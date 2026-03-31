// models/HeroImage.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

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
  mediaType?: 'image' | 'video' | 'document';
  duration?: number | null;
  thumbnail?: string | null;
  description?: string;
  category?: 'image' | 'video' | 'brochure' | 'flyer' | 'other';
  isInProjects?: boolean;
  provider?: 'cloudinary' | 'youtube' | 'vimeo' | 'none';
}

export interface IHeroImage extends Document {
  images: mongoose.Types.DocumentArray<IMediaItem & Document>;
  createdAt: Date;
}

const MediaItemSchema = new Schema<IMediaItem>({
  url:          { type: String, required: true },
  cloudinaryId: { type: String },
  alt:          { type: String, default: '' },
  title:        { type: String, required: true },
  isMainImage:  { type: Boolean, default: false },
  order:        { type: Number, default: 0 },
  format:       { type: String, default: 'webp' },
  fileSize:     { type: Number },
  mediaType:    { type: String, enum: ['image', 'video', 'document'], default: 'image' },
  duration:     { type: Number, default: null },
  thumbnail:    { type: String, default: null },
  description:  { type: String, default: '' },
  category:     { type: String, enum: ['image', 'video', 'brochure', 'flyer', 'other'], default: 'other' },
  isInProjects: { type: Boolean, default: false },
  provider:     { type: String, enum: ['cloudinary', 'youtube', 'vimeo', 'none'], default: 'cloudinary' },
});

const HeroImageSchema = new Schema<IHeroImage>(
  { images: [MediaItemSchema] },
  { timestamps: true }
);

if (mongoose.models.HeroImage) {
  delete (mongoose.models as any).HeroImage;
}

const HeroImage: Model<IHeroImage> = mongoose.model<IHeroImage>('HeroImage', HeroImageSchema);

export default HeroImage;