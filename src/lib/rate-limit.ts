// In-memory sliding-window rate limiter for server-side endpoints.
// SECURITY: Bounds write bursts (form submits, mutations) so a single client
// cannot exhaust the database or brute-force credentials. The store is
// process-local — in a multi-worker deployment each worker enforces its own
// window, which is still a hard ceiling per instance. Keys are hashed so raw
// IPs or user ids never sit in long-lived unstructured memory.

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
// Periodic cleanup so the map doesn't grow without bound.
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function keyFor(...parts: Array<string | number | undefined | null>): string {
  // FNV-1a 32-bit hash — stable across the process, no raw identifier retained.
  let hash = 2166136261;
  const seed = parts.filter((p) => p != null).map((p) => String(p)).join(":");
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return "rl:" + (hash >>> 0).toString(16);
}

export type RateLimitResult = { allowed: true; remaining: number; resetAt: number } | { allowed: false; retryAfter: number };

/**
 * Enforce a sliding-window rate limit.
 * @param keyParts Discriminator(s) — typically the user id and the endpoint name.
 * @param maxRequests Requests allowed per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(
  keyParts: Array<string | number | undefined | null>,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const key = keyFor(...keyParts);
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.max(0, entry.resetAt - now) };
  }
  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/** Reset the limiter — tests only. */
export function __resetRateLimitStore(): void {
  store.clear();
  lastSweep = 0;
}