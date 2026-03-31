// app/(protected)/our-team/new/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Loader2, Save, Camera,
    Linkedin, Instagram, Facebook, GraduationCap,
    Briefcase, Building2, User2, AlignLeft, Info
} from 'lucide-react';
import { createTeamMember } from '@/lib/teamApi';

export default function NewTeamMemberPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        position: '',
        study: '',
        experience: '',
        description: '',
        relationToGroup: '',
        linkedin: '',
        instagram: '',
        facebook: '',
        order: '0',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.position || !imageFile) {
            setError('Name, Position, and Profile Image are required.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => data.append(key, value));
            data.append('image', imageFile);

            await createTeamMember(data);
            router.push('/our-team');
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-20">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-8 py-6 mb-8">
                <button
                    onClick={() => router.push('/our-team')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 font-medium hover:text-slate-600 transition-colors mb-4"
                >
                    <ChevronLeft size={14} /> Back to Team
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">Add New Member</h1>
                        <p className="text-sm text-slate-400 mt-1">Create a new professional profile for your team</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Member</>}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="px-8 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Left Column: Profile Photo ───────────────────────────────── */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Camera size={16} className="text-blue-500" />
                            Profile Photo
                        </h3>

                        <div className="relative aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group cursor-pointer">
                            {preview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                                    <User2 size={48} strokeWidth={1} className="mb-2" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Upload Image</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        <p className="mt-4 text-[11px] text-slate-400 text-center leading-relaxed">
                            Recommended: Square image (800x800px). JPG, PNG or WebP.
                        </p>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200/50 text-white space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 opacity-60">
                            <Info size={14} /> Tips
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Make sure to include social links to help clients connect with the team member directly through the website.
                        </p>
                    </div>
                </div>

                {/* ── Right Column: Details ────────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-6">
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                            <Info size={16} /> {error}
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Position / Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    placeholder="e.g. Senior Architect"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Education & Experience */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                    <GraduationCap size={12} /> Education / Study
                                </label>
                                <input
                                    type="text"
                                    value={formData.study}
                                    onChange={(e) => setFormData({ ...formData, study: e.target.value })}
                                    placeholder="e.g. Masters in Architecture"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                    <Briefcase size={12} /> Work Experience
                                </label>
                                <input
                                    type="text"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    placeholder="e.g. 10+ Years in Civil Design"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Description & Relation */}
                        <div className="space-y-2 pt-6 border-t border-slate-50">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <AlignLeft size={12} /> Professional Biography
                            </label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the professional background and role..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-2 pt-6 border-t border-slate-50">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Building2 size={12} /> Relation to Space Age Group
                            </label>
                            <input
                                type="text"
                                value={formData.relationToGroup}
                                onChange={(e) => setFormData({ ...formData, relationToGroup: e.target.value })}
                                placeholder="e.g. Lead Designer since 2018"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Social Links */}
                        <div className="pt-8 border-t border-slate-50">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Social Profiles</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.linkedin}
                                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                        placeholder="LinkedIn URL"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
                                    />
                                    <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={14} />
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.instagram}
                                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                        placeholder="Instagram URL"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-rose-400 focus:bg-white transition-all"
                                    />
                                    <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500" size={14} />
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.facebook}
                                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                        placeholder="Facebook URL"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
                                    />
                                    <Facebook className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={14} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Display Order</label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                                    className="w-24 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
