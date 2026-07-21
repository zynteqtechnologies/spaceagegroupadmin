// app/api/csr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { csr } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { uploadBuffer } from '@/lib/cloudinary';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';
import { redisGet, redisSet, redisDel } from '@/lib/redis';
import crypto from 'crypto';

export async function GET() {
    try {
        const cacheKey = 'cache:csr';
        const cached = await redisGet(cacheKey);
        if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });

        await connectDB();
        const posts = await db.select().from(csr).orderBy(desc(csr.createdAt));
        const mappedPosts = posts.map(p => {
            const rawItems = (p.items as any[]) || [];
            let mainItem = rawItems.find(i => i.isMainImage && i.category !== 'video');
            if (!mainItem && rawItems.length > 0) {
                mainItem = rawItems.find(i => i.url && i.category !== 'video') || rawItems[0];
            }

            const images = rawItems
                .filter(i => i.url && i.category !== 'video')
                .sort((a, b) => (b.isMainImage ? 1 : 0) - (a.isMainImage ? 1 : 0))
                .map(i => i.url);

            return {
                ...p,
                _id: p.id,
                likes: p.likes || 0,
                mainImage: mainItem?.url || images[0] || null,
                images: images.length > 0 ? images : (mainItem?.url ? [mainItem.url] : []),
            };
        });

        await redisSet(cacheKey, mappedPosts, 120);
        return NextResponse.json(mappedPosts, { headers: { 'X-Cache': 'MISS' } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !isPrivileged(currentUser)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const contentType = req.headers.get('content-type') || '';
        
        let title = '';
        let slug = '';
        let category = '';
        let date = '';
        let description = '';
        let longDescription = '';
        let impact = '';
        let color = '#c9a84c';
        let items: any[] = [];

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            title = formData.get('title') as string || '';
            slug = formData.get('slug') as string || '';
            category = formData.get('category') as string || '';
            date = formData.get('date') as string || '';
            description = formData.get('description') as string || '';
            longDescription = formData.get('longDescription') as string || '';
            impact = formData.get('impact') as string || '';
            color = formData.get('color') as string || '#c9a84c';

            const existingItemsRaw = formData.get('existingItems') as string;
            const existingItems = JSON.parse(existingItemsRaw || '[]') as any[];

            const newDetailsRaw = formData.get('newDetails') as string;
            const newDetails = JSON.parse(newDetailsRaw || '[]') as any[];

            const files = formData.getAll('files') as File[];

            // Upload files under folder: csr/[slug]
            const folderName = `csr/${slug || 'campaign'}`;
            const fileDetails = newDetails.filter((d: any) => d.provider !== 'youtube');

            const newUploadedItems = await Promise.all(
                files.map(async (file, i) => {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const result = await uploadBuffer(buffer, file.type, folderName);
                    const detail = fileDetails[i] || {};
                    return {
                        url: result.secure_url,
                        cloudinaryId: result.public_id,
                        title: detail.title || file.name.replace(/\.[^/.]+$/, ''),
                        description: detail.description || '',
                        category: detail.category || (file.type.startsWith('video/') ? 'video' : 'image'),
                        isMainImage: !!detail.isMainImage,
                        provider: 'cloudinary',
                    };
                })
            );

            const youtubeItems = newDetails
                .filter((d: any) => d.provider === 'youtube' && d.url)
                .map((detail: any) => ({
                    url: detail.url,
                    title: detail.title || 'YouTube Video',
                    description: detail.description || '',
                    category: 'video',
                    isMainImage: !!detail.isMainImage,
                    provider: 'youtube',
                }));

            items = [...existingItems, ...newUploadedItems, ...youtubeItems];

            // Ensure only 1 item is marked as isMainImage
            let hasMain = false;
            items = items.map((item) => {
                const isMain = !!item.isMainImage && !hasMain && item.category !== 'video';
                if (isMain) hasMain = true;
                return { ...item, isMainImage: isMain };
            });
            if (!hasMain && items.length > 0) {
                const firstImgIdx = items.findIndex(i => i.category !== 'video');
                if (firstImgIdx !== -1) items[firstImgIdx].isMainImage = true;
            }
        } else {
            const body = await req.json();
            title = body.title || '';
            slug = body.slug || '';
            category = body.category || '';
            date = body.date || '';
            description = body.description || '';
            longDescription = body.longDescription || '';
            impact = body.impact || '';
            color = body.color || '#c9a84c';
            items = Array.isArray(body.items) ? body.items : [];
        }

        if (!title || !slug || !category || !date || !description || !longDescription || !impact) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const cleanSlug = slug.trim().toLowerCase();

        // Ensure slug is unique
        const [existing] = await db.select().from(csr).where(eq(csr.slug, cleanSlug)).limit(1);
        if (existing) {
            return NextResponse.json({ error: 'Slug must be unique' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await db.insert(csr).values({
            id,
            title: title.trim(),
            slug: cleanSlug,
            category: category.trim(),
            date: date.trim(),
            description: description.trim(),
            longDescription: longDescription.trim(),
            items,
            impact: impact.trim(),
            likes: 0,
            color: color || '#c9a84c',
            createdAt: now,
            updatedAt: now
        });

        await redisDel('cache:csr');

        const [post] = await db.select().from(csr).where(eq(csr.id, id)).limit(1);
        const responseObj = { ...post, _id: post.id };

        // Notification
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'added CSR post',
            title
        );

        return NextResponse.json(responseObj);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
