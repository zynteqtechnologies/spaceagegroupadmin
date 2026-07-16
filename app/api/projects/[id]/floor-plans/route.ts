// app/api/projects/[id]/floor-plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadBuffer, deleteFromCloudinary, CloudinaryResult } from '@/lib/cloudinary';
import { type NewFloorPlanDetail } from '@/types/project';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/projects/:id/floor-plans ─────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const [project] = await db.select({ floorPlans: projects.floorPlans }).from(projects).where(eq(projects.id, id)).limit(1);
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

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('floorPlanDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as NewFloorPlanDetail[];
        const files = formData.getAll('floorPlans') as File[];

        if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 });

        const currentFloorPlans = (project.floorPlans as any[]) || [];

        const newPlans = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                const newId = crypto.randomUUID();
                return {
                    _id: newId,
                    id: newId,
                    url: result.secure_url,
                    cloudinaryId: result.public_id,
                    title: details[i]?.title ?? file.name,
                    alt: details[i]?.alt ?? '',
                    bhkType: details[i]?.bhkType ?? '',
                    carpetArea: details[i]?.carpetArea ?? '',
                    order: details[i]?.order ?? currentFloorPlans.length + i,
                    fileSize: result.bytes,
                };
            })
        );

        const finalFloorPlans = [...currentFloorPlans, ...newPlans];

        await db.update(projects).set({
            floorPlans: finalFloorPlans,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Floor plans added', project: responseObj }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}

// ── PUT /api/projects/:id/floor-plans — update/reorder/delete floor plans ─────
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();

        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const formData = await req.formData();
        const rawDetail = formData.get('floorPlanDetails') as string | null;
        const details = JSON.parse(rawDetail ?? '[]') as (NewFloorPlanDetail & { _id?: string; markedForDeletion?: boolean })[];
        const files = formData.getAll('floorPlans') as File[];

        const currentFloorPlans = (project.floorPlans as any[]) || [];
        const toKeep: any[] = [];
        const toDelete: any[] = [];
        const newMeta: Partial<NewFloorPlanDetail>[] = [];

        for (const d of details) {
            if (d._id && d.markedForDeletion) {
                const orig = currentFloorPlans.find((plan: any) => plan._id === d._id || plan.id === d._id);
                if (orig) toDelete.push(orig);
            } else if (d._id) {
                const orig = currentFloorPlans.find((plan: any) => plan._id === d._id || plan.id === d._id);
                if (orig) {
                    toKeep.push({
                        _id: orig._id || orig.id,
                        id: orig.id || orig._id,
                        url: orig.url,
                        cloudinaryId: orig.cloudinaryId,
                        title: d.title ?? orig.title,
                        alt: d.alt ?? orig.alt ?? '',
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

        await Promise.allSettled(
            toDelete.map(async (orig) => {
                if (orig.cloudinaryId) {
                    await deleteFromCloudinary(orig.cloudinaryId, 'image').catch(console.error);
                }
            })
        );

        const newPlans = await Promise.all(
            files.map(async (file, i) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result: CloudinaryResult = await uploadBuffer(buffer, file.type);
                const newId = crypto.randomUUID();
                return {
                    _id: newId,
                    id: newId,
                    url: result.secure_url,
                    cloudinaryId: result.public_id,
                    title: newMeta[i]?.title ?? file.name,
                    alt: newMeta[i]?.alt ?? '',
                    bhkType: newMeta[i]?.bhkType ?? '',
                    carpetArea: newMeta[i]?.carpetArea ?? '',
                    order: newMeta[i]?.order ?? toKeep.length + i,
                    fileSize: result.bytes,
                };
            })
        );

        const finalFloorPlans = [...toKeep, ...newPlans];

        await db.update(projects).set({
            floorPlans: finalFloorPlans,
            updatedAt: new Date().toISOString()
        }).where(eq(projects.id, id));

        const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        const responseObj = { ...updatedProject, _id: updatedProject.id };

        return NextResponse.json({ message: 'Floor plans updated', project: responseObj });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
    }
}