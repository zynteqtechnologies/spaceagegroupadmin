// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB, { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { checkRateLimit } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(req, 5, 5 * 60 * 1000);
    if (rateLimit) return rateLimit;

    await connectDB();
    
    // Prevent registration if there is already at least one user in the database
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Registration is disabled. Please ask an administrator to create your account.' }, { status: 403 });
    }

    const { name, email, password } = await req.json();

    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    await db.insert(users).values({
      id,
      name,
      email,
      password: hashedPassword,
      role: 'administrator', // The first registered user gets administrator role
      createdAt: now,
      updatedAt: now
    });

    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    // Set cookie
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    const response = NextResponse.json(
      { user: { id: id, name, email } },
      { status: 201 }
    );
    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}