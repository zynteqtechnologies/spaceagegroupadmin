// lib/cloudinary.ts
// Deprecated: Redirecting to ImageKit to support migration without changing all imports
import { uploadBuffer as ikUploadBuffer, deleteFromImageKit } from './imagekit';
export type { CloudinaryResult } from './imagekit';

export async function uploadBuffer(
  buffer: Buffer,
  mimetype: string,
  folder?: string
) {
  return ikUploadBuffer(buffer, mimetype, folder);
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType?: 'image' | 'video'
) {
  return deleteFromImageKit(publicId, resourceType);
}