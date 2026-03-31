// app/api/team/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import { uploadBuffer, deleteFromCloudinary } from '@/lib/cloudinary';
import { getCurrentUser, isManager, isPrivileged } from '@/lib/authUtils';
import { createManagerNotification } from '@/lib/notificationUtils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await connectDB();
        const member = await TeamMember.findById(id);
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        return NextResponse.json(member);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const currentUser = await getCurrentUser(req);
        const { id } = await params;
        const formData = await req.formData();
        
        await connectDB();
        const member = await TeamMember.findById(id);
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        // Update basic fields
        const fields = ['name', 'position', 'study', 'experience', 'description', 'relationToGroup', 'order'];
        fields.forEach(field => {
            const val = formData.get(field);
            if (val !== null) {
                (member as any)[field] = field === 'order' ? parseInt(val as string) : val;
            }
        });

        // Update social links
        const socialFields = ['linkedin', 'instagram', 'facebook'];
        socialFields.forEach(field => {
            const val = formData.get(field);
            if (val !== null) {
                member.socialLinks[field as keyof typeof member.socialLinks] = val as string;
            }
        });

        // Update image if provided
        const file = formData.get('image') as File | null;
        if (file) {
            // Delete old image
            await deleteFromCloudinary(member.image.cloudinaryId);
            
            // Upload new image
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploadResult = await uploadBuffer(buffer, file.type, 'team-profiles');
            
            member.image = {
                url: uploadResult.secure_url,
                cloudinaryId: uploadResult.public_id
            };
        }

        await member.save();

        // ── Privileged Action Notification ──────────────────────────────
        if (currentUser && isPrivileged(currentUser)) {
            await createManagerNotification(
                currentUser._id.toString(),
                currentUser.name,
                'updated team member',
                member.name
            );
        }
        return NextResponse.json(member);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const currentUser = await getCurrentUser(req);
        const { id } = await params;
        await connectDB();
        const member = await TeamMember.findById(id);
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        // Delete image from Cloudinary
        await deleteFromCloudinary(member.image.cloudinaryId);
        
        const memberName = member.name;
        await TeamMember.findByIdAndDelete(id);

        // ── Privileged Action Notification ──────────────────────────────
        if (currentUser && isPrivileged(currentUser)) {
            await createManagerNotification(
                currentUser._id.toString(),
                currentUser.name,
                'deleted team member',
                memberName
            );
        }
        return NextResponse.json({ message: 'Member deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
