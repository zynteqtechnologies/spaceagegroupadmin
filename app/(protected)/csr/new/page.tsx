// app/(protected)/csr/new/page.tsx
'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ChevronLeft, Loader2, Save, Sparkles, AlertCircle, Plus, Trash2, 
    CloudUpload, Youtube, AlignLeft, Info, Calendar, Palette, Tag 
} from 'lucide-react';

interface NewItemPreview {
    file: File | null;
    externalUrl?: string;
    previewUrl: string;
    title: string;
    description: string;
    category: 'image' | 'video' | 'other';
    provider: 'cloudinary' | 'youtube' | 'none';
}

export default function NewCSRPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: '',
        slug: '',
        category: 'Education & Welfare',
        date: '',
        description: '',
        longDescription: '',
        impact: '',
        color: '#c9a84c',
    });

    const [newItems, setNewItems] = useState<NewItemPreview[]>([]);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        const previews = files.map((file, i) => {
            const isVideo = file.type.startsWith('video/');
            return {
                file,
                previewUrl: URL.createObjectURL(file),
                title: file.name.replace(/\.[^/.]+$/, ''),
                description: '',
                category: (isVideo ? 'video' : 'image') as any,
                provider: 'cloudinary' as const,
            };
        });
        setNewItems(prev => [...prev, ...previews]);
    };

    const addYoutubeVideo = () => {
        if (!youtubeUrl.trim()) return;
        const newItem: NewItemPreview = {
            file: null,
            externalUrl: youtubeUrl.trim(),
            previewUrl: '',
            title: 'YouTube Video',
            description: '',
            category: 'video',
            provider: 'youtube'
        };
        setNewItems(prev => [...prev, newItem]);
        setYoutubeUrl('');
        setError(null);
    };

    const updateNewItem = (index: number, patch: Partial<NewItemPreview>) => {
        setNewItems(prev => prev.map((f, i) => i === index ? { ...f, ...patch } : f));
    };

    const removeNewItem = (index: number) => {
        setNewItems(prev => {
            if (prev[index].file) URL.revokeObjectURL(prev[index].previewUrl);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleTitleChange = (title: string) => {
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        setForm(prev => ({ ...prev, title, slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { title, slug, category, date, description, longDescription, impact } = form;

        if (!title || !slug || !category || !date || !description || !longDescription || !impact) {
            setError('All fields except Accent Color and Assets are required.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('slug', slug);
            formData.append('category', category);
            formData.append('date', date);
            formData.append('description', description);
            formData.append('longDescription', longDescription);
            formData.append('impact', impact);
            formData.append('color', form.color);

            const filesToUpload = newItems.filter(p => !!p.file).map(p => p.file!);
            const newDetails = newItems.map(p => ({
                title: p.title,
                description: p.description,
                category: p.category,
                provider: p.provider,
                url: p.provider === 'youtube' ? p.externalUrl : undefined,
            }));

            formData.append('newDetails', JSON.stringify(newDetails));
            formData.append('existingItems', JSON.stringify([]));

            filesToUpload.forEach(f => formData.append('files', f));

            const res = await fetch('/api/csr', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to create CSR post');
            }

            newItems.forEach(p => p.file && URL.revokeObjectURL(p.previewUrl));
            router.push('/csr');
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#f9fbfd] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <button onClick={() => router.push('/csr')} className="hover:text-slate-600 transition-colors">CSR Posts</button>
                    <ChevronLeft size={12} className="rotate-180" />
                    <span className="text-slate-700 font-semibold truncate max-w-[200px]">New Post</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Create CSR Post</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Publish a new community impact campaign or initiative details.</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm shrink-0 w-fit cursor-pointer"
                    >
                        {submitting ? (
                            <><Loader2 size={14} className="animate-spin" /> Saving...</>
                        ) : (
                            <><Save size={14} /> Save Post</>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="px-4 lg:px-8 py-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* ── Left Column: Config Settings & Advice ──────────────────── */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 border border-slate-100 shadow-sm rounded-sm space-y-5">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Palette size={14} className="text-slate-400" /> Settings
                        </h3>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Category</label>
                            <select
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white font-semibold text-slate-700 cursor-pointer"
                            >
                                <option value="Education">Education</option>
                                <option value="Education & Welfare">Education & Welfare</option>
                                <option value="Environment">Environment</option>
                                <option value="Health">Health</option>
                                <option value="National Pride">National Pride</option>
                                <option value="Disaster Relief">Disaster Relief</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Campaign Date</label>
                            <input
                                type="text"
                                required
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                placeholder="e.g. March 2024"
                                className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white font-medium text-slate-700"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Accent Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={form.color}
                                    onChange={e => setForm({ ...form, color: e.target.value })}
                                    className="w-10 h-9 p-0 border border-slate-200 rounded-sm cursor-pointer shrink-0"
                                />
                                <input
                                    type="text"
                                    value={form.color}
                                    onChange={e => setForm({ ...form, color: e.target.value })}
                                    placeholder="#c9a84c"
                                    className="flex-1 border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Impact Statement</label>
                            <input
                                type="text"
                                required
                                value={form.impact}
                                onChange={e => setForm({ ...form, impact: e.target.value })}
                                placeholder="e.g. 50+ Children Supported"
                                className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white text-slate-800 font-bold"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-sm shadow-sm text-white space-y-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 opacity-60">
                            <Info size={12} /> Tips
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Upload high-quality images and name them appropriately to present details clearly inside the visitor page lightbox modals.
                        </p>
                    </div>
                </div>

                {/* ── Right Column: Form Inputs & Asset Queues ───────────────── */}
                <div className="lg:col-span-8 space-y-6">
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-sm text-sm font-medium flex items-center gap-2">
                            <Info size={16} /> {error}
                        </div>
                    )}

                    {/* General Text Fields Wrapper */}
                    <div className="bg-white p-6 border border-slate-100 shadow-sm rounded-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Initiative Title</label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={e => handleTitleChange(e.target.value)}
                                    placeholder="e.g. Tree Plantation Drive"
                                    className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white font-bold text-slate-900"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Slug URL</label>
                                <input
                                    type="text"
                                    required
                                    value={form.slug}
                                    onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                                    placeholder="e.g. tree-plantation-drive"
                                    className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-slate-50 text-slate-500 font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Short Card Description</label>
                            <textarea
                                required
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Write a short teaser summary text shown on the grid cards..."
                                rows={2}
                                className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white text-slate-600 leading-relaxed"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Detailed Long Description</label>
                            <textarea
                                required
                                value={form.longDescription}
                                onChange={e => setForm({ ...form, longDescription: e.target.value })}
                                placeholder="Detailed story narrative shown inside the campaign view modal..."
                                rows={5}
                                className="w-full border border-slate-200 rounded-sm px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white text-slate-600 leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Media Assets Manager Wrapper */}
                    <div className="bg-white p-6 border border-slate-100 shadow-sm rounded-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Campaign Assets</h3>
                            <span className="text-[10px] text-slate-400 font-medium">Add slides for the gallery lightbox</span>
                        </div>

                        {/* File upload block */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-8 text-center cursor-pointer transition-colors space-y-1.5 bg-slate-50/50"
                        >
                            <CloudUpload className="mx-auto text-slate-400" size={28} />
                            <div className="text-xs font-bold text-slate-700">Upload Campaign Images</div>
                            <div className="text-[10px] text-slate-400">Drag & drop or click to browse files</div>
                            <input 
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* YouTube video block */}
                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add YouTube Link</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={youtubeUrl}
                                    onChange={e => setYoutubeUrl(e.target.value)}
                                    placeholder="Paste YouTube video URL..."
                                    className="flex-1 border border-slate-200 rounded-sm px-3 py-1.5 text-xs outline-none focus:border-indigo-400 transition-all bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={addYoutubeVideo}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 rounded-sm flex items-center justify-center transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Asset Queue List */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asset Queue ({newItems.length})</div>
                            {newItems.length === 0 ? (
                                <div className="text-center py-8 text-xs text-slate-300 italic font-medium">No assets added yet</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {newItems.map((item, idx) => (
                                        <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 relative space-y-3 flex flex-col justify-between">
                                            <button 
                                                type="button"
                                                onClick={() => removeNewItem(idx)}
                                                className="absolute right-2 top-2 text-slate-300 hover:text-rose-500 w-6 h-6 rounded-md hover:bg-rose-50 flex items-center justify-center transition-all z-10"
                                            >
                                                <Trash2 size={12} />
                                            </button>

                                            <div className="space-y-2">
                                                <div className="aspect-video relative rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                                                    {item.provider === 'youtube' ? (
                                                        <div className="flex flex-col items-center justify-center text-rose-500 gap-1">
                                                            <Youtube size={24} />
                                                            <span className="text-[8px] font-black uppercase">YouTube URL</span>
                                                        </div>
                                                    ) : item.file && item.file.type.startsWith('video/') ? (
                                                        <div className="flex flex-col items-center justify-center text-indigo-500 gap-1">
                                                            <Youtube size={24} />
                                                            <span className="text-[8px] font-black uppercase">Cloudinary Video</span>
                                                        </div>
                                                    ) : (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img 
                                                            src={item.previewUrl} 
                                                            alt="preview" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>

                                                <div className="space-y-2 pt-1">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Asset Title</span>
                                                        <input 
                                                            type="text"
                                                            value={item.title}
                                                            onChange={e => updateNewItem(idx, { title: e.target.value })}
                                                            placeholder="Asset title..."
                                                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-colors"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Asset Description</span>
                                                        <input 
                                                            type="text"
                                                            value={item.description}
                                                            onChange={e => updateNewItem(idx, { description: e.target.value })}
                                                            placeholder="Asset description..."
                                                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-medium text-slate-500 outline-none focus:border-indigo-400 transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}
