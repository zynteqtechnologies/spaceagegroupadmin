// app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import connectDB, { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendResetEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email } = await req.json();

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    await db.update(users).set({
      resetPasswordToken,
      resetPasswordExpire
    }).where(eq(users.id, user.id));

    // Send email
    await sendResetEmail(user.email, resetToken);

    return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}