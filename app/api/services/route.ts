// app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { services } from '@/lib/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';
import { redisGet, redisSet, redisDel } from '@/lib/redis';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');

        await connectDB();

        const currentUser = await getCurrentUser(req);
        const isUserPrivileged = currentUser && isPrivileged(currentUser);

        // Cache only public (non-draft) requests
        const cacheKey = `cache:services:${status ?? 'published'}:${category ?? 'all'}`;
        if (!isUserPrivileged && (!status || status !== 'draft')) {
            const cached = await redisGet(cacheKey);
            if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
        }

        const conditions = [];
        if (category) {
            conditions.push(eq(services.category, category as any));
        }

        if (status) {
            if (status === 'draft' && !isUserPrivileged) {
                return NextResponse.json({ error: 'Forbidden: You do not have permission to view drafts' }, { status: 403 });
            }
            conditions.push(eq(services.status, status as any));
        } else {
            if (!isUserPrivileged) {
                conditions.push(eq(services.status, 'published'));
            }
        }

        const records = await db.select()
            .from(services)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(asc(services.number));

        const mappedServices = records.map(s => {
            let stats = s.stats;
            if (typeof stats === 'string') {
                try { stats = JSON.parse(stats); } catch { stats = []; }
            }
            if (!Array.isArray(stats)) stats = [];

            let features = s.features;
            if (typeof features === 'string') {
                try { features = JSON.parse(features); } catch { features = []; }
            }
            if (!Array.isArray(features)) features = [];

            return {
                ...s,
                _id: s.id,
                stats,
                features
            };
        });

        if (!isUserPrivileged && (!status || status !== 'draft')) {
            await redisSet(cacheKey, mappedServices, 120);
        }

        return NextResponse.json(mappedServices, { headers: { 'X-Cache': 'MISS' } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { title, number, category, tagline, description, stats, features, accent, icon, status } = body;

        if (!title || !number || !category || !tagline || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Generate slug
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const [existing] = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
        if (existing) {
            return NextResponse.json({ error: 'A service with this title already exists.' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        let parsedStats = stats;
        if (typeof parsedStats === 'string') {
            try { parsedStats = JSON.parse(parsedStats); } catch { parsedStats = []; }
        }
        if (!Array.isArray(parsedStats)) parsedStats = [];

        let parsedFeatures = features;
        if (typeof parsedFeatures === 'string') {
            try { parsedFeatures = JSON.parse(parsedFeatures); } catch { parsedFeatures = []; }
        }
        if (!Array.isArray(parsedFeatures)) parsedFeatures = [];

        await db.insert(services).values({
            id,
            title,
            slug,
            number: String(number),
            category: category as 'Core Development' | 'Consultation',
            tagline,
            description,
            stats: parsedStats,
            features: parsedFeatures,
            accent: accent || '#c9a84c',
            icon: icon || 'home',
            status: (status || 'published') as 'published' | 'draft',
            createdAt: now,
            updatedAt: now
        });

        const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
        const responseObj = { ...service, _id: service.id };

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'created a service',
            title
        );

        return NextResponse.json(responseObj, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
