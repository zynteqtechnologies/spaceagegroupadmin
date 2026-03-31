// types/project.ts

export type MediaType = 'image' | 'video' | 'document';
export type ProjectStatus = 'upcoming' | 'ongoing' | 'completed';
export type VirtualTourType = 'matterport' | 'youtube' | 'custom' | 'other';

// ── Shared media ──────────────────────────────────────────────────────────────

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
    description?: string;
    category?: 'image' | 'video' | 'brochure' | 'flyer' | 'other';
    isInProjects?: boolean;
    provider?: 'cloudinary' | 'youtube' | 'vimeo' | 'none';
    markedForDeletion?: boolean;
}

export interface NewMediaDetail {
    title: string;
    alt: string;
    isMainImage: boolean;
    order: number;
    mediaType: MediaType;
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

// ── Floor plan ────────────────────────────────────────────────────────────────

export interface FloorPlanItem {
    _id?: string;
    url: string;
    cloudinaryId?: string;
    title: string;
    alt?: string;
    bhkType?: string;
    carpetArea?: string;
    order?: number;
    fileSize?: number;
    markedForDeletion?: boolean;
}

export interface NewFloorPlanDetail {
    title: string;
    alt?: string;
    bhkType?: string;
    carpetArea?: string;
    order: number;
}

export interface FloorPlanPreview {
    file: File;
    previewUrl: string;
    title: string;
    alt: string;
    bhkType: string;
    carpetArea: string;
    order: number;
}

// ── Spec item ─────────────────────────────────────────────────────────────────

export interface SpecificationItem {
    _id?: string;
    label: string;
    value: string;
    order?: number;
}

// ── Amenity ───────────────────────────────────────────────────────────────────

export interface AmenityItem {
    _id?: string;
    name: string;
    icon?: string;
    category?: string;
    order?: number;
}

// ── Sample house photo ────────────────────────────────────────────────────────

export interface SampleHousePhoto {
    _id?: string;
    url: string;
    cloudinaryId?: string;
    alt?: string;
    title: string;
    roomType?: string;
    order?: number;
    fileSize?: number;
    markedForDeletion?: boolean;
}

export interface SampleHousePreview {
    file: File;
    previewUrl: string;
    title: string;
    alt: string;
    roomType: string;
    order: number;
}

// ── Virtual tour ──────────────────────────────────────────────────────────────

export interface VirtualTour {
    embedUrl?: string;
    type?: VirtualTourType;
    thumbnailUrl?: string;
    cloudinaryId?: string;
    description?: string;
}

// ── Brochure ──────────────────────────────────────────────────────────────────

export interface Brochure {
    url: string;
    cloudinaryId?: string;
    fileName?: string;
    fileSize?: number;
}

// ── Full project doc ──────────────────────────────────────────────────────────

export interface ProjectDoc {
    _id: string;
    title: string;
    slug: string;
    status?: ProjectStatus;
    headline?: string;

    heroImages: MediaItem[];
    shortIntro?: string;
    floorPlans: FloorPlanItem[];
    layoutPlan?: MediaItem;

    commonSpecifications: SpecificationItem[];
    commercialSpecifications: SpecificationItem[];
    amenities: AmenityItem[];
    sampleHousePhotos: SampleHousePhoto[];
    brochure?: Brochure;
    virtualTour?: VirtualTour;

    createdAt?: string;
    updatedAt?: string;
}

// ── API payloads ──────────────────────────────────────────────────────────────

export interface CreateProjectPayload {
    title: string;
    slug?: string;
    status?: ProjectStatus;
    headline?: string;
    shortIntro?: string;
}

export interface UpdateProjectBasicPayload extends Partial<CreateProjectPayload> {
    id: string;
}