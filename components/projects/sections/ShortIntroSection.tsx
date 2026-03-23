// components/projects/sections/ShortIntroSection.tsx
'use client';
import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { updateProjectBasic } from '@/lib/projectApi';
import type { ProjectDoc } from '@/types/project';

interface Props { project: ProjectDoc; onUpdate: (doc: ProjectDoc) => void; }

export default function ShortIntroSection({ project, onUpdate }: Props) {
    const [shortIntro, setShortIntro] = useState(project.shortIntro ?? '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await updateProjectBasic(project._id, { shortIntro });
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 max-w-2xl">
            <div>
                <h2 className="text-base font-bold text-slate-800">Short Intro</h2>
                <p className="text-xs text-slate-400 mt-0.5">A brief description shown below the hero section</p>
            </div>

            <textarea
                value={shortIntro}
                onChange={(e) => setShortIntro(e.target.value)}
                rows={6}
                placeholder="Write a compelling short intro for this project…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
            />

            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{shortIntro.length} characters</span>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 font-semibold py-2.5 px-6 rounded-xl text-sm transition-all
            ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'} disabled:opacity-60`}
                >
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
                        saved ? '✓ Saved!' :
                            <><Save size={14} /> Save Intro</>}
                </button>
            </div>
        </div>
    );
}