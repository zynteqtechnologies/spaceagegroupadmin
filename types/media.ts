// types/media.ts
import { ProjectDoc, MediaType, MediaItem } from './project';
export type { MediaItem, MediaType } from './project';

export interface MediaDoc {
    _id: string;
    project: string | ProjectDoc;
    title: string;
    items: MediaItem[];
    createdAt?: string;
    updatedAt?: string;
}

export interface HeroImageDoc {
    _id: string;
    images: MediaItem[];
    createdAt?: string;
    updatedAt?: string;
}

export interface PreviewFile {
    file: File;
    previewUrl: string;
    title: string;
    alt: string;
    isMainImage: boolean;
    order: number;
    mediaType: MediaType;
    description?: string;
    category?: string;
}

export interface NewMediaDetail {
    title: string;
    alt: string;
    description?: string;
    category?: string;
    isMainImage: boolean;
    order: number;
    mediaType: MediaType;
}

export interface CreateMediaPayload {
    project: string;
    title: string;
    existingItems?: MediaItem[];
}

export interface UpdateMediaPayload extends Partial<CreateMediaPayload> {
    id: string;
}