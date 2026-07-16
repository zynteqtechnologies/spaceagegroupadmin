// app/api/projects/[id]/virtual-tour/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { VirtualTour } from '@/types/project';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const [project] = await db.select({ virtualTour: projects.virtualTour }).from(projects).where(eq(projects.id, id)).limit(1);
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

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const body = await req.json() as VirtualTour;

        const newVirtualTour = {
            embedUrl: body.embedUrl?.trim() ?? '',
            type: body.type ?? 'other',
            thumbnailUrl: body.thumbnailUrl?.trim() ?? '',
            description: body.description?.trim() ?? '',
        };

        await db.update(projects).set({
            virtualTour: newVirtualTour,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Virtual tour updated', project: responseObj });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await db.update(projects).set({
            virtualTour: null,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Virtual tour removed', project: responseObj });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}