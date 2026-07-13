// app/api/timeline/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TimelineEvent from '@/models/TimelineEvent';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

export async function GET() {
    try {
        await connectDB();
        const events = await TimelineEvent.find().sort({ order: 1, year: 1 });
        return NextResponse.json(events);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !isPrivileged(currentUser)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { year, title, description, order } = body;

        if (!year || !title || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();
        const event = await TimelineEvent.create({
            year: String(year).trim(),
            title: String(title).trim(),
            description: String(description).trim(),
            order: parseInt(order as string || '0'),
        });

        // Notification
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'added journey milestone',
            `${year} - ${title}`
        );

        return NextResponse.json(event);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
