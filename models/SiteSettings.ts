import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISiteSettings extends Document {
  yearsOfExcellence: string;
  projectsCompleted: string;
  happyFamilies: string;
  clientSatisfaction: string;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>({
  yearsOfExcellence: { type: String, default: '35+' },
  projectsCompleted: { type: String, default: '120+' },
  happyFamilies: { type: String, default: '5000+' },
  clientSatisfaction: { type: String, default: '98%' },
}, { timestamps: true });

if (mongoose.models.SiteSettings) {
  delete (mongoose.models as any).SiteSettings;
}

const SiteSettings: Model<ISiteSettings> = mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
export default SiteSettings;
