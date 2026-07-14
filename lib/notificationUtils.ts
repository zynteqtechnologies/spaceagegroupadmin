// lib/notificationUtils.ts
import { connectDB } from './mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function createManagerNotification(userId: string, userName: string, action: string, details: string) {
    try {
        await connectDB();

        // Dynamically find user to fetch latest name and role
        const user = await User.findById(userId);
        const roleLabel = user && user.role === 'administrator' ? 'Admin' : 'Manager';
        const displayName = user ? user.name : userName;

        const content = `${roleLabel} ${displayName} ${action}: ${details}`;

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
