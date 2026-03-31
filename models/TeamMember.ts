// models/TeamMember.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeamMember extends Document {
    name: string;
    position: string;
    study: string;
    experience: string;
    description: string;
    relationToGroup: string;
    image: {
        url: string;
        cloudinaryId: string;
    };
    socialLinks: {
        linkedin?: string;
        instagram?: string;
        facebook?: string;
    };
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>({
    name: { type: String, required: true },
    position: { type: String, required: true },
    study: { type: String, required: true },
    experience: { type: String, required: true },
    description: { type: String, required: true },
    relationToGroup: { type: String, required: true },
    image: {
        url: { type: String, required: true },
        cloudinaryId: { type: String, required: true },
    },
    socialLinks: {
        linkedin: { type: String, default: '' },
        instagram: { type: String, default: '' },
        facebook: { type: String, default: '' },
    },
    order: { type: Number, default: 0 },
}, { 
    timestamps: true 
});

if (mongoose.models.TeamMember) {
    delete (mongoose.models as any).TeamMember;
}

const TeamMember: Model<ITeamMember> = mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);

export default TeamMember;
