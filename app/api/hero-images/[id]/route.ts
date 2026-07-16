// app/api/hero-images/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { heroImages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadBuffer, deleteFromCloudinary, CloudinaryResult } from '@/lib/cloudinary';
import { type NewMediaDetail } from '@/types/media';
import { requireAuth } from '@/lib/apiGuard';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

interface MediaObject {
  _id:          string;
  url:          string;
  cloudinaryId: string;
  alt:          string;
  title:        string;
  isMainImage:  boolean;
  order:        number;
  format:       string;
  fileSize:     number;
  mediaType:    'image' | 'video';
  duration:     number | null;
  thumbnail:    string | null;
}

function buildMediaObject(
  result:        CloudinaryResult,
  file:          File,
  detail:        Partial<NewMediaDetail>,
  fallbackOrder: number
): MediaObject {
  const isVideo = file.type.startsWith('video/');
  return {
    _id:          (detail as any)._id || crypto.randomUUID(),
    url:          result.secure_url,
    cloudinaryId: result.public_id,
    alt:          detail.alt         ?? '',
    title:        detail.title       ?? file.name,
    isMainImage:  detail.isMainImage ?? false,
    order:        detail.order       ?? fallbackOrder,
    format:       isVideo ? (file.type.split('/')[1] ?? 'mp4') : 'webp',
    fileSize:     result.bytes,
    mediaType:    isVideo ? 'video' : 'image',
    duration:     result.duration    ?? null,
    thumbnail:    isVideo ? result.secure_url.replace(/\.[^/.]+$/, '.jpg') : null,
  };
}

// ── PUT /api/hero-images/:id ──────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const guard = await requireAuth(req);
    if (guard) return guard;

    const { id } = await params;

    await connectDB();

    const [heroImage] = await db.select().from(heroImages).where(eq(heroImages.id, id)).limit(1);
    if (!heroImage) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const formData  = await req.formData();
    const rawDetail = formData.get('imageDetails') as string | null;
    const details   = JSON.parse(rawDetail ?? '[]') as (any & { markedForDeletion?: boolean })[];
    const files     = formData.getAll('images') as File[];

    const currentImages = (heroImage.images || []) as any[];

    const toKeep:  MediaObject[]             = [];
    const toDelete: any[]                    = [];
    const newMeta:  Partial<NewMediaDetail>[] = [];

    details.forEach((d) => {
      if (d._id && !d.markedForDeletion) {
        const orig = currentImages.find(img => String(img._id) === String(d._id));
        if (orig) {
          toKeep.push({
            _id:          orig._id,
            url:          orig.url,
            cloudinaryId: orig.cloudinaryId ?? '',
            alt:          d.alt          ?? orig.alt          ?? '',
            title:        d.title        ?? orig.title,
            isMainImage:  d.isMainImage  ?? orig.isMainImage  ?? false,
            order:        d.order        ?? orig.order        ?? 0,
            format:       orig.format    ?? 'webp',
            fileSize:     orig.fileSize  ?? 0,
            mediaType:    (orig.mediaType ?? 'image') as 'image' | 'video',
            duration:     orig.duration  ?? null,
            thumbnail:    orig.thumbnail ?? null,
          });
        }
      } else if (d._id && d.markedForDeletion) {
        const orig = currentImages.find(img => String(img._id) === String(d._id));
        if (orig) toDelete.push(orig);
      } else {
        newMeta.push(d);
      }
    });

    await Promise.allSettled(
      toDelete.map(async (media) => {
        if (media.cloudinaryId) {
          await deleteFromCloudinary(
            media.cloudinaryId,
            media.mediaType === 'video' ? 'video' : 'image'
          );
        }
      })
    );

    const newObjects: MediaObject[] = await Promise.all(
      files.map(async (file, i) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
        return buildMediaObject(result, file, newMeta[i] ?? {}, toKeep.length + i);
      })
    );

    const now = new Date().toISOString();
    const finalImages = [...toKeep, ...newObjects];
    
    await db.update(heroImages).set({
      images: finalImages,
      updatedAt: now
    }).where(eq(heroImages.id, id));

    const [updatedHeroImage] = await db.select().from(heroImages).where(eq(heroImages.id, id)).limit(1);
    const responseObj = {
      ...updatedHeroImage,
      _id: updatedHeroImage.id
    };

    return NextResponse.json({ message: 'Updated successfully', heroImage: responseObj });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[PUT /api/hero-images/[id]]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE /api/hero-images/:id ───────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const guard = await requireAuth(req);
    if (guard) return guard;

    const { id } = await params;

    await connectDB();

    const [heroImage] = await db.select().from(heroImages).where(eq(heroImages.id, id)).limit(1);
    if (!heroImage) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const currentImages = (heroImage.images || []) as any[];

    await Promise.allSettled(
      currentImages.map((media: any) =>
        media.cloudinaryId
          ? deleteFromCloudinary(
              media.cloudinaryId,
              media.mediaType === 'video' ? 'video' : 'image'
            )
          : Promise.resolve()
      )
    );

    await db.delete(heroImages).where(eq(heroImages.id, id));

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[DELETE /api/hero-images/[id]]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}