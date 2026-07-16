// app/api/team/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, db } from '@/lib/db';
import { teamMembers } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadBuffer, deleteFromCloudinary } from '@/lib/cloudinary';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { requireAuth } from '@/lib/apiGuard';
import { createManagerNotification } from '@/lib/notificationUtils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        return NextResponse.json({ ...member, _id: member.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const formData = await req.formData();
        
        await connectDB();
        const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        const updates: any = {};
        const fields = ['name', 'position', 'study', 'experience', 'description', 'relationToGroup', 'order', 'taglineThought'];
        fields.forEach(field => {
            const val = formData.get(field);
            if (val !== null) {
                updates[field] = field === 'order' ? parseInt(val as string) : val;
            }
        });

        // Update skills array
        const skillsVal = formData.get('skills');
        if (skillsVal !== null) {
            updates.skills = String(skillsVal).split(',').map(s => s.trim()).filter(Boolean);
        }

        // Update social links
        const socialLinksObj = { ...(member.socialLinks as any) };
        const socialFields = ['linkedin', 'instagram', 'facebook'];
        let socialLinksChanged = false;
        socialFields.forEach(field => {
            const val = formData.get(field);
            if (val !== null) {
                socialLinksObj[field] = val as string;
                socialLinksChanged = true;
            }
        });
        if (socialLinksChanged) {
            updates.socialLinks = socialLinksObj;
        }

        // Update image if provided
        const file = formData.get('image') as File | null;
        if (file) {
            // Delete old image
            if (member.image && (member.image as any).cloudinaryId) {
                await deleteFromCloudinary((member.image as any).cloudinaryId);
            }
            
            // Upload new image
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploadResult = await uploadBuffer(buffer, file.type, 'team-profiles');
            
            updates.image = {
                url: uploadResult.secure_url,
                cloudinaryId: uploadResult.public_id
            };
        }

        updates.updatedAt = new Date().toISOString();

        await db.update(teamMembers).set(updates).where(eq(teamMembers.id, id));
        const [updatedMember] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
        const responseObj = { ...updatedMember, _id: updatedMember.id };

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'updated team member',
            updatedMember.name
        );
        return NextResponse.json(responseObj);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const guard = await requireAuth(req);
        if (guard) return guard;
        const currentUser = await getCurrentUser(req);
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await connectDB();
        const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        // Delete image from Cloudinary/ImageKit
        if (member.image && (member.image as any).cloudinaryId) {
            await deleteFromCloudinary((member.image as any).cloudinaryId);
        }
        
        const memberName = member.name;
        await db.delete(teamMembers).where(eq(teamMembers.id, id));

        // ── Privileged Action Notification ──────────────────────────────
        await createManagerNotification(
            currentUser._id.toString(),
            currentUser.name,
            'deleted team member',
            memberName
        );
        return NextResponse.json({ message: 'Member deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
