// app/api/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { teamMembers } from '@/lib/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { uploadBuffer } from '@/lib/cloudinary';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';
import { redisGet, redisSet, redisDel } from '@/lib/redis';
import crypto from 'crypto';

export async function GET() {
    try {
        const cacheKey = 'cache:team';
        const cached = await redisGet(cacheKey);
        if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });

        await connectDB();
        const members = await db.select()
            .from(teamMembers)
            .orderBy(asc(teamMembers.order), desc(teamMembers.createdAt));

        const mappedMembers = members.map(m => ({ ...m, _id: m.id }));

        await redisSet(cacheKey, mappedMembers, 120);
        return NextResponse.json(mappedMembers, { headers: { 'X-Cache': 'MISS' } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const name = formData.get('name') as string;
        const position = formData.get('position') as string;
        const study = formData.get('study') as string;
        const experience = formData.get('experience') as string;
        const description = formData.get('description') as string;
        const relationToGroup = formData.get('relationToGroup') as string;
        const linkedin = formData.get('linkedin') as string;
        const instagram = formData.get('instagram') as string;
        const facebook = formData.get('facebook') as string;
        const taglineThought = formData.get('taglineThought') as string || '';
        const skillsString = formData.get('skills') as string || '';
        const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean);
        const order = parseInt(formData.get('order') as string || '0');
        const imageFile = formData.get('image') as File | null;

        if (!name || !position || !imageFile) {
            return NextResponse.json({ error: 'Name, position, and profile image are required' }, { status: 400 });
        }

        await connectDB();

        // Upload image
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadResult = await uploadBuffer(buffer, imageFile.type, 'team-members');

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await db.insert(teamMembers).values({
            id,
            name,
            position,
            study: study || '',
            experience: experience || '',
            description: description || '',
            relationToGroup: relationToGroup || '',
            image: {
                url: uploadResult.secure_url,
                cloudinaryId: uploadResult.public_id
            },
            socialLinks: {
                linkedin: linkedin || '',
                instagram: instagram || '',
                facebook: facebook || ''
            },
            taglineThought: taglineThought || '',
            skills: skills || [],
            order: order || 0,
            createdAt: now,
            updatedAt: now
        });

        const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
        const responseObj = { ...member, _id: member.id };

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'added team member',
            name
        );

        return NextResponse.json(responseObj);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
