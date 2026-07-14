// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(req, 5, 5 * 60 * 1000);
    if (rateLimit) return rateLimit;

    await connectDB();
    
    // Prevent registration if there is already at least one user in the database
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return NextResponse.json({ error: 'Registration is disabled. Please ask an administrator to create your account.' }, { status: 403 });
    }

    const { name, email, password } = await req.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const user = await User.create({ name, email, password });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    // Set cookie
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    const response = NextResponse.json(
      { user: { id: user._id, name, email } },
      { status: 201 }
    );
    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}