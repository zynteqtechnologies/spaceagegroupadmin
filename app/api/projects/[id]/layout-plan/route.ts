// app/api/projects/[id]/layout-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadBuffer, deleteFromCloudinary, CloudinaryResult } from '@/lib/cloudinary';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const file = formData.get('layoutPlan') as File | null;
        const title = formData.get('title') as string ?? 'Layout Plan';
        const alt = formData.get('alt') as string ?? '';

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        // Delete old
        if ((project.layoutPlan as any)?.cloudinaryId) {
            await deleteFromCloudinary((project.layoutPlan as any).cloudinaryId, 'image').catch(console.error);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result: CloudinaryResult = await uploadBuffer(buffer, file.type);

        const newLayoutPlan = {
            url: result.secure_url,
            cloudinaryId: result.public_id,
            title,
            alt,
            format: 'webp',
            fileSize: result.bytes,
            mediaType: 'image',
        };

        await db.update(projects).set({
            layoutPlan: newLayoutPlan,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Layout plan updated', project: responseObj });
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

        if ((project.layoutPlan as any)?.cloudinaryId) {
            await deleteFromCloudinary((project.layoutPlan as any).cloudinaryId, 'image').catch(console.error);
        }

        await db.update(projects).set({
            layoutPlan: null,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Layout plan deleted', project: responseObj });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}