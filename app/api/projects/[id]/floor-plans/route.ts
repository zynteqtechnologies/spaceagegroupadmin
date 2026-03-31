// app/api/projects/[id]/floor-plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { uploadBuffer, deleteFromCloudinary, CloudinaryResult } from '@/lib/cloudinary';
import Project from '@/models/Project';
import { type NewFloorPlanDetail } from '@/types/project';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/projects/:id/floor-plans ─────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const project = await Project.findById(id).select('floorPlans').lean();
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(project.floorPlans ?? []);
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

// ── POST /api/projects/:id/floor-plans — upload new floor plans ───────────────
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('floorPlanDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as NewFloorPlanDetail[];
        const files = formData.getAll('floorPlans') as File[];

        if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 });

        const newPlans = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                return {
                    url: result.secure_url, cloudinaryId: result.public_id,
                    title: details[i]?.title ?? file.name,
                    alt: details[i]?.alt ?? '',
                    bhkType: details[i]?.bhkType ?? '',
                    carpetArea: details[i]?.carpetArea ?? '',
                    order: details[i]?.order ?? project.floorPlans.length + i,
                    fileSize: result.bytes,
                };
            })
        );

        project.floorPlans.push(...newPlans);
        await project.save();

        return NextResponse.json({ message: 'Floor plans added', project }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

// ── PUT /api/projects/:id/floor-plans — update/reorder/delete floor plans ─────
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('floorPlanDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as (NewFloorPlanDetail & { _id?: string; markedForDeletion?: boolean })[];
        const files = formData.getAll('floorPlans') as File[];

        const toKeep: object[] = [];
        const newMeta: Partial<NewFloorPlanDetail>[] = [];

        for (const d of details) {
            if (d._id && d.markedForDeletion) {
                const orig = project.floorPlans.id(d._id);
                if (orig?.cloudinaryId) {
                    await deleteFromCloudinary(orig.cloudinaryId, 'image').catch(console.error);
                }
                project.floorPlans.pull({ _id: d._id });
            } else if (d._id) {
                const orig = project.floorPlans.id(d._id);
                if (orig) {
                    toKeep.push({
                        url: orig.url, cloudinaryId: orig.cloudinaryId,
                        title: d.title ?? orig.title, alt: d.alt ?? orig.alt ?? '',
                        bhkType: d.bhkType ?? orig.bhkType ?? '',
                        carpetArea: d.carpetArea ?? orig.carpetArea ?? '',
                        order: d.order ?? orig.order ?? 0,
                        fileSize: orig.fileSize,
                    });
                }
            } else {
                newMeta.push(d);
            }
        }

        const newPlans = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                return {
                    url: result.secure_url, cloudinaryId: result.public_id,
                    title: newMeta[i]?.title ?? file.name,
                    alt: newMeta[i]?.alt ?? '',
                    bhkType: newMeta[i]?.bhkType ?? '',
                    carpetArea: newMeta[i]?.carpetArea ?? '',
                    order: newMeta[i]?.order ?? toKeep.length + i,
                    fileSize: result.bytes,
                };
            })
        );

        project.set('floorPlans', [...toKeep, ...newPlans]);
        await project.save();

        return NextResponse.json({ message: 'Floor plans updated', project });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}