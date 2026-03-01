/**
 * Docker Compose generation, lifecycle management, and log capture
 * Uses Bun.spawn for all docker commands
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  BACKEND_PORT,
  BUILD_TIMEOUT,
  FRONTEND_PORTS,
  NETWORK_PREFIX,
} from "./constants.js";
import type { PortConfig, TestCombo } from "./types.js";

/** Frontend env var name per framework */
const FRONTEND_ENV_MAP: Record<string, string> = {
  "react-vite": "VITE_BACKEND_URL",
  svelte: "VITE_BACKEND_URL",
  nextjs: "BACKEND_URL",
  angular: "BACKEND_URL",
};

/** Backend healthcheck command — Alpine images use wget, Debian use curl */
const BACKEND_HEALTHCHECK_CMD: Record<string, string[]> = {
  "go-chi": ["CMD", "wget", "-qO-", `http://localhost:${BACKEND_PORT}/health`],
};

/**
 * Generate docker-compose.yml content for a test combo
 */
export function generateComposeYaml(
  combo: TestCombo,
  ports: PortConfig,
  tmpDir: string
): string {
  const networkName = `${NETWORK_PREFIX}-${combo.backend}-${combo.frontend}`;
  const frontendEnvKey = FRONTEND_ENV_MAP[combo.frontend] ?? "BACKEND_URL";
  const frontendContainerPort = FRONTEND_PORTS[combo.frontend] ?? 3000;
  const healthCmd = BACKEND_HEALTHCHECK_CMD[combo.backend]
    ?? ["CMD", "curl", "-f", `http://localhost:${BACKEND_PORT}/health`];
  const healthTest = JSON.stringify(healthCmd);

  return `services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "${ports.backend}:${BACKEND_PORT}"
    healthcheck:
      test: ${healthTest}
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 15s
    labels:
      - "cfs.test=true"
      - "cfs.combo=${combo.backend}-${combo.frontend}"
    networks:
      - ${networkName}

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "${ports.frontend}:${frontendContainerPort}"
    depends_on:
      backend:
        condition: service_healthy
    environment:
      - ${frontendEnvKey}=http://backend:${BACKEND_PORT}
    labels:
      - "cfs.test=true"
      - "cfs.combo=${combo.backend}-${combo.frontend}"
    networks:
      - ${networkName}

networks:
  ${networkName}:
    driver: bridge
`;
}

/**
 * Spawn a docker compose command and wait for exit
 * Returns { exitCode, stdout, stderr }
 */
async function runCompose(
  composePath: string,
  args: string[],
  timeout?: number
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const controller = timeout ? new AbortController() : undefined;
  const timer = timeout
    ? setTimeout(() => controller!.abort(), timeout)
    : undefined;

  try {
    const proc = Bun.spawn(["docker", "compose", "-f", composePath, ...args], {
      stdout: "pipe",
      stderr: "pipe",
      signal: controller?.signal,
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    const exitCode = await proc.exited;
    return { exitCode, stdout, stderr };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Write compose file and bring services up with --build
 */
export async function composeUp(
  composePath: string,
  timeout = BUILD_TIMEOUT
): Promise<void> {
  const { exitCode, stderr } = await runCompose(
    composePath,
    ["up", "-d", "--build"],
    timeout
  );

  if (exitCode !== 0) {
    throw new Error(`docker compose up failed (exit ${exitCode}):\n${stderr}`);
  }
}

/**
 * Tear down services, volumes, orphans, and local images
 */
export async function composeDown(composePath: string): Promise<void> {
  const { exitCode, stderr } = await runCompose(composePath, [
    "down",
    "--volumes",
    "--remove-orphans",
    "--rmi",
    "local",
  ]);

  if (exitCode !== 0) {
    // Non-fatal — log but don't throw during cleanup
    console.warn(`docker compose down warning (exit ${exitCode}):\n${stderr}`);
  }
}

/**
 * Capture recent logs from all services
 */
export async function composeLogs(
  composePath: string,
  tail = 50
): Promise<string> {
  const { stdout, stderr, exitCode } = await runCompose(composePath, [
    "logs",
    `--tail=${tail}`,
  ]);

  if (exitCode !== 0) {
    return `[logs failed] ${stderr}`;
  }

  return stdout || stderr;
}

/**
 * Write a compose file to disk and return its path
 */
export async function writeComposeFile(
  tmpDir: string,
  yaml: string
): Promise<string> {
  const composePath = join(tmpDir, "docker-compose.yml");
  await writeFile(composePath, yaml, "utf-8");
  return composePath;
}
