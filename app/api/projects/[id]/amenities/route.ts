// app/api/projects/[id]/amenities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';
import { AmenityItem } from '@/types/project';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const project = await Project.findById(id).select('amenities').lean();
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(project.amenities ?? []);
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

// PUT — full replacement
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const body = await req.json();
        const items = (body.items ?? []) as AmenityItem[];

        const ordered = items.map((item, i) => ({
            name: item.name?.trim() ?? '',
            icon: item.icon ?? '',
            category: item.category ?? '',
            order: item.order ?? i,
        })).filter(item => item.name);

        project.set('amenities', ordered);
        await project.save();

        return NextResponse.json({ message: 'Amenities updated', project });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}