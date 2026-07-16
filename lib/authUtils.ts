// lib/authUtils.ts
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB, db } from './db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redisGet, redisSet } from './redis';

// Cache TTL: user record cached for 5 minutes.
// On role change / deletion, the admin panel invalidates the cache via redisDel.
const USER_CACHE_TTL = 5 * 60; // seconds

export async function getCurrentUser(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(process.env.JWT_SECRET)
        );

        if (!payload || !payload.userId) return null;

        const userId = payload.userId as string;

        // ── Try Redis cache first ─────────────────────────────────────────
        const cacheKey = `user:${userId}`;
        const cached = await redisGet<ReturnType<typeof buildUserObject>>(cacheKey);
        if (cached) return cached;

        // ── Cache miss → query Turso ──────────────────────────────────────
        await connectDB();
        const [rawUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!rawUser) return null;

        const user = buildUserObject(rawUser);

        // Store in Redis for next requests
        await redisSet(cacheKey, user, USER_CACHE_TTL);

        return user;
    } catch {
        return null;
    }
}

function buildUserObject(rawUser: typeof users.$inferSelect) {
    const { password, ...rest } = rawUser;
    return { ...rest, _id: rawUser.id };
}

export function isAdministrator(user: any) {
    return user && user.role === 'administrator';
}

export function isManager(user: any) {
    return user && user.role === 'manager';
}

export function isPrivileged(user: any) {
    return isAdministrator(user) || isManager(user);
}
