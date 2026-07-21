// app/api/hero-images/[id]/images/[imageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { heroImages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { redisDel } from '@/lib/redis';
import { normalizeHeroDoc } from '@/lib/heroUtils';

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, imageId } = await params;

    await connectDB();

    let [heroImage] = await db.select().from(heroImages).where(eq(heroImages.id, id)).limit(1);
    if (!heroImage) {
      [heroImage] = await db.select().from(heroImages).limit(1);
    }

    if (!heroImage) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    const currentImages = (heroImage.images as any[]) || [];
    const mediaIndex = currentImages.findIndex((img, idx) => {
      const stableId = img._id || img.id || img.cloudinaryId || `img-${idx}`;
      return (
        String(img._id) === String(imageId) ||
        String(img.id) === String(imageId) ||
        String(img.cloudinaryId) === String(imageId) ||
        stableId === String(imageId) ||
        String(idx) === String(imageId) ||
        (img.url && decodeURIComponent(String(img.url)).includes(decodeURIComponent(String(imageId))))
      );
    });

    if (mediaIndex === -1) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const media = currentImages[mediaIndex];

    if (media.cloudinaryId) {
      await deleteFromCloudinary(
        media.cloudinaryId,
        media.mediaType === 'video' ? 'video' : 'image'
      );
    }

    const updatedImages = currentImages.filter((_, idx) => idx !== mediaIndex);

    if (media.isMainImage && updatedImages.length > 0) {
      updatedImages[0].isMainImage = true;
    }

    await db.update(heroImages).set({
      images: updatedImages,
      updatedAt: new Date().toISOString()
    }).where(eq(heroImages.id, heroImage.id));

    await redisDel('cache:hero-images');

    const [updatedHeroImage] = await db.select().from(heroImages).where(eq(heroImages.id, heroImage.id)).limit(1);
    const responseObj = normalizeHeroDoc(updatedHeroImage);

    return NextResponse.json({ message: 'Deleted successfully', heroImage: responseObj });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[DELETE /api/hero-images/[id]/images/[imageId]]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}