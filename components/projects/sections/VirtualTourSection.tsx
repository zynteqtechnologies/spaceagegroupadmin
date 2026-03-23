// components/projects/sections/VirtualTourSection.tsx
'use client';
import { useState } from 'react';
import { Loader2, Save, Trash2, Play, ExternalLink } from 'lucide-react';
import { updateVirtualTour, deleteVirtualTour } from '@/lib/projectApi';
import type { ProjectDoc, VirtualTour, VirtualTourType } from '@/types/project';

interface Props { project: ProjectDoc; onUpdate: (doc: ProjectDoc) => void; }

const TOUR_TYPES: { value: VirtualTourType; label: string; hint: string }[] = [
    { value: 'matterport', label: 'Matterport', hint: 'https://my.matterport.com/show/?m=...' },
    { value: 'youtube', label: 'YouTube', hint: 'https://www.youtube.com/embed/...' },
    { value: 'custom', label: 'Custom iframe', hint: 'Any iframe-embeddable URL' },
    { value: 'other', label: 'Other', hint: 'Direct embed URL' },
];

function extractYouTubeEmbed(url: string): string {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
}

export default function VirtualTourSection({ project, onUpdate }: Props) {
    const existing = project.virtualTour;
    const [form, setForm] = useState<VirtualTour>({
        embedUrl: existing?.embedUrl ?? '',
        type: existing?.type ?? 'youtube',
        thumbnailUrl: existing?.thumbnailUrl ?? '',
        description: existing?.description ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [preview, setPreview] = useState(false);

    const processUrl = (url: string, type: VirtualTourType) => {
        if (type === 'youtube') return extractYouTubeEmbed(url);
        return url;
    };

    const handleSave = async () => {
        if (!form.embedUrl?.trim()) return;
        setSaving(true);
        try {
            const toSave: VirtualTour = {
                ...form,
                embedUrl: processUrl(form.embedUrl ?? '', form.type ?? 'youtube'),
            };
            const updated = await updateVirtualTour(project._id, toSave);
            onUpdate(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Remove virtual tour?')) return;
        setDeleting(true);
        try {
            const updated = await deleteVirtualTour(project._id);
            onUpdate(updated);
            setForm({ embedUrl: '', type: 'youtube', thumbnailUrl: '', description: '' });
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const embedUrl = form.embedUrl?.trim();
    const canPreview = !!embedUrl;

    return (
        <div className="space-y-5 max-w-2xl">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div>
                    <h2 className="text-base font-bold text-slate-800">Virtual Tour</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Embed a 360° tour, Matterport, or YouTube walkthrough</p>
                </div>

                {/* Type selector */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Tour Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {TOUR_TYPES.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setForm(p => ({ ...p, type: t.value }))}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                  ${form.type === t.value
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                        {TOUR_TYPES.find(t => t.value === form.type)?.hint}
                    </p>
                </div>

                {/* Embed URL */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                        {form.type === 'youtube' ? 'YouTube URL or Embed URL' : 'Embed URL'}
                    </label>
                    <input
                        type="url"
                        placeholder={TOUR_TYPES.find(t => t.value === form.type)?.hint}
                        value={form.embedUrl ?? ''}
                        onChange={e => setForm(p => ({ ...p, embedUrl: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all font-mono text-xs"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Description (optional)</label>
                    <textarea
                        placeholder="Brief description of the virtual tour…"
                        value={form.description ?? ''}
                        rows={2}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || !embedUrl}
                        className={`flex items-center gap-2 font-semibold py-2.5 px-6 rounded-xl text-sm transition-all
              ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'} disabled:opacity-50`}
                    >
                        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
                            saved ? '✓ Saved!' :
                                <><Save size={14} /> Save Tour</>}
                    </button>

                    {canPreview && (
                        <button
                            type="button"
                            onClick={() => setPreview(p => !p)}
                            className="flex items-center gap-2 text-sm text-indigo-500 bg-indigo-50 hover:bg-indigo-100 font-semibold px-4 py-2.5 rounded-xl transition-all"
                        >
                            <Play size={13} /> {preview ? 'Hide' : 'Preview'}
                        </button>
                    )}

                    {existing?.embedUrl && (
                        <>
                            <a
                                href={existing.embedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 font-semibold px-4 py-2.5 rounded-xl transition-all border border-slate-200"
                            >
                                <ExternalLink size={13} /> Open
                            </a>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex items-center gap-2 text-sm text-rose-400 bg-rose-50 hover:bg-rose-100 font-semibold px-4 py-2.5 rounded-xl transition-all border border-rose-100"
                            >
                                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                Remove
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Preview iframe */}
            {preview && embedUrl && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-700">Preview</p>
                        <button onClick={() => setPreview(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                    </div>
                    <div className="relative aspect-video bg-slate-900">
                        <iframe
                            src={processUrl(embedUrl, form.type ?? 'youtube')}
                            className="w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title="Virtual Tour Preview"
                        />
                    </div>
                </div>
            )}

            {/* Current tour info */}
            {existing?.embedUrl && !preview && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Current Tour</p>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center shrink-0">
                            <Play size={16} className="text-violet-500" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-600 capitalize">{existing.type ?? 'Virtual Tour'}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-sm">{existing.embedUrl}</p>
                            {existing.description && <p className="text-xs text-slate-500 mt-1">{existing.description}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}