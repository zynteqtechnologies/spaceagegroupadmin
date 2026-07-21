// app/(protected)/our-journey/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Milestone, Plus, Pencil, Trash2, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { useModal } from '@/context/ModalContext';

interface TimelineEvent {
    _id?: string;
    id?: string;
    year: string;
    title: string;
    description: string;
    order: number;
}

export default function JourneyEventsPage() {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { showAlert, showConfirm } = useModal();

    const fetchEvents = () => {
        fetch('/api/timeline')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setEvents(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleDelete = async (id: string, label: string) => {
        const confirmed = await showConfirm('Delete Milestone', `Are you sure you want to delete the milestone "${label}"?`);
        if (!confirmed) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/timeline/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete milestone');
            setEvents(events.filter(e => (e._id || e.id) !== id));
            showAlert('Deleted', `Milestone "${label}" has been deleted.`, 'success');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to delete milestone', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading timeline milestones…</p>
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
                    <span className="text-slate-700 font-semibold">Our Journey</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
                            <Milestone size={20} className="text-blue-600" />
                            Our Journey Milestones
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage the timeline event milestones shown on your About page.</p>
                    </div>

                    <Link
                        href="/our-journey/new"
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-sm transition-all shadow-sm w-fit"
                    >
                        <Plus size={16} /> Add Milestone
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 lg:px-8 py-6 bg-[#f9fbfd] min-h-[calc(100vh-140px)]">
                {events.length === 0 ? (
                    <div className="max-w-2xl bg-white border border-slate-200 shadow-sm rounded-sm p-12 text-center space-y-4">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                            <Milestone size={24} />
                        </div>
                        <h3 className="text-slate-900 font-bold">No Milestones Added Yet</h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                            Create dynamic timeline milestones to showcase the story of Space Age Group on the website.
                        </p>
                        <Link
                            href="/our-journey/new"
                            className="inline-flex items-center gap-1.5 bg-slate-905 bg-slate-900 text-white text-xs font-semibold px-4 py-2 hover:bg-slate-800 rounded-sm transition-all"
                        >
                            <Plus size={14} /> Add First Milestone
                        </Link>
                    </div>
                ) : (
                    <div className="max-w-4xl bg-white border border-slate-100 shadow-sm rounded-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 w-24">Year</th>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Description</th>
                                    <th className="px-6 py-4 w-24 text-center">Order</th>
                                    <th className="px-6 py-4 w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {events.map((event, idx) => {
                                    const eventId = event._id || event.id || `event-${idx}`;
                                    return (
                                        <tr key={eventId} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-blue-600">{event.year}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">{event.title}</td>
                                            <td className="px-6 py-4 text-slate-500 max-w-xs truncate hidden md:table-cell">{event.description}</td>
                                            <td className="px-6 py-4 text-center font-medium text-slate-700">{event.order}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    <Link
                                                        href={`/our-journey/${eventId}/edit`}
                                                        className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={15} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(eventId, `${event.year} - ${event.title}`)}
                                                        disabled={deletingId === eventId}
                                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        {deletingId === eventId ? (
                                                            <Loader2 size={15} className="animate-spin text-rose-500" />
                                                        ) : (
                                                            <Trash2 size={15} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
