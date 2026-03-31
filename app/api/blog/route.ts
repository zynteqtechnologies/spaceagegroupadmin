// app/api/blog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BlogPost from '@/models/BlogPost';
import { uploadBuffer } from '@/lib/cloudinary';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        
        await connectDB();
        const filter: any = {};
        if (status) filter.status = status;
        if (category) filter.category = category;

        const posts = await BlogPost.find(filter).sort({ createdAt: -1 });
        return NextResponse.json(posts);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        const formData = await req.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const tags = JSON.parse(formData.get('tags') as string || '[]');
        const status = formData.get('status') as string || 'draft';
        const videoUrl = formData.get('videoUrl') as string;
        const allowLikes = formData.get('allowLikes') === 'true';
        const allowComments = formData.get('allowComments') === 'true';
        const imageFile = formData.get('image') as File | null;

        if (!title || !description || !category || !imageFile) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Generate slug
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const existing = await BlogPost.findOne({ slug });
        if (existing) {
            return NextResponse.json({ error: 'A post with this title already exists.' }, { status: 400 });
        }

        // Upload image
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadResult = await uploadBuffer(buffer, imageFile.type, 'blog-posts');

        const post = await BlogPost.create({
            title,
            slug,
            description,
            category,
            tags,
            status,
            videoUrl,
            settings: { allowLikes, allowComments },
            image: {
                url: uploadResult.secure_url,
                cloudinaryId: uploadResult.public_id
            }
        });

        // ── Privileged Action Notification ──────────────────────────────
        if (currentUser && isPrivileged(currentUser)) {
            await createManagerNotification(
                currentUser._id.toString(),
                currentUser.name,
                'created a blog post',
                title
            );
        }

        return NextResponse.json(post, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
