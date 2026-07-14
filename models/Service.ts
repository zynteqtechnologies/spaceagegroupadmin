import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
    title: string;
    slug: string;
    number: string;
    category: 'Core Development' | 'Consultation';
    tagline: string;
    description: string;
    stats: { value: string; label: string }[];
    features: string[];
    accent: string;
    icon: string;
    status: 'published' | 'draft';
    createdAt: Date;
    updatedAt: Date;
}

const ServiceSchema = new Schema<IService>({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    number: { type: String, required: true },
    category: { type: String, enum: ['Core Development', 'Consultation'], required: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    stats: [{
        value: { type: String, required: true },
        label: { type: String, required: true }
    }],
    features: [{ type: String }],
    accent: { type: String, default: '#c9a84c' },
    icon: { type: String, default: 'home' },
    status: { type: String, enum: ['published', 'draft'], default: 'published' }
}, { timestamps: true });

if (mongoose.models.Service) {
    delete (mongoose.models as any).Service;
}

export default mongoose.model<IService>('Service', ServiceSchema);
