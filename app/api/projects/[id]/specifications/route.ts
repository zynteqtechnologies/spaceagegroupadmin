// app/api/projects/[id]/specifications/route.ts
// Handles both common and commercial specs via query param ?type=common|commercial
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';
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

        const project = await Project.findById(id).select('commonSpecifications commercialSpecifications').lean();
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

        const project = await Project.findById(id);
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

        project.set(field, ordered);
        await project.save();

        return NextResponse.json({ message: 'Specifications updated', project });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}