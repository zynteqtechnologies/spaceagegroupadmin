// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';
import { redisGet, redisSet, redisDel } from '@/lib/redis';
import crypto from 'crypto';

// ── GET /api/projects ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        // ── Redis cache ─────────────────────────────────────────────────
        const cacheKey = `cache:projects:${status ?? 'all'}`;
        const cached = await redisGet(cacheKey);
        if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });

        await connectDB();

        const conditions = [];
        if (status) {
            conditions.push(eq(projects.status, status as any));
        }

        const records = await db.select({
            id: projects.id,
            title: projects.title,
            slug: projects.slug,
            status: projects.status,
            headline: projects.headline,
            address: projects.address,
            estYear: projects.estYear,
            featured: projects.featured,
            category: projects.category,
            area: projects.area,
            units: projects.units,
            heroImages: projects.heroImages,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt
        })
        .from(projects)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(projects.createdAt));

        const mappedProjects = records.map(p => ({
            ...p,
            _id: p.id,
            featured: Boolean((p.featured as any) === true || (p.featured as any) === 1 || (p.featured as any) === '1' || (p.featured as any) === 'true'),
        }));

        await redisSet(cacheKey, mappedProjects, 120);
        return NextResponse.json(mappedProjects, { headers: { 'X-Cache': 'MISS' } });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[GET /api/projects]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── POST /api/projects ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const body = await req.json();
        const { title, slug, status, headline, shortIntro, address, estYear, featured, category, area, units } = body;

        if (!title?.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Generate slug if not provided
        const generatedSlug = slug?.trim()
            ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check uniqueness
        const [existing] = await db.select().from(projects).where(eq(projects.slug, generatedSlug)).limit(1);
        if (existing) {
            return NextResponse.json(
                { error: `Slug "${generatedSlug}" already exists. Choose a different title or slug.` },
                { status: 409 }
            );
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await db.insert(projects).values({
            id,
            title: title.trim(),
            slug: generatedSlug,
            status: status ?? 'upcoming',
            headline: headline?.trim() ?? '',
            shortIntro: shortIntro?.trim() ?? '',
            address: address?.trim() ?? '',
            estYear: estYear?.trim() ?? '',
            featured: !!featured,
            category: category?.trim() ?? '',
            area: area?.trim() ?? '',
            units: units ? Number(units) : 0,
            createdAt: now,
            updatedAt: now
        });

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...project, _id: project.id };

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'created a new project',
            title
        );

        // Invalidate projects list cache (all status variants)
        await redisDel('cache:projects:all', 'cache:projects:upcoming', 'cache:projects:ongoing', 'cache:projects:completed');

        return NextResponse.json(
            { message: 'Project created successfully', project: responseObj },
            { status: 201 }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[POST /api/projects]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}