// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB, { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { checkRateLimit } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(req, 15, 5 * 60 * 1000);
    if (rateLimit) return rateLimit;

    await connectDB();
    const { email, password } = await req.json();

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    const response = NextResponse.json(
      { user: { id: user.id, name: user.name, email, role: user.role } },
      { status: 200 }
    );
    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}