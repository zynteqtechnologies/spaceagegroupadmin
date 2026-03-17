// app/api/hero-images/[id]/images/[imageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import HeroImage from '@/models/HeroImage';

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, imageId } = await params; // ✅ await params

    await connectDB();

    const heroImage = await HeroImage.findById(id);
    if (!heroImage) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    const media = heroImage.images.id(imageId);
    if (!media) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (media.cloudinaryId) {
      await deleteFromCloudinary(
        media.cloudinaryId,
        media.mediaType === 'video' ? 'video' : 'image'
      );
    }

    heroImage.images.pull({ _id: imageId });
    await heroImage.save();

    return NextResponse.json({ message: 'Deleted successfully', heroImage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[DELETE /api/hero-images/[id]/images/[imageId]]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}