// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { siteSettings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';
import crypto from 'crypto';

export async function GET() {
    try {
        await connectDB();
        let [settings] = await db.select().from(siteSettings).limit(1);
        if (!settings) {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            await db.insert(siteSettings).values({
                id,
                yearsOfExcellence: '35+',
                projectsCompleted: '120+',
                happyFamilies: '5000+',
                clientSatisfaction: '98%',
                createdAt: now,
                updatedAt: now,
            });
            [settings] = await db.select().from(siteSettings).limit(1);
        }
        return NextResponse.json(settings);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !isPrivileged(currentUser)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { yearsOfExcellence, projectsCompleted, happyFamilies, clientSatisfaction } = body;

        await connectDB();
        let [settings] = await db.select().from(siteSettings).limit(1);
        const now = new Date().toISOString();

        if (!settings) {
            const id = crypto.randomUUID();
            await db.insert(siteSettings).values({
                id,
                yearsOfExcellence: String(yearsOfExcellence !== undefined ? yearsOfExcellence : '35+').trim(),
                projectsCompleted: String(projectsCompleted !== undefined ? projectsCompleted : '120+').trim(),
                happyFamilies: String(happyFamilies !== undefined ? happyFamilies : '5000+').trim(),
                clientSatisfaction: String(clientSatisfaction !== undefined ? clientSatisfaction : '98%').trim(),
                createdAt: now,
                updatedAt: now,
            });
            [settings] = await db.select().from(siteSettings).limit(1);
        } else {
            const updates: any = {};
            if (yearsOfExcellence !== undefined) updates.yearsOfExcellence = String(yearsOfExcellence).trim();
            if (projectsCompleted !== undefined) updates.projectsCompleted = String(projectsCompleted).trim();
            if (happyFamilies !== undefined) updates.happyFamilies = String(happyFamilies).trim();
            if (clientSatisfaction !== undefined) updates.clientSatisfaction = String(clientSatisfaction).trim();
            updates.updatedAt = now;

            await db.update(siteSettings).set(updates).where(eq(siteSettings.id, settings.id));
            [settings] = await db.select().from(siteSettings).limit(1);
        }

        // Send a notification log
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated website global stats settings',
            `Excellence: ${settings.yearsOfExcellence}, Projects: ${settings.projectsCompleted}`
        );

        return NextResponse.json(settings);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
