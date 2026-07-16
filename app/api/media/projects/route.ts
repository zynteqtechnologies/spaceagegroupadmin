// app/api/media/projects/route.ts
import { NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { projects } from '@/lib/schema';

export async function GET() {
    try {
        await connectDB();
        
        const allProjects = await db.select({
            id: projects.id,
            title: projects.title,
            heroImages: projects.heroImages,
            floorPlans: projects.floorPlans,
            layoutPlan: projects.layoutPlan,
            sampleHousePhotos: projects.sampleHousePhotos,
            brochure: projects.brochure
        }).from(projects);

        const filtered = allProjects.filter((p: any) => {
            const hasHero = p.heroImages && Array.isArray(p.heroImages) && p.heroImages.length > 0;
            const hasFloor = p.floorPlans && Array.isArray(p.floorPlans) && p.floorPlans.length > 0;
            const hasLayout = p.layoutPlan && p.layoutPlan.url;
            const hasSample = p.sampleHousePhotos && Array.isArray(p.sampleHousePhotos) && p.sampleHousePhotos.length > 0;
            const hasBrochure = p.brochure && p.brochure.url;
            return hasHero || hasFloor || hasLayout || hasSample || hasBrochure;
        }).map(p => ({ ...p, _id: p.id }));

        return NextResponse.json(filtered);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
