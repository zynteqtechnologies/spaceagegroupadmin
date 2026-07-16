// lib/redis.ts
//
// Redis client singleton using ioredis.
// ─────────────────────────────────────────────────────────────────────────────
// • On production (KVM): set  REDIS_URL=redis://127.0.0.1:6379  in .env
// • On local dev without Redis running: every operation silently no-ops.
//   No errors will crash the app — it gracefully falls back to in-memory.
// ─────────────────────────────────────────────────────────────────────────────

import Redis from 'ioredis';

declare global {
    // Prevents multiple Redis clients during hot-reload in dev
    // eslint-disable-next-line no-var
    var __redis: Redis | null | undefined;
}

let redis: Redis | null = null;

function createRedisClient(): Redis | null {
    const url = process.env.REDIS_URL;
    if (!url) return null; // Redis not configured — graceful no-op

    try {
        const client = new Redis(url, {
            maxRetriesPerRequest: 1,    // fail fast in dev if Redis is down
            enableReadyCheck: false,
            lazyConnect: true,
            connectTimeout: 2000,
        });

        client.on('error', (err) => {
            // Log but don't crash — the app uses in-memory fallbacks
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[Redis] Connection error (app continues without cache):', err.message);
            }
        });

        client.on('connect', () => {
            console.log('[Redis] Connected successfully to', url);
        });

        return client;
    } catch (err: any) {
        console.warn('[Redis] Failed to initialize client:', err.message);
        return null;
    }
}

// ── Singleton (survive hot-reload in dev) ────────────────────────────────────
if (!global.__redis) {
    global.__redis = createRedisClient();
}
redis = global.__redis ?? null;

export { redis };

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Get a JSON-parsed value from Redis. Returns null if Redis is unavailable. */
export async function redisGet<T = unknown>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
        const raw = await redis.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

/**
 * Set a JSON-serialised value in Redis with an optional TTL.
 * Silently no-ops if Redis is unavailable.
 * @param ttlSeconds  Expiry in seconds (default: 300 = 5 minutes)
 */
export async function redisSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!redis) return;
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
        // silently ignore
    }
}

/** Delete one or more keys. Silently no-ops if Redis is unavailable. */
export async function redisDel(...keys: string[]): Promise<void> {
    if (!redis || keys.length === 0) return;
    try {
        await redis.del(...keys);
    } catch {
        // silently ignore
    }
}

/**
 * Increment a Redis counter and set TTL on first creation.
 * Returns the new count, or null if Redis is unavailable.
 */
export async function redisIncr(key: string, ttlSeconds: number): Promise<number | null> {
    if (!redis) return null;
    try {
        const count = await redis.incr(key);
        if (count === 1) {
            // First hit — set TTL so key auto-expires after the window
            await redis.expire(key, ttlSeconds);
        }
        return count;
    } catch {
        return null;
    }
}

/** Returns remaining TTL in seconds for a key, or null. */
export async function redisTTL(key: string): Promise<number | null> {
    if (!redis) return null;
    try {
        const ttl = await redis.ttl(key);
        return ttl >= 0 ? ttl : null;
    } catch {
        return null;
    }
}
