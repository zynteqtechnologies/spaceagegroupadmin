// app/api/csr/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { csr } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';
import { uploadBuffer } from '@/lib/cloudinary';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

import { redisDel } from '@/lib/redis';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const [post] = await db.select().from(csr).where(or(eq(csr.id, id), eq(csr.slug, id))).limit(1);
        if (!post) return NextResponse.json({ error: 'CSR post not found' }, { status: 404 });

        const rawItems = (post.items as any[]) || [];
        let mainItem = rawItems.find(i => i.isMainImage && i.category !== 'video');
        if (!mainItem && rawItems.length > 0) {
            mainItem = rawItems.find(i => i.url && i.category !== 'video') || rawItems[0];
        }

        const images = rawItems
            .filter(i => i.url && i.category !== 'video')
            .sort((a, b) => (b.isMainImage ? 1 : 0) - (a.isMainImage ? 1 : 0))
            .map(i => i.url);

        return NextResponse.json({
            ...post,
            _id: post.id,
            likes: post.likes || 0,
            mainImage: mainItem?.url || images[0] || null,
            images: images.length > 0 ? images : (mainItem?.url ? [mainItem.url] : []),
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const contentType = req.headers.get('content-type') || '';
        
        await connectDB();

        // Support public increments for post likes from user website
        if (contentType.includes('application/json')) {
            const body = await req.json();
            if (body.action === 'like' || body.action === 'unlike') {
                const [post] = await db.select().from(csr).where(or(eq(csr.id, id), eq(csr.slug, id))).limit(1);
                if (!post) return NextResponse.json({ error: 'CSR post not found' }, { status: 404 });
                
                const delta = body.action === 'like' ? 1 : -1;
                const newLikes = Math.max(0, (post.likes || 0) + delta);
                await db.update(csr).set({
                    likes: newLikes,
                    updatedAt: new Date().toISOString()
                }).where(eq(csr.id, post.id));

                await redisDel('cache:csr');
                return NextResponse.json({ success: true, likes: newLikes });
            }
        }

        // Authenticated admin manager updates
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !isPrivileged(currentUser)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [post] = await db.select().from(csr).where(eq(csr.id, id)).limit(1);
        if (!post) return NextResponse.json({ error: 'CSR post not found' }, { status: 404 });

        let title = '';
        let slug = '';
        let category = '';
        let date = '';
        let description = '';
        let longDescription = '';
        let impact = '';
        let color = '#c9a84c';
        let likesStr = '';
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
            likesStr = formData.get('likes') as string || '';

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

            // Ensure single isMainImage logic
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
            if (body.likes !== undefined) likesStr = String(body.likes);
            items = Array.isArray(body.items) ? body.items : [];
        }

        const updates: any = {};
        if (title) updates.title = title.trim();
        if (slug) updates.slug = slug.trim().toLowerCase();
        if (category) updates.category = category.trim();
        if (date) updates.date = date.trim();
        if (description) updates.description = description.trim();
        if (longDescription) updates.longDescription = longDescription.trim();
        if (impact) updates.impact = impact.trim();
        if (color) updates.color = color;
        if (likesStr !== '') updates.likes = parseInt(likesStr) || 0;
        if (items) updates.items = items;
        updates.updatedAt = new Date().toISOString();

        await db.update(csr).set(updates).where(eq(csr.id, id));
        await redisDel('cache:csr');

        const [updatedPost] = await db.select().from(csr).where(eq(csr.id, id)).limit(1);
        const responseObj = { ...updatedPost, _id: updatedPost.id };

        // Notification
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated CSR post',
            updatedPost.title
        );

        return NextResponse.json(responseObj);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !isPrivileged(currentUser)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();
        const [post] = await db.select().from(csr).where(eq(csr.id, id)).limit(1);
        if (!post) return NextResponse.json({ error: 'CSR post not found' }, { status: 404 });

        const label = post.title;
        await db.delete(csr).where(eq(csr.id, id));
        await redisDel('cache:csr');

        // Notification
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'deleted CSR post',
            label
        );

        return NextResponse.json({ message: 'CSR post deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
