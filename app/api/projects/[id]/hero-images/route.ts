// app/api/projects/[id]/hero-images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { uploadBuffer, deleteFromCloudinary, CloudinaryResult } from '@/lib/cloudinary';
import Project from '@/models/Project';
import { type NewMediaDetail } from '@/types/project';

type Params = { params: Promise<{ id: string }> };

// ── PUT /api/projects/:id/hero-images — replace/add/delete hero images ────────
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('imageDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as (NewMediaDetail & { _id?: string; markedForDeletion?: boolean })[];
        const files = formData.getAll('images') as File[];

        const toKeep: object[] = [];
        const toDelete: { cloudinaryId?: string; mediaType?: string; _id: unknown }[] = [];
        const newMeta: Partial<NewMediaDetail>[] = [];

        details.forEach((d) => {
            if (d._id && !d.markedForDeletion) {
                const orig = project.heroImages.id(d._id);
                if (orig) {
                    toKeep.push({
                        url: orig.url, cloudinaryId: orig.cloudinaryId ?? '',
                        alt: d.alt ?? orig.alt ?? '', title: d.title ?? orig.title,
                        isMainImage: d.isMainImage ?? orig.isMainImage ?? false,
                        order: d.order ?? orig.order ?? 0,
                        format: orig.format ?? 'webp', fileSize: orig.fileSize ?? 0,
                        mediaType: orig.mediaType ?? 'image',
                        duration: orig.duration ?? null, thumbnail: orig.thumbnail ?? null,
                    });
                }
            } else if (d._id && d.markedForDeletion) {
                const orig = project.heroImages.id(d._id);
                if (orig) toDelete.push(orig as unknown as { cloudinaryId?: string; mediaType?: string; _id: unknown });
            } else {
                newMeta.push(d);
            }
        });

        await Promise.allSettled(
            toDelete.map(async (media) => {
                if (media.cloudinaryId) {
                    await deleteFromCloudinary(media.cloudinaryId, media.mediaType === 'video' ? 'video' : 'image');
                }
                project.heroImages.pull({ _id: media._id });
            })
        );

        const newObjects = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                const isVideo = file.type.startsWith('video/');
                return {
                    url: result.secure_url, cloudinaryId: result.public_id,
                    alt: newMeta[i]?.alt ?? '', title: newMeta[i]?.title ?? file.name,
                    isMainImage: newMeta[i]?.isMainImage ?? false,
                    order: newMeta[i]?.order ?? toKeep.length + i,
                    format: isVideo ? (file.type.split('/')[1] ?? 'mp4') : 'webp',
                    fileSize: result.bytes, mediaType: isVideo ? 'video' : 'image',
                    duration: result.duration ?? null,
                    thumbnail: isVideo ? result.secure_url.replace(/\.[^/.]+$/, '.jpg') : null,
                };
            })
        );

        project.set('heroImages', [...toKeep, ...newObjects]);
        await project.save();

        return NextResponse.json({ message: 'Hero images updated', project });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[PUT /api/projects/[id]/hero-images]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── DELETE single hero image: handled via PUT with markedForDeletion
// ── POST /api/projects/:id/hero-images — append new hero images ───────────────
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('imageDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as NewMediaDetail[];
        const files = formData.getAll('images') as File[];

        if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 });

        const newObjects = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                const isVideo = file.type.startsWith('video/');
                return {
                    url: result.secure_url, cloudinaryId: result.public_id,
                    alt: details[i]?.alt ?? '', title: details[i]?.title ?? file.name,
                    isMainImage: details[i]?.isMainImage ?? false,
                    order: details[i]?.order ?? project.heroImages.length + i,
                    format: isVideo ? (file.type.split('/')[1] ?? 'mp4') : 'webp',
                    fileSize: result.bytes, mediaType: isVideo ? 'video' : 'image',
                    duration: result.duration ?? null,
                    thumbnail: isVideo ? result.secure_url.replace(/\.[^/.]+$/, '.jpg') : null,
                };
            })
        );

        project.heroImages.push(...newObjects);
        await project.save();

        return NextResponse.json({ message: 'Hero images added', project }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}