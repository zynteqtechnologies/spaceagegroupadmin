// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects, blogPosts, teamMembers, media, notifications, users } from '@/lib/schema';
import { eq, desc, count } from 'drizzle-orm';
import { requireAuth } from '@/lib/apiGuard';
import { redisGet, redisSet } from '@/lib/redis';

export async function GET(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;

        // ── Redis cache (60-second TTL) ───────────────────────────────
        const CACHE_KEY = 'dashboard:stats';
        const cached = await redisGet(CACHE_KEY);
        if (cached) {
            return NextResponse.json(cached, {
                headers: { 'X-Cache': 'HIT' }
            });
        }

        await connectDB();

        // Fetch standard counts and breakdowns
        const [
            projectsCountRes,
            blogPostsCountRes,
            teamMembersCountRes,
            mediaCountRes,
            projectsUpcomingRes,
            projectsOngoingRes,
            projectsCompletedRes,
            blogsPublishedRes,
            blogsDraftRes,
        ] = await Promise.all([
            db.select({ count: count() }).from(projects),
            db.select({ count: count() }).from(blogPosts),
            db.select({ count: count() }).from(teamMembers),
            db.select({ count: count() }).from(media),
            db.select({ count: count() }).from(projects).where(eq(projects.status, 'upcoming')),
            db.select({ count: count() }).from(projects).where(eq(projects.status, 'ongoing')),
            db.select({ count: count() }).from(projects).where(eq(projects.status, 'completed')),
            db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, 'published')),
            db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, 'draft')),
        ]);

        const projectsCount = projectsCountRes[0]?.count || 0;
        const blogPostsCount = blogPostsCountRes[0]?.count || 0;
        const teamMembersCount = teamMembersCountRes[0]?.count || 0;
        const mediaCollectionsCount = mediaCountRes[0]?.count || 0;
        const projectsUpcoming = projectsUpcomingRes[0]?.count || 0;
        const projectsOngoing = projectsOngoingRes[0]?.count || 0;
        const projectsCompleted = projectsCompletedRes[0]?.count || 0;
        const blogsPublished = blogsPublishedRes[0]?.count || 0;
        const blogsDraft = blogsDraftRes[0]?.count || 0;

        // Fetch Activities, Needs Attention & Media Size
        const activities = await db.select({
            id: notifications.id,
            userId: notifications.userId,
            managerName: notifications.managerName,
            action: notifications.action,
            target: notifications.target,
            isRead: notifications.isRead,
            createdAt: notifications.createdAt,
            updatedAt: notifications.updatedAt,
            user: {
                id: users.id,
                name: users.name
            }
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.userId, users.id))
        .orderBy(desc(notifications.createdAt))
        .limit(50);

        const recentActivities = activities.map(a => ({
            ...a,
            _id: a.id,
            userId: a.user ? { _id: a.user.id, id: a.user.id, name: a.user.name } : a.userId,
            content: `${a.user && a.user.name ? a.user.name : a.managerName} ${a.action}: ${a.target}`
        }));

        const draftBlogsRaw = await db.select()
            .from(blogPosts)
            .where(eq(blogPosts.status, 'draft'))
            .orderBy(desc(blogPosts.updatedAt))
            .limit(5);
        const draftBlogs = draftBlogsRaw.map(b => ({ ...b, _id: b.id }));

        const allProjects = await db.select().from(projects).orderBy(desc(projects.updatedAt));
        const projectsMissingHeroes = allProjects
            .filter((p: any) => !p.heroImages || !Array.isArray(p.heroImages) || p.heroImages.length === 0)
            .slice(0, 5)
            .map(p => ({ ...p, _id: p.id }));

        const allMedia = await db.select({ items: media.items }).from(media);
        let totalMediaSize = 0;
        allMedia.forEach(row => {
            const items = (row.items as any[]) || [];
            items.forEach(item => {
                if (item && item.fileSize) {
                    totalMediaSize += Number(item.fileSize);
                }
            });
        });

        const statsPayload = {
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
        };

        // Cache the stats object in Redis for 60 seconds
        await redisSet(CACHE_KEY, statsPayload, 60);

        return NextResponse.json(statsPayload, {
            headers: { 'X-Cache': 'MISS' }
        });
    } catch (error: any) {
        console.error('Dashboard stats API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
