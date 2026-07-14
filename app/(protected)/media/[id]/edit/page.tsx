// app/(protected)/media/[id]/edit/page.tsx
'use client';
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Loader2, Save, Trash2,
    Tag, Info, ImageIcon, Video, FileText,
    AlertCircle, Youtube, Link as LinkIcon, Plus,
    CloudUpload, X, CheckCircle2, Building2
} from 'lucide-react';
import { getMedia, updateMedia, listProjectsWithMedia } from '@/lib/mediaApi';
import { useModal } from '@/context/ModalContext';
import type { MediaDoc } from '@/types/media';
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
    thumbnail?: string;
    subCategory?: string;
}

interface SelectableMedia extends MediaItem {
    selectionId: string;
}

export default function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [media, setMedia] = useState<MediaDoc | null>(null);
    const [items, setItems] = useState<MediaItem[]>([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Project selection & project media
    const [selectedProject, setSelectedProject] = useState<ProjectDoc | null>(null);
    const [projectMedia, setProjectMedia] = useState<SelectableMedia[]>([]);
    const [selectedExistingIds, setSelectedExistingIds] = useState<Set<string>>(new Set());

    // New uploads & YouTube links
    const [newItems, setNewItems] = useState<NewItemPreview[]>([]);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showAlert, showConfirm } = useModal();

    useEffect(() => {
        getMedia(id)
            .then(data => {
                setMedia(data);
                setTitle(data.title);
                setItems(data.items);

                const projectId = typeof data.project === 'object' && data.project
                    ? data.project._id
                    : (data.project as string);

                if (projectId) {
                    listProjectsWithMedia()
                        .then(projectsList => {
                            const proj = projectsList.find(p => p._id === projectId);
                            if (proj) {
                                setSelectedProject(proj);
                                const allMedia: SelectableMedia[] = [
                                    ...(proj.heroImages || []).map(m => ({ ...m, selectionId: m._id || `hero-${m.cloudinaryId}`, isInProjects: true })),
                                    ...(proj.floorPlans || []).map(m => ({ ...m, selectionId: m._id || `fp-${m.cloudinaryId}`, isInProjects: true })),
                                    ...(proj.layoutPlan?.url ? [{ ...proj.layoutPlan, selectionId: proj.layoutPlan._id || `layout-${proj.layoutPlan.cloudinaryId}`, isInProjects: true }] : []),
                                    ...(proj.sampleHousePhotos || []).map(m => ({ ...m, selectionId: m._id || `sample-${m.cloudinaryId}`, isInProjects: true })),
                                    ...(proj.brochure?.url ? [{
                                        url: proj.brochure.url,
                                        cloudinaryId: proj.brochure.cloudinaryId,
                                        title: proj.brochure.fileName || 'Brochure',
                                        mediaType: 'document' as const,
                                        category: 'brochure' as const,
                                        selectionId: proj.brochure.cloudinaryId || 'brochure-static-id',
                                        isInProjects: true
                                    } as any] : [])
                                ];
                                setProjectMedia(allMedia);
                            }
                        })
                        .catch(console.error);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index: number, patch: Partial<MediaItem>) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
    };

    const toggleExistingSelection = (selectionId: string) => {
        setSelectedExistingIds(prev => {
            const next = new Set(prev);
            if (next.has(selectionId)) next.delete(selectionId);
            else next.add(selectionId);
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

    const extractYoutubeId = (url: string) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : false;
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
            previewUrl: '',
            title: 'YouTube Video',
            alt: '',
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

    const handleRemoveNewItem = (index: number) => {
        setNewItems(prev => {
            const copy = [...prev];
            const item = copy[index];
            if (item.file) URL.revokeObjectURL(item.previewUrl);
            return copy.filter((_, i) => i !== index);
        });
    };

    const handleUpdateNewItem = (index: number, patch: Partial<NewItemPreview>) => {
        setNewItems(prev => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Collection title is required.');
            return;
        }

        // Merge project selected items
        const selectedProjectMediaItems = projectMedia
            .filter(pm => selectedExistingIds.has(pm.selectionId))
            .map(pm => {
                const { selectionId, ...rest } = pm;
                return { ...rest, isInProjects: true };
            });

        const finalExistingItems = [...items, ...selectedProjectMediaItems];

        if (finalExistingItems.length === 0 && newItems.length === 0) {
            setError('Collection must have at least one asset.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('existingItems', JSON.stringify(finalExistingItems));

            const filesToUpload = newItems.filter(p => !!p.file).map(p => p.file!);
            const newDetails = newItems.map(p => ({
                title: p.title,
                alt: p.alt,
                description: p.description,
                category: p.category,
                mediaType: p.mediaType,
                isMainImage: p.isMainImage,
                provider: p.provider,
                url: p.provider === 'youtube' ? p.externalUrl : undefined,
                thumbnail: p.thumbnail,
                subCategory: p.subCategory
            }));

            formData.append('newDetails', JSON.stringify(newDetails));
            filesToUpload.forEach(f => formData.append('files', f));

            await updateMedia(id, formData);

            newItems.forEach(p => p.file && URL.revokeObjectURL(p.previewUrl));

            showAlert('Saved', 'Media collection updated successfully.', 'success');
            router.push(`/media/${id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to update collection');
            setSubmitting(false);
        }
    };

    const unselectedProjectMedia = projectMedia.filter(
        pm => !items.some(it => it.url === pm.url)
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading collection data…</p>
            </div>
        );
    }

    return (
        <div className="pb-20 bg-[#f9fbfd] min-h-[calc(100vh-64px)]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-6 mb-8">
                <button
                    onClick={() => router.push(`/media/${id}`)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 font-medium hover:text-slate-600 transition-colors mb-4"
                >
                    <ChevronLeft size={14} /> Back to Detail
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 max-w-2xl">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-sm mb-2 inline-block">
                            Project: {selectedProject?.title || 'Unknown Project'}
                        </span>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-2xl font-black text-slate-900 border-none p-0 focus:ring-0 w-full placeholder:text-slate-200"
                            placeholder="Enter collection title..."
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !title.trim()}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm cursor-pointer"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>

            <div className="px-8 mx-auto space-y-10">
                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* Grid Container for Add & Select Elements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Unselected Project Media Selection */}
                    <section className="bg-white rounded-sm border border-slate-100 shadow-sm p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                                Import Project Media
                            </h2>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-sm uppercase">
                                {selectedExistingIds.size} Selected
                            </span>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {unselectedProjectMedia.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-sm">
                                    All project media files are already in this collection.
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {unselectedProjectMedia.map((media) => {
                                        const selectId = media.selectionId;
                                        const isSelected = selectedExistingIds.has(selectId);
                                        return (
                                            <div
                                                key={selectId}
                                                onClick={() => toggleExistingSelection(selectId)}
                                                className={`group relative aspect-square rounded-sm overflow-hidden cursor-pointer border-2 transition-all
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

                    {/* New Upload / Youtube Connector */}
                    <section className="bg-white rounded-sm border border-slate-100 shadow-sm p-6">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                            Upload New Media
                        </h2>

                        <div className="space-y-4">
                            {/* File Upload Zone */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border border-dashed border-slate-300 rounded-sm p-6 flex flex-col items-center gap-3 hover:border-indigo-400 hover:bg-[#f9fbfd] cursor-pointer transition-all bg-[#f9fbfd]"
                            >
                                <CloudUpload className="text-slate-400" size={24} />
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-slate-700">Upload Media Files</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Images, Videos, or Documents</p>
                                </div>
                                <input
                                    type="file" multiple className="hidden" ref={fileInputRef}
                                    onChange={handleFileChange} accept="image/*,video/*,.pdf"
                                />
                            </div>

                            {/* YouTube connector */}
                            <div className="bg-[#f9fbfd] rounded-sm p-4 border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Youtube className="text-rose-500" size={14} />
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Connect YouTube Video</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder="Paste YouTube link here..."
                                            value={youtubeUrl}
                                            onChange={(e) => setYoutubeUrl(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-sm pl-8 pr-3 py-2 text-xs outline-none focus:border-rose-400 transition-all font-medium"
                                        />
                                        <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                    </div>
                                    <button
                                        onClick={addYoutubeVideo}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-sm text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Previews of newly uploaded/added elements */}
                {newItems.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            Newly Added Assets Preview ({newItems.length})
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {newItems.map((item, idx) => (
                                <div key={idx} className="bg-amber-50/40 rounded-2xl border border-amber-100 p-4 transition-all hover:border-amber-200">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex items-center gap-5 shrink-0">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                                                {item.provider === 'youtube' ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={`https://img.youtube.com/vi/${extractYoutubeId(item.externalUrl || '')}/0.jpg`} alt="yt preview" className="w-full h-full object-cover" />
                                                ) : item.mediaType === 'video' ? (
                                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                        <Video size={20} className="text-white/30" />
                                                    </div>
                                                ) : item.mediaType === 'document' ? (
                                                    <div className="w-full h-full bg-rose-50 flex items-center justify-center text-rose-400">
                                                        <FileText size={24} />
                                                    </div>
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset Title</div>
                                                    <input
                                                        type="text" value={item.title}
                                                        onChange={(e) => handleUpdateNewItem(idx, { title: e.target.value })}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</div>
                                                    <select
                                                        value={item.category}
                                                        onChange={(e) => handleUpdateNewItem(idx, { category: e.target.value as any })}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none cursor-pointer"
                                                    >
                                                        <option value="image">Image</option>
                                                        <option value="video">Video</option>
                                                        <option value="brochure">Brochure</option>
                                                        <option value="flyer">Flyer</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5 relative">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</div>
                                                    <div className="relative">
                                                        <input
                                                            type="text" value={item.description}
                                                            onChange={(e) => handleUpdateNewItem(idx, { description: e.target.value })}
                                                            placeholder="Optional description..."
                                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-600 outline-none pr-12"
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveNewItem(idx)}
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Collection Current Assets ────────────────────────────────── */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Tag size={16} className="text-indigo-500" />
                        Current Collection Assets ({items.length})
                    </h2>

                    {items.length === 0 ? (
                        <div className="py-12 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs">
                            No assets left in this collection. Select project media or upload files to save.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {items.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-4 transition-all hover:border-indigo-100 group">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Preview & Main Info */}
                                        <div className="flex items-center gap-5 shrink-0">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                                                {item.provider === 'youtube' && (
                                                    <div className="absolute top-1.5 left-1.5 z-10 bg-rose-500 text-white p-1 rounded-lg">
                                                        <Youtube size={12} />
                                                    </div>
                                                )}
                                                {item.mediaType === 'video' && item.provider !== 'youtube' ? (
                                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                        <Video size={20} className="text-white/30" />
                                                    </div>
                                                ) : item.mediaType === 'document' ? (
                                                    <div className="w-full h-full bg-rose-50 flex items-center justify-center text-rose-400">
                                                        <FileText size={24} />
                                                    </div>
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={item.provider === 'youtube' ? `https://img.youtube.com/vi/${extractYoutubeId(item.url)}/0.jpg` : item.url}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Detailed Controls */}
                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                        Asset Title
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.title}
                                                        onChange={(e) => handleUpdateItem(idx, { title: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                        Category
                                                    </div>
                                                    <select
                                                        value={item.category}
                                                        onChange={(e) => handleUpdateItem(idx, { category: e.target.value as any })}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="image">Image</option>
                                                        <option value="video">Video</option>
                                                        <option value="brochure">Brochure</option>
                                                        <option value="flyer">Flyer</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5 relative">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                        Description
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={item.description || ''}
                                                            onChange={(e) => handleUpdateItem(idx, { description: e.target.value })}
                                                            placeholder="Optional description..."
                                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-600 outline-none focus:border-indigo-400 focus:bg-white transition-all pr-12"
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                                                            title="Remove asset"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {(item.category === 'video' || item.category === 'brochure' || item.provider === 'youtube' || item.category === 'image') && (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                                                    {item.provider === 'youtube' && (
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                                YouTube URL
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={item.url}
                                                                onChange={(e) => handleUpdateItem(idx, { url: e.target.value })}
                                                                placeholder="YouTube video URL..."
                                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-medium text-slate-600 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                                            />
                                                        </div>
                                                    )}
                                                    {item.category === 'video' && (
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                                Video Sub-Category
                                                            </div>
                                                            <select
                                                                value={item.subCategory || 'Walkthrough'}
                                                                onChange={(e) => handleUpdateItem(idx, { subCategory: e.target.value })}
                                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition-all appearance-none cursor-pointer"
                                                            >
                                                                <option value="Walkthrough">Walkthrough</option>
                                                                <option value="Drone View">Drone View</option>
                                                                <option value="Brand">Brand</option>
                                                                <option value="Event">Event</option>
                                                                <option value="Update">Update</option>
                                                                <option value="Testimonial">Testimonial</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                    {(item.category === 'video' || item.category === 'brochure') && (
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                                Cover / Thumbnail Image URL
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={item.thumbnail || ''}
                                                                onChange={(e) => handleUpdateItem(idx, { thumbnail: e.target.value })}
                                                                placeholder="Paste image URL (for cover/preview)..."
                                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-medium text-slate-600 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1.5 flex items-center pt-5">
                                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!item.isMainImage}
                                                                onChange={(e) => handleUpdateItem(idx, { isMainImage: e.target.checked })}
                                                                className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                                Featured Video / Main Image
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
