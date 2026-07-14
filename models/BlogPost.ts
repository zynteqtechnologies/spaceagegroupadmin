// models/BlogPost.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogPost extends Document {
    title: string;
    slug: string;
    description: string; // Rich text/Markdown
    excerpt: string; // Teaser/Excerpt
    category: string;
    tags: string[];
    image: {
        url: string;
        cloudinaryId: string;
    };
    videoUrl?: string; // YouTube link
    author: string;
    authorRole: string;
    readTime: string;
    featured: boolean;
    status: 'published' | 'draft';
    settings: {
        allowLikes: boolean;
        allowComments: boolean;
    };
    likesCount: number;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        excerpt: { type: String, default: '' },
        category: { type: String, required: true },
        tags: [{ type: String }],
        image: {
            url: { type: String, required: true },
            cloudinaryId: { type: String, required: true },
        },
        videoUrl: { type: String },
        author: { type: String, default: 'Space Age Group' },
        authorRole: { type: String, default: 'Media & Communications' },
        readTime: { type: String, default: '5 min read' },
        featured: { type: Boolean, default: false },
        status: { type: String, enum: ['published', 'draft'], default: 'draft' },
        settings: {
            allowLikes: { type: Boolean, default: true },
            allowComments: { type: Boolean, default: true },
        },
        likesCount: { type: Number, default: 0 },
        viewCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

if (mongoose.models.BlogPost) {
    delete (mongoose.models as any).BlogPost;
}

export default mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);
