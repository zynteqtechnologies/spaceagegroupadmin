'use client';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard, ChevronRight, Building2, FileText,
    Users, Aperture, Plus, ArrowRight, Clock,
    TrendingUp, ExternalLink, ShieldCheck, Loader2,
    Activity, AlertCircle, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats } from '@/lib/dashboardApi';
import type { DashboardStats } from '@/types/dashboard';

export default function DashboardHome() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activityPage, setActivityPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 MB';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    useEffect(() => {
        getDashboardStats()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading CMS overview…</p>
            </div>
        );
    }

    const totalPages = Math.ceil((stats?.recentActivities?.length || 0) / ITEMS_PER_PAGE);
    const currentActivities = stats?.recentActivities?.slice(
        (activityPage - 1) * ITEMS_PER_PAGE,
        activityPage * ITEMS_PER_PAGE
    );

    return (
        <div>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <Link href="/dashboard" className="hover:text-slate-600 transition-colors">Dashboard</Link>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold">Home</span>
                </div>

                <h1 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
                    <LayoutDashboard size={24} className="text-blue-600" />
                    Content Management Overview
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">Manage your real estate portal content, review drafts, and track team activity.</p>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-8 space-y-8 mx-auto">

                {/* 1. Stat Breakdowns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Projects Breakdown */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg">
                                    <Building2 size={20} />
                                </div>
                                <h3 className="text-slate-900 font-bold tracking-wider">Projects</h3>
                            </div>
                            <span className="text-2xl font-black text-slate-900">{stats?.counts.projects || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-slate-50">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Active</p>
                                <p className="text-lg font-bold text-blue-600">{stats?.projectBreakdown?.ongoing || 0}</p>
                            </div>
                            <div className="text-center border-l border-slate-100">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Upcoming</p>
                                <p className="text-lg font-bold text-amber-500">{stats?.projectBreakdown?.upcoming || 0}</p>
                            </div>
                            <div className="text-center border-l border-slate-100">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Completed</p>
                                <p className="text-lg font-bold text-emerald-500">{stats?.projectBreakdown?.completed || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Blog Breakdown */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                                    <FileText size={20} />
                                </div>
                                <h3 className="text-slate-900 font-bold tracking-wider">Blog Articles</h3>
                            </div>
                            <span className="text-2xl font-black text-slate-900">{stats?.counts.blogPosts || 0}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-slate-50">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Published</p>
                                <p className="text-lg font-bold text-emerald-600">{stats?.blogBreakdown?.published || 0}</p>
                            </div>
                            <div className="text-center border-l border-slate-100">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Drafts</p>
                                <p className="text-lg font-bold text-amber-500">{stats?.blogBreakdown?.draft || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. Needs Attention & Drafts (Left Column: 2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Needs Attention / Incomplete Projects */}
                        <div className="bg-white border border-rose-100 rounded-2xl shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                            <div className="px-6 py-4 border-b border-rose-50 flex items-center justify-between bg-rose-50/30">
                                <h2 className="font-bold text-rose-900 flex items-center gap-2 text-sm uppercase tracking-tight">
                                    <AlertCircle size={16} className="text-rose-500" />
                                    Needs Attention
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {stats?.needsAttention?.projectsMissingHeroes?.length === 0 && stats?.needsAttention?.draftBlogs?.length === 0 ? (
                                    <p className="p-8 text-center text-sm text-slate-400">All content is complete and published.</p>
                                ) : (
                                    <>
                                        {stats?.needsAttention?.projectsMissingHeroes.map((project) => (
                                            <div key={project._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                                                        <ImageIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm">Project missing Hero Image</h4>
                                                        <p className="text-[11px] text-slate-600">The project "{project.title}" has no hero image.</p>
                                                    </div>
                                                </div>
                                                <Link href={`/projects/${project._id}`} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                                                    Fix Now
                                                </Link>
                                            </div>
                                        ))}
                                        {stats?.needsAttention?.draftBlogs.map((post) => (
                                            <div key={post._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm">Unpublished Blog Draft</h4>
                                                        <p className="text-[11px] text-slate-600">"{post.title}" is saved as a draft.</p>
                                                    </div>
                                                </div>
                                                <Link href={`/blog/${post._id}`} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                                                    Review
                                                </Link>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity Audit Log */}
                        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">
                                    <Activity size={16} className="text-blue-500" />
                                    Recent Team Activity
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {currentActivities?.length === 0 ? (
                                    <p className="p-8 text-center text-sm text-slate-400">No recent activity found.</p>
                                ) : (
                                    currentActivities?.map((activity) => (
                                        <div key={activity._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase text-xs overflow-hidden shrink-0">
                                                {activity.userId?.avatar ? (
                                                    <img src={activity.userId.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    activity.userId?.name?.charAt(0) || 'U'
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-700">
                                                    <span className="font-bold text-slate-900">{activity.userId?.name || 'System'}</span> {activity.content}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/50">
                                    <button
                                        onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                                        disabled={activityPage === 1}
                                        className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors"
                                    >
                                        &larr; Previous
                                    </button>
                                    <span className="text-[10px] text-slate-400 font-medium">Page {activityPage} of {totalPages}</span>
                                    <button
                                        onClick={() => setActivityPage(p => Math.min(totalPages, p + 1))}
                                        disabled={activityPage === totalPages}
                                        className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors"
                                    >
                                        Next &rarr;
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Quick Actions & General Stats (Right Column: 1/3) */}
                    <div className="space-y-8">
                        {/* Quick Actions */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                            <h2 className="font-black uppercase tracking-widest text-[11px] mb-6 text-slate-400 flex items-center gap-2">
                                <Plus size={14} /> Content Creation
                            </h2>
                            <div className="grid grid-cols-1 gap-3">
                                <Link href="/projects" className="flex items-center justify-between bg-blue-500/10 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Building2 size={18} className="text-blue-400" />
                                        <span className="text-sm font-bold">New Project</span>
                                    </div>
                                    <Plus size={16} className="text-slate-600 group-hover:text-white" />
                                </Link>
                                <Link href="/blog/new" className="flex items-center justify-between bg-blue-500/10 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} className="text-emerald-400" />
                                        <span className="text-sm font-bold">Write Article</span>
                                    </div>
                                    <Plus size={16} className="text-slate-600 group-hover:text-white" />
                                </Link>
                                <Link href="/media/new" className="flex items-center justify-between bg-blue-500/10 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Aperture size={18} className="text-amber-400" />
                                        <span className="text-sm font-bold">Upload Media</span>
                                    </div>
                                    <Plus size={16} className="text-slate-600 group-hover:text-white" />
                                </Link>
                            </div>
                        </div>

                        {/* Additional Stats */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <h2 className="font-black uppercase tracking-widest text-[11px] mb-4 text-slate-400 flex items-center gap-2">
                                <Aperture size={14} /> Platform Data
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 flex items-center gap-2"><Aperture size={14} className="text-slate-400" /> Media Storage Used</span>
                                    <span className="font-bold text-slate-900">{formatBytes(stats?.counts.totalMediaSize || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 flex items-center gap-2"><ImageIcon size={14} className="text-slate-400" /> Total Media Files</span>
                                    <span className="font-bold text-slate-900">{stats?.counts.mediaCollections || 0}</span>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-sm text-slate-600 flex items-center gap-2"><Users size={14} className="text-slate-400" /> Team Profiles</span>
                                    <span className="font-bold text-slate-900">{stats?.counts.teamMembers || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}