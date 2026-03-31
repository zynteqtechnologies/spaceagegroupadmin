// app/api/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Media from '@/models/Media';
import Project from '@/models/Project';
import { uploadBuffer } from '@/lib/cloudinary';
import { MediaItem } from '@/types/project';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

// ── GET /api/media ────────────────────────────────────────────────────────────
export async function GET() {
    try {
        await connectDB();
        const media = await Media.find().populate('project', 'title slug').sort({ createdAt: -1 });
        return NextResponse.json(media);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── POST /api/media ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        await connectDB();
        const formData = await req.formData();
        
        const projectId = formData.get('projectId') as string;
        const title = formData.get('title') as string;
        const existingItemsRaw = formData.get('existingItems') as string;
        const files = formData.getAll('files') as File[];

        if (!projectId || !title) {
            return NextResponse.json({ error: 'Project and Title are required' }, { status: 400 });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const existingItems = JSON.parse(existingItemsRaw || '[]') as MediaItem[];
        const newDetailsRaw = formData.get('newDetails') as string;
        const newDetails = JSON.parse(newDetailsRaw || '[]') as any[];

        // Cloudinary folder structure: media/[project.title]/uploads
        const folderName = `media/${project.title}/uploads`;

        const newItems = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const isVideo = file.type.startsWith('video/');
                const isPdf = file.type === 'application/pdf';
                const result = await uploadBuffer(buffer, file.type, folderName);

                const detail = newDetails[i] || {};

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
                    thumbnail: isVideo ? result.secure_url.replace(/\.[^/.]+$/, '.jpg') 
                             : isPdf ? 'https://res.cloudinary.com/demo/image/upload/v1/pdf_logo.png' // Placeholder or generated
                             : null,
                };
            })
        );

        const media = await Media.create({
            project: projectId,
            title,
            items: [...existingItems, ...newItems] as any,
        });

        // ── Privileged Action Notification ──────────────────────────────
        if (currentUser && isPrivileged(currentUser)) {
            await createManagerNotification(
                currentUser._id.toString(),
                currentUser.name,
                'uploaded media for project',
                project.title
            );
        }

        return NextResponse.json(media, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[POST /api/media]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
