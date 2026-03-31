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
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">Create New Admin</h1>
                        <p className="text-sm text-slate-400 mt-1">Set up a new administrator account for dashboard access</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Create Account</>}
                    </button>
                </div>
            </div>

            <div className="px-8 mx-auto">
                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
                        <AlertCircle size={16} /> {error}
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
                                placeholder="e.g. Admin User"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm focus:shadow-md"
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
                                placeholder="admin@example.com"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm focus:shadow-md"
                            />
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="pt-8 border-t border-slate-50">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Key size={14} className="text-indigo-500" /> Security Credentials
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm focus:shadow-md"
                                    />
                                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm focus:shadow-md"
                                    />
                                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>
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
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all appearance-none cursor-pointer"
                            >
                                <option value="administrator">Administrator</option>
                                <option value="manager">Manager (Restricted)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 shrink-0">
                            <Info size={18} className="text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Note on Access</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                Administrators have full access to all dashboard features including user management. Ensure that the email provided is valid for potential password resets.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
