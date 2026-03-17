// app/dashboard/hero-image/page.tsx
'use client';
import { useState, useEffect } from 'react';
import MediaUploader from '@/components/MediaUploader';
import MediaGallery from '@/components/MediaGallery';
import { getHeroMedia } from '@/lib/mediaApi';
import type { HeroImageDoc } from '@/types/media';
import { CloudUpload, LayoutGrid, Loader2, ImageIcon, Film, ChevronRight } from 'lucide-react';

export default function HeroImagePage() {
  const [doc, setDoc]       = useState<HeroImageDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState<'upload' | 'gallery'>('upload');

  useEffect(() => {
    getHeroMedia()
      .then((d) => { setDoc(d); setTab('gallery'); })
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={28} className="text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading…</p>
      </div>
    );
  }

  const imageCount = doc?.images.filter(i => i.mediaType !== 'video').length ?? 0;
  const videoCount = doc?.images.filter(i => i.mediaType === 'video').length ?? 0;
  const totalCount = doc?.images.length ?? 0;

  return (
    <div>
      {/* ── Page header — white, clean ──────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-8 py-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Dashboard</span>
          <ChevronRight size={12} />
          <span className="text-slate-700 font-semibold">Hero Image</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Hero Images</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage images and videos for your hero section</p>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2">
              <ImageIcon size={14} className="text-indigo-500" />
              <span className="text-xs font-bold text-indigo-700">{imageCount} Images</span>
            </div>
            <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-2">
              <Film size={14} className="text-violet-500" />
              <span className="text-xs font-bold text-violet-700">{videoCount} Videos</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-5">
          {[
            { key: 'upload'  as const, label: 'Upload',  icon: <CloudUpload size={14} /> },
            { key: 'gallery' as const, label: 'Gallery', icon: <LayoutGrid size={14} />, count: totalCount },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === t.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                  ${tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="px-8 py-6">

        {tab === 'upload' && (
          <MediaUploader
            existingDoc={doc}
            onSuccess={(updated) => { setDoc(updated); setTab('gallery'); }}
          />
        )}

        {tab === 'gallery' && doc && doc.images.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <MediaGallery doc={doc} onUpdate={setDoc} />
          </div>
        )}

        {tab === 'gallery' && (!doc || doc.images.length === 0) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                <LayoutGrid size={28} className="text-slate-300" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700 mb-1">No images yet</p>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Upload your first image or video to start building your hero section
              </p>
            </div>
            <button
              onClick={() => setTab('upload')}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <CloudUpload size={15} /> Upload Media
            </button>
          </div>
        )}
      </div>
    </div>
  );
}