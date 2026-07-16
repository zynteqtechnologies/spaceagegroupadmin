// app/api/timeline/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { timelineEvents } from '@/lib/schema';
import { asc, eq } from 'drizzle-orm';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';
import { redisGet, redisSet, redisDel } from '@/lib/redis';
import crypto from 'crypto';

export async function GET() {
    try {
        const cacheKey = 'cache:timeline';
        const cached = await redisGet(cacheKey);
        if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });

        await connectDB();
        const events = await db.select()
            .from(timelineEvents)
            .orderBy(asc(timelineEvents.order), asc(timelineEvents.year));

        await redisSet(cacheKey, events, 300);
        return NextResponse.json(events, { headers: { 'X-Cache': 'MISS' } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !isPrivileged(currentUser)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { year, title, description, order } = body;

        if (!year || !title || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        
        await db.insert(timelineEvents).values({
            id,
            year: String(year).trim(),
            title: String(title).trim(),
            description: String(description).trim(),
            order: parseInt(String(order) || '0'),
            createdAt: now,
            updatedAt: now,
        });

        const [event] = await db.select().from(timelineEvents).where(eq(timelineEvents.id, id)).limit(1);

        // Notification
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'added journey milestone',
            `${year} - ${title}`
        );

        return NextResponse.json(event);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
