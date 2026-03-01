#!/usr/bin/env bun
/**
 * Docker integration test runner
 * Scaffolds every backend x frontend combo, builds via Docker Compose,
 * and verifies health endpoints respond.
 */

import { rm } from "node:fs/promises";
import { Command } from "commander";

import type { TestCombo, TestResult } from "./types.js";
import {
  ALL_BACKENDS,
  ALL_FRONTENDS,
  ALL_PACKAGE_MANAGERS,
  BUILD_TIMEOUT,
  CONNECTIVITY_TIMEOUT,
  HEALTH_TIMEOUT,
  buildAllCombos,
  buildCustomCombos,
  getPortConfig,
} from "./constants.js";
import { scaffoldCombo } from "./scaffold.js";
import {
  generateComposeYaml,
  writeComposeFile,
  composeUp,
  composeDown,
  composeLogs,
} from "./docker.js";
import { pollHealth } from "./health.js";
import { pollConnectivity } from "./connectivity.js";
import { printResult, printSummary } from "./report.js";

// ── CLI setup ────────────────────────────────────────────────

const program = new Command()
  .name("integration-tests")
  .description("Docker integration tests for create-fast-stack combos")
  .option("--combo <backend:frontend>", "run single combo (colon-separated)")
  .option("--backend <name>", "run all combos with this backend")
  .option("--frontend <name>", "run all combos with this frontend")
  .option("--custom", "run custom frontend combos (PM variations)", false)
  .option("--pm <name>", "filter custom combos by package manager (pnpm|npm|bun)")
  .option("--addons", "include addon combos in custom run", false)
  .option("--parallel", "run combos concurrently", false)
  .option("--keep-on-fail", "don't teardown failed combos for debugging", false)
  .option("--dry-run", "scaffold + generate compose files without running Docker", false)
  .option("--build-timeout <ms>", "override build timeout (ms)", String(BUILD_TIMEOUT))
  .option("--health-timeout <ms>", "override health timeout (ms)", String(HEALTH_TIMEOUT))
  .option("--connectivity-timeout <ms>", "override connectivity timeout (ms)", String(CONNECTIVITY_TIMEOUT))
  .parse();

const opts = program.opts();
const buildTimeout = Number(opts.buildTimeout);
const healthTimeout = Number(opts.healthTimeout);
const connectivityTimeout = Number(opts.connectivityTimeout);
const parallel: boolean = opts.parallel;
const keepOnFail: boolean = opts.keepOnFail;
const dryRun: boolean = opts.dryRun;

// ── Combo filtering ──────────────────────────────────────────

function filterCombos(): TestCombo[] {
  // Custom mode: PM and addon combos
  if (opts.custom) {
    let combos = buildCustomCombos(opts.addons as boolean);

    if (opts.pm) {
      if (!ALL_PACKAGE_MANAGERS.includes(opts.pm as any)) {
        console.error(`Unknown package manager "${opts.pm}". Available: ${ALL_PACKAGE_MANAGERS.join(", ")}`);
        process.exit(1);
      }
      combos = combos.filter((c) => c.packageManager === opts.pm);
    }

    if (opts.combo) {
      const [be, fe] = (opts.combo as string).split(":");
      combos = combos.filter((c) => c.backend === be && c.frontend === fe);
    }

    if (opts.frontend) {
      combos = combos.filter((c) => c.frontend === opts.frontend);
    }

    if (combos.length === 0) {
      console.error("No custom combos match the given filters.");
      process.exit(1);
    }

    return combos;
  }

  // Scaffold mode: standard backend x frontend matrix
  const all = buildAllCombos();

  if (opts.combo) {
    const [be, fe] = (opts.combo as string).split(":");
    const match = all.filter((c) => c.backend === be && c.frontend === fe);
    if (match.length === 0) {
      console.error(`No combo matches "${opts.combo}". Available backends: ${ALL_BACKENDS.join(", ")}; frontends: ${ALL_FRONTENDS.join(", ")}`);
      process.exit(1);
    }
    return match;
  }

  let filtered = all;

  if (opts.backend) {
    if (!ALL_BACKENDS.includes(opts.backend as any)) {
      console.error(`Unknown backend "${opts.backend}". Available: ${ALL_BACKENDS.join(", ")}`);
      process.exit(1);
    }
    filtered = filtered.filter((c) => c.backend === opts.backend);
  }

  if (opts.frontend) {
    if (!ALL_FRONTENDS.includes(opts.frontend as any)) {
      console.error(`Unknown frontend "${opts.frontend}". Available: ${ALL_FRONTENDS.join(", ")}`);
      process.exit(1);
    }
    filtered = filtered.filter((c) => c.frontend === opts.frontend);
  }

  return filtered;
}

// ── Cleanup tracking for SIGINT/SIGTERM ──────────────────────

