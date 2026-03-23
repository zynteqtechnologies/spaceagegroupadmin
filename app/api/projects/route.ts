// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';

// ── GET /api/projects ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const filter = status ? { status } : {};

        const projects = await Project.find(filter)
            .select('_id title slug status headline heroImages createdAt updatedAt')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(projects);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[GET /api/projects]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── POST /api/projects ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const { title, slug, status, headline, shortIntro } = body;

        if (!title?.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Generate slug if not provided
        const generatedSlug = slug?.trim()
            ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check uniqueness
        const existing = await Project.findOne({ slug: generatedSlug });
        if (existing) {
            return NextResponse.json(
                { error: `Slug "${generatedSlug}" already exists. Choose a different title or slug.` },
                { status: 409 }
            );
        }

        const project = await Project.create({
            title: title.trim(),
            slug: generatedSlug,
            status: status ?? 'upcoming',
            headline: headline?.trim() ?? '',
            shortIntro: shortIntro?.trim() ?? '',
        });

        return NextResponse.json(
            { message: 'Project created successfully', project },
            { status: 201 }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error';
        console.error('[POST /api/projects]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}