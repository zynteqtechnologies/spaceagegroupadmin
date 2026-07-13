// app/(protected)/our-journey/new/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2, Save, Milestone, AlertCircle } from 'lucide-react';

export default function NewJourneyEventPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        year: '',
        title: '',
        description: '',
        order: '0',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.year || !form.title || !form.description) {
            setError('Year, Title, and Description are required.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/timeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to create milestone');
            }
            router.push('/our-journey');
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <Link href="/our-journey" className="hover:text-slate-600 transition-colors">Our Journey</Link>
                    <ChevronLeft size={12} className="rotate-180" />
                    <span className="text-slate-700 font-semibold">New Milestone</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Add Journey Milestone</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Create a new milestone on the company history timeline.</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm w-fit cursor-pointer"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save size={14} /> Save Milestone
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 lg:px-8 py-6 bg-[#f9fbfd] min-h-[calc(100vh-140px)]">
                <div className="max-w-2xl">
                    <form onSubmit={handleSubmit} className="bg-white border border-slate-100 shadow-sm rounded-sm p-6 space-y-6">
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-sm text-sm font-semibold flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Milestone Year</label>
                                <input
                                    type="text"
                                    required
                                    value={form.year}
                                    onChange={e => setForm({ ...form, year: e.target.value })}
                                    placeholder="e.g. 1992"
                                    className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Display Order</label>
                                <input
                                    type="number"
                                    required
                                    value={form.order}
                                    onChange={e => setForm({ ...form, order: e.target.value })}
                                    placeholder="e.g. 0"
                                    className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Title</label>
                            <input
                                type="text"
                                required
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. The Beginning"
                                className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Description</label>
                            <textarea
                                required
                                rows={4}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Explain the achievement or history milestone..."
                                className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white resize-none"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

