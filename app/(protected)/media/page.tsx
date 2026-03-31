// app/(protected)/media/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Aperture, ChevronRight, Loader2, Trash2, Pencil, Edit, Calendar, Image as ImageIcon, Video, FolderOpen, FileText, Tag, Youtube } from 'lucide-react';
import { listMedia, deleteMedia } from '@/lib/mediaApi';
import type { MediaDoc } from '@/types/media';

const extractYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
};

export default function MediaPage() {
    const [mediaList, setMediaList] = useState<MediaDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        listMedia()
            .then(setMediaList)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete media collection "${title}"?`)) return;
        setDeletingId(id);
        try {
            await deleteMedia(id);
            setMediaList((prev) => prev.filter((m) => m._id !== id));
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
            {/* ── Page header ────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <span className="hover:text-slate-600 cursor-pointer transition-colors">Dashboard</span>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold">Media</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Media Collections</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage project-specific media and brochures</p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#f9fbfd] rounded-sm border border-gray-200 shadow-sm px-3.5 py-2">
                            <FolderOpen size={14} className="text-black" />
                            <span className="text-xs font-bold text-black">{mediaList.length} Total</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 mt-5">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 text-white shadow-sm rounded-sm">
                        <Aperture size={14} />
                        All Collections
                    </button>
                    <Link
                        href="/media/new"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 bg-[#f9fbfd] rounded-sm border border-gray-200 hover:bg-slate-50 transition-all"
                    >
                        <Plus size={14} />
                        Create New
                    </Link>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-6 bg-[#f9fbfd] min-h-[calc(100vh-140px)]">
                {mediaList.length === 0 ? (
                    <div className="bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                            <Aperture size={28} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-700 mb-1">No media collections yet</p>
                            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                                Create your first media collection to organize project assets
                            </p>
                        </div>
                        <Link
                            href="/media/new"
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <Plus size={15} /> New Collection
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {mediaList.map((media) => {
                            const projectTitle = typeof media.project === 'object' ? media.project.title : 'Unknown Project';
                            const firstItem = media.items[0];
                            const imgCount = media.items.filter(i => i.category === 'image').length;
                            const vidCount = media.items.filter(i => i.category === 'video').length;
                            const brochureCount = media.items.filter(i => i.category === 'brochure').length;
                            const flyerCount = media.items.filter(i => i.category === 'flyer').length;

                            return (
                                <div key={media._id} className="group bg-white border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200 transition-all relative">
                                    {/* Link to detail page */}
                                    <Link href={`/media/${media._id}`} className="block">
                                        {/* Thumbnail */}
                                        <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                            {firstItem?.url ? (
                                                firstItem.provider === 'youtube' ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={`https://img.youtube.com/vi/${extractYoutubeId(firstItem.url)}/0.jpg`}
                                                        alt={media.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : firstItem.mediaType === 'video' ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                        <Video size={32} className="text-white/30" />
                                                    </div>
                                                ) : firstItem.mediaType === 'document' ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 gap-2">
                                                        <FileText size={32} className="text-rose-400" />
                                                        <span className="text-[10px] font-bold text-rose-300 uppercase">Document</span>
                                                    </div>
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={firstItem.url} alt={media.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                )
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Aperture size={32} className="text-slate-300" />
                                                </div>
                                            )}
                                            {firstItem?.provider === 'youtube' && (
                                                <div className="absolute top-3 right-3 bg-rose-600 text-white p-1 rounded-md shadow-lg z-10">
                                                    <Youtube size={12} />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-slate-100 text-[10px] font-bold text-slate-600 shadow-sm">
                                                {projectTitle}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1 truncate">{media.title}</h3>

                                            <div className="flex items-center gap-3 text-slate-400 mb-4">
                                                <div className="flex items-center gap-1 text-[11px] font-medium">
                                                    <Calendar size={12} />
                                                    {media.createdAt ? new Date(media.createdAt).toLocaleDateString() : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {imgCount > 0 && (
                                                        <span className="flex items-center gap-1 text-[11px] text-indigo-500 font-semibold" title="Images">
                                                            <ImageIcon size={10} /> {imgCount}
                                                        </span>
                                                    )}
                                                    {vidCount > 0 && (
                                                        <span className="flex items-center gap-1 text-[11px] text-violet-500 font-semibold" title="Videos">
                                                            <Video size={10} /> {vidCount}
                                                        </span>
                                                    )}
                                                    {brochureCount > 0 && (
                                                        <span className="flex items-center gap-1 text-[11px] text-rose-500 font-semibold" title="Brochures">
                                                            <FileText size={10} /> {brochureCount}
                                                        </span>
                                                    )}
                                                    {flyerCount > 0 && (
                                                        <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold" title="Flyers">
                                                            <Tag size={10} className="w-2.5 h-2.5" /> {flyerCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Actions */}
                                    <div className="p-4 pt-0 flex items-center gap-2">
                                        <Link
                                            href={`/media/${media._id}/edit`}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold py-2 rounded-sm transition-all border border-slate-100"
                                        >
                                            <Edit size={12} /> Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(media._id, media.title)}
                                            disabled={deletingId === media._id}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 text-xs font-semibold py-2 rounded-sm transition-all border border-rose-100"
                                        >
                                            {deletingId === media._id ? <Loader2 size={12} className="animate-spin" /> : <><Trash2 size={12} /> Delete</>}
                                        </button>
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
