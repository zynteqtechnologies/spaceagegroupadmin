// app/(protected)/media/new/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronRight, Loader2, Save, X,
    Building2, Video, FileText, CheckCircle2,
    CloudUpload, Trash2, Tag, AlignLeft, Youtube, Link as LinkIcon
} from 'lucide-react';
import { listProjectsWithMedia, createMedia } from '@/lib/mediaApi';
import type { ProjectDoc, MediaItem } from '@/types/project';

interface NewItemPreview {
    file: File | null;
    externalUrl?: string;
    previewUrl: string;
    title: string;
    alt: string;
    description: string;
    category: 'image' | 'video' | 'brochure' | 'flyer' | 'other';
    isMainImage: boolean;
    order: number;
    mediaType: 'image' | 'video' | 'document';
    provider: 'cloudinary' | 'youtube';
}

interface SelectableMedia extends MediaItem {
    selectionId: string;
}

export default function NewMediaPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<ProjectDoc[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<ProjectDoc | null>(null);

    // Existing media from project
    const [projectMedia, setProjectMedia] = useState<SelectableMedia[]>([]);
    const [selectedExistingIds, setSelectedExistingIds] = useState<Set<string>>(new Set());

    // New uploads & Externals
    const [newItems, setNewItems] = useState<NewItemPreview[]>([]);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        listProjectsWithMedia()
            .then(setProjects)
            .catch(console.error)
            .finally(() => setLoadingProjects(false));
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            const project = projects.find(p => p._id === selectedProjectId);
            if (project) {
                setSelectedProject(project);
                const allMedia: SelectableMedia[] = [
                    ...(project.heroImages || []).map(m => ({ ...m, selectionId: m._id || `hero-${m.cloudinaryId}`, isInProjects: true })),
                    ...(project.floorPlans || []).map(m => ({ ...m, selectionId: m._id || `fp-${m.cloudinaryId}`, isInProjects: true })),
                    ...(project.layoutPlan?.url ? [{ ...project.layoutPlan, selectionId: project.layoutPlan._id || `layout-${project.layoutPlan.cloudinaryId}`, isInProjects: true }] : []),
                    ...(project.sampleHousePhotos || []).map(m => ({ ...m, selectionId: m._id || `sample-${m.cloudinaryId}`, isInProjects: true })),
                    ...(project.brochure?.url ? [{
                        url: project.brochure.url,
                        cloudinaryId: project.brochure.cloudinaryId,
                        title: project.brochure.fileName || 'Brochure',
                        mediaType: 'document' as const,
                        category: 'brochure' as const,
                        selectionId: project.brochure.cloudinaryId || 'brochure-static-id',
                        isInProjects: true
                    } as any] : [])
                ];
                setProjectMedia(allMedia);
                setSelectedExistingIds(new Set());
            }
        } else {
            setSelectedProject(null);
            setProjectMedia([]);
        }
    }, [selectedProjectId, projects]);

    const toggleExistingSelection = (id: string) => {
        setSelectedExistingIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        const previews = files.map((file, i) => {
            const isVideo = file.type.startsWith('video/');
            const isPdf = file.type === 'application/pdf';
            return {
                file,
                previewUrl: URL.createObjectURL(file),
                title: file.name.replace(/\.[^/.]+$/, ''),
                alt: '',
                description: '',
                category: (isVideo ? 'video' : isPdf ? 'brochure' : 'image') as any,
                isMainImage: false,
                order: newItems.length + i,
                mediaType: (isVideo ? 'video' : isPdf ? 'document' : 'image') as any,
                provider: 'cloudinary' as const
            };
        });
        setNewItems(prev => [...prev, ...previews]);
    };

    const addYoutubeVideo = () => {
        const videoId = extractYoutubeId(youtubeUrl);
        if (!videoId) {
            setError('Invalid YouTube URL');
            return;
        }
        const newItem: NewItemPreview = {
            file: null,
            externalUrl: youtubeUrl,
            previewUrl: `https://img.youtube.com/vi/${videoId}/0.jpg`,
            title: 'YouTube Video',
            alt: 'YouTube Video',
            description: '',
            category: 'video',
            isMainImage: false,
            order: newItems.length,
            mediaType: 'video',
            provider: 'youtube'
        };
        setNewItems(prev => [...prev, newItem]);
        setYoutubeUrl('');
        setError(null);
    };

    const extractYoutubeId = (url: string) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : false;
    };

    const updateNewItem = (index: number, patch: Partial<NewItemPreview>) => {
        setNewItems(prev => prev.map((f, i) => i === index ? { ...f, ...patch } : f));
    };

    const removeNewItem = (index: number) => {
        setNewItems(prev => {
            if (prev[index].file) URL.revokeObjectURL(prev[index].previewUrl);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async () => {
        if (!selectedProjectId || !title.trim()) {
            setError('Please select a project and enter a title.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const existingToSave = projectMedia
                .filter(m => selectedExistingIds.has(m.selectionId))
                .map(m => {
                    const { selectionId, ...rest } = m;
                    if (rest._id && typeof rest._id === 'string' && !/^[0-9a-fA-F]{24}$/.test(rest._id)) {
                        delete rest._id;
                    }
                    rest.isInProjects = true;
                    return rest;
                });

            const filesToUpload = newItems.filter(p => !!p.file).map(p => p.file!);
            const newDetails = newItems.map(p => ({
                title: p.title,
                alt: p.alt,
                description: p.description,
                category: p.category,
                mediaType: p.mediaType,
                isMainImage: p.isMainImage,
                order: p.order,
                provider: p.provider,
                url: p.provider === 'youtube' ? p.externalUrl : undefined
            }));

            await createMedia(selectedProjectId, title, existingToSave, filesToUpload, newDetails);

            newItems.forEach(p => p.file && URL.revokeObjectURL(p.previewUrl));
            router.push('/media');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create media collection');
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-20">
            {/* ── Page Header ────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 mb-8">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <span className="hover:text-slate-600 cursor-pointer transition-colors" onClick={() => router.push('/dashboard')}>Dashboard</span>
                    <ChevronRight size={12} />
                    <span className="hover:text-slate-600 cursor-pointer transition-colors" onClick={() => router.push('/media')}>Media</span>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold">New Collection</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Create Media Collection</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Combine existing assets with new uploads or video links</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !selectedProjectId || !title.trim()}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm hover:shadow-md"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Collection</>}
                    </button>
                </div>
            </div>

            <div className="px-8 mx-auto space-y-8">
                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <X size={16} className="shrink-0" />
                        {error}
                    </div>
                )}

                {/* ── Section 1: Basic Info ────────────────────────────────────── */}
                <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Project *</label>
                            <div className="relative">
                                {loadingProjects ? (
                                    <div className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50 flex items-center gap-2 text-slate-400 text-sm">
                                        <Loader2 size={14} className="animate-spin" /> Loading projects…
                                    </div>
                                ) : (
                                    <select
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all bg-white appearance-none cursor-pointer"
                                    >
                                        <option value="">Choose a project</option>
                                        {projects.map(p => (
                                            <option key={p._id} value={p._id}>{p.title}</option>
                                        ))}
                                    </select>
                                )}
                                <Building2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Collection Title *</label>
                            <input
                                type="text"
                                placeholder="e.g. Marketing Brochure & Site Photos"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Section 2: Assets Integration ────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Existing Media Selector */}
                    <section className={`bg-white rounded-xl border border-slate-100 shadow-sm p-6 transition-all ${!selectedProjectId ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                                Select Existing Media
                            </h2>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full uppercase">
                                {selectedExistingIds.size} Selected
                            </span>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {!selectedProjectId ? (
                                <div className="py-10 text-center text-slate-400 text-[11px] border border-dashed border-slate-100 rounded-xl">
                                    Select a project first
                                </div>
                            ) : projectMedia.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 text-[11px] border border-dashed border-slate-100 rounded-xl">
                                    No media found in this project
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {projectMedia.map((media) => {
                                        const id = media.selectionId;
                                        const isSelected = selectedExistingIds.has(id);
                                        return (
                                            <div
                                                key={id}
                                                onClick={() => toggleExistingSelection(id)}
                                                className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all
                                                    ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
                                            >
                                                {media.mediaType === 'video' ? (
                                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                        <Video size={14} className="text-white/50" />
                                                    </div>
                                                ) : media.mediaType === 'document' ? (
                                                    <div className="w-full h-full bg-rose-50 flex items-center justify-center">
                                                        <FileText size={14} className="text-rose-400" />
                                                    </div>
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={media.url} alt={media.title} className="w-full h-full object-cover" />
                                                )}
                                                {isSelected && (
                                                    <div className="absolute top-0.5 right-0.5">
                                                        <CheckCircle2 size={12} className="text-indigo-500 fill-white" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* New Uploads & YouTube */}
                    <section className={`bg-white rounded-xl border border-slate-100 shadow-sm p-6 transition-all ${!selectedProjectId ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                            Add New Media
                        </h2>

                        <div className="space-y-4">
                            {/* File Upload Trigger */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex items-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                    <CloudUpload className="text-slate-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700">Upload Media Files</p>
                                    <p className="text-[10px] text-slate-400">Images, Videos, or Documents</p>
                                </div>
                                <input
                                    type="file" multiple className="hidden" ref={fileInputRef}
                                    onChange={handleFileChange} accept="image/*,video/*,.pdf"
                                />
                            </div>

                            {/* YouTube URL Input */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Youtube className="text-rose-500" size={16} />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connect YouTube Video</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder="Paste YouTube link here..."
                                            value={youtubeUrl}
                                            onChange={(e) => setYoutubeUrl(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-rose-400 transition-all font-medium"
                                        />
                                        <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    </div>
                                    <button
                                        onClick={addYoutubeVideo}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── Section 4: Items Management ──────────────────────────────── */}
                {newItems.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                            Recently Added Assets ({newItems.length})
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {newItems.map((p, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                                            {p.provider === 'youtube' && (
                                                <div className="absolute top-1 left-1 z-10 bg-rose-500 text-white p-1 rounded-md shadow-sm">
                                                    <Youtube size={12} />
                                                </div>
                                            )}
                                            {p.mediaType === 'video' && p.provider === 'cloudinary' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                    <Video size={24} className="text-white/50" />
                                                </div>
                                            ) : p.mediaType === 'document' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-rose-50">
                                                    <FileText size={24} className="text-rose-500" />
                                                </div>
                                            ) : (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={p.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                <Tag size={10} /> Asset Title
                                            </div>
                                            <input
                                                type="text"
                                                value={p.title}
                                                onChange={(e) => updateNewItem(i, { title: e.target.value })}
                                                className="w-full border border-slate-100 bg-slate-50 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-400 focus:bg-white transition-all font-semibold"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                <Tag size={10} /> Category
                                            </div>
                                            <select
                                                value={p.category}
                                                onChange={(e) => updateNewItem(i, { category: e.target.value as any })}
                                                className="w-full border border-slate-100 bg-slate-50 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-400 focus:bg-white transition-all font-semibold cursor-pointer appearance-none"
                                            >
                                                <option value="image">Image</option>
                                                <option value="video">Video</option>
                                                <option value="brochure">Brochure</option>
                                                <option value="flyer">Flyer</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                <AlignLeft size={10} /> Description
                                            </div>
                                            <div className="relative h-[41px]">
                                                <input
                                                    type="text"
                                                    placeholder="Add a context..."
                                                    value={p.description}
                                                    onChange={(e) => updateNewItem(i, { description: e.target.value })}
                                                    className="w-full h-full border border-slate-100 bg-slate-50 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium pr-10"
                                                />
                                                <button onClick={() => removeNewItem(i)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-slate-300 hover:text-rose-500 w-7 h-7 flex items-center justify-center rounded-lg shadow-sm border border-slate-100 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
