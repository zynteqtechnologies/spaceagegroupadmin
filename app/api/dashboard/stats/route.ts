// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';
import BlogPost from '@/models/BlogPost';
import TeamMember from '@/models/TeamMember';
import Media from '@/models/Media';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/authUtils';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch standard counts
        const [
            projectsCount,
            blogPostsCount,
            teamMembersCount,
            mediaCollectionsCount,
        ] = await Promise.all([
            Project.countDocuments(),
            BlogPost.countDocuments(),
            TeamMember.countDocuments(),
            Media.countDocuments(),
        ]);

        // Fetch Breakdowns
        const [
            projectsUpcoming,
            projectsOngoing,
            projectsCompleted,
            blogsPublished,
            blogsDraft,
        ] = await Promise.all([
            Project.countDocuments({ status: 'upcoming' }),
            Project.countDocuments({ status: 'ongoing' }),
            Project.countDocuments({ status: 'completed' }),
            BlogPost.countDocuments({ status: 'published' }),
            BlogPost.countDocuments({ status: 'draft' }),
        ]);

        // Fetch Activities, Needs Attention & Media Size
        const [recentActivities, draftBlogs, projectsMissingHeroes, mediaSizeResult] = await Promise.all([
            Notification.find({ type: 'manager_action' })
                .sort({ createdAt: -1 })
                .limit(50)
                .populate('userId', 'name')
                .lean(),
            BlogPost.find({ status: 'draft' }).sort({ updatedAt: -1 }).limit(5).lean(),
            Project.find({ 'heroImages.0': { $exists: false } }).sort({ updatedAt: -1 }).limit(5).lean(),
            Media.aggregate([
                { $unwind: "$items" },
                { $group: { _id: null, totalSize: { $sum: "$items.fileSize" } } }
            ])
        ]);

        const totalMediaSize = mediaSizeResult[0]?.totalSize || 0;

        return NextResponse.json({
            counts: {
                projects: projectsCount,
                blogPosts: blogPostsCount,
                teamMembers: teamMembersCount,
                mediaCollections: mediaCollectionsCount,
                totalMediaSize,
            },
            projectBreakdown: {
                upcoming: projectsUpcoming,
                ongoing: projectsOngoing,
                completed: projectsCompleted,
            },
            blogBreakdown: {
                published: blogsPublished,
                draft: blogsDraft,
            },
            recentActivities,
            needsAttention: {
                draftBlogs,
                projectsMissingHeroes
            }
        });
    } catch (error: any) {
        console.error('Dashboard stats API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
