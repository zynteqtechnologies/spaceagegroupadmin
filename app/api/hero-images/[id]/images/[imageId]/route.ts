// app/api/hero-images/[id]/images/[imageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { heroImages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { deleteFromCloudinary } from '@/lib/cloudinary';

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, imageId } = await params;

    await connectDB();

    const [heroImage] = await db.select().from(heroImages).where(eq(heroImages.id, id)).limit(1);
    if (!heroImage) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    const currentImages = (heroImage.images as any[]) || [];
    const media = currentImages.find(img => img._id === imageId || img.id === imageId);
    if (!media) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (media.cloudinaryId) {
      await deleteFromCloudinary(
        media.cloudinaryId,
        media.mediaType === 'video' ? 'video' : 'image'
      );
    }

    const updatedImages = currentImages.filter(img => img._id !== imageId && img.id !== imageId);

    await db.update(heroImages).set({
      images: updatedImages,
      updatedAt: new Date().toISOString()
    }).where(eq(heroImages.id, id));

    const [updatedHeroImage] = await db.select().from(heroImages).where(eq(heroImages.id, id)).limit(1);
    const responseObj = { ...updatedHeroImage, _id: updatedHeroImage.id };

    return NextResponse.json({ message: 'Deleted successfully', heroImage: responseObj });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[DELETE /api/hero-images/[id]/images/[imageId]]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}