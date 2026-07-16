// app/api/projects/[id]/sample-house-photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadBuffer, deleteFromCloudinary, CloudinaryResult } from '@/lib/cloudinary';
import { SampleHousePreview } from '@/types/project';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const [project] = await db.select({ sampleHousePhotos: projects.sampleHousePhotos }).from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(project.sampleHousePhotos ?? []);
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('photoDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as SampleHousePreview[];
        const files = formData.getAll('photos') as File[];

        if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 });

        const currentPhotos = (project.sampleHousePhotos as any[]) || [];

        const newPhotos = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                const newId = crypto.randomUUID();
                return {
                    _id: newId,
                    id: newId,
                    url: result.secure_url,
                    cloudinaryId: result.public_id,
                    title: details[i]?.title ?? file.name,
                    alt: details[i]?.alt ?? '',
                    roomType: details[i]?.roomType ?? '',
                    order: details[i]?.order ?? currentPhotos.length + i,
                    fileSize: result.bytes,
                };
            })
        );

        const finalPhotos = [...currentPhotos, ...newPhotos];

        await db.update(projects).set({
            sampleHousePhotos: finalPhotos,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Photos added', project: responseObj }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('photoDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as (SampleHousePreview & { _id?: string; markedForDeletion?: boolean })[];
        const files = formData.getAll('photos') as File[];

        const currentPhotos = (project.sampleHousePhotos as any[]) || [];
        const toKeep: any[] = [];
        const toDelete: any[] = [];
        const newMeta: Partial<SampleHousePreview>[] = [];

        for (const d of details) {
            if (d._id && d.markedForDeletion) {
                const orig = currentPhotos.find((photo: any) => photo._id === d._id || photo.id === d._id);
                if (orig) toDelete.push(orig);
            } else if (d._id) {
                const orig = currentPhotos.find((photo: any) => photo._id === d._id || photo.id === d._id);
                if (orig) {
                    toKeep.push({
                        _id: orig._id || orig.id,
                        id: orig.id || orig._id,
                        url: orig.url,
                        cloudinaryId: orig.cloudinaryId,
                        title: d.title ?? orig.title,
                        alt: d.alt ?? orig.alt ?? '',
                        roomType: d.roomType ?? orig.roomType ?? '',
                        order: d.order ?? orig.order ?? 0,
                        fileSize: orig.fileSize,
                    });
                }
            } else {
                newMeta.push(d);
            }
        }

        await Promise.allSettled(
            toDelete.map(async (orig) => {
                if (orig.cloudinaryId) {
                    await deleteFromCloudinary(orig.cloudinaryId, 'image').catch(console.error);
                }
            })
        );

        const newPhotos = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                const newId = crypto.randomUUID();
                return {
                    _id: newId,
                    id: newId,
                    url: result.secure_url,
                    cloudinaryId: result.public_id,
                    title: newMeta[i]?.title ?? file.name,
                    alt: newMeta[i]?.alt ?? '',
                    roomType: newMeta[i]?.roomType ?? '',
                    order: newMeta[i]?.order ?? toKeep.length + i,
                    fileSize: result.bytes,
                };
            })
        );

        const finalPhotos = [...toKeep, ...newPhotos];

        await db.update(projects).set({
            sampleHousePhotos: finalPhotos,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Photos updated', project: responseObj });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}