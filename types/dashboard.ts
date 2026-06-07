import { ProjectDoc } from './project';

export interface RecentBlogPost {
    _id: string;
    title: string;
    category: string;
    status: 'published' | 'draft';
    image: { url: string; cloudinaryId: string };
    createdAt: string;
    updatedAt: string;
}

export interface ActivityNotification {
    _id: string;
    type: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    postId?: string;
    userId?: { _id: string; name: string; avatar?: string };
}

export interface DashboardStats {
  counts: {
    projects: number;
    blogPosts: number;
    teamMembers: number;
    mediaCollections: number;
    totalMediaSize: number;
  };
  projectBreakdown: {
    upcoming: number;
    ongoing: number;
    completed: number;
  };
  blogBreakdown: {
    published: number;
    draft: number;
  };
  recentActivities: ActivityNotification[];
  needsAttention: {
    draftBlogs: RecentBlogPost[];
    projectsMissingHeroes: ProjectDoc[];
  };
}
