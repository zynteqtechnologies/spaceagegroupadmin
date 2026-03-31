# Cloudinary Integration Guide

This document explains how media (Images, Videos, PDFs) are handled and stored in Cloudinary for the Space Age Group Admin Dashboard.

## 1. Configuration
The integration is defined in `lib/cloudinary.ts` and requires the following environment variables:
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name.
- `CLOUDINARY_API_KEY`: Your API Key.
- `CLOUDINARY_API_SECRET`: Your API Secret.

```typescript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});
```

---

## 2. Upload Flow (`uploadBuffer`)
The system uses a **Buffer-based stream upload** to avoid saving temporary files on the server disk.

### Image Optimization (Sharp)
Before uploading an image, the system uses the [Sharp](https://sharp.pixelplumbing.com/) library to optimize it:
- Converts the image to `.webp` format.
- Sets quality to 80.
- Reduces file size significantly before sending to Cloudinary.

### Handling Different File Types
| File Type | Resource Type | Strategy |
| :--- | :--- | :--- |
| **Image** (`image/*`) | `image` | Converted to `.webp` via Sharp, then uploaded. |
| **Video** (`video/*`) | `video` | Uploaded raw via stream (chunk size: 6MB). |
| **PDF** (`application/pdf`) | `image` | Uploaded raw via stream (Cloudinary treats PDFs as images for thumbnails/delivery). |

---

## 3. Deletion Flow (`deleteFromCloudinary`)
When an item is deleted from the dashboard (e.g., a project photo or a blog image):
1. The **Public ID** (returned during upload) is retrieved from the database.
2. The `destroy` method is called to remove the asset from Cloudinary storage.
3. The `invalidate: true` option ensures cached versions on the CDN are also cleared.

---

## 4. Usage Examples in Code

### Media Vault / Portfolio
In `app/api/media/route.ts`, when a project photo is uploaded:
```typescript
const result = await uploadBuffer(buffer, file.type, `media/${project.title}/uploads`);
```

### Blog Featured Images
In `app/api/blog/route.ts`, images are stored in a dedicated `blog-posts` folder.

### Team Member Profiles
In `app/api/team/route.ts`, images are stored in the `team-profiles` folder.

---

## 5. Summary of Benefits
- **Optimized Performance**: WebP conversion reduces payload.
- **Security**: Assets are deleted when no longer used, preventing storage bloat.
- **Organization**: Uses dynamic folder names to keep the Cloudinary library structured.
