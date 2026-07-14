// app/api/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import { uploadBuffer } from '@/lib/cloudinary';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';

export async function GET() {
    try {
        await connectDB();
        const members = await TeamMember.find().sort({ order: 1, createdAt: -1 });
        return NextResponse.json(members);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);

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

        const member = await TeamMember.create({
            name,
            position,
            study,
            experience,
            description,
            relationToGroup,
            image: {
                url: uploadResult.secure_url,
                cloudinaryId: uploadResult.public_id
            },
            socialLinks: {
                linkedin,
                instagram,
                facebook
            },
            taglineThought,
            skills,
            order
        });

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'added team member',
            name
        );

        return NextResponse.json(member);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
