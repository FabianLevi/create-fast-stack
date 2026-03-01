/**
 * Dynamic Dockerfile generation for custom frontend combos
 * Generates Dockerfile strings based on frontend framework + package manager
 */

import type { FrontendFramework, PackageManager } from "../../src/types.js";
import { FRONTEND_PORTS } from "./constants.js";

interface PmConfig {
  baseImage: string;
  setupCmd: string | null;
  lockfileGlob: string;
  installCmd: string;
}

const PM_CONFIG: Record<PackageManager, PmConfig> = {
  pnpm: {
    baseImage: "node:20-slim",
    setupCmd: "RUN corepack enable",
    lockfileGlob: "pnpm-lock.yaml*",
    installCmd: "pnpm install --frozen-lockfile || pnpm install",
  },
  npm: {
    baseImage: "node:20-slim",
    setupCmd: null,
    lockfileGlob: "package-lock.json*",
    installCmd: "npm install",
  },
  bun: {
    baseImage: "oven/bun:1",
    setupCmd: null,
    lockfileGlob: "bun.lockb*",
    installCmd: "bun install",
  },
};

type DevCmd = string[];

const DEV_COMMANDS: Record<FrontendFramework, Record<PackageManager, DevCmd>> = {
  "react-vite": {
    pnpm: ["pnpm", "dev", "--host", "0.0.0.0"],
    npm: ["npx", "vite", "--host", "0.0.0.0"],
    bun: ["bunx", "vite", "--host", "0.0.0.0"],
  },
  nextjs: {
    pnpm: ["pnpm", "dev"],
    npm: ["npx", "next", "dev"],
    bun: ["bunx", "next", "dev"],
  },
  angular: {
    pnpm: ["pnpm", "exec", "ng", "serve", "--host", "0.0.0.0"],
    npm: ["npx", "ng", "serve", "--host", "0.0.0.0"],
    bun: ["bunx", "ng", "serve", "--host", "0.0.0.0"],
  },
};

/**
 * Generate a frontend Dockerfile for a given framework + package manager
 */
export function generateFrontendDockerfile(
  frontend: FrontendFramework,
  pm: PackageManager
): string {
  const cfg = PM_CONFIG[pm];
  const port = FRONTEND_PORTS[frontend];
  const cmd = DEV_COMMANDS[frontend][pm];
  const cmdJson = JSON.stringify(cmd);

  const lines: string[] = [
    `FROM ${cfg.baseImage}`,
    "",
    'LABEL maintainer="create-fast-stack"',
    'LABEL cfs-e2e="true"',
    "",
    "RUN apt-get update && apt-get install -y --no-install-recommends curl \\",
    "    && rm -rf /var/lib/apt/lists/*",
    "",
  ];

  if (cfg.setupCmd) {
    lines.push(cfg.setupCmd, "");
  }

  lines.push(
    "WORKDIR /app",
    "",
    `COPY package.json ${cfg.lockfileGlob} ./`,
    `RUN ${cfg.installCmd}`,
    "",
    "COPY . .",
    "",
    `EXPOSE ${port}`,
    "",
    `HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=3 \\`,
    `    CMD curl -f http://localhost:${port}/ || exit 1`,
    "",
    `CMD ${cmdJson}`,
    ""
  );

  return lines.join("\n");
}
