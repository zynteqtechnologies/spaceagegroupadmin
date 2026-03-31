import { ProjectDoc } from './project';

interface RecentBlogPost {
    _id: string;
    title: string;
    category: string;
    status: 'published' | 'draft';
    image: { url: string; cloudinaryId: string };
    createdAt: string;
    updatedAt: string;
}

export interface DashboardStats {
  counts: {
    projects: number;
    blogPosts: number;
    teamMembers: number;
    mediaCollections: number;
    users?: number; // Only for administrators
  };
  recentProjects: ProjectDoc[];
  recentBlogPosts: RecentBlogPost[];
}

