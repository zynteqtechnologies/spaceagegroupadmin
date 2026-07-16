// lib/notificationUtils.ts
import { connectDB, db } from './db';
import { notifications, users } from './schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function createManagerNotification(userId: string, userName: string, action: string, details: string) {
    try {
        await connectDB();

        // Dynamically find user to fetch latest name and role
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const roleLabel = user && user.role === 'administrator' ? 'Admin' : 'Manager';
        const displayName = user ? user.name : userName;

        const content = `${roleLabel} ${displayName} ${action}: ${details}`;

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await db.insert(notifications).values({
            id,
            userId,
            managerName: displayName,
            action,
            target: details,
            isRead: false,
            createdAt: now,
            updatedAt: now
        });

        const [notification] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
        return { ...notification, _id: notification.id };
    } catch (error: any) {
        console.error('Failed to create manager notification:', error);
        throw error;
    }
}
