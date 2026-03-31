// app/(protected)/media/[id]/edit/page.tsx
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, Loader2, Save, Trash2, 
    Tag, Info, ImageIcon, Video, FileText,
    AlertCircle, Youtube, Link as LinkIcon, Plus
} from 'lucide-react';
import { getMedia, updateMedia } from '@/lib/mediaApi';
import type { MediaDoc } from '@/types/media';
import type { MediaItem } from '@/types/project';

export default function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [media, setMedia] = useState<MediaDoc | null>(null);
    const [items, setItems] = useState<MediaItem[]>([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');

    useEffect(() => {
        getMedia(id)
            .then(data => {
                setMedia(data);
                setTitle(data.title);
                setItems(data.items);
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
        const newItem: MediaItem = {
            url: youtubeUrl,
            title: 'YouTube Video',
            mediaType: 'video',
            category: 'video',
            provider: 'youtube',
            isInProjects: false,
            order: items.length
        };
        setItems(prev => [...prev, newItem]);
        setYoutubeUrl('');
        setError(null);
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Collection title is required.');
            return;
        }
        if (items.length === 0) {
            setError('Collection must have at least one asset.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await updateMedia(id, { title, items });
            router.push(`/media/${id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update collection');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading collection data…</p>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-8 py-6 mb-8">
                <button 
                    onClick={() => router.push(`/media/${id}`)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 font-medium hover:text-slate-600 transition-colors mb-4"
                >
                    <ChevronLeft size={14} /> Back to Detail
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 max-w-2xl">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Collection Title</label>
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
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>

            <div className="px-8 max-w-5xl mx-auto space-y-10">
                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* ── Add YouTube Section ────────────────────────────────────── */}
                <div className="bg-slate-900 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <Youtube className="text-rose-500" size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add External Video</h3>
                            <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">Directly link YouTube videos to this collection</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                placeholder="Paste YouTube link (e.g. https://youtube.com/watch?v=...)"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-rose-500 transition-all font-medium placeholder:text-slate-600"
                            />
                            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        </div>
                        <button 
                            onClick={addYoutubeVideo}
                            className="bg-white text-slate-900 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Add
                        </button>
                    </div>
                </div>

                {/* ── Assets List ────────────────────────────────────────────── */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Tag size={16} className="text-indigo-500" />
                        Manage Assets ({items.length})
                    </h2>

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
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                                Description / URL
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type="text"
                                                    value={item.provider === 'youtube' ? item.url : (item.description || '')}
                                                    onChange={(e) => item.provider === 'youtube' ? handleUpdateItem(idx, { url: e.target.value }) : handleUpdateItem(idx, { description: e.target.value })}
                                                    placeholder={item.provider === 'youtube' ? 'YouTube URL' : 'Optional description...'}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-600 outline-none focus:border-indigo-400 focus:bg-white transition-all pr-12"
                                                />
                                                <button 
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                    title="Remove asset"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
