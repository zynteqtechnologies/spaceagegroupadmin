// app/(protected)/blog/[id]/comments/page.tsx
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, MessageSquare, Heart, Clock, 
    Trash2, CheckCircle2, XCircle, Loader2, 
    CornerDownRight, User, Mail
} from 'lucide-react';
import { getBlogPost } from '@/lib/blogApi';

export default function CommentModerationPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modifyingId, setModifyingId] = useState<string | null>(null);

    useEffect(() => {
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
        loadData();
    }, [id]);

    const handleToggleApproval = async (commentId: string, currentStatus: boolean) => {
        setModifyingId(commentId);
        try {
            await fetch(`/api/blog/${id}/engagement`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId, isApproved: !currentStatus })
            });
            setComments(prev => prev.map(c => c._id === commentId ? { ...c, isApproved: !currentStatus } : c));
        } catch (err) {
            console.error(err);
        } finally {
            setModifyingId(null);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Permanently delete this comment?')) return;
        setModifyingId(commentId);
        try {
            await fetch(`/api/blog/${id}/engagement`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId })
            });
            setComments(prev => prev.filter(c => c._id !== commentId));
        } catch (err) {
            console.error(err);
        } finally {
            setModifyingId(null);
        }
    };

    // Group comments into parents and replies
    const parentComments = comments.filter(c => !c.parentId);
    const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Fetching conversation…</p>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-8 py-6 mb-8">
                <button 
                    onClick={() => router.push('/blog')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 font-medium hover:text-slate-600 transition-colors mb-4"
                >
                    <ChevronLeft size={14} /> Back to Blog
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">Conversation Moderation</h1>
                        <p className="text-sm text-slate-400 mt-1">Managing discussion for: <span className="text-blue-600 font-bold">{post?.title}</span></p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Likes</span>
                            <span className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                                <Heart size={18} className="text-rose-500" fill="currentColor" /> {post?.likesCount || 0}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comments</span>
                            <span className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <MessageSquare size={18} className="text-blue-500" /> {comments.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-8 max-w-5xl mx-auto space-y-6">
                {parentComments.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <MessageSquare size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Clean Slate</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto">No one has started the conversation yet. Be patient!</p>
                    </div>
                ) : (
                    parentComments.map((comment) => (
                        <div key={comment._id} className="space-y-4">
                            {/* Parent Comment */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm group hover:shadow-md transition-shadow relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${comment.isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900">{comment.authorName}</h4>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                <span className="flex items-center gap-1"><Mail size={10} /> {comment.authorEmail}</span>
                                                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleDelete(comment._id)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed pl-14">{comment.content}</p>

                                <div className="flex items-center gap-4 mt-6 pl-14">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md uppercase">
                                        <Heart size={12} fill="currentColor" /> {comment.likesCount || 0} Likes
                                    </div>
                                    {comment.isApproved ? (
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">
                                            <CheckCircle2 size={12} /> Approved
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase">
                                            <XCircle size={12} /> Pending Approval
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Replies */}
                            {getReplies(comment._id).map(reply => (
                                <div key={reply._id} className="flex gap-4 ml-12">
                                    <CornerDownRight size={20} className="text-slate-300 shrink-0 mt-4" />
                                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-5 relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${reply.isApproved ? 'bg-emerald-500/50' : 'bg-amber-500/50'}`} />
                                        
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-300">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-800">{reply.authorName}</h4>
                                                    <p className="text-[9px] font-bold text-slate-400">{new Date(reply.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(reply._id)}
                                                className="p-1.5 text-slate-300 hover:text-rose-500 rounded-md transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed pl-11">{reply.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
