// app/api/media/projects/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';

export async function GET() {
    try {
        await connectDB();
        
        // A project "has media" if any of its media fields are non-empty
        const projects = await Project.find({
            $or: [
                { 'heroImages.0': { $exists: true } },
                { 'floorPlans.0': { $exists: true } },
                { 'layoutPlan.url': { $exists: true, $ne: '' } },
                { 'sampleHousePhotos.0': { $exists: true } },
                { 'brochure.url': { $exists: true, $ne: '' } }
            ]
        }).select('title _id heroImages floorPlans layoutPlan sampleHousePhotos brochure').lean();

        return NextResponse.json(projects);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
