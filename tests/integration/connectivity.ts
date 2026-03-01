/**
 * Cross-service connectivity verification
 * Runs curl inside the frontend container to hit the backend via Docker internal network
 */

export interface ConnectivityResult {
  ok: boolean;
  attempts: number;
  requestId?: string;
  error?: string;
}

/**
 * Verify frontend container can reach backend via Docker internal DNS
 * Executes `curl http://backend:8000/health` inside the frontend container
 */
export async function pollConnectivity(
  composePath: string,
  timeout: number,
  interval = 2_000
): Promise<ConnectivityResult> {
  const deadline = Date.now() + timeout;
  let attempts = 0;
  let lastError: string | undefined;

  while (Date.now() < deadline) {
    attempts++;
    try {
      const proc = Bun.spawn(
        [
          "docker",
          "compose",
          "-f",
          composePath,
          "exec",
          "-T",
          "frontend",
          "curl",
          "-sf",
          "--max-time",
          "5",
          "http://backend:8000/health",
        ],
        { stdout: "pipe", stderr: "pipe" }
      );

      const stdout = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        lastError = `curl exit ${exitCode}`;
        await Bun.sleep(interval);
        continue;
      }

      // Parse backend response: {"status":"ok"} or {"status":"ok","request_id":"uuid"}
      const data = JSON.parse(stdout.trim());
      if (data.status === "ok") {
        return {
          ok: true,
          attempts,
          requestId: data.request_id ?? undefined,
        };
      }

      lastError = `unexpected status: ${data.status ?? "missing"}`;
      await Bun.sleep(interval);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      await Bun.sleep(interval);
    }
  }

  return {
    ok: false,
    attempts,
    error: lastError ?? "timeout",
  };
}
