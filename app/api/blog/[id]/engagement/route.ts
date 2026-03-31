// app/api/blog/[id]/engagement/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BlogPost from '@/models/BlogPost';
import Comment from '@/models/Comment';
import Notification from '@/models/Notification';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const comments = await Comment.find({ postId: id }).sort({ createdAt: -1 });
        return NextResponse.json(comments);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { action, authorName, authorEmail, content, parentId } = body;

        await connectDB();
        const post = await BlogPost.findById(id);
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        if (action === 'like') {
            if (!post.settings.allowLikes) return NextResponse.json({ error: 'Likes disabled' }, { status: 403 });
            post.likesCount += 1;
            await post.save();

            // Create notification
            await Notification.create({
                type: 'like',
                content: `Someone liked your post: ${post.title}`,
                postId: id
            });

            return NextResponse.json({ likesCount: post.likesCount });
        }

        if (action === 'comment' || action === 'reply') {
            if (!post.settings.allowComments) return NextResponse.json({ error: 'Comments disabled' }, { status: 403 });
            
            const comment = await Comment.create({
                postId: id,
                parentId: parentId || null,
                authorName,
                authorEmail,
                content
            });

            // Create notification
            await Notification.create({
                type: action === 'reply' ? 'reply' : 'comment',
                content: `${authorName} ${action === 'reply' ? 'replied to a comment' : 'commented'} on: ${post.title}`,
                postId: id,
                commentId: comment._id
            });

            return NextResponse.json(comment);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
