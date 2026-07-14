import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './authUtils';

/**
 * Server-side auth guard for API routes.
 *
 * Returns `null` if the request is authenticated and authorized.
 * Returns a `NextResponse` error if the request should be rejected.
 *
 * Usage:
 *   const guard = await requireAuth(req);
 *   if (guard) return guard;   // early return if unauthorized
 *   // ... rest of handler (user is now guaranteed to be logged in)
 */
export async function requireAuth(
    req: NextRequest,
    requiredRole?: 'administrator' | 'manager' | 'user'
): Promise<NextResponse | null> {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized: Authentication token is missing or invalid' },
                { status: 401 }
            );
        }

        if (requiredRole === 'administrator' && user.role !== 'administrator') {
            return NextResponse.json(
                { error: 'Forbidden: Administrator privileges required' },
                { status: 403 }
            );
        }

        if (requiredRole === 'manager' && user.role !== 'manager' && user.role !== 'administrator') {
            return NextResponse.json(
                { error: 'Forbidden: Manager privileges required' },
                { status: 403 }
            );
        }

        // Default: must be administrator or manager to mutate dashboard records
        if (!requiredRole && user.role !== 'administrator' && user.role !== 'manager') {
            return NextResponse.json(
                { error: 'Forbidden: Insufficient privileges' },
                { status: 403 }
            );
        }

        return null; // auth passed — caller may proceed
    } catch (err: any) {
        return NextResponse.json(
            { error: 'Internal Auth Error: ' + err.message },
            { status: 500 }
        );
    }
}
