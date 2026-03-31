// lib/notificationUtils.ts
import { connectDB } from './mongodb';
import Notification from '@/models/Notification';

export async function createManagerNotification(userId: string, userName: string, action: string, details: string) {
    try {
        await connectDB();

        const content = `Manager ${userName} ${action}: ${details}`;

        const notification = await Notification.create({
            type: 'manager_action',
            content,
            userId,
            isRead: false
        });

        return notification;
    } catch (error: any) {
        console.error('Failed to create manager notification:', error);
        throw error;
    }
}
