/**
 * E2E scaffold helper — programmatically generates projects bypassing interactive prompts.
 * Usage: bun tests/e2e-scaffold.ts --name=<name> --backend=<framework> --frontend=<framework> --out=<dir>
 *
 * Flags are optional — omit --backend or --frontend to skip that project type.
 */

import { parseArgs } from "util";
import { generateProjects } from "../src/generator/index.js";
import { scaffoldConfigSchema } from "../src/config.js";
import type { ProjectSelection } from "../src/config.js";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    name: { type: "string" },
    backend: { type: "string" },
    frontend: { type: "string" },
    out: { type: "string" },
  },
});

const name = values.name;
const out = values.out;

if (!name || !out) {
  console.error("Usage: bun tests/e2e-scaffold.ts --name=<name> --backend=<fw> --frontend=<fw> --out=<dir>");
  process.exit(1);
}

const projects: ProjectSelection[] = [];

if (values.backend) {
  projects.push({
    type: "backend",
    framework: values.backend,
    folderName: `${name}-backend`,
  });
}

if (values.frontend) {
  projects.push({
    type: "frontend",
    framework: values.frontend,
    folderName: `${name}-frontend`,
  });
}

if (projects.length === 0) {
  console.error("Provide at least --backend or --frontend");
  process.exit(1);
}

const config = scaffoldConfigSchema.parse({
  projectName: name,
  projects,
  outputDir: out,
  initGit: false,
});

const parentPath = `${out}/${name}`;
await Bun.write(parentPath + "/.keep", ""); // ensure parent dir exists
const fs = await import("fs");
fs.mkdirSync(parentPath, { recursive: true });

await generateProjects(config, parentPath);
console.log(`Scaffolded ${projects.map((p) => p.folderName).join(", ")} in ${parentPath}`);
