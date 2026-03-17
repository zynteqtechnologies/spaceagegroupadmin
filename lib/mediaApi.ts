// lib/mediaApi.ts
import type {
  HeroImageDoc,
  UploadMediaPayload,
  UpdateMediaPayload,
} from '@/types/media';

// All fetches go to /api/... (same origin — works on localhost AND Vercel)
const BASE = '/api/hero-images';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function getHeroMedia(): Promise<HeroImageDoc> {
  const res = await fetch(BASE, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Fetch failed');
  }
  return res.json();
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function uploadHeroMedia(
  payload: UploadMediaPayload
): Promise<HeroImageDoc> {
  const formData = new FormData();
  formData.append('imageDetails', JSON.stringify(payload.imageDetails));
  payload.files.forEach((file) => formData.append('images', file));

  const res = await fetch(BASE, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Upload failed');
  }
  const data = await res.json();
  return data.heroImage;
}

// ── PUT ───────────────────────────────────────────────────────────────────────
export async function updateHeroMedia(
  payload: UpdateMediaPayload
): Promise<HeroImageDoc> {
  const formData = new FormData();
  formData.append('imageDetails', JSON.stringify(payload.imageDetails));
  payload.files.forEach((file) => formData.append('images', file));

  const res = await fetch(`${BASE}/${payload.id}`, {
    method: 'PUT',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Update failed');
  }
  const data = await res.json();
  return data.heroImage;
}

// ── DELETE single image ───────────────────────────────────────────────────────
export async function deleteMediaItem(
  heroImageId: string,
  imageId: string
): Promise<HeroImageDoc> {
  const res = await fetch(`${BASE}/${heroImageId}/images/${imageId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Delete failed');
  }
  const data = await res.json();
  return data.heroImage;
}

// ── DELETE entire doc ─────────────────────────────────────────────────────────
export async function deleteHeroMedia(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Delete failed');
  }
}