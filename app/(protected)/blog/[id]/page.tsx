// app/(protected)/blog/[id]/page.tsx
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Heart, MessageSquare, Clock,
    Share2, User, Send, Loader2, PlayCircle,
    CornerDownRight, Globe, Tag
} from 'lucide-react';
import { getBlogPost } from '@/lib/blogApi';

export default function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [liking, setLiking] = useState(false);
    const [commenting, setCommenting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [postData, commentData] = await Promise.all([
                getBlogPost(id),
                fetch(`/api/blog/${id}/engagement`).then(res => res.json())
            ]);
            setPost(postData);
            setComments(commentData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!post?.settings.allowLikes || liking) return;
        setLiking(true);
        try {
            const res = await fetch(`/api/blog/${id}/engagement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'like' })
            });
            const data = await res.json();
            setPost({ ...post, likesCount: data.likesCount });
        } catch (err) {
            console.error(err);
        } finally {
            setLiking(false);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || commenting) return;
        setCommenting(true);
        try {
            const res = await fetch(`/api/blog/${id}/engagement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'comment',
                    authorName: 'Admin (Preview)',
                    authorEmail: 'admin@spaceage.com',
                    content: newComment
                })
            });
            const data = await res.json();
            setComments([data, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error(err);
        } finally {
            setCommenting(false);
        }
    };

    const handleReply = async (parentId: string) => {
        if (!replyContent.trim() || commenting) return;
        setCommenting(true);
        try {
            const res = await fetch(`/api/blog/${id}/engagement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reply',
                    authorName: 'Admin (Preview)',
                    authorEmail: 'admin@spaceage.com',
                    content: replyContent,
                    parentId
                })
            });
            const data = await res.json();
            setComments([...comments, data]);
            setReplyTo(null);
            setReplyContent('');
        } catch (err) {
            console.error(err);
        } finally {
            setCommenting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Rendering article preview…</p>
            </div>
        );
    }

    const parentComments = comments.filter(c => !c.parentId);
    const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

    return (
        <div className="pb-20 bg-slate-50 min-h-screen">
            {/* ── Top Bar ────────────────────────────────────────────────── */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 sticky top-0 z-50">
                <div className="mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push('/blog')}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={16} strokeWidth={3} /> Back
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="py-1 px-3 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Preview Mode
                        </div>
                        <button
                            onClick={() => router.push(`/blog/${id}/edit`)}
                            className="bg-slate-900 text-white px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                        >
                            Edit Article
                        </button>
                    </div>
                </div>
            </div>

            <article className="mx-auto px-8 mt-12 pb-12">
                {/* ── Article Header ────────────────────────────────────────── */}
                <header className="mb-12 text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <span className="px-4 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm">
                            {post.category}
                        </span>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <Clock size={12} /> {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-8 max-w-3xl mx-auto">
                        {post.title}
                    </h1>

                    <div className="flex justify-center items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                SA
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Space Age Group</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrator</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Featured Image ─────────────────────────────────────────── */}
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl mb-16 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.image.url} alt={post.title} className="w-full h-full object-cover" />
                    {post.videoUrl && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle size={64} className="text-white drop-shadow-lg" />
                        </div>
                    )}
                </div>

                {/* ── Article Body ───────────────────────────────────────────── */}
                <div className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed space-y-6 mb-16 whitespace-pre-wrap">
                    {post.description}
                </div>

                {/* ── Tags ────────────────────────────────────────────────────── */}
                {post.tags?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-16 pb-16 border-b border-slate-200">
                        <Tag size={16} className="text-slate-300 mr-2" />
                        {post.tags.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-xs font-bold text-slate-500 hover:text-blue-600 hover:border-blue-100 transition-all cursor-default">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Engagement Actions ───────────────────────────────────────── */}
                <section className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm mb-16 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-blue-500 to-indigo-500" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-12">
                            <button
                                onClick={handleLike}
                                disabled={!post.settings.allowLikes || liking}
                                className={`flex flex-col items-center gap-2 transition-all ${liking ? 'scale-90' : 'hover:scale-110 active:scale-95'
                                    } ${!post.settings.allowLikes ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${post.likesCount > 0 ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                    <Heart size={24} fill={post.likesCount > 0 ? 'currentColor' : 'none'} />
                                </div>
                                <span className="text-xs font-black uppercase text-slate-600 tracking-widest">{post.likesCount || 0} Likes</span>
                            </button>

                            <div className="flex flex-col items-center gap-2 opacity-50">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Share2 size={24} />
                                </div>
                                <span className="text-xs font-black uppercase text-slate-600 tracking-widest">Share Story</span>
                            </div>
                        </div>

                        <div className="flex-1 md:max-w-xs text-center md:text-right">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">What did you think?</h4>
                            <p className="text-xs text-slate-400 font-medium">Join the discussion below and share your thoughts with the community.</p>
                        </div>
                    </div>
                </section>

                {/* ── Comments Section ───────────────────────────────────────── */}
                <section id="comments" className="space-y-12">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <MessageSquare className="text-blue-500" />
                            Conversations
                            <span className="text-slate-300 text-sm font-medium">({comments.length})</span>
                        </h3>
                    </div>

                    {/* New Comment Input */}
                    {post.settings.allowComments ? (
                        <form onSubmit={handleComment} className="relative group">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add your perspective..."
                                rows={3}
                                className="w-full bg-white border border-slate-100 rounded-3xl p-6 pr-16 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm group-hover:border-blue-200"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || commenting}
                                className="absolute right-4 bottom-4 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:grayscale transition-all shadow-lg"
                            >
                                {commenting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </form>
                    ) : (
                        <div className="bg-slate-100 rounded-2xl p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                            Comments are disabled for this article
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-8">
                        {parentComments.map((comment) => (
                            <div key={comment._id} className="space-y-6">
                                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900">{comment.authorName}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-6">{comment.content}</p>
                                    <div className="flex items-center gap-6">
                                        <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                                            <Heart size={14} /> {comment.likesCount || 0}
                                        </button>
                                        <button
                                            onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            Reply
                                        </button>
                                    </div>

                                    {/* Reply Input */}
                                    {replyTo === comment._id && (
                                        <div className="mt-6 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                                            <textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder={`Replying to ${comment.authorName}...`}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-200 transition-all"
                                                rows={2}
                                            />
                                            <div className="flex justify-end gap-2 text-[10px] font-black uppercase tracking-widest">
                                                <button
                                                    onClick={() => setReplyTo(null)}
                                                    className="px-4 py-2 text-slate-400 hover:text-slate-600"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReply(comment._id)}
                                                    disabled={!replyContent.trim() || commenting}
                                                    className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
                                                >
                                                    Post Reply
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Nested Replies */}
                                {getReplies(comment._id).map((reply) => (
                                    <div key={reply._id} className="flex gap-4 ml-12 lg:ml-20">
                                        <CornerDownRight size={20} className="text-slate-200 mt-4 shrink-0" />
                                        <div className="flex-1 bg-slate-100/50 border border-slate-100 rounded-3xl p-6">
                                            <div className="flex gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-900">{reply.authorName}</h4>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {new Date(reply.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{reply.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </section>
            </article>
        </div>
    );
}
