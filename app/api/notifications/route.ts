// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { notifications, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/apiGuard';

export async function GET(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;

        await connectDB();
        const records = await db.select({
            id: notifications.id,
            userId: notifications.userId,
            managerName: notifications.managerName,
            action: notifications.action,
            target: notifications.target,
            isRead: notifications.isRead,
            createdAt: notifications.createdAt,
            updatedAt: notifications.updatedAt,
            user: {
                id: users.id,
                name: users.name
            }
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.userId, users.id))
        .orderBy(desc(notifications.createdAt))
        .limit(20);

        const mapped = records.map(n => ({
            ...n,
            _id: n.id,
            userId: n.user ? { _id: n.user.id, id: n.user.id, name: n.user.name } : n.userId,
            content: `${n.user && n.user.name ? n.user.name : n.managerName} ${n.action}: ${n.target}`
        }));

        return NextResponse.json(mapped);
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
            await db.update(notifications)
                .set({ isRead: true, updatedAt: new Date().toISOString() })
                .where(eq(notifications.isRead, false));
        } else {
            await db.update(notifications)
                .set({ isRead: true, updatedAt: new Date().toISOString() })
                .where(eq(notifications.id, id));
        }

        return NextResponse.json({ message: 'Notifications updated' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
