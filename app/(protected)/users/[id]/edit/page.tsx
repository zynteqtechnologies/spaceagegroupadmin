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
        <div className="min-h-[calc(100vh-64px)] bg-[#f9fbfd]">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <button onClick={() => router.push('/users')} className="hover:text-slate-600 transition-colors">Users</button>
                    <ChevronLeft size={12} className="rotate-180" />
                    <span className="text-slate-700 font-semibold truncate max-w-[200px]">{formData.name}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">
                            Update Administrator
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Modify account details and reset dashboard passwords</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm shrink-0 w-fit"
                    >
                        {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Changes</>}
                    </button>
                </div>
            </div>

            <div className="px-4 lg:px-8 py-6">
                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-sm text-sm font-medium flex items-center gap-2 mb-6 max-w-3xl">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-sm text-sm font-medium flex items-center gap-2 mb-6 max-w-3xl">
                        <RefreshCcw size={16} className="animate-spin-slow" /> {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-6 border border-slate-100 shadow-sm max-w-3xl space-y-6">
                    <h2 className="text-base font-bold text-slate-800 mb-4">Profile Information</h2>
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-slate-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full border border-slate-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block">
                                Assigned Role
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full border border-slate-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white cursor-pointer"
                            >
                                <option value="administrator">Administrator</option>
                                <option value="manager">Manager (Restricted)</option>
                            </select>
                        </div>
                    </div>

                    {/* Password Reset Section */}
                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                                <Key size={14} className="text-indigo-500" /> Reset Password
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-sm">Optional</span>
                        </div>
                        <div className="space-y-1.5 max-w-md">
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter new password to reset..."
                                className="w-full border border-slate-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                            />
                            <p className="text-xs text-slate-400">Leave blank if you don&apos;t want to change the password.</p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
