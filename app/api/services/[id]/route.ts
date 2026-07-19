// app/api/services/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { services } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';
import { getCurrentUser, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        
        const [service] = await db.select()
            .from(services)
            .where(or(eq(services.id, id), eq(services.slug, id)))
            .limit(1);

        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

        // Enforce draft content safety
        if (service.status === 'draft') {
            const currentUser = await getCurrentUser(req);
            if (!currentUser || !isPrivileged(currentUser)) {
                return NextResponse.json({ error: 'Forbidden: You do not have permission to view drafts' }, { status: 403 });
            }
        }

        // Parse JSON fields safely
        let stats = service.stats;
        if (typeof stats === 'string') {
            try { stats = JSON.parse(stats); } catch { stats = []; }
        }
        if (!Array.isArray(stats)) stats = [];

        let features = service.features;
        if (typeof features === 'string') {
            try { features = JSON.parse(features); } catch { features = []; }
        }
        if (!Array.isArray(features)) features = [];

        return NextResponse.json({
            ...service,
            _id: service.id,
            stats,
            features
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        
        await connectDB();
        const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

        const updates: any = {};
        const fields = ['title', 'number', 'category', 'tagline', 'description', 'accent', 'icon', 'status', 'stats', 'features'];
        fields.forEach(field => {
            if (body[field] !== undefined) {
                updates[field] = field === 'number' ? String(body[field]) : body[field];
            }
        });

        // Update slug if title changes
        if (body.title) {
            updates.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        updates.updatedAt = new Date().toISOString();

        await db.update(services).set(updates).where(eq(services.id, id));
        const [updatedService] = await db.select().from(services).where(eq(services.id, id)).limit(1);
        const responseObj = { ...updatedService, _id: updatedService.id };

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated service',
            updatedService.title
        );

        return NextResponse.json(responseObj);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await connectDB();
        const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

        const serviceTitle = service.title;
        await db.delete(services).where(eq(services.id, id));

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
