// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';
import BlogPost from '@/models/BlogPost';
import TeamMember from '@/models/TeamMember';
import Media from '@/models/Media';
import User from '@/models/User';
import { getCurrentUser, isAdministrator } from '@/lib/authUtils';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = isAdministrator(user);

        // Fetch counts in parallel
        const [
            projectsCount,
            blogPostsCount,
            teamMembersCount,
            mediaCollectionsCount,
            usersCount
        ] = await Promise.all([
            Project.countDocuments(),
            BlogPost.countDocuments(),
            TeamMember.countDocuments(),
            Media.countDocuments(),
            isAdmin ? User.countDocuments() : Promise.resolve(undefined)
        ]);

        // Fetch recent items
        const [recentProjects, recentBlogPosts] = await Promise.all([
            Project.find().sort({ createdAt: -1 }).limit(5).lean(),
            BlogPost.find().sort({ createdAt: -1 }).limit(5).lean()
        ]);

        return NextResponse.json({
            counts: {
                projects: projectsCount,
                blogPosts: blogPostsCount,
                teamMembers: teamMembersCount,
                mediaCollections: mediaCollectionsCount,
                users: usersCount
            },
            recentProjects,
            recentBlogPosts
        });
    } catch (error: any) {
        console.error('Dashboard stats API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
