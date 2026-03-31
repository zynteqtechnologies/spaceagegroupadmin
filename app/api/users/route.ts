import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser, isAdministrator } from '@/lib/authUtils';

export async function GET() {
    try {
        await connectDB();
        const users = await User.find({ role: { $in: ['administrator', 'manager'] } }).select('-password').sort({ createdAt: -1 });
        return NextResponse.json(users);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !isAdministrator(currentUser)) {
            return NextResponse.json({ error: 'Permission denied. Only Administrators can create users.' }, { status: 403 });
        }

        await connectDB();
        const { name, email, password, role } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const user = await User.create({ 
            name, 
            email, 
            password, 
            role: role || 'admin' 
        });

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };

        return NextResponse.json(userResponse, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
