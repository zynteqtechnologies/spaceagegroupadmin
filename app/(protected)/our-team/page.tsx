// app/(protected)/our-team/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Loader2, Trash2, Edit, Users,
    Linkedin, Instagram, Facebook, GraduationCap,
    Briefcase, Building2, Info, ChevronRight, User2
} from 'lucide-react';
import { listTeamMembers, deleteTeamMember } from '@/lib/teamApi';
import type { TeamMember } from '@/types/team';

export default function OurTeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            const data = await listTeamMembers();
            setMembers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;
        setDeletingId(id);
        try {
            await deleteTeamMember(id);
            setMembers(prev => prev.filter(m => m._id !== id));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading team members…</p>
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
                    <span className="text-slate-700 font-semibold">Our Team</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">
                            Our Team
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage and showcase your professional team</p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#f9fbfd] rounded-sm border border-gray-200 shadow-sm px-3.5 py-2">
                            <Users size={14} className="text-black" />
                            <span className="text-xs font-bold text-black">{members.length} Total</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 mt-5">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 text-white shadow-sm rounded-sm">
                        <Users size={14} />
                        All Members
                    </button>
                    <Link
                        href="/our-team/new"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-[#f9fbfd] rounded-sm border border-gray-200 hover:bg-slate-50 transition-all"
                    >
                        <Plus size={14} />
                        Create New
                    </Link>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-6 bg-[#f9fbfd] min-h-[calc(100vh-140px)]">
                {members.length === 0 ? (
                    <div className="bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                            <Users size={28} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-700 mb-1">No team members yet</p>
                            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                                Start adding your talented team members to showcase them on your website.
                            </p>
                        </div>
                        <Link
                            href="/our-team/new"
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <Plus size={15} /> Add Member
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {members.map((member) => (
                            <div key={member._id} className="group bg-white border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200 transition-all relative flex flex-col">
                                {/* Profile Card Header */}
                                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={member.image.url}
                                        alt={member.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        <div className="flex gap-1.5">
                                            {member.socialLinks.linkedin && (
                                                <a href={member.socialLinks.linkedin} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-sm bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-blue-600 transition-all">
                                                    <Linkedin size={12} />
                                                </a>
                                            )}
                                            {member.socialLinks.instagram && (
                                                <a href={member.socialLinks.instagram} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-sm bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-rose-500 transition-all">
                                                    <Instagram size={12} />
                                                </a>
                                            )}
                                            {member.socialLinks.facebook && (
                                                <a href={member.socialLinks.facebook} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-sm bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-blue-800 transition-all">
                                                    <Facebook size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="mb-3">
                                        <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1 truncate">{member.name}</h3>
                                        <p className="text-blue-600 text-[10px] font-bold uppercase tracking-wider truncate">{member.position}</p>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-start gap-2 text-slate-600">
                                            <GraduationCap size={14} className="shrink-0 text-slate-400 mt-0.5" />
                                            <span className="text-[11px] line-clamp-1">{member.study}</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-slate-600">
                                            <Briefcase size={14} className="shrink-0 text-slate-400 mt-0.5" />
                                            <span className="text-[11px] line-clamp-1">{member.experience}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-auto flex items-center gap-2">
                                        <Link
                                            href={`/our-team/${member._id}/edit`}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold py-2 rounded-sm transition-all border border-slate-100"
                                        >
                                            <Edit size={12} /> Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(member._id!, member.name)}
                                            disabled={deletingId === member._id}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 text-xs font-semibold py-2 rounded-sm transition-all border border-rose-100 disabled:opacity-50"
                                        >
                                            {deletingId === member._id ? <Loader2 size={12} className="animate-spin" /> : <><Trash2 size={12} /> Delete</>}
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
