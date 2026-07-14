// app/(protected)/services/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Loader2, Trash2, Edit, Info, ChevronRight,
    Home, Building2, Globe, Scale, Compass, Leaf,
    CheckSquare, TrendingUp, Gavel, FileText
} from 'lucide-react';
import { listServices, deleteService } from '@/lib/serviceApi';
import { useModal } from '@/context/ModalContext';

// Predefined Icon Component Mapper
const IconMapper: Record<string, any> = {
    home: Home,
    building: Building2,
    globe: Globe,
    scale: Scale,
    compass: Compass,
    leaf: Leaf,
    checkSquare: CheckSquare,
    trendingUp: TrendingUp,
    gavel: Gavel,
};

export default function ServicesListingPage() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { showAlert, showConfirm } = useModal();

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const data = await listServices();
            setServices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        const confirmed = await showConfirm('Delete Service', `Are you sure you want to delete service "${title}"?`);
        if (!confirmed) return;
        setDeletingId(id);
        try {
            await deleteService(id);
            setServices(prev => prev.filter(s => s._id !== id));
            showAlert('Deleted', `Service "${title}" has been deleted.`, 'success');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to delete service', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredServices = services.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tagline.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading services list…</p>
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
                    <span className="text-slate-700 font-semibold">Services</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">
                            Services Management
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage construction & consultation services displayed on your site</p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#f9fbfd] rounded-sm border border-gray-200 shadow-sm px-3.5 py-2">
                            <FileText size={14} className="text-black" />
                            <span className="text-xs font-bold text-black">{services.length} Total</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5">
                    <div className="flex items-center gap-1">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 text-white shadow-sm rounded-sm">
                            <FileText size={14} />
                            All Services
                        </button>
                        <Link
                            href="/services/new"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-[#f9fbfd] rounded-sm border border-gray-200 hover:bg-slate-50 transition-all"
                        >
                            <Plus size={14} />
                            Create New
                        </Link>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-4 py-2 bg-[#f9fbfd] border border-gray-200 rounded-sm text-sm focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none w-full sm:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-6 bg-[#f9fbfd] min-h-[calc(100vh-140px)]">
                {filteredServices.length === 0 ? (
                    <div className="bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                            <Compass size={28} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-700 mb-1">No services found</p>
                            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                                Create your first service to showcase it on your website.
                            </p>
                        </div>
                        <Link
                            href="/services/new"
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <Plus size={15} /> New Service
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredServices.map((service) => {
                            const IconComponent = IconMapper[service.icon] || Home;
                            return (
                                <div key={service._id} className="group bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between">
                                    
                                    {/* Card Header Info */}
                                    <div className="p-6 pb-4">
                                        <div className="flex items-start justify-between mb-4">
                                            {/* Icon with accent border */}
                                            <div 
                                                className="w-10 h-10 rounded-sm flex items-center justify-center border shadow-sm"
                                                style={{ 
                                                    borderColor: `${service.accent}40`,
                                                    backgroundColor: `${service.accent}08`,
                                                    color: service.accent
                                                }}
                                            >
                                                <IconComponent size={20} />
                                            </div>

                                            {/* Number Badge */}
                                            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded px-2 py-0.5">
                                                No. {service.number}
                                            </span>
                                        </div>

                                        {/* Category & Status */}
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span 
                                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                                                style={{ 
                                                    backgroundColor: service.category === 'Core Development' ? '#eff6ff' : '#f0fdf4',
                                                    color: service.category === 'Core Development' ? '#1d4ed8' : '#15803d'
                                                }}
                                            >
                                                {service.category}
                                            </span>
                                            
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                service.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {service.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Titles */}
                                        <h3 className="font-serif font-bold text-slate-900 text-lg leading-tight mb-1">{service.title}</h3>
                                        <p className="text-xs text-slate-400 font-medium italic mb-3">"{service.tagline}"</p>
                                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">{service.description}</p>

                                        {/* Stats Row */}
                                        {service.stats && service.stats.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-4 mb-2">
                                                {service.stats.map((st: any, idx: number) => (
                                                    <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded px-3 py-2 text-center">
                                                        <p className="font-serif font-bold text-slate-900 text-sm">{st.value}</p>
                                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">{st.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-2 mt-auto">
                                        <Link
                                            href={`/services/${service._id}/edit`}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-sm transition-all shadow-sm cursor-pointer"
                                        >
                                            <Edit size={12} /> Edit Details
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(service._id, service.title)}
                                            disabled={deletingId === service._id}
                                            className="w-10 h-8 flex items-center justify-center rounded-sm bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all disabled:opacity-50 cursor-pointer"
                                            title="Delete Service"
                                        >
                                            {deletingId === service._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
