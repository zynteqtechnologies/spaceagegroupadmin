// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const FOLDER = 'space-age-hero-images';

// ── Typed Cloudinary result ───────────────────────────────────────────────────
export interface CloudinaryResult {
  secure_url: string;
  public_id:  string;
  bytes:      number;
  duration?:  number;
  format?:    string;
  resource_type: 'image' | 'video';
}

// ── Upload buffer to Cloudinary ───────────────────────────────────────────────
export async function uploadBuffer(
  buffer: Buffer,
  mimetype: string,
  folder: string = FOLDER
): Promise<CloudinaryResult> {
  const isImage = mimetype.startsWith('image/');
  const isVideo = mimetype.startsWith('video/');
  const isPDF = mimetype === 'application/pdf';

  if (!isImage && !isVideo && !isPDF) throw new Error(`Unsupported file type: ${mimetype}`);

  if (isImage && !isPDF) {
    const sharp = (await import('sharp')).default;
    const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: 'image', folder: folder, format: 'webp' },
          (err, result) => {
            if (err || !result) return reject(err ?? new Error('Upload failed'));
            resolve(result as any);
          }
        )
        .end(webpBuffer);
    });
  }

  // Video or PDF (treat PDF as image but don't sharp it)
  const resource_type = isVideo ? 'video' : 'image';
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type, folder: folder, chunk_size: 6_000_000 },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('Upload failed'));
          resolve(result as any);
        }
      )
      .end(buffer);
  });
}

// ── Delete from Cloudinary ────────────────────────────────────────────────────
export async function deleteFromCloudinary(
  publicId:     string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate:    true,
  });
}