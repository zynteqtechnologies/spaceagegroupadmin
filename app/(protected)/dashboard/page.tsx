'use client';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard, ChevronRight, Building2, FileText,
    Users, Aperture, Plus, ArrowRight, Clock,
    TrendingUp, ExternalLink, ShieldCheck, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats } from '@/lib/dashboardApi';
import type { DashboardStats } from '@/types/dashboard';

export default function DashboardHome() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

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
                <p className="text-sm text-slate-400 font-medium">Loading overview…</p>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Projects', count: stats?.counts.projects || 0, icon: <Building2 size={24} />, color: 'bg-blue-500', link: '/projects' },
        { label: 'Blog Articles', count: stats?.counts.blogPosts || 0, icon: <FileText size={24} />, color: 'bg-emerald-500', link: '/blog' },
        { label: 'Team Members', count: stats?.counts.teamMembers || 0, icon: <Users size={24} />, color: 'bg-violet-500', link: '/our-team' },
        { label: 'Media Collections', count: stats?.counts.mediaCollections || 0, icon: <Aperture size={24} />, color: 'bg-amber-500', link: '/media' },
    ];

    if (stats?.counts.users !== undefined) {
        statCards.push({ label: 'Administrators', count: stats.counts.users, icon: <ShieldCheck size={24} />, color: 'bg-slate-800', link: '/users' });
    }

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
                    Dashboard Overview
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">Welcome back! Manage your real estate portal with ease.</p>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-8 space-y-8 max-w-7xl mx-auto">

                {/* 1. Stat Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, i) => (
                        <Link
                            key={i}
                            href={card.link}
                            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${card.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    {card.icon}
                                </div>
                                <TrendingUp size={16} className="text-slate-200" />
                            </div>
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{card.label}</h3>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-black text-slate-900">{card.count}</span>
                                <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. Recent Activities (Left Column: 2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Recent Projects */}
                        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">
                                    <Clock size={16} className="text-blue-500" />
                                    Recently Added Projects
                                </h2>
                                <Link href="/projects" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                    View All <ChevronRight size={14} />
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {stats?.recentProjects.length === 0 ? (
                                    <p className="p-8 text-center text-sm text-slate-400">No projects yet.</p>
                                ) : (
                                    stats?.recentProjects.map((project) => (
                                        <div key={project._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 font-bold uppercase text-xs">
                                                    {project.status?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{project.title}</h4>
                                                    <p className="text-[11px] text-slate-400 capitalize">{project.status || 'Upcoming'}</p>
                                                </div>
                                            </div>
                                            <Link href={`/projects/${project._id}`} className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                                <ChevronRight size={14} />
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Blogs */}
                        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">
                                    <FileText size={16} className="text-emerald-500" />
                                    Latest Blog Articles
                                </h2>
                                <Link href="/blog" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                    View All <ChevronRight size={14} />
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {stats?.recentBlogPosts.length === 0 ? (
                                    <p className="p-8 text-center text-sm text-slate-400">No blog posts yet.</p>
                                ) : (
                                    stats?.recentBlogPosts.map((post) => (
                                        <div key={post._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-8 rounded bg-slate-100 overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={post.image.url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{post.title}</h4>
                                                    <p className="text-[11px] text-slate-400">{post.category} • {post.status}</p>
                                                </div>
                                            </div>
                                            <Link href={`/blog/${post._id}`} className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                                <ChevronRight size={14} />
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Quick Actions & Stats (Right Column: 1/3) */}
                    <div className="space-y-8">
                        {/* Quick Actions */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                            <h2 className="font-black uppercase tracking-widest text-[11px] mb-6 text-slate-400 flex items-center gap-2">
                                <Plus size={14} /> Quick Management
                            </h2>
                            <div className="grid grid-cols-1 gap-3">
                                <Link href="/projects" className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Building2 size={18} className="text-blue-400" />
                                        <span className="text-sm font-bold">New Project</span>
                                    </div>
                                    <Plus size={16} className="text-slate-500 group-hover:text-white" />
                                </Link>
                                <Link href="/blog/new" className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} className="text-emerald-400" />
                                        <span className="text-sm font-bold">Write Article</span>
                                    </div>
                                    <Plus size={16} className="text-slate-500 group-hover:text-white" />
                                </Link>
                                <Link href="/media/new" className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Aperture size={18} className="text-amber-400" />
                                        <span className="text-sm font-bold">Add Media</span>
                                    </div>
                                    <Plus size={16} className="text-slate-500 group-hover:text-white" />
                                </Link>
                            </div>
                        </div>

                        {/* System Status / Mini Info */}
                        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                            <div className="relative z-10">
                                <h3 className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">System Status</h3>
                                <div className="text-xl font-bold mb-4 flex items-center gap-2">
                                    Operational
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                </div>
                                <p className="text-blue-100 text-xs leading-relaxed opacity-80">
                                    The administration dashboard is connected to MongoDB Atlas and Cloudinary media servers.
                                </p>
                            </div>
                            <Aperture className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-500 opacity-20 rotate-12" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}