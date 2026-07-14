// app/(protected)/csr/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Plus, Pencil, Trash2, Loader2, ChevronRight, Heart } from 'lucide-react';
import { useModal } from '@/context/ModalContext';

interface CSRPost {
    _id: string;
    slug: string;
    title: string;
    category: string;
    date: string;
    description: string;
    longDescription: string;
    images: string[];
    imageCount: number;
    impact: string;
    likes: number;
    color: string;
}

export default function CSRListPage() {
    const [posts, setPosts] = useState<CSRPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { showAlert, showConfirm } = useModal();

    const fetchPosts = () => {
        fetch('/api/csr')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPosts(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id: string, title: string) => {
        const confirmed = await showConfirm('Delete CSR Post', `Are you sure you want to delete the CSR post "${title}"?`);
        if (!confirmed) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/csr/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete CSR post');
            setPosts(posts.filter(p => p._id !== id));
            showAlert('Deleted', `CSR post "${title}" has been deleted.`, 'success');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to delete CSR post', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-emerald-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading CSR posts…</p>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <Link href="/dashboard" className="hover:text-slate-600 transition-colors">Dashboard</Link>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold">CSR Posts</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
                            <Sparkles size={20} className="text-emerald-600" />
                            Corporate Social Responsibility (CSR)
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage the social and environmental community impact initiatives shown on the website.</p>
                    </div>

                    <Link
                        href="/csr/new"
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-sm transition-all shadow-sm w-fit"
                    >
                        <Plus size={16} /> New CSR Post
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 lg:px-8 py-6 bg-[#f9fbfd] min-h-[calc(100vh-140px)]">
                {posts.length === 0 ? (
                    <div className="max-w-2xl bg-white border border-slate-200 shadow-sm rounded-sm p-12 text-center space-y-4">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-slate-900 font-bold">No CSR Posts Created Yet</h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                            Create dynamic social responsibility campaigns to showcase your corporate community impact.
                        </p>
                        <Link
                            href="/csr/new"
                            className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-4 py-2 hover:bg-slate-800 rounded-sm transition-all"
                        >
                            <Plus size={14} /> Add First CSR Post
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <div key={post._id} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group">
                                <div>
                                    {/* Cover Preview */}
                                    <div className="aspect-[16/9] relative bg-slate-100 overflow-hidden border-b border-slate-50">
                                        {post.images && post.images.length > 0 ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={post.images[0]}
                                                alt={post.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs uppercase">No Images</div>
                                        )}
                                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm shadow-sm rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider" style={{ color: post.color || '#c9a84c' }}>
                                            {post.category}
                                        </div>
                                    </div>

                                    {/* Text Details */}
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                            <span>{post.date}</span>
                                            <span className="flex items-center gap-1"><Heart size={12} className="fill-rose-500 stroke-none" /> {post.likes} Likes</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 leading-snug text-base group-hover:text-emerald-600 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">Impact: <span className="text-slate-800 font-bold">{post.impact}</span></p>
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{post.description}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-5 pt-0 flex gap-2">
                                    <Link
                                        href={`/csr/${post._id}/edit`}
                                        className="flex-1 inline-flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-100"
                                    >
                                        <Pencil size={12} /> Edit Details
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(post._id, post.title)}
                                        disabled={deletingId === post._id}
                                        className="w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100 disabled:opacity-50"
                                    >
                                        {deletingId === post._id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
