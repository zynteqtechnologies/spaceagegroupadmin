// app/api/blog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { uploadBuffer } from '@/lib/cloudinary';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';
import { redisGet, redisSet, redisDel } from '@/lib/redis';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');

        await connectDB();

        const currentUser = await getCurrentUser(req);
        const isUserPrivileged = currentUser && isPrivileged(currentUser);

        // Only cache public (non-privileged) requests with no draft access
        const cacheKey = `cache:blog:${status ?? 'published'}:${category ?? 'all'}`;
        if (!isUserPrivileged && (!status || status !== 'draft')) {
            const cached = await redisGet(cacheKey);
            if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
        }

        const conditions = [];
        if (category) {
            conditions.push(eq(blogPosts.category, category));
        }

        if (status) {
            if (status === 'draft' && !isUserPrivileged) {
                return NextResponse.json({ error: 'Forbidden: You do not have permission to view drafts' }, { status: 403 });
            }
            conditions.push(eq(blogPosts.status, status as 'published' | 'draft'));
        } else {
            if (!isUserPrivileged) {
                conditions.push(eq(blogPosts.status, 'published'));
            }
        }

        const posts = await db.select()
            .from(blogPosts)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(blogPosts.createdAt));

        const mappedPosts = posts.map(p => ({ ...p, _id: p.id }));

        // Cache only public responses
        if (!isUserPrivileged && (!status || status !== 'draft')) {
            await redisSet(cacheKey, mappedPosts, 120);
        }

        return NextResponse.json(mappedPosts, { headers: { 'X-Cache': 'MISS' } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const excerpt = formData.get('excerpt') as string || '';
        const category = formData.get('category') as string;
        const tags = JSON.parse(formData.get('tags') as string || '[]');
        const status = (formData.get('status') as string || 'draft') as 'published' | 'draft';
        const videoUrl = formData.get('videoUrl') as string;
        const author = formData.get('author') as string || 'Space Age Group';
        const authorRole = formData.get('authorRole') as string || 'Media & Communications';
        const readTime = formData.get('readTime') as string || '5 min read';
        const featured = formData.get('featured') === 'true';
        const allowLikes = formData.get('allowLikes') === 'true';
        const allowComments = formData.get('allowComments') === 'true';
        const imageFile = formData.get('image') as File | null;

        if (!title || !description || !category || !imageFile) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Generate slug
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
        if (existing) {
            return NextResponse.json({ error: 'A post with this title already exists.' }, { status: 400 });
        }

        // Upload image
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadResult = await uploadBuffer(buffer, imageFile.type, 'blog-posts');

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await db.insert(blogPosts).values({
            id,
            title,
            slug,
            description,
            excerpt,
            category,
            tags,
            status,
            videoUrl,
            author,
            authorRole,
            readTime,
            featured,
            settings: { allowLikes, allowComments },
            image: {
                url: uploadResult.secure_url,
                cloudinaryId: uploadResult.public_id
            },
            createdAt: now,
            updatedAt: now
        });

        const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
        const responseObj = { ...post, _id: post.id };

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'created a blog post',
            title
        );

        return NextResponse.json(responseObj, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
