// app/api/hero-images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { heroImages } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { uploadBuffer, CloudinaryResult } from '@/lib/cloudinary';
import { type NewMediaDetail } from '@/types/media';
import { requireAuth } from '@/lib/apiGuard';
import { redisGet, redisSet, redisDel } from '@/lib/redis';
import { normalizeHeroDoc } from '@/lib/heroUtils';
import crypto from 'crypto';

// ── GET /api/hero-images ──────────────────────────────────────────────────────
export async function GET() {
  try {
    const cacheKey = 'cache:hero-images';
    const cached = await redisGet(cacheKey);
    if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });

    await connectDB();

    const [heroImage] = await db.select().from(heroImages).orderBy(desc(heroImages.createdAt)).limit(1);

    if (!heroImage) {
      return NextResponse.json(
        { error: 'No hero images found' },
        { status: 404 }
      );
    }

    const result = normalizeHeroDoc(heroImage);

    await redisSet(cacheKey, result, 120);
    return NextResponse.json(result, { headers: { 'X-Cache': 'MISS' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[GET /api/hero-images]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/hero-images ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const guard = await requireAuth(req);
    if (guard) return guard;

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
        const itemId = crypto.randomUUID();

        return {
          _id:          itemId,
          id:           itemId,
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

    let [heroImageRecord] = await db.select().from(heroImages).limit(1);
    const now = new Date().toISOString();

    const hasNewMain = mediaObjects.some(m => m.isMainImage);

    if (heroImageRecord) {
      let existingImages = (heroImageRecord.images as any[]) || [];
      if (hasNewMain) {
        existingImages = existingImages.map(img => ({ ...img, isMainImage: false }));
      }
      const updatedImages = [...existingImages, ...mediaObjects];

      await db.update(heroImages).set({
        images: updatedImages,
        updatedAt: now
      }).where(eq(heroImages.id, heroImageRecord.id));

      [heroImageRecord] = await db.select().from(heroImages).where(eq(heroImages.id, heroImageRecord.id)).limit(1);
    } else {
      const id = crypto.randomUUID();
      await db.insert(heroImages).values({
        id,
        images: mediaObjects,
        createdAt: now,
        updatedAt: now
      });
      [heroImageRecord] = await db.select().from(heroImages).where(eq(heroImages.id, id)).limit(1);
    }

    await redisDel('cache:hero-images');

    const responseObj = normalizeHeroDoc(heroImageRecord);

    return NextResponse.json(
      { message: 'Uploaded successfully', heroImage: responseObj },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[POST /api/hero-images]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}