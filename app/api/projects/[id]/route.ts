// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq, and, or, ne } from 'drizzle-orm';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';
import { redisDel } from '@/lib/redis';

type Params = { params: Promise<{ id: string }> };

// ── helper: find by ID OR slug ─────────────────────────────────────────
async function findProject(id: string) {
    const [project] = await db.select().from(projects).where(or(eq(projects.id, id), eq(projects.slug, id))).limit(1);
    return project;
}

// ── GET /api/projects/:id ─────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await findProject(id);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({ ...project, _id: project.id });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[GET /api/projects/[id]]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── PATCH /api/projects/:id — update basic info ───────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await connectDB();

        const body = await req.json();
        const { title, slug, status, headline, shortIntro, address, estYear, featured, category, area, units } = body;

        const project = await findProject(id);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const updates: any = {};
        if (title !== undefined) updates.title = title.trim();
        if (headline !== undefined) updates.headline = headline.trim();
        if (shortIntro !== undefined) updates.shortIntro = shortIntro.trim();
        if (status !== undefined) updates.status = status;
        if (address !== undefined) updates.address = address.trim();
        if (estYear !== undefined) updates.estYear = estYear.trim();
        if (featured !== undefined) {
            updates.featured = (featured === true || featured === 'true' || featured === 1 || featured === '1') ? 1 : 0;
        }
        if (category !== undefined) updates.category = category.trim();
        if (area !== undefined) updates.area = area.trim();
        if (units !== undefined) updates.units = units ? Number(units) : 0;

        if (slug !== undefined) {
            const newSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const [conflict] = await db.select().from(projects).where(
                and(
                    eq(projects.slug, newSlug),
                    ne(projects.id, project.id)
                )
            ).limit(1);
            if (conflict) {
                return NextResponse.json({ error: `Slug "${newSlug}" already taken` }, { status: 409 });
            }
            updates.slug = newSlug;
        }

        updates.updatedAt = new Date().toISOString();

        await db.update(projects).set(updates).where(eq(projects.id, project.id));
        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, project.id)).limit(1);
        const responseObj = { 
            ...updatedProject, 
            _id: updatedProject.id,
            featured: Boolean((updatedProject.featured as any) === true || (updatedProject.featured as any) === 1 || (updatedProject.featured as any) === '1' || (updatedProject.featured as any) === 'true'),
        };
 
        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated project',
            updatedProject.title
        );

        // Invalidate projects list cache
        await redisDel('cache:projects:all', 'cache:projects:upcoming', 'cache:projects:ongoing', 'cache:projects:completed');

        return NextResponse.json({ message: 'Updated successfully', project: responseObj });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[PATCH /api/projects/[id]]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── DELETE /api/projects/:id — delete entire project ─────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await connectDB();

        const project = await findProject(id);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const cleanupTasks: Promise<void>[] = [];

        const deleteMedia = (items: any, type: 'image' | 'video' = 'image') => {
            let list: any[] = [];
            if (Array.isArray(items)) {
                list = items;
            } else if (typeof items === 'string') {
                try {
                    const parsed = JSON.parse(items);
                    if (Array.isArray(parsed)) list = parsed;
                } catch (e) {
                    list = [];
                }
            }
            list.forEach((item) => {
                if (item && item.cloudinaryId) {
                    cleanupTasks.push(
                        deleteFromCloudinary(item.cloudinaryId, item.mediaType === 'video' ? 'video' : type)
                            .catch((e) => console.error('Cloudinary delete failed:', e))
                    );
                }
            });
        };

        deleteMedia(project.heroImages);
        deleteMedia(project.floorPlans);
        deleteMedia(project.sampleHousePhotos);

        if ((project.layoutPlan as any)?.cloudinaryId) {
            cleanupTasks.push(
                deleteFromCloudinary((project.layoutPlan as any).cloudinaryId, 'image')
                    .catch((e) => console.error('Cloudinary delete failed:', e))
            );
        }
        if ((project.brochure as any)?.cloudinaryId) {
            cleanupTasks.push(
                deleteFromCloudinary((project.brochure as any).cloudinaryId, 'image')
                    .catch((e) => console.error('Cloudinary delete failed:', e))
            );
        }

        await Promise.allSettled(cleanupTasks);
        const projectTitle = project.title;
        await db.delete(projects).where(eq(projects.id, project.id));
        await redisDel('cache:projects:all', 'cache:projects:upcoming', 'cache:projects:ongoing', 'cache:projects:completed');
 
        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'deleted project',
            projectTitle
        );

        // Invalidate projects list cache
        await redisDel('cache:projects:all', 'cache:projects:upcoming', 'cache:projects:ongoing', 'cache:projects:completed');

        return NextResponse.json({ message: 'Project deleted successfully' });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[DELETE /api/projects/[id]]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}