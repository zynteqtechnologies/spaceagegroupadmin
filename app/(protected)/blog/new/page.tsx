// app/(protected)/blog/new/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, Loader2, Save, Image as ImageIcon, 
    Video, Type, Tag, Layout, Globe, Lock, 
    Settings, MessageSquare, Heart, Info
} from 'lucide-react';
import { createBlogPost } from '@/lib/blogApi';

export default function NewPostPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        tags: '',
        status: 'published',
        videoUrl: '',
        allowLikes: true,
        allowComments: true,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.category || !imageFile) {
            setError('Title, Description, Category, and Main Image are required.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('status', formData.status);
            data.append('videoUrl', formData.videoUrl);
            data.append('allowLikes', formData.allowLikes.toString());
            data.append('allowComments', formData.allowComments.toString());
            data.append('image', imageFile);
            
            const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            data.append('tags', JSON.stringify(tagsArray));

            await createBlogPost(data);
            router.push('/blog');
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
                    onClick={() => router.push('/blog')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 font-medium hover:text-slate-600 transition-colors mb-4"
                >
                    <ChevronLeft size={14} /> Back to Dashboard
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">Create New Article</h1>
                        <p className="text-sm text-slate-400 mt-1">Compose and publish fresh content for your audience</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Publish Content</>}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="px-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Left Column: Main Editor ─────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-6">
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
                            <Info size={16} /> {error}
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Type size={12} className="text-blue-500" /> Article Title
                            </label>
                            <input 
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Enter a catchy headline..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 text-lg font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Layout size={12} className="text-blue-500" /> Featured Image
                            </label>
                            <div className="relative aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group cursor-pointer">
                                {preview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                                        <ImageIcon size={48} strokeWidth={1} className="mb-2" />
                                        <span className="text-sm font-bold uppercase tracking-widest">Upload Cover Photo</span>
                                        <span className="text-[10px] font-medium mt-1">Recommended: 1200x630px</span>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Type size={12} className="text-blue-500" /> Story Content
                            </label>
                            <textarea 
                                rows={12}
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Draft your content here..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Settings & Metadata ───────────────────────── */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Settings size={14} className="text-slate-400" /> Publishing
                            </h3>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <select 
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all cursor-pointer"
                                >
                                    <option value="published">Immediate Release</option>
                                    <option value="draft">Save as Draft</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    placeholder="e.g. Real Estate News"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                    <Tag size={12} /> Tags (Comma separated)
                                </label>
                                <input 
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                                    placeholder="luxury, architecture, mumbai"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 space-y-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Video size={14} className="text-slate-400" /> Embedded Media
                            </h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">YouTube Video Link</label>
                                <input 
                                    type="text"
                                    value={formData.videoUrl}
                                    onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 space-y-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={14} className="text-slate-400" /> Engagement
                            </h3>
                            
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-800 uppercase">Allow Likes</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Public heart counts</span>
                                </div>
                                <input 
                                    type="checkbox"
                                    checked={formData.allowLikes}
                                    onChange={(e) => setFormData({...formData, allowLikes: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-800 uppercase">Allow Comments</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">User discussions</span>
                                </div>
                                <input 
                                    type="checkbox"
                                    checked={formData.allowComments}
                                    onChange={(e) => setFormData({...formData, allowComments: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
