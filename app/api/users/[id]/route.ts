// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser, isAdministrator } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req, 'administrator');
        if (guard) return guard;

        const { id } = await params;
        await connectDB();
        const user = await User.findById(id).select('-password');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json(user);
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
        
        const updateData: any = { name, email, role };
        if (password) updateData.password = password;

        const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(user);
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
        
        // Prevent deleting the last admin if possible (simplified here)
        const user = await User.findById(id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        await User.findByIdAndDelete(id);
        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
