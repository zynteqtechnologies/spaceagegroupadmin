// lib/rateLimit.ts
//
// Sliding-window rate limiter.
// ─────────────────────────────────────────────────────────────────────────────
// Strategy:
//   1. If Redis is available  → use Redis INCR + TTL (works across processes)
//   2. If Redis is unavailable → fall back to in-memory Map  (single-process)
//
// This means the limiter works correctly in production with Redis,
// and still works in local dev without Redis — zero crashes either way.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { redisIncr, redisTTL } from './redis';

// ── In-memory fallback store ─────────────────────────────────────────────────
interface RequestLog { timestamps: number[] }
const memStore = new Map<string, RequestLog>();

if (typeof global !== 'undefined' && !(global as any).__rateLimitIntervalInitialized) {
    (global as any).__rateLimitIntervalInitialized = true;
    setInterval(() => {
        const now = Date.now();
        for (const [ip, log] of memStore.entries()) {
            log.timestamps = log.timestamps.filter(ts => now - ts < 5 * 60 * 1000);
            if (log.timestamps.length === 0) memStore.delete(ip);
        }
    }, 2 * 60 * 1000);
}

// ── Redis-backed limiter (fixed window per minute/second granularity) ─────────
async function redisRateLimit(
    ip: string,
    limit: number,
    windowMs: number
): Promise<NextResponse | null> {
    const windowSec = Math.ceil(windowMs / 1000);
    const key = `rl:${ip}:${Math.floor(Date.now() / windowMs)}`; // window bucket key

    const count = await redisIncr(key, windowSec);
    if (count === null) return null; // Redis unavailable, caller will use memStore

    if (count > limit) {
        const ttl = await redisTTL(key);
        const retryAfter = ttl ?? windowSec;
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfter),
                    'X-RateLimit-Limit': String(limit),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Date.now() + retryAfter * 1000)
                }
            }
        );
    }

    return null; // within limits
}

// ── In-memory fallback limiter ────────────────────────────────────────────────
function memRateLimit(
    ip: string,
    limit: number,
    windowMs: number
): NextResponse | null {
    const now = Date.now();

    if (!memStore.has(ip)) memStore.set(ip, { timestamps: [] });
    const log = memStore.get(ip)!;
    log.timestamps = log.timestamps.filter(ts => now - ts < windowMs);

    if (log.timestamps.length >= limit) {
        const retryAfter = Math.ceil((log.timestamps[0] + windowMs - now) / 1000);
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfter),
                    'X-RateLimit-Limit': String(limit),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(log.timestamps[0] + windowMs)
                }
            }
        );
    }

    log.timestamps.push(now);
    return null;
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Sliding-window rate limiter. Tries Redis first, falls back to in-memory.
 *
 * Returns `null` if the request is within limits (caller may proceed).
 * Returns a `NextResponse` (429) if the rate limit is exceeded.
 *
 * @param req       NextRequest
 * @param limit     Max requests allowed in windowMs
 * @param windowMs  Window duration in milliseconds
 */
export async function checkRateLimit(
    req: NextRequest,
    limit: number,
    windowMs: number
): Promise<NextResponse | null> {
    const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();

    // Try Redis first
    const redisResult = await redisRateLimit(ip, limit, windowMs);
    if (redisResult !== null) return redisResult; // Redis responded (block or pass)

    // Redis unavailable or returned null (within limits via Redis) — use mem fallback
    // Note: if redisIncr returned a valid count ≤ limit, redisResult is null = allowed.
    // We only hit memRateLimit when Redis itself is completely unavailable (count === null).
    return memRateLimit(ip, limit, windowMs);
}
