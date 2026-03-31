// models/Notification.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    type: 'like' | 'comment' | 'reply' | 'manager_action';
    content: string;
    postId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    commentId?: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        type: { type: String, enum: ['like', 'comment', 'reply', 'manager_action'], required: true },
        content: { type: String, required: true },
        postId: { type: Schema.Types.ObjectId, ref: 'BlogPost' },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        commentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

if (mongoose.models.Notification) {
    delete (mongoose.models as any).Notification;
}

export default mongoose.model<INotification>('Notification', NotificationSchema);
