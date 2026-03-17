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
  mediaType?: 'image' | 'video';
  duration?: number | null;
  thumbnail?: string | null;
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
  mediaType:    { type: String, enum: ['image', 'video'], default: 'image' },
  duration:     { type: Number, default: null },
  thumbnail:    { type: String, default: null },
});

const HeroImageSchema = new Schema<IHeroImage>(
  { images: [MediaItemSchema] },
  { timestamps: true }
);

const HeroImage: Model<IHeroImage> =
  mongoose.models.HeroImage ||
  mongoose.model<IHeroImage>('HeroImage', HeroImageSchema);

export default HeroImage;