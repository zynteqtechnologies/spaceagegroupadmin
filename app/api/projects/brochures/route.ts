// app/api/projects/brochures/route.ts
// Public endpoint — no auth required — returns all projects that have a brochure set
import { NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
    try {
        await connectDB();

        const records = await db.select({
            id: projects.id,
            title: projects.title,
            slug: projects.slug,
            status: projects.status,
            category: projects.category,
            brochure: projects.brochure,
            heroImages: projects.heroImages,
            createdAt: projects.createdAt,
        })
        .from(projects)
        .orderBy(desc(projects.createdAt));

        // Only return projects that have a brochure with a URL
        const withBrochures = records
            .map(p => ({ ...p, _id: p.id }))
            .filter(p => {
                const b = p.brochure as any;
                return b && (b.url || b.fileName);
            });

        return NextResponse.json(withBrochures);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[GET /api/projects/brochures]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
