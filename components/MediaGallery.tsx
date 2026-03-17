// components/MediaGallery.tsx
'use client';
import { useState } from 'react';
import { Trash2, Star, Video, X, ChevronLeft, ChevronRight, Maximize2, LayoutGrid } from 'lucide-react';
import { deleteMediaItem } from '@/lib/mediaApi';
import type { HeroImageDoc, MediaItem } from '@/types/media';

interface MediaGalleryProps {
  doc: HeroImageDoc;
  onUpdate?: (doc: HeroImageDoc) => void;
}

export default function MediaGallery({ doc, onUpdate }: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleting, setDeleting]           = useState<string | null>(null);
  const [filter, setFilter]               = useState<'all' | 'image' | 'video'>('all');

  const allImages = doc.images ?? [];
  const filtered  = filter === 'all' ? allImages : allImages.filter(m => m.mediaType === filter);
  const current   = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  const handleDelete = async (media: MediaItem) => {
    if (!media._id) return;
    if (!confirm(`Delete "${media.title}"?`)) return;
    setDeleting(media._id);
    try {
      const updated = await deleteMediaItem(doc._id, media._id);
      onUpdate?.(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const imageCount = allImages.filter(m => m.mediaType !== 'video').length;
  const videoCount = allImages.filter(m => m.mediaType === 'video').length;

  if (allImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
          <LayoutGrid size={24} className="text-slate-300" />
        </div>
        <p className="text-sm text-slate-400">No media uploaded yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-slate-800">Gallery</h2>

        <div className="flex items-center gap-3">
          {/* Filter pills */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {([
              { key: 'all',   label: 'All',    count: allImages.length },
              { key: 'image', label: 'Images', count: imageCount },
              { key: 'video', label: 'Videos', count: videoCount },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setLightboxIndex(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${filter === f.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {f.label}
                <span className={`min-w-[18px] text-center text-[10px] font-bold px-1 py-0.5 rounded
                  ${filter === f.key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400 font-medium">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((media, i) => (
          <div
            key={media._id ?? i}
            className="group relative rounded-xl overflow-hidden bg-slate-100 cursor-pointer aspect-[4/3]"
            onClick={() => setLightboxIndex(i)}
          >
            {/* Thumbnail */}
            {media.mediaType === 'video' ? (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Video size={24} className="text-white/70" />
                </div>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.url}
                alt={media.alt ?? media.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />

            {/* Expand icon — bottom right, shows on hover */}
            <div className="absolute bottom-2.5 right-2.5 w-8 h-8 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/40">
              <Maximize2 size={14} className="text-white" />
            </div>

            {/* Main badge */}
            {media.isMainImage && (
              <span className="absolute top-2.5 left-2.5 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm z-10">
                <Star size={8} fill="white" /> Main
              </span>
            )}

            {/* Delete — top right, shows on hover */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDelete(media); }}
              disabled={deleting === media._id}
              className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm text-slate-500 rounded-lg items-center justify-center shadow-sm hidden group-hover:flex hover:bg-rose-500 hover:text-white transition-all z-10"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {current && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(8,10,18,0.96)' }}
          onClick={() => setLightboxIndex(null)}
        >
          <div className="absolute inset-0 backdrop-blur-md" />

          {/* Close */}
          <button
            className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors z-20 border border-white/10"
            onClick={() => setLightboxIndex(null)}
          >
            <X size={18} />
          </button>

          {/* Counter pill */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/10 border border-white/10 text-white/60 text-xs font-semibold px-3 py-1.5 rounded-full z-20">
            {lightboxIndex + 1} / {filtered.length}
          </div>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 z-20 border border-white/10"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Media */}
          <div
            className="relative z-10 flex flex-col items-center gap-4 px-20 max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {current.mediaType === 'video' ? (
              <video
                src={current.url}
                controls
                className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.url}
                alt={current.alt ?? current.title}
                className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
            )}
            <p className="text-white/50 text-sm font-medium">{current.title}</p>
          </div>

          {/* Next */}
          {lightboxIndex < filtered.length - 1 && (
            <button
              className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 z-20 border border-white/10"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      )}
    </>
  );
}