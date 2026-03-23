// models/Project.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Sub-document interfaces ───────────────────────────────────────────────────

export interface IMediaItem {
    _id?: mongoose.Types.ObjectId;
    url: string;
    cloudinaryId?: string;
    alt?: string;
    title: string;
    isMainImage?: boolean;
    order?: number;
    format?: string;
    fileSize?: number;
    mediaType?: 'image' | 'video';
    duration?: number | null;
    thumbnail?: string | null;
}

export interface IFloorPlan {
    _id?: mongoose.Types.ObjectId;
    url: string;
    cloudinaryId?: string;
    title: string;
    alt?: string;
    bhkType?: string;   // e.g. "2BHK", "3BHK"
    carpetArea?: string;
    order?: number;
    fileSize?: number;
}

export interface ISpecificationItem {
    _id?: mongoose.Types.ObjectId;
    label: string;
    value: string;
    order?: number;
}

export interface IAmenity {
    _id?: mongoose.Types.ObjectId;
    name: string;
    icon?: string;        // icon name or URL
    category?: string;    // e.g. "Sports", "Wellness"
    order?: number;
}

export interface ISampleHousePhoto {
    _id?: mongoose.Types.ObjectId;
    url: string;
    cloudinaryId?: string;
    alt?: string;
    title: string;
    roomType?: string;   // "Living Room", "Bedroom", etc.
    order?: number;
    fileSize?: number;
}

export interface IVirtualTour {
    embedUrl?: string;           // iframe embed URL
    type?: 'matterport' | 'youtube' | 'custom' | 'other';
    thumbnailUrl?: string;
    cloudinaryId?: string;
    description?: string;
}

export interface IProject extends Document {
    // ①  Title
    title: string;
    slug: string;
    status?: 'upcoming' | 'ongoing' | 'completed';

    // ②  Hero Images (carousel 2-3)
    heroImages: mongoose.Types.DocumentArray<IMediaItem & Document>;

    // ③  Short Intro / Description
    shortIntro?: string;

    // ④  Floor Plans (images)
    floorPlans: mongoose.Types.DocumentArray<IFloorPlan & Document>;

    // ⑤  Layout Plan (site plan image)
    layoutPlan?: IMediaItem;

    // ⑥  Common Specifications
    commonSpecifications: mongoose.Types.DocumentArray<ISpecificationItem & Document>;

    // ⑦  Commercial Specifications
    commercialSpecifications: mongoose.Types.DocumentArray<ISpecificationItem & Document>;

    // ⑧  Amenities
    amenities: mongoose.Types.DocumentArray<IAmenity & Document>;

    // ⑨  Sample House Photos
    sampleHousePhotos: mongoose.Types.DocumentArray<ISampleHousePhoto & Document>;

    // ⑩  Download Brochure (PDF)
    brochure?: {
        url: string;
        cloudinaryId?: string;
        fileName?: string;
        fileSize?: number;
    };

    // ⑪  Virtual Tour
    virtualTour?: IVirtualTour;

    // meta
    headline?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const MediaItemSchema = new Schema<IMediaItem>({
    url: { type: String, required: true },
    cloudinaryId: { type: String },
    alt: { type: String, default: '' },
    title: { type: String, required: true },
    isMainImage: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    format: { type: String, default: 'webp' },
    fileSize: { type: Number },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    duration: { type: Number, default: null },
    thumbnail: { type: String, default: null },
});

const FloorPlanSchema = new Schema<IFloorPlan>({
    url: { type: String, required: true },
    cloudinaryId: { type: String },
    title: { type: String, required: true },
    alt: { type: String, default: '' },
    bhkType: { type: String },
    carpetArea: { type: String },
    order: { type: Number, default: 0 },
    fileSize: { type: Number },
});

const SpecificationSchema = new Schema<ISpecificationItem>({
    label: { type: String, required: true },
    value: { type: String, required: true },
    order: { type: Number, default: 0 },
});

const AmenitySchema = new Schema<IAmenity>({
    name: { type: String, required: true },
    icon: { type: String },
    category: { type: String },
    order: { type: Number, default: 0 },
});

const SampleHousePhotoSchema = new Schema<ISampleHousePhoto>({
    url: { type: String, required: true },
    cloudinaryId: { type: String },
    alt: { type: String, default: '' },
    title: { type: String, required: true },
    roomType: { type: String },
    order: { type: Number, default: 0 },
    fileSize: { type: Number },
});

// ── Main schema ───────────────────────────────────────────────────────────────

const ProjectSchema = new Schema<IProject>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
        headline: { type: String, trim: true },

        heroImages: [MediaItemSchema],
        shortIntro: { type: String },
        floorPlans: [FloorPlanSchema],

        layoutPlan: {
            url: String,
            cloudinaryId: String,
            alt: String,
            title: String,
            isMainImage: Boolean,
            order: Number,
            format: String,
            fileSize: Number,
            mediaType: { type: String, enum: ['image', 'video'] },
            duration: Number,
            thumbnail: String,
        },

        commonSpecifications: [SpecificationSchema],
        commercialSpecifications: [SpecificationSchema],
        amenities: [AmenitySchema],
        sampleHousePhotos: [SampleHousePhotoSchema],

        brochure: {
            url: String,
            cloudinaryId: String,
            fileName: String,
            fileSize: Number,
        },

        virtualTour: {
            embedUrl: String,
            type: { type: String, enum: ['matterport', 'youtube', 'custom', 'other'] },
            thumbnailUrl: String,
            cloudinaryId: String,
            description: String,
        },
    },
    { timestamps: true }
);

// auto-generate slug from title if not provided
ProjectSchema.pre('validate', function (this: IProject) {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
});

const Project: Model<IProject> =
    mongoose.models.Project ||
    mongoose.model<IProject>('Project', ProjectSchema);

export default Project;