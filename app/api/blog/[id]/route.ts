// app/api/blog/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';
import { uploadBuffer, deleteFromCloudinary } from '@/lib/cloudinary';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';

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

        // Enforce draft content safety
        if (post.status === 'draft') {
            const currentUser = await getCurrentUser(req);
            if (!currentUser || !isPrivileged(currentUser)) {
                return NextResponse.json({ error: 'Forbidden: You do not have permission to view drafts' }, { status: 403 });
            }
        }

        return NextResponse.json({ ...post, _id: post.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const formData = await req.formData();
        
        await connectDB();
        const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        const updates: any = {};
        const fields = ['title', 'description', 'excerpt', 'category', 'status', 'videoUrl', 'author', 'authorRole', 'readTime'];
        fields.forEach(field => {
            const val = formData.get(field);
            if (val !== null) updates[field] = val;
        });

        const featured = formData.get('featured');
        if (featured !== null) updates.featured = featured === 'true';

        const tags = formData.get('tags');
        if (tags) updates.tags = JSON.parse(tags as string);

        const allowLikes = formData.get('allowLikes');
        const allowComments = formData.get('allowComments');
        const currentSettings = { ...(post.settings as any) };
        let settingsChanged = false;
        if (allowLikes !== null) {
            currentSettings.allowLikes = allowLikes === 'true';
            settingsChanged = true;
        }
        if (allowComments !== null) {
            currentSettings.allowComments = allowComments === 'true';
            settingsChanged = true;
        }
        if (settingsChanged) {
            updates.settings = currentSettings;
        }

        // Update image if provided
        const imageFile = formData.get('image') as File | null;
        if (imageFile) {
            if (post.image && (post.image as any).cloudinaryId) {
                await deleteFromCloudinary((post.image as any).cloudinaryId);
            }
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadResult = await uploadBuffer(buffer, imageFile.type, 'blog-posts');
            updates.image = {
                url: uploadResult.secure_url,
                cloudinaryId: uploadResult.public_id
            };
        }

        updates.updatedAt = new Date().toISOString();

        await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));
        const [updatedPost] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
        const responseObj = { ...updatedPost, _id: updatedPost.id };

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated blog post',
            updatedPost.title
        );
        return NextResponse.json(responseObj);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await connectDB();
        const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        if (post.image && (post.image as any).cloudinaryId) {
            await deleteFromCloudinary((post.image as any).cloudinaryId);
        }
        const postTitle = post.title;
        await db.delete(blogPosts).where(eq(blogPosts.id, id));

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'deleted blog post',
            postTitle
        );
        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
