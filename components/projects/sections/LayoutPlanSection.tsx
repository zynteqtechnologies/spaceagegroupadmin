// components/projects/sections/LayoutPlanSection.tsx
'use client';
import { useRef, useState, DragEvent } from 'react';
import { CloudUpload, X, Loader2, Trash2, MapPin } from 'lucide-react';
import { uploadLayoutPlan, deleteLayoutPlan } from '@/lib/projectApi';
import type { ProjectDoc } from '@/types/project';

interface Props { project: ProjectDoc; onUpdate: (doc: ProjectDoc) => void; }

export default function LayoutPlanSection({ project, onUpdate }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [title, setTitle] = useState('Layout Plan');
    const [alt, setAlt] = useState('');
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = (f: File) => {
        if (!f.type.startsWith('image/')) { setError('Only image files allowed'); return; }
        if (preview) URL.revokeObjectURL(preview);
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setError(null);
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true); setError(null);
        try {
            const updated = await uploadLayoutPlan(project._id, file, title, alt);
            onUpdate(updated);
            if (preview) URL.revokeObjectURL(preview);
            setFile(null); setPreview(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Remove layout plan?')) return;
        setDeleting(true);
        try {
            const updated = await deleteLayoutPlan(project._id);
            onUpdate(updated);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const existing = project.layoutPlan;

    return (
        <div className="space-y-5 max-w-2xl">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h2 className="text-base font-bold text-slate-800 mb-1">Layout Plan</h2>
                <p className="text-xs text-slate-400 mb-4">Site/layout plan image showing the entire project layout</p>

                {/* Existing */}
                {existing?.url && (
                    <div className="mb-4 relative rounded-xl overflow-hidden border border-slate-100 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={existing.url} alt={existing.alt ?? existing.title ?? 'Layout Plan'} className="w-full object-contain max-h-72 bg-slate-50" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="absolute top-3 right-3 w-8 h-8 bg-white/90 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-all"
                        >
                            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-lg">
                            {existing.title ?? 'Layout Plan'}
                        </div>
                    </div>
                )}

                {/* Upload zone */}
                {!preview ? (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        onClick={() => inputRef.current?.click()}
                        className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all
              ${dragging ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10'}`}
                    >
                        <div className="flex flex-col items-center py-10 gap-2">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dragging ? 'bg-indigo-500' : 'bg-slate-50 border border-slate-200'}`}>
                                <MapPin size={20} className={dragging ? 'text-white' : 'text-slate-400'} />
                            </div>
                            <p className="text-sm font-semibold text-slate-600">
                                {existing?.url ? 'Upload a new layout plan (replaces current)' : 'Upload layout plan image'}
                            </p>
                        </div>
                        <input ref={inputRef} type="file" accept="image/*" className="hidden"
                            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden border border-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="preview" className="w-full object-contain max-h-64 bg-slate-50" />
                            <button onClick={() => { if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(null); }}
                                className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-lg flex items-center justify-center hover:bg-rose-500">
                                <X size={12} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}
                                className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                            <input type="text" placeholder="Alt text" value={alt} onChange={e => setAlt(e.target.value)}
                                className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-600 text-sm px-4 py-3 rounded-xl mt-3">
                        <X size={14} /> {error}
                    </div>
                )}

                {file && (
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow-md transition-all disabled:opacity-60"
                        >
                            {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><CloudUpload size={14} /> Upload Layout Plan</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}