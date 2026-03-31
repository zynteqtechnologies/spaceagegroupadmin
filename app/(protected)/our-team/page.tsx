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
                        <h1 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
                            <Users size={24} className="text-blue-500" />
                            Our Team
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage and showcase your professional team</p>
                    </div>

                    <Link
                        href="/our-team/new"
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm"
                    >
                        <Plus size={16} /> Add Member
                    </Link>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-8">
                {members.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-xl p-16 text-center shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                            <Users size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No team members yet</h3>
                        <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">
                            Start adding your talented team members to showcase them on your website.
                        </p>
                        <Link
                            href="/our-team/new"
                            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3 rounded-sm transition-all"
                        >
                            <Plus size={18} /> Add First Member
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {members.map((member) => (
                            <div key={member._id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                                {/* Profile Card Header */}
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={member.image.url}
                                        alt={member.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                        <div className="flex gap-2">
                                            {member.socialLinks.linkedin && (
                                                <a href={member.socialLinks.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-blue-600 transition-all">
                                                    <Linkedin size={14} />
                                                </a>
                                            )}
                                            {member.socialLinks.instagram && (
                                                <a href={member.socialLinks.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-rose-500 transition-all">
                                                    <Instagram size={14} />
                                                </a>
                                            )}
                                            {member.socialLinks.facebook && (
                                                <a href={member.socialLinks.facebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-blue-800 transition-all">
                                                    <Facebook size={14} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{member.name}</h3>
                                        <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">{member.position}</p>
                                    </div>

                                    <div className="space-y-2.5 mb-6">
                                        <div className="flex items-start gap-2.5 text-slate-500">
                                            <GraduationCap size={16} className="shrink-0 text-slate-400" />
                                            <span className="text-xs line-clamp-1">{member.study}</span>
                                        </div>
                                        <div className="flex items-start gap-2.5 text-slate-500">
                                            <Briefcase size={16} className="shrink-0 text-slate-400" />
                                            <span className="text-xs line-clamp-1">{member.experience}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-auto pt-5 border-t border-slate-50 flex items-center gap-2">
                                        <Link
                                            href={`/our-team/${member._id}/edit`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-bold py-2 rounded-lg transition-all"
                                        >
                                            <Edit size={14} /> Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(member._id!, member.name)}
                                            disabled={deletingId === member._id}
                                            className="w-10 h-9 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all disabled:opacity-50"
                                        >
                                            {deletingId === member._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
