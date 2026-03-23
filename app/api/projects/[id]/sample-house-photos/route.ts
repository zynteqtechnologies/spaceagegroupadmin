// app/api/projects/[id]/sample-house-photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { uploadBuffer, deleteFromCloudinary, CloudinaryResult } from '@/lib/cloudinary';
import Project from '@/models/Project';
import { SampleHousePreview } from '@/types/project';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const project = await Project.findById(id).select('sampleHousePhotos').lean();
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

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('photoDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as SampleHousePreview[];
        const files = formData.getAll('photos') as File[];

        if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 });

        const newPhotos = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                return {
                    url: result.secure_url, cloudinaryId: result.public_id,
                    title: details[i]?.title ?? file.name,
                    alt: details[i]?.alt ?? '',
                    roomType: details[i]?.roomType ?? '',
                    order: details[i]?.order ?? project.sampleHousePhotos.length + i,
                    fileSize: result.bytes,
                };
            })
        );

        project.sampleHousePhotos.push(...newPhotos);
        await project.save();

        return NextResponse.json({ message: 'Photos added', project }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('photoDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as (SampleHousePreview & { _id?: string; markedForDeletion?: boolean })[];
        const files = formData.getAll('photos') as File[];

        const toKeep: object[] = [];
        const newMeta: Partial<SampleHousePreview>[] = [];

        for (const d of details) {
            if (d._id && d.markedForDeletion) {
                const orig = project.sampleHousePhotos.id(d._id);
                if (orig?.cloudinaryId) await deleteFromCloudinary(orig.cloudinaryId, 'image').catch(console.error);
                project.sampleHousePhotos.pull({ _id: d._id });
            } else if (d._id) {
                const orig = project.sampleHousePhotos.id(d._id);
                if (orig) {
                    toKeep.push({
                        url: orig.url, cloudinaryId: orig.cloudinaryId,
                        title: d.title ?? orig.title, alt: d.alt ?? orig.alt ?? '',
                        roomType: d.roomType ?? orig.roomType ?? '',
                        order: d.order ?? orig.order ?? 0,
                        fileSize: orig.fileSize,
                    });
                }
            } else {
                newMeta.push(d);
            }
        }

        const newPhotos = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                return {
                    url: result.secure_url, cloudinaryId: result.public_id,
                    title: newMeta[i]?.title ?? file.name,
                    alt: newMeta[i]?.alt ?? '',
                    roomType: newMeta[i]?.roomType ?? '',
                    order: newMeta[i]?.order ?? toKeep.length + i,
                    fileSize: result.bytes,
                };
            })
        );

        project.set('sampleHousePhotos', [...toKeep, ...newPhotos]);
        await project.save();

        return NextResponse.json({ message: 'Photos updated', project });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}