// app/(protected)/media/[id]/page.tsx
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, Loader2, Calendar, 
    ImageIcon, Video, FileText, Tag, AlignLeft,
    ExternalLink, CheckCircle, Info, Edit, Youtube
} from 'lucide-react';
import Link from 'next/link';
import { getMedia } from '@/lib/mediaApi';
import type { MediaDoc } from '@/types/media';

type Params = { id: string };

const extractYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
};

export default function MediaDetailPage({ params }: { params: Promise<Params> }) {
    const router = useRouter();
    const { id } = use(params);
    const [media, setMedia] = useState<MediaDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getMedia(id)
            .then(setMedia)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading collection…</p>
            </div>
        );
    }

    if (error || !media) {
        return (
            <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-500 mb-4">
                    <Info size={32} />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Error loading collection</h1>
                <p className="text-slate-500 mb-6">{error || 'Collection not found'}</p>
                <button 
                    onClick={() => router.push('/media')}
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-sm font-semibold text-sm hover:bg-slate-800 transition-all"
                >
                    <ChevronLeft size={16} /> Back to Media
                </button>
            </div>
        );
    }

    const projectTitle = typeof media.project === 'object' ? media.project.title : 'Project';

    return (
        <div className="pb-20">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-8 py-6 mb-8">
                <button 
                    onClick={() => router.push('/media')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 font-medium hover:text-slate-600 transition-colors mb-4"
                >
                    <ChevronLeft size={14} /> Back to Collections
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
                                {projectTitle}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <Calendar size={12} />
                                {new Date(media.createdAt!).toLocaleDateString()}
                            </div>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">{media.title}</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link 
                            href={`/media/${id}/edit`}
                            className="bg-slate-900 text-white px-4 py-2 rounded-sm text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
                        >
                            <Edit size={14} /> Edit Collection
                        </Link>
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Assets</p>
                            <p className="text-xl font-black text-slate-900">{media.items.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Assets Grid ────────────────────────────────────────────────── */}
            <div className="px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {media.items.map((item, idx) => (
                        <div key={idx} className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                            {/* Preview Area */}
                            <div className="relative aspect-video bg-slate-100 overflow-hidden shrink-0">
                                {item.mediaType === 'video' ? (
                                    item.provider === 'youtube' ? (
                                        <div className="w-full h-full bg-slate-900 relative">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${extractYoutubeId(item.url)}`}
                                                title={item.title}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="absolute inset-0"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                            <Video size={32} className="text-white/20" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                        </div>
                                    )
                                ) : item.mediaType === 'document' ? (
                                    <div className="w-full h-full bg-rose-50 flex items-center justify-center">
                                        <FileText size={48} className="text-rose-400" />
                                    </div>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img 
                                        src={item.url} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                )}

                                {/* Badge: isInProjects */}
                                {item.isInProjects && (
                                    <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-lg flex items-center gap-1 ring-2 ring-white">
                                        <CheckCircle size={10} /> In Projects
                                    </div>
                                )}

                                {/* Provider Badge for YouTube */}
                                {item.provider === 'youtube' && (
                                    <div className="absolute top-3 left-3 bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-lg flex items-center gap-1 ring-2 ring-white z-20">
                                        <Youtube size={10} className="fill-white" /> YouTube
                                    </div>
                                )}

                                {/* MediaType Icon Overlay (Small) */}
                                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm z-10">
                                    {item.mediaType === 'video' ? <Video size={14} className="text-slate-600" /> : 
                                     item.mediaType === 'document' ? <FileText size={14} className="text-rose-500" /> : 
                                     <ImageIcon size={14} className="text-indigo-500" />}
                                </div>
                            </div>

                            {/* Info Area */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                        item.provider === 'youtube' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        <Tag size={10} /> {item.category || 'Asset'}
                                    </span>
                                </div>
                                
                                <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                    {item.title}
                                </h3>

                                {item.description ? (
                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4 italic">
                                        &ldquo;{item.description}&rdquo;
                                    </p>
                                ) : (
                                    <p className="text-xs text-slate-300 mb-4 font-medium italic">No description provided</p>
                                )}

                                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {item.format?.toUpperCase() || 'FILE'} {item.fileSize ? `• ${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                                    </span>
                                    <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 hover:bg-indigo-50 rounded-lg"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
