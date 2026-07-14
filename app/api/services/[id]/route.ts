import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Service from '@/models/Service';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        
        const service = id.match(/^[0-9a-fA-F]{24}$/)
            ? await Service.findById(id)
            : await Service.findOne({ slug: id });

        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

        // Enforce draft content safety
        if (service.status === 'draft') {
            const currentUser = await getCurrentUser(req);
            if (!currentUser || !isPrivileged(currentUser)) {
                return NextResponse.json({ error: 'Forbidden: You do not have permission to view drafts' }, { status: 403 });
            }
        }

        return NextResponse.json(service);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);

        const { id } = await params;
        const body = await req.json();
        
        await connectDB();
        const service = await Service.findById(id);
        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

        const fields = ['title', 'number', 'category', 'tagline', 'description', 'accent', 'icon', 'status', 'stats', 'features'];
        fields.forEach(field => {
            if (body[field] !== undefined) {
                (service as any)[field] = body[field];
            }
        });

        // Update slug if title changes
        if (body.title) {
            service.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        await service.save();

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated service',
            service.title
        );

        return NextResponse.json(service);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);

        const { id } = await params;
        await connectDB();
        const service = await Service.findById(id);
        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

        const serviceTitle = service.title;
        await Service.findByIdAndDelete(id);

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'deleted service',
            serviceTitle
        );

        return NextResponse.json({ message: 'Service deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
