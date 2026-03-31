// components/MediaUploader.tsx
'use client';
import { useRef, useState, DragEvent } from 'react';
import {
  CloudUpload, X, Star, ImageIcon,
  Video, Loader2, Trash2, RotateCcw, Plus, ArrowUpCircle,
} from 'lucide-react';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import type { HeroImageDoc, PreviewFile } from '@/types/media';

interface MediaUploaderProps {
  existingDoc?: HeroImageDoc | null;
  onSuccess?: (doc: HeroImageDoc) => void;
}

export default function MediaUploader({ existingDoc, onSuccess }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const {
    previews, uploading, error,
    deletions, addFiles, updatePreview,
    removePreview, markForDeletion,
    unmarkForDeletion, submit,
    existingMainImageId, setExistingAsMain,
  } = useMediaUpload({ existingDoc, onSuccess });

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const isVideo = (p: PreviewFile) => p.mediaType === 'video';

  return (
    <div className="space-y-5">

      {/* ── Drop zone ────────────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-sm border-2 border-dashed transition-all duration-200
          ${dragging
            ? 'border-indigo-400 bg-indigo-50/60 scale-[1.01]'
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20'
          }`}
      >
        {/* Dot pattern */}
        <div className="absolute inset-0 rounded-sm overflow-hidden opacity-50 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #c7d2fe 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

        <div className="relative flex flex-col items-center justify-center py-14 px-6 gap-3">
          <div className={`w-16 h-16 rounded-sm flex items-center justify-center transition-all duration-200
            ${dragging
              ? 'bg-indigo-500 shadow-xl shadow-indigo-300 scale-110'
              : 'bg-slate-50 border border-slate-200'
            }`}>
            <CloudUpload size={30} className={dragging ? 'text-white' : 'text-slate-400'} />
          </div>

          <div className="text-center">
            <p className={`text-sm font-semibold ${dragging ? 'text-indigo-600' : 'text-slate-700'}`}>
              {dragging ? 'Drop to upload' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              or <span className="text-indigo-500 font-medium">click to browse</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">JPG</span>
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">PNG</span>
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">WebP</span>
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">MP4</span>
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">MOV</span>
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">max 50MB</span>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/mov,video/avi,video/webm,video/mkv"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm px-4 py-3 rounded-xl">
          <X size={15} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Existing media (edit mode) ─────────────────────────────────────── */}
      {existingDoc && existingDoc.images.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Current Media</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {existingDoc.images.length} item{existingDoc.images.length !== 1 ? 's' : ''} · click 🗑 to remove
              </p>
            </div>
            {deletions.size > 0 && (
              <span className="text-xs font-semibold bg-rose-50 text-rose-500 border border-rose-100 px-2.5 py-1 rounded-full">
                {deletions.size} marked for deletion
              </span>
            )}
          </div>

          {/* Grid matching gallery style */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 p-4">
            {existingDoc.images.map((media) => {
              const isDeleted = media._id ? deletions.has(media._id) : false;
              return (
                <div
                  key={media._id}
                  className={`group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer transition-all duration-200 border-2
                    ${isDeleted ? 'opacity-40 scale-95 border-rose-400' : 'hover:shadow-md border-transparent'}
                    ${existingMainImageId === media._id && !isDeleted ? 'ring-2 ring-amber-400 ring-offset-2 border-amber-400' : ''}`}
                >
                  {media.mediaType === 'video' ? (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <Video size={20} className="text-white/50" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.url} alt={media.alt ?? media.title} className="w-full h-full object-cover" />
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />

                  {existingMainImageId === media._id && (
                    <span className="absolute top-1.5 left-1.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 z-10">
                      <Star size={7} fill="white" /> Main
                    </span>
                  )}
                  {!isDeleted && existingMainImageId !== media._id && media.mediaType === 'image' && (
                    <button
                      type="button"
                      title="Set as Main Image"
                      onClick={(e) => { e.stopPropagation(); setExistingAsMain(media._id!); }}
                      className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-md flex items-center justify-center transition-all bg-white/90 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-amber-100 hover:text-amber-500 z-10`}
                    >
                      <Star size={10} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => media._id
                      ? isDeleted ? unmarkForDeletion(media._id) : markForDeletion(media._id)
                      : undefined}
                    className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-lg flex items-center justify-center shadow transition-all
                      ${isDeleted
                        ? 'bg-slate-700 text-white opacity-100'
                        : 'bg-white/90 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white'
                      }`}
                  >
                    {isDeleted ? <RotateCcw size={10} /> : <Trash2 size={10} />}
                  </button>

                  {isDeleted && (
                    <div className="absolute inset-0 flex items-end justify-center pb-1.5">
                      <span className="text-[9px] text-rose-300 font-bold bg-black/60 px-1.5 py-0.5 rounded">
                        Will be deleted
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── New file previews ──────────────────────────────────────────────── */}
      {previews.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Ready to Upload</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {previews.length} file{previews.length !== 1 ? 's' : ''} — fill in details then click Upload
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={12} /> Add More
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {previews.map((preview, i) => (
              <div key={i} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-100">
                  {isVideo(preview) ? (
                    <video src={preview.previewUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview.previewUrl} alt={preview.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Type badge */}
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    {isVideo(preview) ? <><Video size={9} /> Video</> : <><ImageIcon size={9} /> Image</>}
                  </span>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removePreview(i)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm text-white rounded-lg flex items-center justify-center hover:bg-rose-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Fields */}
                <div className="p-3.5 space-y-2.5 bg-white">
                  <input
                    type="text"
                    placeholder="Title *"
                    value={preview.title}
                    onChange={(e) => updatePreview(i, { title: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all placeholder:text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Alt text"
                    value={preview.alt}
                    onChange={(e) => updatePreview(i, { alt: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all placeholder:text-slate-300"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-[10px] font-medium text-slate-400 uppercase">Order</span>
                      <input
                        type="number"
                        value={preview.order}
                        min={0}
                        onChange={(e) => updatePreview(i, { order: Number(e.target.value) })}
                        className="w-10 text-sm outline-none bg-transparent text-slate-700 font-semibold"
                      />
                    </div>
                    <label className="flex items-center gap-2 ml-auto cursor-pointer group/star">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all
                        ${preview.isMainImage
                          ? 'bg-amber-400 border-amber-400 shadow-md shadow-amber-100'
                          : 'border-slate-200 bg-white group-hover/star:border-amber-300'
                        }`}>
                        <Star size={14} className={preview.isMainImage ? 'text-white fill-white' : 'text-slate-300 group-hover/star:text-amber-300'} />
                        <input
                          type="checkbox"
                          checked={preview.isMainImage}
                          onChange={(e) => updatePreview(i, { isMainImage: e.target.checked })}
                          className="sr-only"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500">Main</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Submit bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
        <p className="text-xs text-slate-400">
          {previews.length > 0
            ? <><span className="font-semibold text-indigo-500">{previews.length} file{previews.length > 1 ? 's' : ''}</span> ready to upload</>
            : deletions.size > 0
              ? <><span className="font-semibold text-rose-500">{deletions.size} item{deletions.size > 1 ? 's' : ''}</span> marked for deletion</>
              : 'Select files above to get started'
          }
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={uploading || (previews.length === 0 && deletions.size === 0)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-sm shadow-md shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0 whitespace-nowrap"
        >
          {uploading
            ? <><Loader2 size={15} className="animate-spin" /> Uploading…</>
            : existingDoc
              ? <><ArrowUpCircle size={15} /> Save Changes</>
              : <><CloudUpload size={15} /> {previews.length > 0 ? `Upload ${previews.length} File${previews.length > 1 ? 's' : ''}` : 'Upload Files'}</>
          }
        </button>
      </div>
    </div>
  );
}