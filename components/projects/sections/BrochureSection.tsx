// components/projects/sections/BrochureSection.tsx
'use client';
import { useRef, useState, DragEvent } from 'react';
import { FileText, X, Loader2, Trash2, Download, CloudUpload } from 'lucide-react';
import { uploadBrochure, deleteBrochure } from '@/lib/projectApi';
import type { ProjectDoc } from '@/types/project';

interface Props { project: ProjectDoc; onUpdate: (doc: ProjectDoc) => void; }

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function BrochureSection({ project, onUpdate }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = (f: File) => {
        if (f.type !== 'application/pdf') { setError('Only PDF files are allowed'); return; }
        if (f.size > 20 * 1024 * 1024) { setError('PDF must be under 20MB'); return; }
        setFile(f); setError(null);
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true); setError(null);
        try {
            const updated = await uploadBrochure(project._id, file);
            onUpdate(updated); setFile(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Remove brochure?')) return;
        setDeleting(true);
        try {
            const updated = await deleteBrochure(project._id);
            onUpdate(updated);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const existing = project.brochure;

    return (
        <div className="space-y-5 w-full">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div>
                    <h2 className="text-base font-bold text-slate-800">Download Brochure</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Upload a PDF brochure that visitors can download</p>
                </div>

                {/* Existing brochure */}
                {existing?.url && (
                    <div className="flex items-center gap-4 bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
                        <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={18} className="text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{existing.fileName ?? 'Brochure.pdf'}</p>
                            {existing.fileSize && <p className="text-xs text-slate-400">{formatBytes(existing.fileSize)}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <a
                                href={existing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <Download size={14} />
                            </a>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="w-8 h-8 bg-rose-50 text-rose-400 hover:bg-rose-100 rounded-lg flex items-center justify-center transition-colors"
                            >
                                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload zone */}
                {!file ? (
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
                                <FileText size={20} className={dragging ? 'text-white' : 'text-slate-400'} />
                            </div>
                            <p className="text-sm font-semibold text-slate-600">
                                {existing?.url ? 'Upload a new brochure (replaces current)' : 'Upload PDF brochure'}
                            </p>
                            <p className="text-xs text-slate-400">PDF only · max 20MB</p>
                        </div>
                        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
                            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    </div>
                ) : (
                    <div className="flex items-center gap-4 bg-indigo-50 rounded-xl border border-indigo-100 px-4 py-3">
                        <div className="w-10 h-10 bg-white border border-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={18} className="text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                            <p className="text-xs text-slate-400">{formatBytes(file.size)} · Ready to upload</p>
                        </div>
                        <button onClick={() => setFile(null)} className="w-7 h-7 bg-white text-slate-400 hover:text-rose-400 rounded-lg flex items-center justify-center border border-slate-200">
                            <X size={12} />
                        </button>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-600 text-sm px-4 py-3 rounded-xl">
                        <X size={14} /> {error}
                    </div>
                )}

                {file && (
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow-md transition-all disabled:opacity-60"
                    >
                        {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><CloudUpload size={14} /> Upload Brochure</>}
                    </button>
                )}
            </div>
        </div>
    );
}