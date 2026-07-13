import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICSRItem {
    url: string;
    cloudinaryId?: string;
    title?: string;
    description?: string;
    category?: 'image' | 'video' | 'other';
    provider?: 'cloudinary' | 'youtube' | 'none';
}

export interface ICSR extends Document {
    slug: string;
    title: string;
    category: string;
    date: string;
    description: string;
    longDescription: string;
    items: ICSRItem[];
    impact: string;
    likes: number;
    color: string;
    createdAt: Date;
    updatedAt: Date;
}

const CSRItemSchema = new Schema<ICSRItem>({
    url: { type: String, required: true },
    cloudinaryId: { type: String },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: String, enum: ['image', 'video', 'other'], default: 'image' },
    provider: { type: String, enum: ['cloudinary', 'youtube', 'none'], default: 'cloudinary' },
});

const CSRSchema = new Schema<ICSR>(
    {
        slug: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        category: { type: String, required: true },
        date: { type: String, required: true },
        description: { type: String, required: true },
        longDescription: { type: String, required: true },
        items: [CSRItemSchema],
        impact: { type: String, required: true },
        likes: { type: Number, default: 0 },
        color: { type: String, default: '#c9a84c' },
    },
    { timestamps: true }
);

if (mongoose.models.CSR) {
    delete (mongoose.models as any).CSR;
}

const CSR: Model<ICSR> = mongoose.model<ICSR>('CSR', CSRSchema);
export default CSR;
