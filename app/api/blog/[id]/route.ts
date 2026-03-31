// app/api/blog/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BlogPost from '@/models/BlogPost';
import { uploadBuffer, deleteFromCloudinary } from '@/lib/cloudinary';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const post = await BlogPost.findById(id);
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        return NextResponse.json(post);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const currentUser = await getCurrentUser(req);
        const { id } = await params;
        const formData = await req.formData();
        
        await connectDB();
        const post = await BlogPost.findById(id);
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        // Update basic fields
        const fields = ['title', 'description', 'category', 'status', 'videoUrl'];
        fields.forEach(field => {
            const val = formData.get(field);
            if (val !== null) (post as any)[field] = val;
        });

        const tags = formData.get('tags');
        if (tags) post.tags = JSON.parse(tags as string);

        const allowLikes = formData.get('allowLikes');
        if (allowLikes !== null) post.settings.allowLikes = allowLikes === 'true';

        const allowComments = formData.get('allowComments');
        if (allowComments !== null) post.settings.allowComments = allowComments === 'true';

        // Update image if provided
        const imageFile = formData.get('image') as File | null;
        if (imageFile) {
            await deleteFromCloudinary(post.image.cloudinaryId);
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadResult = await uploadBuffer(buffer, imageFile.type, 'blog-posts');
            post.image = {
                url: uploadResult.secure_url,
                cloudinaryId: uploadResult.public_id
            };
        }

        await post.save();

        // ── Privileged Action Notification ──────────────────────────────
        if (currentUser && isPrivileged(currentUser)) {
            await createManagerNotification(
                currentUser._id.toString(),
                currentUser.name,
                'updated blog post',
                post.title
            );
        }
        return NextResponse.json(post);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const currentUser = await getCurrentUser(req);
        const { id } = await params;
        await connectDB();
        const post = await BlogPost.findById(id);
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

        await deleteFromCloudinary(post.image.cloudinaryId);
        const postTitle = post.title;
        await BlogPost.findByIdAndDelete(id);

        // ── Privileged Action Notification ──────────────────────────────
        if (currentUser && isPrivileged(currentUser)) {
            await createManagerNotification(
                currentUser._id.toString(),
                currentUser.name,
                'deleted blog post',
                postTitle
            );
        }
        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
