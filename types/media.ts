// types/media.ts

export type MediaType = 'image' | 'video';

export interface MediaItem {
  _id?: string;
  url: string;
  cloudinaryId?: string;
  alt?: string;
  title: string;
  isMainImage?: boolean;
  order?: number;
  format?: string;
  fileSize?: number;
  mediaType?: MediaType;
  duration?: number | null;
  thumbnail?: string | null;
  markedForDeletion?: boolean;
}

export interface NewMediaDetail {
  title: string;
  alt: string;
  isMainImage: boolean;
  order: number;
  mediaType: MediaType;
}

export interface HeroImageDoc {
  _id: string;
  images: MediaItem[];
  createdAt?: string;
}

export interface UploadMediaPayload {
  files: File[];
  imageDetails: NewMediaDetail[];
}

export interface UpdateMediaPayload {
  id: string;
  files: File[];
  imageDetails: (MediaItem | NewMediaDetail)[];
}

export interface PreviewFile {
  file: File;
  previewUrl: string;
  title: string;
  alt: string;
  isMainImage: boolean;
  order: number;
  mediaType: MediaType;
}