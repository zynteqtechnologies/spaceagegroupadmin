// components/projects/sections/FloorPlansSection.tsx
'use client';
import { useRef, useState, DragEvent } from 'react';
import { CloudUpload, X, Loader2, Trash2, RotateCcw, Plus, ArrowUpCircle, LayoutGrid } from 'lucide-react';
import { uploadFloorPlans, updateFloorPlans } from '@/lib/projectApi';
import type { ProjectDoc, FloorPlanItem, FloorPlanPreview, NewFloorPlanDetail } from '@/types/project';

interface Props { project: ProjectDoc; onUpdate: (doc: ProjectDoc) => void; }

export default function FloorPlansSection({ project, onUpdate }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [previews, setPreviews] = useState<FloorPlanPreview[]>([]);
    const [deletions, setDeletions] = useState<Set<string>>(new Set());
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addFiles = (list: FileList | File[]) => {
        const files = Array.from(list).filter(f => f.type.startsWith('image/'));
        setPreviews(prev => [
            ...prev,
            ...files.map((file, i) => ({
                file,
                previewUrl: URL.createObjectURL(file),
                title: file.name.replace(/\.[^/.]+$/, ''),
                alt: '', bhkType: '', carpetArea: '',
                order: prev.length + i,
            })),
        ]);
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); setDragging(false);
        if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    };

    const updatePreview = (i: number, patch: Partial<FloorPlanPreview>) =>
        setPreviews(prev => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p));

    const removePreview = (i: number) => {
        setPreviews(prev => { URL.revokeObjectURL(prev[i].previewUrl); return prev.filter((_, idx) => idx !== i); });
    };

    const toggleDeletion = (id: string) =>
        setDeletions(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const submit = async () => {
        setUploading(true); setError(null);
        try {
            const newDetails: NewFloorPlanDetail[] = previews.map(p => ({
                title: p.title, alt: p.alt, bhkType: p.bhkType, carpetArea: p.carpetArea, order: p.order,
            }));

            let updated: ProjectDoc;
            if (project.floorPlans.length > 0 || deletions.size > 0) {
                const existingDetails: (FloorPlanItem & { markedForDeletion?: boolean })[] = project.floorPlans.map(fp => ({
                    ...fp, markedForDeletion: fp._id ? deletions.has(fp._id) : false,
                }));
                updated = await updateFloorPlans(project._id, previews.map(p => p.file), [...existingDetails, ...newDetails]);
            } else {
                updated = await uploadFloorPlans(project._id, previews.map(p => p.file), newDetails);
            }

            onUpdate(updated);
            previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
            setPreviews([]); setDeletions(new Set());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const existing = project.floorPlans ?? [];

    return (
        <div className="space-y-5 max-w-3xl">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h2 className="text-base font-bold text-slate-800 mb-1">Floor Plans</h2>
                <p className="text-xs text-slate-400 mb-4">Upload floor plan images for each unit type (2BHK, 3BHK, etc.)</p>

                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all
            ${dragging ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10'}`}
                >
                    <div className="flex flex-col items-center py-10 gap-2">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${dragging ? 'bg-indigo-500' : 'bg-slate-50 border border-slate-200'}`}>
                            <LayoutGrid size={20} className={dragging ? 'text-white' : 'text-slate-400'} />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">{dragging ? 'Drop floor plans' : 'Upload floor plan images'}</p>
                    </div>
                    <input ref={inputRef} type="file" multiple accept="image/*" className="hidden"
                        onChange={e => e.target.files && addFiles(e.target.files)} />
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-600 text-sm px-4 py-3 rounded-xl mt-3">
                        <X size={14} /> {error}
                    </div>
                )}
            </div>

            {/* Existing floor plans */}
            {existing.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">Current Floor Plans ({existing.length})</p>
                        {deletions.size > 0 && (
                            <span className="text-xs bg-rose-50 text-rose-500 border border-rose-100 px-2.5 py-1 rounded-full font-semibold">
                                {deletions.size} for deletion
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                        {existing.map((fp) => {
                            const isDeleted = fp._id ? deletions.has(fp._id) : false;
                            return (
                                <div key={fp._id}
                                    className={`group relative rounded-xl overflow-hidden border border-slate-100 transition-all ${isDeleted ? 'opacity-40 ring-2 ring-rose-400' : ''}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={fp.url} alt={fp.alt ?? fp.title} className="w-full aspect-video object-contain bg-slate-50" />
                                    <div className="p-2.5">
                                        <p className="text-xs font-semibold text-slate-700 truncate">{fp.title}</p>
                                        {fp.bhkType && <p className="text-[10px] text-slate-400">{fp.bhkType} {fp.carpetArea ? `· ${fp.carpetArea}` : ''}</p>}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fp._id && toggleDeletion(fp._id)}
                                        className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center transition-all
                      ${isDeleted ? 'bg-slate-700 text-white opacity-100' : 'bg-white/90 text-rose-400 opacity-0 group-hover:opacity-100'}`}
                                    >
                                        {isDeleted ? <RotateCcw size={9} /> : <Trash2 size={9} />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* New previews */}
            {previews.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">New Floor Plans ({previews.length})</p>
                        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-semibold">
                            <Plus size={11} /> Add More
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                        {previews.map((p, i) => (
                            <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                                <div className="relative aspect-video bg-slate-50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.previewUrl} alt={p.title} className="w-full h-full object-contain" />
                                    <button type="button" onClick={() => removePreview(i)}
                                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-lg flex items-center justify-center hover:bg-rose-500">
                                        <X size={12} />
                                    </button>
                                </div>
                                <div className="p-3 space-y-2">
                                    <input type="text" placeholder="Title *" value={p.title} onChange={e => updatePreview(i, { title: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" placeholder="BHK Type (e.g. 2BHK)" value={p.bhkType} onChange={e => updatePreview(i, { bhkType: e.target.value })}
                                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                                        <input type="text" placeholder="Carpet Area (sq ft)" value={p.carpetArea} onChange={e => updatePreview(i, { carpetArea: e.target.value })}
                                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={submit}
                    disabled={uploading || (previews.length === 0 && deletions.size === 0)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow-md shadow-indigo-100 transition-all"
                >
                    {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><ArrowUpCircle size={14} /> Save Floor Plans</>}
                </button>
            </div>
        </div>
    );
}