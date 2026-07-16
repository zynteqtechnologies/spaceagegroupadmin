// app/api/projects/[id]/brochure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadBuffer, deleteFromCloudinary } from '@/lib/cloudinary';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const file = formData.get('brochure') as File | null;

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF allowed' }, { status: 400 });

        // Delete old
        if ((project.brochure as any)?.cloudinaryId) {
            await deleteFromCloudinary((project.brochure as any).cloudinaryId, 'image').catch(console.error);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadBuffer(buffer, file.type, 'space-age-brochures');

        const newBrochure = {
            url: result.secure_url,
            cloudinaryId: result.public_id,
            fileName: file.name,
            fileSize: result.bytes,
        };

        await db.update(projects).set({
            brochure: newBrochure,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Brochure updated', project: responseObj });
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

        if ((project.brochure as any)?.cloudinaryId) {
            await deleteFromCloudinary((project.brochure as any).cloudinaryId, 'image').catch(console.error);
        }

        await db.update(projects).set({
            brochure: null,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Brochure deleted', project: responseObj });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}