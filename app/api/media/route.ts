// app/api/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { media, projects } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { MediaItem } from '@/types/project';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';
import { uploadBuffer } from '@/lib/cloudinary';
import crypto from 'crypto';

// ── GET /api/media ────────────────────────────────────────────────────────────
export async function GET() {
    try {
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
        .orderBy(desc(media.createdAt));

        const mappedMedia = rows.map(row => ({
            ...row.mediaRecord,
            _id: row.mediaRecord.id,
            project: row.projectRecord ? {
                _id: row.projectRecord.id,
                id: row.projectRecord.id,
                title: row.projectRecord.title,
                slug: row.projectRecord.slug
            } : null
        }));

        return NextResponse.json(mappedMedia);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── POST /api/media ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const formData = await req.formData();
        
        const projectId = formData.get('projectId') as string;
        const title = formData.get('title') as string;
        const existingItemsRaw = formData.get('existingItems') as string;
        const files = formData.getAll('files') as File[];

        if (!projectId || !title) {
            return NextResponse.json({ error: 'Project and Title are required' }, { status: 400 });
        }

        const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const existingItems = JSON.parse(existingItemsRaw || '[]') as MediaItem[];
        const newDetailsRaw = formData.get('newDetails') as string;
        const newDetails = JSON.parse(newDetailsRaw || '[]') as any[];

        // Folder structure: media/[project-slug]/uploads
        // Sanitize title → slug so ImageKit doesn't reject spaces or special chars
        const safeTitle = project.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const folderName = `media/${safeTitle}/uploads`;

        // Find detail blocks matching actual file indices (excluding youtube)
        const fileDetails = newDetails.filter((d: any) => d.provider !== 'youtube');

        const newItems = await Promise.all(
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

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await db.insert(media).values({
            id,
            project: projectId,
            title,
            items: [...existingItems, ...newItems, ...youtubeItems] as any,
            createdAt: now,
            updatedAt: now
        });

        const [mediaRecord] = await db.select().from(media).where(eq(media.id, id)).limit(1);
        const responseObj = { ...mediaRecord, _id: mediaRecord.id };

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'uploaded media for project',
            project.title
        );

        return NextResponse.json(responseObj, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[POST /api/media]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
