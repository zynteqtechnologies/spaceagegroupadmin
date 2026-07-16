// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { getCurrentUser, isAdministrator } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    try {
        const guard = await requireAuth(req, 'administrator');
        if (guard) return guard;

        await connectDB();
        const records = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        })
        .from(users)
        .where(inArray(users.role, ['administrator', 'manager']))
        .orderBy(desc(users.createdAt));

        const mapped = records.map(u => ({ ...u, _id: u.id }));
        return NextResponse.json(mapped);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const guard = await requireAuth(req, 'administrator');
        if (guard) return guard;

        await connectDB();
        const { name, email, password, role } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.insert(users).values({
            id,
            name,
            email,
            password: hashedPassword,
            role: (role || 'administrator') as any,
            createdAt: now,
            updatedAt: now
        });

        const userResponse = {
            _id: id,
            id,
            name,
            email,
            role: role || 'administrator',
            createdAt: now
        };

        return NextResponse.json(userResponse, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
