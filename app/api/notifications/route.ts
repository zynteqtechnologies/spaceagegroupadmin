// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import BlogPost from '@/models/BlogPost';
import User from '@/models/User';
import { requireAuth } from '@/lib/apiGuard';

export async function GET(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;

        // Reference models to prevent compiler optimization from stripping unused imports
        const _registeredModels = [BlogPost, User];

        await connectDB();
        const notifications = await Notification.find()
            .populate('postId', 'title')
            .sort({ createdAt: -1 })
            .limit(20);
        return NextResponse.json(notifications);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;

        const { id, all } = await req.json();
        await connectDB();

        if (all) {
            await Notification.updateMany({ isRead: false }, { isRead: true });
        } else {
            await Notification.findByIdAndUpdate(id, { isRead: true });
        }

        return NextResponse.json({ message: 'Notifications updated' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
