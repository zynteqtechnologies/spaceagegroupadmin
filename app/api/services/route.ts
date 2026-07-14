import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Service from '@/models/Service';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        
        await connectDB();
        
        const currentUser = await getCurrentUser(req);
        const isUserPrivileged = currentUser && isPrivileged(currentUser);

        const filter: any = {};
        if (category) filter.category = category;

        if (status) {
            if (status === 'draft' && !isUserPrivileged) {
                return NextResponse.json({ error: 'Forbidden: You do not have permission to view drafts' }, { status: 403 });
            }
            filter.status = status;
        } else {
            if (!isUserPrivileged) {
                filter.status = 'published';
            }
        }

        const services = await Service.find(filter).sort({ number: 1 });
        return NextResponse.json(services);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);

        const body = await req.json();
        const { title, number, category, tagline, description, stats, features, accent, icon, status } = body;

        if (!title || !number || !category || !tagline || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Generate slug
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const existing = await Service.findOne({ slug });
        if (existing) {
            return NextResponse.json({ error: 'A service with this title already exists.' }, { status: 400 });
        }

        const service = await Service.create({
            title,
            slug,
            number,
            category,
            tagline,
            description,
            stats: stats || [],
            features: features || [],
            accent: accent || '#c9a84c',
            icon: icon || 'home',
            status: status || 'published'
        });

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'created a service',
            title
        );

        return NextResponse.json(service, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
