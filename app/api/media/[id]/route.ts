// app/api/media/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Media from '@/models/Media';
import Project from '@/models/Project';
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
        const media = await Media.findById(id).populate('project', 'title slug');
        if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(media);
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

        const { id } = await params;
        const contentType = req.headers.get('content-type') || '';
        
        await connectDB();
        const media = await Media.findById(id);
        if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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

            // Find project to get title for Cloudinary folder name
            const project = await Project.findById(media.project);
            const folderName = `media/${project ? project.title : 'uploads'}/uploads`;

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

        if (title) media.title = title;
        if (items) media.items = items;

        await media.save();
 
        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated media collection',
            media.title
        );
        return NextResponse.json(media);
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

        const { id } = await params;
        await connectDB();
        const media = await Media.findById(id);
        if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const mediaTitle = media.title;
        await Media.findByIdAndDelete(id);
 
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
