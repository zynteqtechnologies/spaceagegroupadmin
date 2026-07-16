// app/api/projects/[id]/specifications/route.ts
// Handles both common and commercial specs via query param ?type=common|commercial
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { SpecificationItem } from '@/types/project';

type Params = { params: Promise<{ id: string }> };

function getSpecField(type: string | null): 'commonSpecifications' | 'commercialSpecifications' {
    return type === 'commercial' ? 'commercialSpecifications' : 'commonSpecifications';
}

// ── GET /api/projects/:id/specifications?type=common|commercial ───────────────
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const type = new URL(req.url).searchParams.get('type');
        await connectDB();

        const [project] = await db.select({
            commonSpecifications: projects.commonSpecifications,
            commercialSpecifications: projects.commercialSpecifications
        }).from(projects).where(eq(projects.id, id)).limit(1);

        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const field = getSpecField(type);
        return NextResponse.json(project[field] ?? []);
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

// ── PUT /api/projects/:id/specifications?type=common|commercial ───────────────
// Body: { items: SpecificationItem[] }  — full replacement
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const type = new URL(req.url).searchParams.get('type');
        await connectDB();

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const body = await req.json();
        const items = (body.items ?? []) as SpecificationItem[];
        const field = getSpecField(type);

        // Re-index order
        const ordered = items.map((item, i) => ({
            label: item.label?.trim() ?? '',
            value: item.value?.trim() ?? '',
            order: item.order ?? i,
        })).filter(item => item.label && item.value);

        await db.update(projects).set({
            [field]: ordered,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Specifications updated', project: responseObj });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}