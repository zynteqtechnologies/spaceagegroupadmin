import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CSR from '@/models/CSR';
import { uploadBuffer } from '@/lib/cloudinary';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

export async function GET() {
    try {
        await connectDB();
        const posts = await CSR.find().sort({ createdAt: -1 });
        return NextResponse.json(posts);
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

        if (!title || !slug || !category || !date || !description || !longDescription || !impact) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure slug is unique
        const existing = await CSR.findOne({ slug: slug.trim().toLowerCase() });
        if (existing) {
            return NextResponse.json({ error: 'Slug must be unique' }, { status: 400 });
        }

        const post = await CSR.create({
            title: title.trim(),
            slug: slug.trim().toLowerCase(),
            category: category.trim(),
            date: date.trim(),
            description: description.trim(),
            longDescription: longDescription.trim(),
            items,
            impact: impact.trim(),
            likes: 0,
            color: color || '#c9a84c',
        });

        // Notification
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'added CSR post',
            title
        );

        return NextResponse.json(post);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
