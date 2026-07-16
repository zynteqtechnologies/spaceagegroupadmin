// app/api/timeline/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { timelineEvents } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const [event] = await db.select().from(timelineEvents).where(eq(timelineEvents.id, id)).limit(1);
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
        const [event] = await db.select().from(timelineEvents).where(eq(timelineEvents.id, id)).limit(1);
        if (!event) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

        const updates: any = {};
        if (year !== undefined) updates.year = String(year).trim();
        if (title !== undefined) updates.title = String(title).trim();
        if (description !== undefined) updates.description = String(description).trim();
        if (order !== undefined) updates.order = parseInt(String(order) || '0');
        updates.updatedAt = new Date().toISOString();

        await db.update(timelineEvents).set(updates).where(eq(timelineEvents.id, id));
        const [updatedEvent] = await db.select().from(timelineEvents).where(eq(timelineEvents.id, id)).limit(1);

        // Notification
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated journey milestone',
            `${updatedEvent.year} - ${updatedEvent.title}`
        );

        return NextResponse.json(updatedEvent);
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
        const [event] = await db.select().from(timelineEvents).where(eq(timelineEvents.id, id)).limit(1);
        if (!event) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

        const label = `${event.year} - ${event.title}`;
        await db.delete(timelineEvents).where(eq(timelineEvents.id, id));

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
