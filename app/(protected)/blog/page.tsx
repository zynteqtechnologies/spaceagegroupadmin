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
import { useModal } from '@/context/ModalContext';

export default function BlogDashboard() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copyingId, setCopyingId] = useState<string | null>(null);
    const { showAlert, showConfirm } = useModal();

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
        const confirmed = await showConfirm('Delete Blog Post', `Are you sure you want to delete "${title}"?`);
        if (!confirmed) return;
        setDeletingId(id);
        try {
            await deleteBlogPost(id);
            setPosts(prev => prev.filter(p => p._id !== id));
            showAlert('Deleted', `Blog post "${title}" has been deleted.`, 'success');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to delete blog post', 'error');
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

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">
                            Blog Management
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Create and moderate your article ecosystem</p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#f9fbfd] rounded-sm border border-gray-200 shadow-sm px-3.5 py-2">
                            <FileText size={14} className="text-black" />
                            <span className="text-xs font-bold text-black">{posts.length} Total</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5">
                    <div className="flex items-center gap-1">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 text-white shadow-sm rounded-sm">
                            <FileText size={14} />
                            All Articles
                        </button>
                        <Link
                            href="/blog/new"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-[#f9fbfd] rounded-sm border border-gray-200 hover:bg-slate-50 transition-all"
                        >
                            <Plus size={14} />
                            Create New
                        </Link>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-[#f9fbfd] border border-gray-200 rounded-sm text-sm focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none w-full sm:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-6 bg-[#f9fbfd] min-h-[calc(100vh-140px)]">
                {filteredPosts.length === 0 ? (
                    <div className="bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                            <FileText size={28} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-700 mb-1">No articles found</p>
                            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                                Create your first article to get started.
                            </p>
                        </div>
                        <Link
                            href="/blog/new"
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <Plus size={15} /> New Article
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredPosts.map((post) => (
                            <div key={post._id} className="group bg-white border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200 transition-all relative flex flex-col">
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                    {post.image?.url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={post.image.url}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileText size={32} className="text-slate-300" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md ${post.status === 'published'
                                                ? 'bg-emerald-500/90 text-white border-emerald-500/20'
                                                : 'bg-slate-900/90 text-white border-slate-900/20'
                                            }`}>
                                            {post.status === 'published' ? <Globe size={10} /> : <Lock size={10} />}
                                            {post.status.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3 py-1 px-3 bg-white/90 backdrop-blur-md rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm border border-white/20">
                                        {post.category}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors mb-4 line-clamp-2">{post.title}</h3>

                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="flex flex-col items-center gap-1 bg-slate-50 py-2 rounded-sm border border-slate-100">
                                            <Heart size={12} className="text-rose-400" />
                                            <span className="text-[10px] font-black text-slate-600">{post.likesCount || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 bg-slate-50 py-2 rounded-sm border border-slate-100">
                                            <MessageSquare size={12} className="text-blue-400" />
                                            <span className="text-[10px] font-black text-slate-600">{post.commentsCount || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 bg-slate-50 py-2 rounded-sm border border-slate-100">
                                            <Eye size={12} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-600">{post.viewCount || 0}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto flex items-center gap-2">
                                        <Link
                                            href={`/blog/${post._id}`}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-sm transition-all shadow-sm"
                                        >
                                            <Eye size={12} /> Preview
                                        </Link>
                                        <Link
                                            href={`/blog/${post._id}/edit`}
                                            className="w-8 h-8 flex items-center justify-center rounded-sm bg-slate-50 border border-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all"
                                            title="Edit Story"
                                        >
                                            <Edit size={12} />
                                        </Link>
                                        <button
                                            onClick={() => handleCopyLink(post.slug, post._id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-sm bg-white border border-slate-100 text-slate-300 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-100 transition-all"
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
