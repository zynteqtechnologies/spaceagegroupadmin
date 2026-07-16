// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, isAdministrator } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import bcrypt from 'bcryptjs';
import { redisDel } from '@/lib/redis';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req, 'administrator');
        if (guard) return guard;

        const { id } = await params;
        await connectDB();
        
        const [user] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        }).from(users).where(eq(users.id, id)).limit(1);

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json({ ...user, _id: user.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req, 'administrator');
        if (guard) return guard;

        const { id } = await params;
        await connectDB();
        const { name, email, password, role } = await req.json();
        
        const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (!existing) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (role !== undefined) updates.role = role as any;
        if (password) {
            updates.password = await bcrypt.hash(password, 10);
        }
        updates.updatedAt = new Date().toISOString();

        await db.update(users).set(updates).where(eq(users.id, id));

        // Invalidate Redis user cache so next request gets fresh data
        await redisDel(`user:${id}`);

        const [updatedUser] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        }).from(users).where(eq(users.id, id)).limit(1);

        const responseObj = { ...updatedUser, _id: updatedUser.id };
        return NextResponse.json(responseObj);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req, 'administrator');
        if (guard) return guard;

        const { id } = await params;
        await connectDB();
        
        const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        await db.delete(users).where(eq(users.id, id));

        // Invalidate Redis user cache
        await redisDel(`user:${id}`);

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
