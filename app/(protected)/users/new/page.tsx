// app/(protected)/users/new/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Loader2, Save, User2,
    Mail, Lock, Shield, Info, AlertCircle, Key
} from 'lucide-react';
import { createUser } from '@/lib/userApi';

export default function NewUserPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'manager',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const { confirmPassword, ...submitData } = formData;
            await createUser(submitData);
            router.push('/users');
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#f9fbfd]">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <button onClick={() => router.push('/users')} className="hover:text-slate-600 transition-colors">Users</button>
                    <ChevronLeft size={12} className="rotate-180" />
                    <span className="text-slate-700 font-semibold truncate max-w-[200px]">New Admin</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Create New Admin</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Set up a new administrator account for dashboard access</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm shrink-0 w-fit"
                    >
                        {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Create Account</>}
                    </button>
                </div>
            </div>

            <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-sm text-sm font-medium flex items-center gap-2 mb-6">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-6 border border-slate-100 shadow-sm rounded-sm space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 block">
                                <User2 size={14} className="text-blue-500" /> Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Admin User"
                                className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 block">
                                <Mail size={14} className="text-blue-500" /> Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="admin@example.com"
                                className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                            />
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="pt-6 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Key size={14} className="text-slate-400" /> Security Credentials
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block">Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full border border-slate-200 rounded-sm pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                    />
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full border border-slate-200 rounded-sm pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                    />
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 block">
                                <Shield size={14} className="text-blue-500" /> Assigned Role
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white cursor-pointer appearance-none"
                            >
                                <option value="administrator">Administrator</option>
                                <option value="manager">Manager (Restricted)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0">
                            <Info size={16} className="text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-800">Note on Access</h4>
                            <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                                Administrators have full access to all dashboard features including user management. Ensure that the email provided is valid for potential password resets.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
