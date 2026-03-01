/**
 * Constants for Docker integration tests
 * Port allocation, timeouts, and combo generation
 */

import type {
  BackendFramework,
  FrontendFramework,
  PackageManager,
  AddonName,
} from "../../src/types.js";
import type { TestCombo, PortConfig } from "./types.js";

// Port base offsets — each combo gets unique ports via index
export const BACKEND_PORT_BASE = 18_000;
export const FRONTEND_PORT_BASE = 19_000;

// Health check timing
export const HEALTH_TIMEOUT = 60_000;
export const HEALTH_INTERVAL = 2_000;

// Connectivity check timing
export const CONNECTIVITY_TIMEOUT = 60_000;

// Build timeouts
export const BUILD_TIMEOUT = 300_000; // 5min
export const RUST_BUILD_TIMEOUT = 600_000; // 10min
export const COMBO_TIMEOUT = 600_000;

// Docker network prefix for test isolation
export const NETWORK_PREFIX = "cfs-e2e";

// All supported frameworks
export const ALL_BACKENDS: BackendFramework[] = [
  "python-fastapi",
  "go-chi",
  "nestjs",
  "rust-axum",
  "dotnet-aspnetcore",
];

export const ALL_FRONTENDS: FrontendFramework[] = [
  "react-vite",
  "nextjs",
  "angular",
  "svelte",
];

// Default ports per framework (used inside containers)
export const FRONTEND_PORTS: Record<FrontendFramework, number> = {
  "react-vite": 5173,
  nextjs: 3000,
  angular: 4200,
  svelte: 5173,
};

export const BACKEND_PORT = 8000;

// Custom mode options
export const ALL_PACKAGE_MANAGERS: PackageManager[] = ["pnpm", "npm", "bun"];
export const ALL_ADDONS: AddonName[] = [
  "biome",
  "husky",
  "skills",
  "mcp",
];

// Backend used for custom combos (fastest build)
const CUSTOM_BACKEND: BackendFramework = "go-chi";

/**
 * Generate all backend x frontend combos (4 x 3 = 12)
 * Each combo gets a sequential index for port allocation
 */
export function buildAllCombos(): TestCombo[] {
  const combos: TestCombo[] = [];
  let index = 0;

  for (const backend of ALL_BACKENDS) {
    for (const frontend of ALL_FRONTENDS) {
      combos.push({ backend, frontend, index });
      index++;
    }
  }

  return combos;
}

/**
 * Generate custom frontend combos:
 * - 9 PM combos: go-chi x 3 frontends x 3 packageManagers
 * - 3 addon combos: go-chi x 3 frontends x npm x all addons
 * Index starts at 12 (after scaffold combos)
 */
export function buildCustomCombos(includeAddons = false): TestCombo[] {
  const combos: TestCombo[] = [];
  let index = 12; // after 12 scaffold combos

  // PM combos: 3 frontends x 3 PMs = 9
  for (const frontend of ALL_FRONTENDS) {
    for (const pm of ALL_PACKAGE_MANAGERS) {
      combos.push({
        backend: CUSTOM_BACKEND,
        frontend,
        index,
        scaffoldMode: "custom",
        packageManager: pm,
        runtime: pm === "bun" ? "bun" : "node",
        addons: [],
      });
      index++;
    }
  }

  // Addon combos: 3 frontends x npm x all addons = 3
  if (includeAddons) {
    for (const frontend of ALL_FRONTENDS) {
      combos.push({
        backend: CUSTOM_BACKEND,
        frontend,
        index,
        scaffoldMode: "custom",
        packageManager: "npm",
        runtime: "node",
        addons: [...ALL_ADDONS],
      });
      index++;
    }
  }

  return combos;
}

/**
 * Derive unique host ports for a combo based on its index
 * Prevents port collisions when running combos in parallel
 */
export function getPortConfig(combo: TestCombo): PortConfig {
  return {
    backend: BACKEND_PORT_BASE + combo.index,
    frontend: FRONTEND_PORT_BASE + combo.index,
  };
}
