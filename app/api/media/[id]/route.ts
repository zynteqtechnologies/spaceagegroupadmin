// app/api/media/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Media from '@/models/Media';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
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
        const currentUser = await getCurrentUser(req);
        const { id } = await params;
        const body = await req.json();
        const { title, items } = body;

        await connectDB();
        
        const media = await Media.findById(id);
        if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (title) media.title = title;
        if (items) media.items = items;

        await media.save();
 
        // ── Privileged Action Notification ──────────────────────────────
        if (currentUser && isPrivileged(currentUser)) {
            await createManagerNotification(
                currentUser._id.toString(),
                currentUser.name,
                'updated media collection',
                media.title
            );
        }
        return NextResponse.json(media);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── DELETE /api/media/:id ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const currentUser = await getCurrentUser(req);
        const { id } = await params;
        await connectDB();
        const media = await Media.findById(id);
        if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const mediaTitle = media.title;
        await Media.findByIdAndDelete(id);
 
        // ── Privileged Action Notification ──────────────────────────────
        if (currentUser && isPrivileged(currentUser)) {
            await createManagerNotification(
                currentUser._id.toString(),
                currentUser.name,
                'deleted media collection',
                mediaTitle
            );
        }
        return NextResponse.json({ message: 'Media deleted successfully' });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
