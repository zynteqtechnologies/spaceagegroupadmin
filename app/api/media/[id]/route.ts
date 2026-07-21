// app/api/media/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { media, projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadBuffer } from '@/lib/cloudinary';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/media/:id ────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const rows = await db.select({
            mediaRecord: media,
            projectRecord: {
                id: projects.id,
                title: projects.title,
                slug: projects.slug
            }
        })
        .from(media)
        .leftJoin(projects, eq(media.project, projects.id))
        .where(eq(media.id, id))
        .limit(1);

        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        
        const row = rows[0];
        const responseObj = {
            ...row.mediaRecord,
            _id: row.mediaRecord.id,
            project: row.projectRecord ? {
                _id: row.projectRecord.id,
                id: row.projectRecord.id,
                title: row.projectRecord.title,
                slug: row.projectRecord.slug
            } : null
        };

        return NextResponse.json(responseObj);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── PATCH /api/media/:id ─────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const contentType = req.headers.get('content-type') || '';
        
        await connectDB();
        const [mediaRecord] = await db.select().from(media).where(eq(media.id, id)).limit(1);
        if (!mediaRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        let title = '';
        let items: any[] = [];

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            title = formData.get('title') as string || '';
            const existingItemsRaw = formData.get('existingItems') as string;
            const existingItems = JSON.parse(existingItemsRaw || '[]') as any[];

            const newDetailsRaw = formData.get('newDetails') as string;
            const newDetails = JSON.parse(newDetailsRaw || '[]') as any[];

            const files = formData.getAll('files') as File[];

            // Find project to get title for folder name
            const [project] = await db.select().from(projects).where(eq(projects.id, mediaRecord.project)).limit(1);
            const safeTitle = project
                ? project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                : 'uploads';
            const folderName = `media/${safeTitle}/uploads`;

            const fileDetails = newDetails.filter((d: any) => d.provider !== 'youtube');

            const newUploadedItems = await Promise.all(
                files.map(async (file, i) => {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const isVideo = file.type.startsWith('video/');
                    const isPdf = file.type === 'application/pdf';
                    const result = await uploadBuffer(buffer, file.type, folderName);

                    const detail = fileDetails[i] || {};

                    return {
                        url: result.secure_url,
                        cloudinaryId: result.public_id,
                        title: detail.title || file.name,
                        alt: detail.alt || '',
                        description: detail.description || '',
                        category: detail.category || (isVideo ? 'video' : isPdf ? 'brochure' : 'image'),
                        mediaType: isVideo ? 'video' : isPdf ? 'document' : 'image',
                        isInProjects: false,
                        format: isVideo ? (file.type.split('/')[1] ?? 'mp4') : isPdf ? 'pdf' : 'webp',
                        fileSize: result.bytes,
                        duration: result.duration ?? null,
                        thumbnail: detail.thumbnail || (isVideo ? result.secure_url.replace(/\.[^/.]+$/, '.jpg') 
                                 : isPdf ? 'https://res.cloudinary.com/demo/image/upload/v1/pdf_logo.png'
                                 : null),
                        subCategory: detail.subCategory || null,
                    };
                })
            );

            const youtubeItems = newDetails
                .filter((d: any) => d.provider === 'youtube' && d.url)
                .map((detail: any) => ({
                    url: detail.url,
                    title: detail.title || 'YouTube Video',
                    alt: detail.alt || '',
                    description: detail.description || '',
                    category: 'video',
                    mediaType: 'video',
                    isInProjects: false,
                    provider: 'youtube',
                    thumbnail: detail.thumbnail || null,
                    subCategory: detail.subCategory || null,
                }));

            items = [...existingItems, ...newUploadedItems, ...youtubeItems];
        } else {
            const body = await req.json();
            title = body.title;
            items = body.items;
        }

        const updates: any = {};
        if (title) updates.title = title;
        if (items) updates.items = items;
        updates.updatedAt = new Date().toISOString();

        await db.update(media).set(updates).where(eq(media.id, id));
        const [updatedRecord] = await db.select().from(media).where(eq(media.id, id)).limit(1);
        const responseObj = { ...updatedRecord, _id: updatedRecord.id };

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated media collection',
            updatedRecord.title
        );
        return NextResponse.json(responseObj);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── DELETE /api/media/:id ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await connectDB();
        const [mediaRecord] = await db.select().from(media).where(eq(media.id, id)).limit(1);
        if (!mediaRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const mediaTitle = mediaRecord.title;
        
        await db.delete(media).where(eq(media.id, id));
 
        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'deleted media collection',
            mediaTitle
        );
        return NextResponse.json({ message: 'Media deleted successfully' });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
