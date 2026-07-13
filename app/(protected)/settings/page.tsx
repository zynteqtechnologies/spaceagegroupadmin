// app/(protected)/settings/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, ChevronRight, Loader2, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
    const [form, setForm] = useState({
        yearsOfExcellence: '35+',
        projectsCompleted: '120+',
        happyFamilies: '5000+',
        clientSatisfaction: '98%',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setForm({
                        yearsOfExcellence: data.yearsOfExcellence || '35+',
                        projectsCompleted: data.projectsCompleted || '120+',
                        happyFamilies: data.happyFamilies || '5000+',
                        clientSatisfaction: data.clientSatisfaction || '98%',
                    });
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to save settings');
            }
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading settings…</p>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <Link href="/dashboard" className="hover:text-slate-600 transition-colors">Dashboard</Link>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold">Settings</span>
                </div>

                <h1 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
                    <Settings size={20} className="text-blue-600 animate-spin-slow" />
                    Global Website Settings
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">Configure live achievements and statistic numbers shown on your main homepage and about pages.</p>
            </div>

            {/* Content */}
            <div className="px-4 lg:px-8 py-6 bg-[#f9fbfd] min-h-[calc(100vh-140px)]">
                <div className="max-w-2xl">
                    <form onSubmit={handleSave} className="bg-white border border-slate-100 shadow-sm rounded-sm p-6 space-y-6">
                        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Website Achievement Counters</h2>

                        {success && (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-sm text-sm font-semibold flex items-center gap-2 transition-all">
                                <CheckCircle size={16} /> Website settings saved successfully!
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Years of Excellence</label>
                                <input
                                    type="text"
                                    required
                                    value={form.yearsOfExcellence}
                                    onChange={e => setForm({ ...form, yearsOfExcellence: e.target.value })}
                                    placeholder="e.g. 35+"
                                    className="w-full border border-slate-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                />
                                <p className="text-[10px] text-slate-400">Default fallback: 35+</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Projects Completed</label>
                                <input
                                    type="text"
                                    required
                                    value={form.projectsCompleted}
                                    onChange={e => setForm({ ...form, projectsCompleted: e.target.value })}
                                    placeholder="e.g. 120+"
                                    className="w-full border border-slate-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                />
                                <p className="text-[10px] text-slate-400">Default fallback: 120+</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Happy Families</label>
                                <input
                                    type="text"
                                    required
                                    value={form.happyFamilies}
                                    onChange={e => setForm({ ...form, happyFamilies: e.target.value })}
                                    placeholder="e.g. 5000+"
                                    className="w-full border border-slate-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                />
                                <p className="text-[10px] text-slate-400">Default fallback: 5000+</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Client Satisfaction</label>
                                <input
                                    type="text"
                                    required
                                    value={form.clientSatisfaction}
                                    onChange={e => setForm({ ...form, clientSatisfaction: e.target.value })}
                                    placeholder="e.g. 98%"
                                    className="w-full border border-slate-200 rounded-sm px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                />
                                <p className="text-[10px] text-slate-400">Default fallback: 98%</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-5 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-sm transition-all shadow-sm hover:shadow disabled:opacity-50 cursor-pointer"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={15} /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
