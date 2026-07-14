import { NextRequest, NextResponse } from 'next/server';
import { sendResendEmail } from '@/lib/resend';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    try {
        // Enforce rate limiter (5 submissions per 5 minutes per client IP)
        const rateLimit = await checkRateLimit(req, 5, 5 * 60 * 1000);
        if (rateLimit) return rateLimit;

        const body = await req.json();
        const { name, email, phone, message, interest, project, budget, serviceTitle } = body;

        if (!name || !email || !phone || !message) {
            return NextResponse.json({ error: 'Name, Email, Phone, and Message are required fields' }, { status: 400 });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
        }

        // Phone number length validation (at least 8 digits)
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 8) {
            return NextResponse.json({ error: 'Please provide a valid phone number (at least 8 digits)' }, { status: 400 });
        }

        // ── 1. Admin Notification Email ─────────────────────────────
        const adminEmailContent = `
            <h3>New Inquiry Received</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            ${interest ? `<p><strong>Interest Category:</strong> ${interest}</p>` : ''}
            ${project ? `<p><strong>Selected Project:</strong> ${project}</p>` : ''}
            ${budget ? `<p><strong>Estimated Budget:</strong> ${budget}</p>` : ''}
            ${serviceTitle ? `<p><strong>Service Page:</strong> ${serviceTitle}</p>` : ''}
            <p><strong>Message / Requirements:</strong></p>
            <p style="white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px;">${message}</p>
        `;

        // Send to verified address (sandbox limit)
        const adminReceipt = await sendResendEmail({
            to: 'zahidqureshi5104@gmail.com',
            subject: `[SpaceAge Inquiry] New Request from ${name}`,
            html: adminEmailContent
        });

        // ── 2. Visitor Auto-Receipt Email ───────────────────────────
        const visitorEmailContent = `
            <h3>Thank you for contacting SpaceAge Group, ${name}!</h3>
            <p>We have successfully received your inquiry regarding <strong>${serviceTitle || interest || 'our construction & consultation services'}</strong>.</p>
            <p>Our advisors are reviewing your details and will get in touch with you at <strong>${phone}</strong> or <strong>${email}</strong> within one business day.</p>
            <br />
            <p>Best Regards,</p>
            <p><strong>SpaceAge Group Vadodara</strong></p>
        `;

        try {
            // Attempt to send to customer. If Resend rejects (because domain is unverified sandbox limit),
            // it throws. We catch it and send a copy of the receipt to admin instead so it doesn't crash the request!
            await sendResendEmail({
                to: email,
                subject: `SpaceAge Group - Inquiry Acknowledged`,
                html: visitorEmailContent
            });
        } catch (visitorMailErr: any) {
            console.warn(
                `Could not send confirmation receipt to ${email} (likely due to Resend Sandbox limitation). Sending copy of receipt to admin instead. Error:`,
                visitorMailErr.message
            );
            
            try {
                // Send receipt copy to the verified account owner so the developer sees the receipt output
                await sendResendEmail({
                    to: 'zahidqureshi5104@gmail.com',
                    subject: `[Copy of Receipt for ${name}] SpaceAge Group - Inquiry Acknowledged`,
                    html: visitorEmailContent
                });
            } catch (fallbackErr: any) {
                console.error("Failed to send fallback copy to admin:", fallbackErr.message);
            }
        }

        return NextResponse.json({ success: true, message: 'Inquiry received and processed successfully' });
    } catch (err: any) {
        console.error('Inquiry API Error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error occurred' }, { status: 500 });
    }
}
