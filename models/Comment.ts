// models/Comment.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
    postId: mongoose.Types.ObjectId;
    parentId?: mongoose.Types.ObjectId; // For replies
    authorName: string;
    authorEmail: string;
    content: string;
    likesCount: number;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
    {
        postId: { type: Schema.Types.ObjectId, ref: 'BlogPost', required: true },
        parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
        authorName: { type: String, required: true },
        authorEmail: { type: String, required: true },
        content: { type: String, required: true },
        likesCount: { type: Number, default: 0 },
        isApproved: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
