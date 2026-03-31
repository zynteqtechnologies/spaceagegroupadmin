// models/Media.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMediaItem } from './Project';

export interface IMedia extends Document {
    project: mongoose.Types.ObjectId;
    title: string;
    items: IMediaItem[];
    createdAt: Date;
    updatedAt: Date;
}

const MediaItemSchema = new Schema<IMediaItem>({
    url: { type: String, required: true },
    cloudinaryId: { type: String },
    alt: { type: String, default: '' },
    title: { type: String, required: true },
    isMainImage: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    format: { type: String, default: 'webp' },
    fileSize: { type: Number },
    mediaType: { type: String, enum: ['image', 'video', 'document'], default: 'image' },
    duration: { type: Number, default: null },
    thumbnail: { type: String, default: null },
    description: { type: String, default: '' },
    category: { type: String, enum: ['image', 'video', 'brochure', 'flyer', 'other'], default: 'other' },
    isInProjects: { type: Boolean, default: false },
    provider: { type: String, enum: ['cloudinary', 'youtube', 'vimeo', 'none'], default: 'cloudinary' },
});

const MediaSchema = new Schema<IMedia>(
    {
        project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
        title: { type: String, required: true },
        items: [MediaItemSchema],
    },
    { timestamps: true }
);

if (mongoose.models.Media) {
    delete (mongoose.models as any).Media;
}

const Media: Model<IMedia> = mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
