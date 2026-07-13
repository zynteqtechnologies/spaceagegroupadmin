import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CSR from '@/models/CSR';
import { uploadBuffer } from '@/lib/cloudinary';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const post = await CSR.findById(id);
        if (!post) return NextResponse.json({ error: 'CSR post not found' }, { status: 404 });
        return NextResponse.json(post);
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
            if (body.action === 'like') {
                const post = await CSR.findById(id);
                if (!post) return NextResponse.json({ error: 'CSR post not found' }, { status: 404 });
                post.likes = (post.likes || 0) + 1;
                await post.save();
                return NextResponse.json({ success: true, likes: post.likes });
            }
        }

        // Authenticated admin manager updates
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !isPrivileged(currentUser)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const post = await CSR.findById(id);
        if (!post) return NextResponse.json({ error: 'CSR post not found' }, { status: 404 });

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

            // Upload files to Cloudinary under folder: csr/[slug]
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
                    provider: 'youtube',
                }));

            items = [...existingItems, ...newUploadedItems, ...youtubeItems];
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

        if (title) post.title = title.trim();
        if (slug) post.slug = slug.trim().toLowerCase();
        if (category) post.category = category.trim();
        if (date) post.date = date.trim();
        if (description) post.description = description.trim();
        if (longDescription) post.longDescription = longDescription.trim();
        if (impact) post.impact = impact.trim();
        if (color) post.color = color;
        if (items) post.items = items;

        await post.save();

        // Notification
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated CSR post',
            post.title
        );

        return NextResponse.json(post);
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
        const post = await CSR.findById(id);
        if (!post) return NextResponse.json({ error: 'CSR post not found' }, { status: 404 });

        const label = post.title;
        await CSR.findByIdAndDelete(id);

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
