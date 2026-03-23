// app/api/projects/[id]/layout-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { uploadBuffer, deleteFromCloudinary, CloudinaryResult } from '@/lib/cloudinary';
import Project from '@/models/Project';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const file = formData.get('layoutPlan') as File | null;
        const title = formData.get('title') as string ?? 'Layout Plan';
        const alt = formData.get('alt') as string ?? '';

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        // Delete old
        if (project.layoutPlan?.cloudinaryId) {
            await deleteFromCloudinary(project.layoutPlan.cloudinaryId, 'image').catch(console.error);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result: CloudinaryResult = await uploadBuffer(buffer, file.type);

        project.layoutPlan = {
            url: result.secure_url, cloudinaryId: result.public_id,
            title, alt, format: 'webp', fileSize: result.bytes, mediaType: 'image',
        };

        await project.save();
        return NextResponse.json({ message: 'Layout plan updated', project });
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

        if (project.layoutPlan?.cloudinaryId) {
            await deleteFromCloudinary(project.layoutPlan.cloudinaryId, 'image').catch(console.error);
        }
        project.layoutPlan = undefined;
        await project.save();

        return NextResponse.json({ message: 'Layout plan deleted', project });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}