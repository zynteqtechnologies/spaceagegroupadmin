// app/dashboard/projects/[id]/page.tsx
'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    ChevronRight, Loader2, Building2,
    Image as ImageIcon, FileText, LayoutGrid,
    MapPin, ListChecks, DollarSign, Sparkles,
    Camera, Download, Play, Info, Check, CheckCircle2
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
    step: number;
}

const TABS: Tab[] = [
    { key: 'basic', step: 1, label: 'Title & Info', shortLabel: 'Title', icon: <Info size={14} /> },
    { key: 'hero', step: 2, label: 'Hero Images', shortLabel: 'Hero', icon: <ImageIcon size={14} /> },
    { key: 'intro', step: 3, label: 'Short Intro', shortLabel: 'Intro', icon: <FileText size={14} /> },
    { key: 'floorPlans', step: 4, label: 'Floor Plans', shortLabel: 'Floor', icon: <LayoutGrid size={14} /> },
    { key: 'layoutPlan', step: 5, label: 'Layout Plan', shortLabel: 'Layout', icon: <MapPin size={14} /> },
    { key: 'commonSpecs', step: 6, label: 'Common Specs', shortLabel: 'Com.Spec', icon: <ListChecks size={14} /> },
    { key: 'commercialSpecs', step: 7, label: 'Commercial Specs', shortLabel: 'Com.Spec²', icon: <DollarSign size={14} /> },
    { key: 'amenities', step: 8, label: 'Amenities', shortLabel: 'Amenities', icon: <Sparkles size={14} /> },
    { key: 'sampleHouse', step: 9, label: 'Sample House Photos', shortLabel: 'Photos', icon: <Camera size={14} /> },
    { key: 'brochure', step: 10, label: 'Download Brochure', shortLabel: 'Brochure', icon: <Download size={14} /> },
    { key: 'virtualTour', step: 11, label: 'Virtual Tour', shortLabel: 'VTour', icon: <Play size={14} /> },
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

    const progressDetails = {
        basic: !!project.title,
        hero: !!(project.heroImages && project.heroImages.length > 0),
        intro: !!project.shortIntro,
        floorPlans: !!(project.floorPlans && project.floorPlans.length > 0),
        layoutPlan: !!project.layoutPlan,
        commonSpecs: !!(project.commonSpecifications && project.commonSpecifications.length > 0),
        commercialSpecs: !!(project.commercialSpecifications && project.commercialSpecifications.length > 0),
        amenities: !!(project.amenities && project.amenities.length > 0),
        sampleHouse: !!(project.sampleHousePhotos && project.sampleHousePhotos.length > 0),
        brochure: !!project.brochure,
        virtualTour: !!project.virtualTour,
    };

    const progress = (() => {
        const total = 11;
        const completed = Object.values(progressDetails).filter(Boolean).length;
        return { completed, total, percentage: Math.round((completed / total) * 100) };
    })();

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

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{project.title}</h1>
                        {project.headline && <p className="text-sm text-slate-400 mt-0.5">{project.headline}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 w-fit
            ${project.status === 'ongoing' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            project.status === 'completed' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                'bg-sky-50 text-sky-600 border-sky-100'}`}
                    >
                        {project.status ?? 'upcoming'}
                    </span>
                </div>

                {/* Realtime Progress Bar */}
                <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm max-w-full">
                    <div className="flex items-center justify-between text-sm font-bold mb-3">
                        <span className="text-slate-800 flex items-center gap-2">
                            <ListChecks size={16} className="text-blue-500" /> Project Completion Status
                        </span>
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-2">
                        <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mb-4 font-medium">
                        {progress.completed} out of {progress.total} sections are saved and completed
                    </p>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                        {TABS.map(t => {
                            const isDone = progressDetails[t.key as keyof typeof progressDetails];
                            return (
                                <div
                                    key={t.key}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-colors cursor-default
                                        ${isDone
                                            ? 'bg-blue-50/50 border-blue-100 text-blue-700'
                                            : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                    title={t.label}
                                >
                                    {isDone ? <CheckCircle2 size={13} className="text-blue-500" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                                    {t.shortLabel}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tabs — Wrapped in multiple lines */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-8 mt-8 border-b border-slate-200">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`relative flex items-center gap-1.5 pb-3 px-1 text-[13px] font-semibold transition-colors
                                ${tab === t.key
                                    ? 'text-slate-900'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            <span className={`flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-bold shrink-0 transition-colors
                                ${tab === t.key ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {t.step}
                            </span>
                            <span className="hidden sm:inline">{t.label}</span>
                            <span className="sm:hidden">{t.shortLabel}</span>

                            {tab === t.key && (
                                <span className="absolute left-0 right-0 bottom-[-1px] h-[2px] bg-indigo-600" />
                            )}
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