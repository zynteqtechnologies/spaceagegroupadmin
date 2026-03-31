// types/blog.ts
export interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    tags: string[];
    image: {
        url: string;
        cloudinaryId: string;
    };
    videoUrl?: string;
    status: 'published' | 'draft';
    settings: {
        allowLikes: boolean;
        allowComments: boolean;
    };
    likesCount: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}
