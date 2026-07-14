// app/(protected)/services/[id]/edit/page.tsx
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, Loader2, Save, Type, Settings, Info,
    Home, Building2, Globe, Scale, Compass, Leaf,
    CheckSquare, TrendingUp, Gavel, Plus, Trash2, AlertCircle
} from 'lucide-react';
import { getService, updateService } from '@/lib/serviceApi';

// Predefined Icon Preset Options
const ICON_OPTIONS = [
    { value: 'home', label: 'House Outline', Icon: Home },
    { value: 'building', label: 'Commercial Buildings', Icon: Building2 },
    { value: 'globe', label: 'Integrated Sphere', Icon: Globe },
    { value: 'scale', label: 'Shield & Valuation Scale', Icon: Scale },
    { value: 'compass', label: 'Architect Drafting Compass', Icon: Compass },
    { value: 'leaf', label: 'Environmental Leaf', Icon: Leaf },
    { value: 'checkSquare', label: 'Checklist / Management', Icon: CheckSquare },
    { value: 'trendingUp', label: 'Trends / Advisory Chart', Icon: TrendingUp },
    { value: 'gavel', label: 'Legal Gavel / Arbitration', Icon: Gavel },
];

const ACCENT_PRESETS = [
    '#c9a84c', // Gold
    '#1d4ed8', // Blue
    '#15803d', // Green
    '#b91c1c', // Red
    '#4f46e5', // Indigo
    '#0891b2', // Cyan
];

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        number: '01',
        category: 'Core Development',
        tagline: '',
        description: '',
        accent: '#c9a84c',
        icon: 'home',
        status: 'published',
        featuresText: '', // Split by newline
    });

    const [stats, setStats] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        getService(id)
            .then(data => {
                setFormData({
                    title: data.title || '',
                    number: data.number || '01',
                    category: data.category || 'Core Development',
                    tagline: data.tagline || '',
                    description: data.description || '',
                    accent: data.accent || '#c9a84c',
                    icon: data.icon || 'home',
                    status: data.status || 'published',
                    featuresText: Array.isArray(data.features) ? data.features.join('\n') : '',
                });
                
                if (Array.isArray(data.stats) && data.stats.length > 0) {
                    setStats(data.stats);
                } else {
                    setStats([
                        { value: '', label: '' },
                        { value: '', label: '' },
                    ]);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleStatChange = (idx: number, field: 'value' | 'label', val: string) => {
        setStats(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            return next;
        });
    };

    const addStatField = () => {
        if (stats.length >= 4) return; // Limit to 4 stats
        setStats(prev => [...prev, { value: '', label: '' }]);
    };

    const removeStatField = (idx: number) => {
        setStats(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.number || !formData.category || !formData.tagline || !formData.description) {
            setError('Please fill in all required basic fields.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Process stats: filter out empty inputs
            const processedStats = stats.filter(s => s.value.trim() !== '' && s.label.trim() !== '');

            // Process features: split by newline
            const processedFeatures = formData.featuresText
                .split('\n')
                .map(f => f.trim())
                .filter(f => f !== '');

            const payload = {
                title: formData.title,
                number: formData.number,
                category: formData.category,
                tagline: formData.tagline,
                description: formData.description,
                accent: formData.accent,
                icon: formData.icon,
                status: formData.status,
                stats: processedStats,
                features: processedFeatures,
            };

            await updateService(id, payload);
            router.push('/services');
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading service details…</p>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#f9fbfd]">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <button onClick={() => router.push('/services')} className="hover:text-slate-600 transition-colors">Services</button>
                    <ChevronLeft size={12} className="rotate-180" />
                    <span className="text-slate-700 font-semibold truncate max-w-[200px]">{formData.title}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Update Service</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Modify information and preset configurations for this service</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm shrink-0 w-fit cursor-pointer"
                    >
                        {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Changes</>}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="px-4 lg:px-8 py-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── Left Column: Form Details ─────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-6">
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-sm text-sm font-medium flex items-center gap-2 mb-6">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {/* Basic info section */}
                    <div className="bg-white p-6 border border-slate-100 shadow-sm rounded-sm space-y-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                            <Type size={16} className="text-indigo-500" /> Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Service Title *</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g. Residential Development"
                                    className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sequence Number *</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.number}
                                    onChange={(e) => setFormData({...formData, number: e.target.value})}
                                    placeholder="e.g. 01"
                                    className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tagline *</label>
                            <input 
                                type="text"
                                required
                                value={formData.tagline}
                                onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                                placeholder="e.g. Homes that hold generations."
                                className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Description *</label>
                            <textarea 
                                rows={5}
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Describe this service in details..."
                                className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white resize-none"
                            />
                        </div>
                    </div>

                    {/* Dynamic Stats Section */}
                    <div className="bg-white p-6 border border-slate-100 shadow-sm rounded-sm space-y-6">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <Plus size={16} className="text-indigo-500" /> Service Statistics (Optional)
                            </h2>
                            <button
                                type="button"
                                onClick={addStatField}
                                disabled={stats.length >= 4}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 flex items-center gap-1 cursor-pointer"
                            >
                                <Plus size={14} /> Add Stat Box
                            </button>
                        </div>
                        <p className="text-xs text-slate-400">Display summary numeric callouts for this service card (max 4). (e.g. Value: "3000+", Label: "Homes Delivered")</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.map((st, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-sm relative space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Stat Box #{idx + 1}</span>
                                        {stats.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeStatField(idx)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Value</label>
                                            <input 
                                                type="text"
                                                value={st.value}
                                                onChange={e => handleStatChange(idx, 'value', e.target.value)}
                                                placeholder="e.g. 3000+"
                                                className="w-full border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs outline-none bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Label</label>
                                            <input 
                                                type="text"
                                                value={st.label}
                                                onChange={e => handleStatChange(idx, 'label', e.target.value)}
                                                placeholder="e.g. Homes Delivered"
                                                className="w-full border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs outline-none bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Features list section */}
                    <div className="bg-white p-6 border border-slate-100 shadow-sm rounded-sm space-y-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                            <Plus size={16} className="text-indigo-500" /> Key Features & Capabilities (One per line)
                        </h2>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Capabilities list</label>
                            <textarea 
                                rows={5}
                                value={formData.featuresText}
                                onChange={(e) => setFormData({...formData, featuresText: e.target.value})}
                                placeholder="Type each capability on a new line&#10;e.g. Vastu-Compliant Layouts&#10;Gated Township Planning&#10;Sustainable Infrastructure..."
                                className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Configuration settings ────────────────────── */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 border border-slate-100 shadow-sm rounded-sm space-y-6">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Settings size={14} className="text-slate-400" /> Configurations
                        </h3>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Status</label>
                            <select 
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white cursor-pointer"
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Category</label>
                            <select 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white cursor-pointer"
                            >
                                <option value="Core Development">Core Development</option>
                                <option value="Consultation">Consultation</option>
                            </select>
                        </div>

                        {/* Icon Selection presets dropdown */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Display Icon Preset</label>
                            <select 
                                value={formData.icon}
                                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                                className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white cursor-pointer"
                            >
                                {ICON_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <div className="mt-2.5 p-3 bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Icon Preview</span>
                                <div className="text-indigo-600 bg-white w-8 h-8 rounded border shadow-sm flex items-center justify-center">
                                    {(() => {
                                        const opt = ICON_OPTIONS.find(o => o.value === formData.icon);
                                        if (opt) {
                                            const Comp = opt.Icon;
                                            return <Comp size={18} />;
                                        }
                                        return <Home size={18} />;
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Custom Accent color picker */}
                        <div className="space-y-2.5 pt-4 border-t border-slate-100">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Service Accent Color</label>
                            <div className="flex flex-wrap gap-2">
                                {ACCENT_PRESETS.map(hex => (
                                    <button 
                                        key={hex}
                                        type="button"
                                        onClick={() => setFormData({...formData, accent: hex})}
                                        className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer shadow-sm relative transition-transform hover:scale-110"
                                        style={{ backgroundColor: hex }}
                                    >
                                        {formData.accent === hex && (
                                            <span className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input 
                                    type="color" 
                                    value={formData.accent}
                                    onChange={(e) => setFormData({...formData, accent: e.target.value})}
                                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                                />
                                <input 
                                    type="text"
                                    value={formData.accent}
                                    onChange={(e) => setFormData({...formData, accent: e.target.value})}
                                    placeholder="#c9a84c"
                                    className="flex-1 border border-slate-200 rounded-sm px-2.5 py-1 text-xs outline-none uppercase font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
