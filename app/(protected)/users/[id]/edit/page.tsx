// app/(protected)/users/[id]/edit/page.tsx
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Loader2, Save, User2,
    Mail, Lock, Shield, Info, AlertCircle, Key, RefreshCcw
} from 'lucide-react';
import { getUser, updateUser } from '@/lib/userApi';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'manager',
    });

    useEffect(() => {
        loadUser();
    }, [id]);

    const loadUser = async () => {
        try {
            const data = await getUser(id);
            setFormData({
                name: data.name,
                email: data.email,
                role: data.role || 'manager',
                password: '', // Password stays empty unless changing
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password && formData.password.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const updateData: any = {
                name: formData.name,
                email: formData.email,
                role: formData.role
            };
            if (formData.password) updateData.password = formData.password;

            await updateUser(id, updateData);
            setSuccess('Profile updated successfully!');
            setFormData(prev => ({ ...prev, password: '' }));
            setTimeout(() => {
                router.push('/users');
            }, 1000);
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading user data…</p>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-8 py-6 mb-8">
                <button
                    onClick={() => router.push('/users')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 font-medium hover:text-slate-600 transition-colors mb-4"
                >
                    <ChevronLeft size={14} /> Back to Users
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-base">
                                {formData.name.charAt(0).toUpperCase()}
                            </div>
                            Update Administrator Profile
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">Modify account details and reset dashboard passwords</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Profile</>}
                    </button>
                </div>
            </div>

            <div className="px-8 mx-auto">
                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
                        <RefreshCcw size={16} className="animate-spin-slow" /> {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <User2 size={12} className="text-blue-500" /> Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Mail size={12} className="text-blue-500" /> Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Password Reset Section */}
                    <div className="pt-8 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Key size={14} className="text-indigo-500" /> Reset Password
                            </h3>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Optional</span>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter new password to reset..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                />
                                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                            <p className="text-[10px] text-slate-400 ml-1">Leave blank if you don&apos;t want to change the password.</p>
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-50">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Shield size={12} className="text-blue-600" /> Assigned Role
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all cursor-pointer"
                            >
                                <option value="administrator">Administrator</option>
                                <option value="manager">Manager (Restricted)</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
