// app/api/projects/[id]/brochure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import Project from '@/models/Project';

type Params = { params: Promise<{ id: string }> };

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const FOLDER = 'space-age-brochures';

async function uploadPdfBuffer(buffer: Buffer, fileName: string): Promise<{ secure_url: string; public_id: string; bytes: number }> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                { resource_type: 'raw', folder: FOLDER, public_id: fileName.replace(/\.pdf$/i, ''), format: 'pdf' },
                (err, result) => {
                    if (err || !result) return reject(err ?? new Error('Upload failed'));
                    resolve({ secure_url: result.secure_url, public_id: result.public_id, bytes: result.bytes });
                }
            )
            .end(buffer);
    });
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const file = formData.get('brochure') as File | null;

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF allowed' }, { status: 400 });

        // Delete old
        if (project.brochure?.cloudinaryId) {
            await deleteFromCloudinary(project.brochure.cloudinaryId, 'image').catch(console.error);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadPdfBuffer(buffer, file.name);

        project.brochure = {
            url: result.secure_url,
            cloudinaryId: result.public_id,
            fileName: file.name,
            fileSize: result.bytes,
        };

        await project.save();
        return NextResponse.json({ message: 'Brochure updated', project });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (project.brochure?.cloudinaryId) {
            await deleteFromCloudinary(project.brochure.cloudinaryId, 'image').catch(console.error);
        }

        project.brochure = undefined;
        await project.save();

        return NextResponse.json({ message: 'Brochure deleted', project });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}