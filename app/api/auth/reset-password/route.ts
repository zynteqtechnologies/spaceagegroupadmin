// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import connectDB, { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { and, eq, gt } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { token, password } = await req.json();

    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const [user] = await db.select().from(users).where(
      and(
        eq(users.resetPasswordToken, hashedToken),
        gt(users.resetPasswordExpire, new Date().toISOString())
      )
    ).limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set new password and clear reset token fields
    await db.update(users).set({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpire: null
    }).where(eq(users.id, user.id));

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}