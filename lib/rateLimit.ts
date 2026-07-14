import { NextRequest, NextResponse } from 'next/server';

interface RequestLog {
    timestamps: number[];
}

const rateLimitStore = new Map<string, RequestLog>();

// Periodically clean up memory store to prevent leaks
if (typeof global !== 'undefined' && !(global as any).__rateLimitIntervalInitialized) {
    (global as any).__rateLimitIntervalInitialized = true;
    setInterval(() => {
        const now = Date.now();
        for (const [ip, log] of rateLimitStore.entries()) {
            // Remove timestamps older than 5 minutes (maximum window limit)
            log.timestamps = log.timestamps.filter(ts => now - ts < 5 * 60 * 1000);
            if (log.timestamps.length === 0) {
                rateLimitStore.delete(ip);
            }
        }
    }, 2 * 60 * 1000);
}

/**
 * Basic in-memory rate limiter for Next.js API endpoints.
 *
 * Returns `null` if the request is within limits (caller may proceed).
 * Returns a `NextResponse` (429) if the request exceeds the rate limit.
 *
 * Usage:
 *   const rateLimit = await checkRateLimit(req, 15, 5 * 60 * 1000);
 *   if (rateLimit) return rateLimit;  // ← reject over-limit request early
 *
 * @param req       NextRequest
 * @param limit     Max number of requests allowed in windowMs
 * @param windowMs  Window duration in milliseconds
 */
export async function checkRateLimit(
    req: NextRequest,
    limit: number,
    windowMs: number
): Promise<NextResponse | null> {
    const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();
    const now = Date.now();

    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, { timestamps: [] });
    }

    const log = rateLimitStore.get(ip)!;
    // Filter timestamps within current window frame
    log.timestamps = log.timestamps.filter(ts => now - ts < windowMs);

    if (log.timestamps.length >= limit) {
        const oldestTs = log.timestamps[0];
        const resetTime = oldestTs + windowMs;
        const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);

        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfterSeconds),
                    'X-RateLimit-Limit': String(limit),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(resetTime)
                }
            }
        );
    }

    log.timestamps.push(now);
    return null; // within limits, caller may proceed
}
