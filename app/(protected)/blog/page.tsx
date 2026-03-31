// app/(protected)/blog/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Loader2, Trash2, Edit, FileText,
    MessageSquare, Heart, Eye, ChevronRight,
    Search, Filter, MoreVertical, Globe, Lock, Link as LinkIcon, CheckCircle2 as CheckCircleIcon
} from 'lucide-react';
import { listBlogPosts, deleteBlogPost } from '@/lib/blogApi';

export default function BlogDashboard() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copyingId, setCopyingId] = useState<string | null>(null);

    const handleCopyLink = (slug: string, id: string) => {
        const url = `${window.location.origin}/blog/${slug}`;
        navigator.clipboard.writeText(url);
        setCopyingId(id);
        setTimeout(() => setCopyingId(null), 2000);
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await listBlogPosts();
            setPosts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
        setDeletingId(id);
        try {
            await deleteBlogPost(id);
            setPosts(prev => prev.filter(p => p._id !== id));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredPosts = posts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading blog content…</p>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <Link href="/dashboard" className="hover:text-slate-600 transition-colors">Dashboard</Link>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold">Blog</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
                            <FileText size={24} className="text-blue-600" />
                            Blog Management
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Create and moderate your article ecosystem</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none w-64"
                            />
                        </div>
                        <Link
                            href="/blog/new"
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm"
                        >
                            <Plus size={16} /> New Article
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
                {filteredPosts.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No articles found</h3>
                        <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">
                            {searchTerm ? 'No results match your search criteria.' : 'Start sharing stories and news with your community.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPosts.map((post) => (
                            <div key={post._id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative">
                                {/* Thumbnail Section */}
                                <div className="relative aspect-video overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={post.image.url}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <div className={`py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm flex items-center gap-1.5 ${post.status === 'published'
                                                ? 'bg-emerald-500/90 text-white'
                                                : 'bg-slate-900/90 text-white'
                                            }`}>
                                            {post.status === 'published' ? <Globe size={10} /> : <Lock size={10} />}
                                            {post.status}
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3 py-1 px-3 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm border border-white/20">
                                        {post.category}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors mb-4 line-clamp-2">{post.title}</h3>

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="flex flex-col items-center gap-1 bg-slate-50 py-2 rounded-xl">
                                            <Heart size={14} className="text-rose-400" />
                                            <span className="text-[11px] font-black text-slate-600">{post.likesCount || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 bg-slate-50 py-2 rounded-xl">
                                            <MessageSquare size={14} className="text-blue-400" />
                                            <span className="text-[11px] font-black text-slate-600">{post.commentsCount || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 bg-slate-50 py-2 rounded-xl">
                                            <Eye size={14} className="text-slate-400" />
                                            <span className="text-[11px] font-black text-slate-600">{post.viewCount || 0}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto flex items-center gap-2">
                                        <Link
                                            href={`/blog/${post._id}`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
                                        >
                                            <Eye size={14} /> Preview
                                        </Link>
                                        <Link
                                            href={`/blog/${post._id}/edit`}
                                            className="w-11 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all"
                                            title="Edit Story"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleCopyLink(post.slug, post._id)}
                                            className="w-11 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-100 transition-all"
                                            title="Copy Link"
                                        >
                                            {copyingId === post._id ? <CheckCircleIcon size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post._id, post.title)}
                                            disabled={deletingId === post._id}
                                            className="w-11 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all disabled:opacity-50"
                                        >
                                            {deletingId === post._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
