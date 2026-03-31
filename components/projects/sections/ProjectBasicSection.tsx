// components/projects/sections/ProjectBasicSection.tsx
'use client';
import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { updateProjectBasic } from '@/lib/projectApi';
import type { ProjectDoc, ProjectStatus } from '@/types/project';

interface Props { project: ProjectDoc; onUpdate: (doc: ProjectDoc) => void; }

export default function ProjectBasicSection({ project, onUpdate }: Props) {
    const [form, setForm] = useState({
        title: project.title,
        headline: project.headline ?? '',
        status: project.status ?? 'upcoming',
        slug: project.slug,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await updateProjectBasic(project._id, form);
            onUpdate(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-5 w-full">
            <div>
                <h2 className="text-base font-bold text-slate-800">Title & Basic Info</h2>
                <p className="text-xs text-slate-400 mt-0.5">Core project identity — name, headline, and status</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Project Title *</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                    />
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Headline</label>
                    <input
                        type="text"
                        placeholder="e.g. Luxury 2 & 3 BHK in Vadodara"
                        value={form.headline}
                        onChange={(e) => setForm(p => ({ ...p, headline: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm(p => ({ ...p, status: e.target.value as ProjectStatus }))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                        >
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Slug (URL)</label>
                        <input
                            type="text"
                            value={form.slug}
                            onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all font-mono text-xs"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 font-semibold py-2.5 px-6 rounded-xl text-sm transition-all
          ${saved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                    } disabled:opacity-60`}
            >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
                    saved ? '✓ Saved!' :
                        <><Save size={14} /> Save Changes</>}
            </button>
        </div>
    );
}