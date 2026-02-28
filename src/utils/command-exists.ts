/**
 * Cross-platform command existence check
 * Uses `which` on Unix/macOS and `where` on Windows
 */

import { spawnSync } from "child_process";

/**
 * Check if a command exists on the system
 * Returns true if command is available, false otherwise
 */
export function commandExists(command: string): boolean {
  const isWindows = process.platform === "win32";
  const checkCmd = isWindows ? "where" : "which";
  const result = spawnSync(checkCmd, [command], { stdio: "pipe", shell: isWindows });
  return result.status === 0;
}
