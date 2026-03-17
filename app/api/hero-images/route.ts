// app/api/hero-images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { uploadBuffer, CloudinaryResult } from '@/lib/cloudinary';
import HeroImage from '@/models/HeroImage';
import { type NewMediaDetail } from '@/types/media';

// ── GET /api/hero-images ──────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectDB();

    const heroImage = await HeroImage.findOne().sort({ createdAt: -1 }).lean();

    if (!heroImage) {
      return NextResponse.json(
        { error: 'No hero images found' },
        { status: 404 }
      );
    }

    return NextResponse.json(heroImage);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[GET /api/hero-images]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/hero-images ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData  = await req.formData();
    const rawDetail = formData.get('imageDetails') as string | null;
    const details   = JSON.parse(rawDetail ?? '[]') as NewMediaDetail[];
    const files     = formData.getAll('images') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const mediaObjects = await Promise.all(
      files.map(async (file, i) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
        const isVideo = file.type.startsWith('video/');

        return {
          url:          result.secure_url,
          cloudinaryId: result.public_id,
          alt:          details[i]?.alt          ?? '',
          title:        details[i]?.title         ?? file.name,
          isMainImage:  details[i]?.isMainImage   ?? false,
          order:        details[i]?.order          ?? i,
          format:       isVideo ? file.type.split('/')[1] : 'webp',
          fileSize:     result.bytes,
          mediaType:    isVideo ? 'video' : 'image',
          duration:     result.duration             ?? null,
          thumbnail:    isVideo
            ? result.secure_url.replace(/\.[^/.]+$/, '.jpg')
            : null,
        };
      })
    );

    let heroImage = await HeroImage.findOne();
    if (heroImage) {
      heroImage.images.push(...mediaObjects);
      await heroImage.save();
    } else {
      heroImage = await HeroImage.create({ images: mediaObjects });
    }

    return NextResponse.json(
      { message: 'Uploaded successfully', heroImage },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[POST /api/hero-images]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}