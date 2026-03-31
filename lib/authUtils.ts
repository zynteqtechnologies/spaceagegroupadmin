// lib/authUtils.ts
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from './mongodb';
import User from '@/models/User';

export async function getCurrentUser(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    if (!token) {
        console.log('[DEBUG] No token found in cookies');
        return null;
    }

    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(process.env.JWT_SECRET)
        );

        if (!payload || !payload.userId) {
            console.log('[DEBUG] Invalid token payload:', payload);
            return null;
        }

        await connectDB();
        const user = await User.findById(payload.userId).select('-password');
        if (!user) {
            console.log('[DEBUG] User not found for ID:', payload.userId);
        }
        return user;
    } catch (error) {
        console.error('[DEBUG] Auth verification failed:', error);
        return null;
    }
}

export function isAdministrator(user: any) {
    return user && user.role === 'administrator';
}

export function isManager(user: any) {
    return user && user.role === 'manager';
}

export function isPrivileged(user: any) {
    return isAdministrator(user) || isManager(user);
}
