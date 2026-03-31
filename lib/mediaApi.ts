// lib/mediaApi.ts
import { MediaDoc, HeroImageDoc, NewMediaDetail } from '@/types/media';
import { ProjectDoc, MediaItem } from '@/types/project';

const BASE = '/api/media';
const HERO_BASE = '/api/hero-images';

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed: ${res.status}`);
    }
    return res.json();
}

// ── NEW Media API (Project Specific Collections) ──────────────────────────────

export async function listMedia(): Promise<MediaDoc[]> {
    const res = await fetch(BASE, { cache: 'no-store' });
    return handleResponse<MediaDoc[]>(res);
}

export async function getMedia(id: string): Promise<MediaDoc> {
    const res = await fetch(`${BASE}/${id}`, { cache: 'no-store' });
    return handleResponse<MediaDoc>(res);
}

export async function createMedia(
    projectId: string,
    title: string,
    existingItems: MediaItem[],
    files: File[],
    newDetails: Partial<MediaItem>[] = []
): Promise<MediaDoc> {
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('title', title);
    formData.append('existingItems', JSON.stringify(existingItems));
    formData.append('newDetails', JSON.stringify(newDetails));
    files.forEach((f) => formData.append('files', f));

    const res = await fetch(BASE, { method: 'POST', body: formData });
    return handleResponse<MediaDoc>(res);
}

export async function updateMedia(id: string, payload: { title?: string; items?: MediaItem[] }): Promise<MediaDoc> {
    const res = await fetch(`${BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse<MediaDoc>(res);
}

export async function deleteMedia(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    await handleResponse<void>(res);
}

export async function listProjectsWithMedia(): Promise<ProjectDoc[]> {
    const res = await fetch(`${BASE}/projects`, { cache: 'no-store' });
    return handleResponse<ProjectDoc[]>(res);
}

// ── RESTORED Hero Image API ───────────────────────────────────────────────────

export async function getHeroMedia(): Promise<HeroImageDoc> {
    const res = await fetch(HERO_BASE, { cache: 'no-store' });
    return handleResponse<HeroImageDoc>(res);
}

export async function uploadHeroMedia({ files, imageDetails }: { files: File[], imageDetails: NewMediaDetail[] }): Promise<HeroImageDoc> {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    formData.append('imageDetails', JSON.stringify(imageDetails));

    const res = await fetch(HERO_BASE, { method: 'POST', body: formData });
    const data = await handleResponse<{ heroImage: HeroImageDoc }>(res);
    return data.heroImage;
}

export async function updateHeroMedia({ id, files, imageDetails }: { id: string, files: File[], imageDetails: (MediaItem | NewMediaDetail)[] }): Promise<HeroImageDoc> {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    formData.append('imageDetails', JSON.stringify(imageDetails));

    const res = await fetch(`${HERO_BASE}/${id}`, { method: 'PUT', body: formData });
    const data = await handleResponse<{ heroImage: HeroImageDoc }>(res);
    return data.heroImage;
}

export async function deleteMediaItem(docId: string, imageId: string): Promise<HeroImageDoc> {
    const res = await fetch(`${HERO_BASE}/${docId}/images/${imageId}`, { method: 'DELETE' });
    const data = await handleResponse<{ heroImage: HeroImageDoc }>(res);
    return data.heroImage;
}