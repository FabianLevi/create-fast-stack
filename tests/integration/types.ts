/**
 * Type definitions for Docker integration tests
 */

import type {
  BackendFramework,
  FrontendFramework,
  PackageManager,
  Runtime,
  AddonName,
} from "../../src/types.js";
import type { ConnectivityResult } from "./connectivity.js";

export interface TestCombo {
  backend: BackendFramework;
  frontend: FrontendFramework;
  index: number;
  scaffoldMode?: "scaffold" | "custom";
  packageManager?: PackageManager;
  runtime?: Runtime;
  addons?: AddonName[];
}

export interface PortConfig {
  backend: number;
  frontend: number;
}

export interface TestResult {
  combo: TestCombo;
  status: "pass" | "fail" | "skip";
  durationMs: number;
  error?: string;
  logs?: string;
  connectivity?: ConnectivityResult;
}

export interface RunConfig {
  combos: TestCombo[];
  parallel: boolean;
  buildTimeout: number;
  healthTimeout: number;
  connectivityTimeout: number;
  keepOnFail: boolean;
  dryRun: boolean;
}
