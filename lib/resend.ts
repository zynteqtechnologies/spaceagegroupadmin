// lib/resend.ts

export async function sendResendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    const apiKey = process.env.RESEND_API_KEY || 're_dwKV5VyZ_EnT55NKj3WT54i4jBM4HEfYG';
    
    try {
        console.log(`Sending email to ${to} via Resend...`);
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: 'SpaceAge Group <onboarding@resend.dev>',
                to: to,
                subject: subject,
                html: html
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Resend API Error: ${res.status} - ${errText}`);
        }

        const result = await res.json();
        console.log(`Email successfully dispatched: ID ${result.id}`);
        return result;
    } catch (err: any) {
        console.error(`Failed to dispatch email:`, err.message);
        throw err;
    }
}
