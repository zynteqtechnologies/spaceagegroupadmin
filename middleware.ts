import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const protectedRoutes = ['/dashboard', '/profile'];
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  console.log(`[Middleware] Path: ${pathname}`);
  console.log(`[Middleware] Token present: ${!!token}`);

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  if (isProtected) {
    if (!token) {
      console.log('[Middleware] No token → redirect to /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Verify token with jose (Edge compatible)
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      console.log('[Middleware] Token valid, decoded:', payload);
      return NextResponse.next();
    } catch (error) {
      console.error('[Middleware] Token verification failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (isAuthRoute && token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      console.log('[Middleware] Valid token on auth route → redirect to /dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      console.log('[Middleware] Invalid token on auth route → allow access');
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};