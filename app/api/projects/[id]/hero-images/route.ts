// app/api/projects/[id]/hero-images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadBuffer, deleteFromCloudinary, CloudinaryResult } from '@/lib/cloudinary';
import { type NewMediaDetail } from '@/types/project';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

// ── PUT /api/projects/:id/hero-images — replace/add/delete hero images ────────
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('imageDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as (NewMediaDetail & { _id?: string; markedForDeletion?: boolean })[];
        const files = formData.getAll('images') as File[];

        const currentHeroImages = (project.heroImages as any[]) || [];
        const toKeep: any[] = [];
        const toDelete: any[] = [];
        const newMeta: Partial<NewMediaDetail>[] = [];

        details.forEach((d) => {
            if (d._id && !d.markedForDeletion) {
                const orig = currentHeroImages.find((img: any) => img._id === d._id || img.id === d._id);
                if (orig) {
                    toKeep.push({
                        _id: orig._id || orig.id,
                        id: orig.id || orig._id,
                        url: orig.url,
                        cloudinaryId: orig.cloudinaryId ?? '',
                        alt: d.alt ?? orig.alt ?? '',
                        title: d.title ?? orig.title,
                        isMainImage: d.isMainImage ?? orig.isMainImage ?? false,
                        order: d.order ?? orig.order ?? 0,
                        format: orig.format ?? 'webp',
                        fileSize: orig.fileSize ?? 0,
                        mediaType: orig.mediaType ?? 'image',
                        duration: orig.duration ?? null,
                        thumbnail: orig.thumbnail ?? null,
                    });
                }
            } else if (d._id && d.markedForDeletion) {
                const orig = currentHeroImages.find((img: any) => img._id === d._id || img.id === d._id);
                if (orig) toDelete.push(orig);
            } else {
                newMeta.push(d);
            }
        });

        await Promise.allSettled(
            toDelete.map(async (mediaItem) => {
                if (mediaItem.cloudinaryId) {
                    await deleteFromCloudinary(mediaItem.cloudinaryId, mediaItem.mediaType === 'video' ? 'video' : 'image');
                }
            })
        );

        const newObjects = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                const isVideo = file.type.startsWith('video/');
                const newId = crypto.randomUUID();
                return {
                    _id: newId,
                    id: newId,
                    url: result.secure_url,
                    cloudinaryId: result.public_id,
                    alt: newMeta[i]?.alt ?? '',
                    title: newMeta[i]?.title ?? file.name,
                    isMainImage: newMeta[i]?.isMainImage ?? false,
                    order: newMeta[i]?.order ?? toKeep.length + i,
                    format: isVideo ? (file.type.split('/')[1] ?? 'mp4') : 'webp',
                    fileSize: result.bytes,
                    mediaType: isVideo ? 'video' : 'image',
                    duration: result.duration ?? null,
                    thumbnail: isVideo ? result.secure_url.replace(/\.[^/.]+$/, '.jpg') : null,
                };
            })
        );

        const finalHeroImages = [...toKeep, ...newObjects];

        await db.update(projects).set({
            heroImages: finalHeroImages,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Hero images updated', project: responseObj });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[PUT /api/projects/[id]/hero-images]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── POST /api/projects/:id/hero-images — append new hero images ───────────────
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('imageDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as NewMediaDetail[];
        const files = formData.getAll('images') as File[];

        if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 });

        const currentHeroImages = (project.heroImages as any[]) || [];

        const newObjects = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                const isVideo = file.type.startsWith('video/');
                const newId = crypto.randomUUID();
                return {
                    _id: newId,
                    id: newId,
                    url: result.secure_url,
                    cloudinaryId: result.public_id,
                    alt: details[i]?.alt ?? '',
                    title: details[i]?.title ?? file.name,
                    isMainImage: details[i]?.isMainImage ?? false,
                    order: details[i]?.order ?? currentHeroImages.length + i,
                    format: isVideo ? (file.type.split('/')[1] ?? 'mp4') : 'webp',
                    fileSize: result.bytes,
                    mediaType: isVideo ? 'video' : 'image',
                    duration: result.duration ?? null,
                    thumbnail: isVideo ? result.secure_url.replace(/\.[^/.]+$/, '.jpg') : null,
                };
            })
        );

        const finalHeroImages = [...currentHeroImages, ...newObjects];

        await db.update(projects).set({
            heroImages: finalHeroImages,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Hero images added', project: responseObj }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}