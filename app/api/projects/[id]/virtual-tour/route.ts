// app/api/projects/[id]/virtual-tour/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';
import { VirtualTour } from '@/types/project';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const project = await Project.findById(id).select('virtualTour').lean();
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(project.virtualTour ?? null);
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

// PUT — upsert virtual tour data
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const body = await req.json() as VirtualTour;

        project.virtualTour = {
            embedUrl: body.embedUrl?.trim() ?? '',
            type: body.type ?? 'other',
            thumbnailUrl: body.thumbnailUrl?.trim() ?? '',
            description: body.description?.trim() ?? '',
        };

        await project.save();
        return NextResponse.json({ message: 'Virtual tour updated', project });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        project.virtualTour = undefined;
        await project.save();

        return NextResponse.json({ message: 'Virtual tour removed', project });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}