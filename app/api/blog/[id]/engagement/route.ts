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

        if (action === 'like' || action === 'unlike') {
            const settings = post.settings as any;
            if (settings && settings.allowLikes === false) {
                return NextResponse.json({ error: 'Likes disabled' }, { status: 403 });
            }

            const delta = action === 'like' ? 1 : -1;
            const newLikesCount = Math.max(0, (post.likesCount || 0) + delta);
            await db.update(blogPosts)
                .set({ likesCount: newLikesCount, updatedAt: now })
                .where(eq(blogPosts.id, postIdStr));

            if (action === 'like') {
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
            }

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
                authorName: authorName?.trim() || 'Anonymous',
                authorEmail: authorEmail?.trim() || '',
                content: content?.trim() || '',
                isApproved: true,
                createdAt: now,
                updatedAt: now
            });

            const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
            const responseObj = { ...comment, _id: comment.id };

            // Create notification
            await db.insert(notifications).values({
                id: crypto.randomUUID(),
                userId: 'system',
                managerName: authorName || 'Visitor',
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

// ── PATCH /api/blog/:id/engagement — Approve/Unapprove Comment ────────────────
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { commentId, isApproved } = body;

        if (!commentId) {
            return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
        }

        await connectDB();
        await db.update(comments)
            .set({ isApproved: Boolean(isApproved), updatedAt: new Date().toISOString() })
            .where(eq(comments.id, commentId));

        return NextResponse.json({ message: 'Comment status updated successfully', isApproved: Boolean(isApproved) });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── DELETE /api/blog/:id/engagement — Delete Comment ─────────────────────────
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { commentId } = body;

        if (!commentId) {
            return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
        }

        await connectDB();
        // Delete child replies if any, then the comment itself
        await db.delete(comments).where(or(eq(comments.id, commentId), eq(comments.parentId, commentId)));

        return NextResponse.json({ message: 'Comment deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
