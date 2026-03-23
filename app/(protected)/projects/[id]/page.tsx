// app/dashboard/projects/[id]/page.tsx
'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    ChevronRight, Loader2, Building2,
    Image as ImageIcon, FileText, LayoutGrid,
    MapPin, ListChecks, DollarSign, Sparkles,
    Camera, Download, Play, Info,
} from 'lucide-react';
import { getProject } from '@/lib/projectApi';
import type { ProjectDoc } from '@/types/project';

// Section components (imported below)
import ProjectBasicSection from '@/components/projects/sections/ProjectBasicSection';
import HeroImagesSection from '@/components/projects/sections/HeroImagesSection';
import ShortIntroSection from '@/components/projects/sections/ShortIntroSection';
import FloorPlansSection from '@/components/projects/sections/FloorPlansSection';
import LayoutPlanSection from '@/components/projects/sections/LayoutPlanSection';
import CommonSpecsSection from '@/components/projects/sections/CommonSpecsSection';
import CommercialSpecsSection from '@/components/projects/sections/CommercialSpecsSection';
import AmenitiesSection from '@/components/projects/sections/AmenitiesSection';
import SampleHouseSection from '@/components/projects/sections/SampleHouseSection';
import BrochureSection from '@/components/projects/sections/BrochureSection';
import VirtualTourSection from '@/components/projects/sections/VirtualTourSection';

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabKey =
    | 'basic' | 'hero' | 'intro' | 'floorPlans' | 'layoutPlan'
    | 'commonSpecs' | 'commercialSpecs' | 'amenities'
    | 'sampleHouse' | 'brochure' | 'virtualTour';

interface Tab {
    key: TabKey;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: string;
}

const TABS: Tab[] = [
    { key: 'basic', label: '① Title & Info', shortLabel: 'Title', icon: <Info size={14} /> },
    { key: 'hero', label: '② Hero Images', shortLabel: 'Hero', icon: <ImageIcon size={14} /> },
    { key: 'intro', label: '③ Short Intro', shortLabel: 'Intro', icon: <FileText size={14} /> },
    { key: 'floorPlans', label: '④ Floor Plans', shortLabel: 'Floor', icon: <LayoutGrid size={14} /> },
    { key: 'layoutPlan', label: '⑤ Layout Plan', shortLabel: 'Layout', icon: <MapPin size={14} /> },
    { key: 'commonSpecs', label: '⑥ Common Specs', shortLabel: 'Com.Spec', icon: <ListChecks size={14} /> },
    { key: 'commercialSpecs', label: '⑦ Commercial Specs', shortLabel: 'Com.Spec²', icon: <DollarSign size={14} /> },
    { key: 'amenities', label: '⑧ Amenities', shortLabel: 'Amenities', icon: <Sparkles size={14} /> },
    { key: 'sampleHouse', label: '⑨ Sample House Photos', shortLabel: 'Photos', icon: <Camera size={14} /> },
    { key: 'brochure', label: '⑩ Download Brochure', shortLabel: 'Brochure', icon: <Download size={14} /> },
    { key: 'virtualTour', label: '⑪ Virtual Tour', shortLabel: 'VTour', icon: <Play size={14} /> },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectAdminPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [project, setProject] = useState<ProjectDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>('basic');

    useEffect(() => {
        getProject(id)
            .then(setProject)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-400">Loading project…</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Building2 size={40} className="text-slate-300" />
                <p className="text-slate-500 font-medium">Project not found</p>
                <Link href="/dashboard/projects" className="text-sm text-indigo-500 hover:underline">← Back to Projects</Link>
            </div>
        );
    }

    const renderSection = () => {
        const props = { project, onUpdate: setProject };
        switch (tab) {
            case 'basic': return <ProjectBasicSection    {...props} />;
            case 'hero': return <HeroImagesSection      {...props} />;
            case 'intro': return <ShortIntroSection      {...props} />;
            case 'floorPlans': return <FloorPlansSection      {...props} />;
            case 'layoutPlan': return <LayoutPlanSection      {...props} />;
            case 'commonSpecs': return <CommonSpecsSection     {...props} />;
            case 'commercialSpecs': return <CommercialSpecsSection {...props} />;
            case 'amenities': return <AmenitiesSection       {...props} />;
            case 'sampleHouse': return <SampleHouseSection     {...props} />;
            case 'brochure': return <BrochureSection        {...props} />;
            case 'virtualTour': return <VirtualTourSection     {...props} />;
        }
    };

    return (
        <div>
            {/* Page header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <Link href="/dashboard/projects" className="hover:text-slate-600 transition-colors">Projects</Link>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold truncate max-w-[200px]">{project.title}</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{project.title}</h1>
                        {project.headline && <p className="text-sm text-slate-400 mt-0.5">{project.headline}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border mt-1 shrink-0
            ${project.status === 'ongoing' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            project.status === 'completed' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                'bg-sky-50 text-sky-600 border-sky-100'}`}
                    >
                        {project.status ?? 'upcoming'}
                    </span>
                </div>

                {/* Tabs — horizontal scroll on mobile */}
                <div className="flex items-center gap-0.5 mt-5 overflow-x-auto pb-0 scrollbar-none">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0
                ${tab === t.key
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                        >
                            {t.icon}
                            <span className="hidden sm:inline">{t.label}</span>
                            <span className="sm:hidden">{t.shortLabel}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
                {renderSection()}
            </div>
        </div>
    );
}