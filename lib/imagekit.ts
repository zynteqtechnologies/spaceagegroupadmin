// lib/imagekit.ts
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export interface CloudinaryResult {
  secure_url: string;
  public_id:  string;
  bytes:      number;
  duration?:  number;
  format?:    string;
  resource_type: 'image' | 'video';
}

export async function uploadBuffer(
  buffer: Buffer,
  mimetype: string,
  folder: string = 'space-age-hero-images'
): Promise<CloudinaryResult> {
  const isImage = mimetype.startsWith('image/');
  const isVideo = mimetype.startsWith('video/');
  const isPDF = mimetype === 'application/pdf';

  if (!isImage && !isVideo && !isPDF) {
    throw new Error(`Unsupported file type: ${mimetype}`);
  }

  let finalBuffer = buffer;
  let fileExtension = mimetype.split('/')[1] || 'bin';

  if (isImage && !isPDF) {
    // Compress and format to WebP on our server using sharp to minimize ImageKit storage footprints
    try {
      const sharp = (await import('sharp')).default;
      finalBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
      fileExtension = 'webp';
    } catch (sharpError) {
      console.warn('[ImageKit] Sharp not available, uploading original buffer:', sharpError);
    }
  }

  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

  const result = await imagekit.upload({
    file: finalBuffer,
    fileName: uniqueFileName,
    folder: folder,
  });

  return {
    secure_url: result.url,
    public_id: result.fileId, // We map ImageKit fileId to public_id
    bytes: result.size,
    format: fileExtension,
    resource_type: isVideo ? 'video' : 'image',
  };
}

export async function deleteFromImageKit(
  fileId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> {
  if (!fileId) return;

  try {
    // Catch deletion errors (e.g. legacy Cloudinary IDs) so they don't block DB document deletion
    await imagekit.deleteFile(fileId);
  } catch (error: any) {
    console.warn(`[ImageKit] Ignored delete failure for fileId "${fileId}":`, error.message);
  }
}
