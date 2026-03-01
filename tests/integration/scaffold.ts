/**
 * Scaffold a backend+frontend combo to a temp directory
 * Uses the Handlebars + VFS pipeline (not deprecated copyTemplate)
 * Copies the appropriate Dockerfile into each generated project
 */

import { mkdtemp, cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { generateProjects } from "../../src/generator/index.js";

import type { TestCombo } from "./types.js";
import { generateFrontendDockerfile } from "./dockerfile-gen.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCKERFILES_DIR = join(__dirname, "dockerfiles");

export async function scaffoldCombo(combo: TestCombo): Promise<string> {
  const isCustom = combo.scaffoldMode === "custom";
  const pm = combo.packageManager ?? "pnpm";
  const suffix = isCustom ? `${combo.backend}-${combo.frontend}-${pm}-` : `${combo.backend}-${combo.frontend}-`;

  const tmpDir = await mkdtemp(join(tmpdir(), `cfs-e2e-${suffix}`));

  // Use the real generator pipeline (Handlebars + VFS), silent to avoid spinner noise
  await generateProjects(
    {
      projectName: "test-app",
      projects: [
        { type: "backend", framework: combo.backend, folderName: "backend" },
        { type: "frontend", framework: combo.frontend, folderName: "frontend" },
      ],
      outputDir: tmpDir,
      initGit: false,
      runtime: combo.runtime ?? "bun",
      packageManager: pm,
      scaffoldMode: isCustom ? "custom" : "scaffold",
      addons: combo.addons ?? [],
    },
    tmpDir,
    { silent: true }
  );

  // Backend Dockerfile: always from static file
  await cp(
    join(DOCKERFILES_DIR, `${combo.backend}.Dockerfile`),
    join(tmpDir, "backend", "Dockerfile")
  );

  // Frontend Dockerfile: dynamic for custom mode, static for scaffold
  if (isCustom) {
    const dockerfile = generateFrontendDockerfile(combo.frontend, pm);
    await writeFile(join(tmpDir, "frontend", "Dockerfile"), dockerfile, "utf-8");
  } else {
    await cp(
      join(DOCKERFILES_DIR, `${combo.frontend}.Dockerfile`),
      join(tmpDir, "frontend", "Dockerfile")
    );
  }

  return tmpDir;
}
