// app/api/blog/[id]/engagement/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { blogPosts, comments, notifications } from '@/lib/schema';
import { eq, or, desc } from 'drizzle-orm';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        
        const [post] = await db.select()
            .from(blogPosts)
            .where(or(eq(blogPosts.id, id), eq(blogPosts.slug, id)))
            .limit(1);
        
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        const records = await db.select()
            .from(comments)
            .where(eq(comments.postId, post.id))
            .orderBy(desc(comments.createdAt));

        const mapped = records.map(c => ({ ...c, _id: c.id }));
        return NextResponse.json(mapped);
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
        
        const [post] = await db.select()
            .from(blogPosts)
            .where(or(eq(blogPosts.id, id), eq(blogPosts.slug, id)))
            .limit(1);

        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        
        const postIdStr = post.id;
        const now = new Date().toISOString();

        if (action === 'like') {
            const settings = post.settings as any;
            if (settings && settings.allowLikes === false) {
                return NextResponse.json({ error: 'Likes disabled' }, { status: 403 });
            }

            const newLikesCount = (post.likesCount || 0) + 1;
            await db.update(blogPosts)
                .set({ likesCount: newLikesCount, updatedAt: now })
                .where(eq(blogPosts.id, postIdStr));

            // Create notification
            await db.insert(notifications).values({
                id: crypto.randomUUID(),
                userId: 'system',
                managerName: 'Visitor',
                action: 'liked post',
                target: post.title,
                isRead: false,
                createdAt: now,
                updatedAt: now
            });

            return NextResponse.json({ likesCount: newLikesCount });
        }

        if (action === 'comment' || action === 'reply') {
            const settings = post.settings as any;
            if (settings && settings.allowComments === false) {
                return NextResponse.json({ error: 'Comments disabled' }, { status: 403 });
            }
            
            const commentId = crypto.randomUUID();
            await db.insert(comments).values({
                id: commentId,
                postId: postIdStr,
                parentId: parentId || null,
                authorName,
                authorEmail,
                content,
                createdAt: now,
                updatedAt: now
            });

            const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
            const responseObj = { ...comment, _id: comment.id };

            // Create notification
            await db.insert(notifications).values({
                id: crypto.randomUUID(),
                userId: 'system',
                managerName: authorName,
                action: action === 'reply' ? 'replied to comment' : 'commented on post',
                target: post.title,
                isRead: false,
                createdAt: now,
                updatedAt: now
            });

            return NextResponse.json(responseObj);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
