// app/dashboard/projects/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Building2, ChevronRight, Loader2, Trash2, Eye, Pencil, ImageIcon, Film, LayoutGrid } from 'lucide-react';
import { listProjects, createProject, deleteProject } from '@/lib/projectApi';
import type { ProjectDoc, ProjectStatus } from '@/types/project';

const STATUS_COLORS: Record<ProjectStatus, string> = {
    upcoming: 'bg-sky-50 text-sky-600 border-sky-100',
    ongoing: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    completed: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_DOT: Record<ProjectStatus, string> = {
    upcoming: 'bg-sky-400',
    ongoing: 'bg-emerald-400',
    completed: 'bg-slate-400',
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [tab, setTab] = useState<'all' | 'create'>('all');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: '', headline: '', status: 'upcoming' as ProjectStatus, shortIntro: '',
    });

    useEffect(() => {
        listProjects()
            .then(setProjects)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        if (!form.title.trim()) return;
        setCreating(true);
        try {
            const project = await createProject(form);
            setProjects((prev) => [project, ...prev]);
            setTab('all');
            setForm({ title: '', headline: '', status: 'upcoming', shortIntro: '' });
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Create failed');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete project "${title}"? This will remove all media from Cloudinary.`)) return;
        setDeletingId(id);
        try {
            await deleteProject(id);
            setProjects((prev) => prev.filter((p) => p._id !== id));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading…</p>
            </div>
        );
    }

    return (
        <div>
            {/* ── Page header — white, clean ──────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <span className="hover:text-slate-600 cursor-pointer transition-colors">Dashboard</span>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold">Projects</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    {/* Title */}
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Projects</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage all real estate projects</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#f9fbfd] rounded-sm border border-gray-200 shadow-sm px-3.5 py-2">
                            <Building2 size={14} className="text-black" />
                            <span className="text-xs font-bold text-black">{projects.length} Total</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mt-5">
                    {[
                        { key: 'all' as const, label: 'All Projects', icon: <LayoutGrid size={14} />, count: projects.length },
                        { key: 'create' as const, label: 'Create', icon: <Plus size={14} /> },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all
                ${tab === t.key
                                    ? 'bg-slate-900 text-white shadow-sm rounded-sm'
                                    : 'text-slate-500 hover:text-slate-800 bg-[#f9fbfd] rounded-sm border border-gray-200 hover:bg-slate-50'
                                }`}
                        >
                            {t.icon}
                            {t.label}
                            {t.count !== undefined && t.count > 0 && (
                                <span className={`text-[12px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                  ${tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-6 bg-[#f9fbfd] min-h-[calc(100vh-140px)]">

                {/* Create form */}
                {tab === 'create' && (
                    <div className="bg-white border border-slate-100 shadow-sm p-6 space-y-4 max-w-3xl">
                        <h2 className="text-base font-bold text-slate-800">Create New Project</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Project Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Space Age Residency Phase 2"
                                    value={form.title}
                                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Headline</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Luxury 2 & 3 BHK in Vadodara"
                                    value={form.headline}
                                    onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ProjectStatus }))}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                >
                                    <option value="upcoming">Upcoming</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Short Intro</label>
                                <textarea
                                    placeholder="Brief description of the project…"
                                    value={form.shortIntro}
                                    rows={2}
                                    onChange={(e) => setForm((p) => ({ ...p, shortIntro: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <button
                                onClick={handleCreate}
                                disabled={creating || !form.title.trim()}
                                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            >
                                {creating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Building2 size={14} /> Create Project</>}
                            </button>
                            <button
                                onClick={() => setTab('all')}
                                className="text-sm text-slate-400 hover:text-slate-600 font-medium px-3 py-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Projects grid */}
                {tab === 'all' && projects.length === 0 && (
                    <div className="bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                                <Building2 size={28} className="text-slate-300" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-700 mb-1">No projects yet</p>
                            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                                Create your first project to get started
                            </p>
                        </div>
                        <button
                            onClick={() => setTab('create')}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <Plus size={15} /> New Project
                        </button>
                    </div>
                )}

                {tab === 'all' && projects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {projects.map((project) => {
                            const status = (project.status ?? 'upcoming') as ProjectStatus;
                            const imgCount = project.heroImages?.filter(i => i.mediaType !== 'video').length ?? 0;
                            const vidCount = project.heroImages?.filter(i => i.mediaType === 'video').length ?? 0;
                            const mainImg = project.heroImages?.find(i => i.isMainImage) ?? project.heroImages?.[0];

                            return (
                                <div key={project._id} className="group bg-white border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200 transition-all relative">
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                        {mainImg?.url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={mainImg.url} alt={mainImg.alt ?? project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Building2 size={32} className="text-slate-300" />
                                            </div>
                                        )}
                                        {/* Status badge */}
                                        <span className={`absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[status]}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{project.title}</h3>
                                        {project.headline && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{project.headline}</p>}

                                        {/* Media counts */}
                                        <div className="flex items-center gap-2 mt-3">
                                            {imgCount > 0 && (
                                                <span className="flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-500 font-semibold px-2 py-0.5 rounded-md">
                                                    <ImageIcon size={10} /> {imgCount}
                                                </span>
                                            )}
                                            {vidCount > 0 && (
                                                <span className="flex items-center gap-1 text-[11px] bg-violet-50 text-violet-500 font-semibold px-2 py-0.5 rounded-md">
                                                    <Film size={10} /> {vidCount}
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <Link
                                                href={`/projects/${project._id}`}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-sm transition-all"
                                            >
                                                <Pencil size={11} /> Manage
                                            </Link>
                                            <Link
                                                href={`/projects/${project.slug}`}
                                                target="_blank"
                                                className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-semibold py-2 px-3 rounded-sm transition-all border border-slate-200"
                                            >
                                                <Eye size={11} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(project._id, project.title)}
                                                disabled={deletingId === project._id}
                                                className="flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-500 text-xs font-semibold py-2 px-3 rounded-sm transition-all border border-rose-100"
                                            >
                                                {deletingId === project._id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}