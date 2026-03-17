// app/api/hero-images/[id]/images/[imageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import HeroImage from '@/models/HeroImage';

type Params = { params: { id: string; imageId: string } };

// ── DELETE /api/hero-images/:id/images/:imageId ───────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const heroImage = await HeroImage.findById(params.id);
    if (!heroImage) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    const media = heroImage.images.id(params.imageId);
    if (!media) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (media.cloudinaryId) {
      await deleteFromCloudinary(
        media.cloudinaryId,
        media.mediaType === 'video' ? 'video' : 'image'
      );
    }

    heroImage.images.pull({ _id: params.imageId });
    await heroImage.save();

    return NextResponse.json({ message: 'Deleted successfully', heroImage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error(
      `[DELETE /api/hero-images/${params.id}/images/${params.imageId}]`,
      err
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}