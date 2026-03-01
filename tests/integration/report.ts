/**
 * Console reporter for Docker integration test results
 * Prints colored output with ANSI escape codes
 */

import type { TestCombo, TestResult } from "./types.js";

function comboLabel(combo: TestCombo): string {
  let label = `${combo.backend} + ${combo.frontend}`;
  if (combo.scaffoldMode === "custom") {
    const suffix = combo.addons?.length ? `${combo.packageManager}+addons` : combo.packageManager;
    label += ` (${suffix})`;
  }
  return label;
}

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

export function printResult(result: TestResult): void {
  const icon =
    result.status === "pass"
      ? `${GREEN}✓${RESET}`
      : result.status === "fail"
        ? `${RED}✗${RESET}`
        : `${YELLOW}○${RESET}`;
  const combo = comboLabel(result.combo);
  const time = `${DIM}${(result.durationMs / 1000).toFixed(1)}s${RESET}`;
  console.log(`  ${icon} ${combo} ${time}`);
  if (result.connectivity?.ok) {
    const rid = result.connectivity.requestId?.slice(0, 8) ?? "unknown";
    console.log(`    ${GREEN}connectivity (request_id: ${rid}...)${RESET}`);
  }
  if (result.error) {
    console.log(`    ${RED}${result.error}${RESET}`);
  }
}

export function printSummary(results: TestResult[]): void {
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log();
  console.log(
    `${BOLD}${"─".repeat(60)}${RESET}`
  );
  console.log(
    `${BOLD}  ${"Combo".padEnd(35)} ${"Status".padEnd(10)} Duration${RESET}`
  );
  console.log(`  ${"─".repeat(55)}`);

  for (const result of results) {
    const combo = comboLabel(result.combo);
    const statusLabel =
      result.status === "pass"
        ? `${GREEN}pass${RESET}`
        : result.status === "fail"
          ? `${RED}FAIL${RESET}`
          : `${YELLOW}skip${RESET}`;
    const duration = `${DIM}${(result.durationMs / 1000).toFixed(1)}s${RESET}`;
    console.log(`  ${combo.padEnd(35)} ${statusLabel.padEnd(19)} ${duration}`);
  }

  console.log(`  ${"─".repeat(55)}`);

  const parts: string[] = [];
  if (passed > 0) parts.push(`${GREEN}${passed} passed${RESET}`);
  if (failed > 0) parts.push(`${RED}${failed} failed${RESET}`);
  if (skipped > 0) parts.push(`${YELLOW}${skipped} skipped${RESET}`);

  const totalTime = `${DIM}${(totalMs / 1000).toFixed(1)}s total${RESET}`;
  console.log(`  ${parts.join(", ")}  ${totalTime}`);
  console.log(`${BOLD}${"─".repeat(60)}${RESET}`);

  if (failed > 0) {
    console.log();
    console.log(`${RED}${BOLD}  Failed combos:${RESET}`);
    for (const result of results.filter((r) => r.status === "fail")) {
      const combo = comboLabel(result.combo);
      console.log(`    ${RED}✗ ${combo}${RESET}`);
      if (result.error) {
        console.log(`      ${DIM}${result.error}${RESET}`);
      }
    }
    console.log();
    console.log(
      `  ${DIM}Tip: re-run with --keep-on-fail to inspect containers${RESET}`
    );
  }
}
