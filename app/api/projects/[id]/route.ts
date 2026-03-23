// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import Project from '@/models/Project';
import { IMediaItem } from '@/models/Project';

type Params = { params: Promise<{ id: string }> };

// ── helper: find by ObjectId OR slug ─────────────────────────────────────────
async function findProject(id: string) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;
    return isObjectId
        ? Project.findById(id)
        : Project.findOne({ slug: id });
}

async function findProjectLean(id: string) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;
    return isObjectId
        ? Project.findById(id).lean()
        : Project.findOne({ slug: id }).lean();
}

// ── GET /api/projects/:id ─────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await findProjectLean(id);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[GET /api/projects/[id]]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── PATCH /api/projects/:id — update basic info ───────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const body = await req.json();
        const { title, slug, status, headline, shortIntro } = body;

        const project = await findProject(id);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (title !== undefined) project.title = title.trim();
        if (headline !== undefined) project.headline = headline.trim();
        if (shortIntro !== undefined) project.shortIntro = shortIntro.trim();
        if (status !== undefined) project.status = status;

        if (slug !== undefined) {
            const newSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const conflict = await Project.findOne({ slug: newSlug, _id: { $ne: project._id } });
            if (conflict) {
                return NextResponse.json({ error: `Slug "${newSlug}" already taken` }, { status: 409 });
            }
            project.slug = newSlug;
        }

        await project.save();

        return NextResponse.json({ message: 'Updated successfully', project });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[PATCH /api/projects/[id]]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── DELETE /api/projects/:id — delete entire project ─────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await findProject(id);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const cleanupTasks: Promise<void>[] = [];

        const deleteMedia = (items: IMediaItem[], type: 'image' | 'video' = 'image') => {
            items.forEach((item) => {
                if (item.cloudinaryId) {
                    cleanupTasks.push(
                        deleteFromCloudinary(item.cloudinaryId, item.mediaType === 'video' ? 'video' : type)
                            .catch((e) => console.error('Cloudinary delete failed:', e))
                    );
                }
            });
        };

        deleteMedia(project.heroImages as unknown as IMediaItem[]);
        deleteMedia(project.floorPlans as unknown as IMediaItem[]);
        deleteMedia(project.sampleHousePhotos as unknown as IMediaItem[]);

        if (project.layoutPlan?.cloudinaryId) {
            cleanupTasks.push(
                deleteFromCloudinary(project.layoutPlan.cloudinaryId, 'image')
                    .catch((e) => console.error('Cloudinary delete failed:', e))
            );
        }
        if (project.brochure?.cloudinaryId) {
            cleanupTasks.push(
                deleteFromCloudinary(project.brochure.cloudinaryId, 'image')
                    .catch((e) => console.error('Cloudinary delete failed:', e))
            );
        }

        await Promise.allSettled(cleanupTasks);
        await Project.findByIdAndDelete(project._id);

        return NextResponse.json({ message: 'Project deleted successfully' });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[DELETE /api/projects/[id]]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}