// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

export async function GET() {
    try {
        await connectDB();
        let settings = await SiteSettings.findOne();
        if (!settings) {
            settings = await SiteSettings.create({
                yearsOfExcellence: '35+',
                projectsCompleted: '120+',
                happyFamilies: '5000+',
                clientSatisfaction: '98%',
            });
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
        let settings = await SiteSettings.findOne();
        if (!settings) {
            settings = new SiteSettings();
        }

        if (yearsOfExcellence !== undefined) settings.yearsOfExcellence = String(yearsOfExcellence).trim();
        if (projectsCompleted !== undefined) settings.projectsCompleted = String(projectsCompleted).trim();
        if (happyFamilies !== undefined) settings.happyFamilies = String(happyFamilies).trim();
        if (clientSatisfaction !== undefined) settings.clientSatisfaction = String(clientSatisfaction).trim();

        await settings.save();

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
