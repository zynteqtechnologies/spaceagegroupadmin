// app/api/timeline/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TimelineEvent from '@/models/TimelineEvent';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const event = await TimelineEvent.findById(id);
        if (!event) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
        return NextResponse.json(event);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !isPrivileged(currentUser)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { year, title, description, order } = body;

        await connectDB();
        const event = await TimelineEvent.findById(id);
        if (!event) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

        if (year !== undefined) event.year = String(year).trim();
        if (title !== undefined) event.title = String(title).trim();
        if (description !== undefined) event.description = String(description).trim();
        if (order !== undefined) event.order = parseInt(order as string || '0');

        await event.save();

        // Notification
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated journey milestone',
            `${event.year} - ${event.title}`
        );

        return NextResponse.json(event);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !isPrivileged(currentUser)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();
        const event = await TimelineEvent.findById(id);
        if (!event) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

        const label = `${event.year} - ${event.title}`;
        await TimelineEvent.findByIdAndDelete(id);

        // Notification
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'deleted journey milestone',
            label
        );

        return NextResponse.json({ message: 'Milestone deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
