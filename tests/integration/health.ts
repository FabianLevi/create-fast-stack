/**
 * Health endpoint polling with retry and timeout
 */

import { HEALTH_INTERVAL, HEALTH_TIMEOUT } from "./constants.js";

export interface HealthResult {
  ok: boolean;
  statusCode?: number;
  body?: unknown;
  error?: string;
  attempts: number;
}

export async function pollHealth(
  url: string,
  timeout = HEALTH_TIMEOUT,
  interval = HEALTH_INTERVAL
): Promise<HealthResult> {
  const deadline = Date.now() + timeout;
  let attempts = 0;
  let lastError: string | undefined;

  while (Date.now() < deadline) {
    attempts++;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (res.ok) {
        const body = await res.json().catch(() => null);
        return { ok: true, statusCode: res.status, body, attempts };
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await Bun.sleep(interval);
  }

  return { ok: false, error: lastError ?? "timeout", attempts };
}