const activeComposePaths = new Set<string>();

async function cleanupAll(): Promise<void> {
  if (activeComposePaths.size === 0) return;
  console.log(`\nCleaning up ${activeComposePaths.size} running compose project(s)...`);
  const tasks = [...activeComposePaths].map(async (p) => {
    try {
      await composeDown(p);
    } catch {
      // best-effort
    }
  });
  await Promise.allSettled(tasks);
  activeComposePaths.clear();
}

process.on("SIGINT", async () => {
  await cleanupAll();
  process.exit(130);
});

process.on("SIGTERM", async () => {
  await cleanupAll();
  process.exit(143);
});

// ── Single combo execution ───────────────────────────────────

function comboLabel(combo: TestCombo): string {
  let label = `${combo.backend} + ${combo.frontend}`;
  if (combo.scaffoldMode === "custom") {
    const suffix = combo.addons?.length ? `${combo.packageManager}+addons` : combo.packageManager;
    label += ` (${suffix})`;
  }
  return label;
}

async function runCombo(combo: TestCombo): Promise<TestResult> {
  const start = Date.now();
  const label = comboLabel(combo);
  let tmpDir: string | undefined;
  let composePath: string | undefined;

  try {
    // 1. Scaffold
    console.log(`  Scaffolding ${label}...`);
    tmpDir = await scaffoldCombo(combo);

    // 2. Generate compose file
    const ports = getPortConfig(combo);
    const yaml = generateComposeYaml(combo, ports, tmpDir);
    composePath = await writeComposeFile(tmpDir, yaml);

    // 3. Dry-run: stop here
    if (dryRun) {
      console.log(`  [dry-run] Compose file: ${composePath}`);
      return {
        combo,
        status: "skip",
        durationMs: Date.now() - start,
      };
    }

    // 4. Build + start
    console.log(`  Building ${label}...`);
    activeComposePaths.add(composePath);
    await composeUp(composePath, buildTimeout);

    // 5. Health checks
    console.log(`  Checking health ${label}...`);
    const backendUrl = `http://localhost:${ports.backend}/health`;
    const frontendUrl = `http://localhost:${ports.frontend}/`;

    const [backendHealth, frontendHealth] = await Promise.all([
      pollHealth(backendUrl, healthTimeout),
      pollHealth(frontendUrl, healthTimeout),
    ]);

    if (!backendHealth.ok) {
      throw new Error(
        `Backend health failed after ${backendHealth.attempts} attempts: ${backendHealth.error}`
      );
    }
    if (!frontendHealth.ok) {
      throw new Error(
        `Frontend health failed after ${frontendHealth.attempts} attempts: ${frontendHealth.error}`
      );
    }

    // 6. Connectivity check (frontend → backend)
    console.log(`  Checking connectivity ${label}...`);
    const connectivity = await pollConnectivity(
      composePath,
      connectivityTimeout
    );

    if (!connectivity.ok) {
      throw new Error(
        `Connectivity check failed after ${connectivity.attempts} attempts: ${connectivity.error}`
      );
    }

    // 7. Pass — teardown
    console.log(`  Tearing down ${label}...`);
    await composeDown(composePath);
    activeComposePaths.delete(composePath);
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });

    return {
      combo,
      status: "pass",
      durationMs: Date.now() - start,
      connectivity,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    let logs: string | undefined;

    if (composePath && !dryRun) {
      if (!keepOnFail) {
        logs = await composeLogs(composePath).catch(() => undefined);
      }
    }

    // Cleanup unless --keep-on-fail
    if (!keepOnFail) {
      if (composePath) {
        await composeDown(composePath).catch(() => {});
        activeComposePaths.delete(composePath);
      }
      if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    } else if (tmpDir) {
      console.log(`  [keep-on-fail] Preserving: ${tmpDir}`);
    }

    return {
      combo,
      status: "fail",
      durationMs: Date.now() - start,
      error,
      logs,
    };
  }
}

// ── Main ─────────────────────────────────────────────────────

async function main(): Promise<void> {
  const combos = filterCombos();

  console.log();
  console.log(`Integration Tests — ${combos.length} combo(s)`);
  if (dryRun) console.log("  (dry-run mode — Docker will not start)");
  if (parallel) console.log("  (parallel mode)");
  console.log();

  let results: TestResult[];

  if (parallel) {
    const promises = combos.map(async (combo) => {
      const result = await runCombo(combo);
      printResult(result);
      return result;
    });
    results = await Promise.all(promises);
  } else {
    results = [];
    for (const combo of combos) {
      const result = await runCombo(combo);
      printResult(result);
      results.push(result);
    }
  }

  printSummary(results);

  const failed = results.filter((r) => r.status === "fail").length;
  process.exit(failed > 0 ? 1 : 0);
}

main();
