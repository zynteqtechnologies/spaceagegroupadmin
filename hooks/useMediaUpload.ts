// hooks/useMediaUpload.ts
'use client';
import { useState, useCallback, useEffect } from 'react';
import { uploadHeroMedia, updateHeroMedia } from '@/lib/mediaApi';
import type { HeroImageDoc, PreviewFile, MediaItem, NewMediaDetail } from '@/types/media';

interface UseMediaUploadOptions {
  existingDoc?: HeroImageDoc | null;
  onSuccess?: (doc: HeroImageDoc) => void;
}

export function useMediaUpload({ existingDoc, onSuccess }: UseMediaUploadOptions) {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletions, setDeletions] = useState<Set<string>>(new Set());
  const [existingMainImageId, setExistingMainImageId] = useState<string | null>(null);

  useEffect(() => {
    setExistingMainImageId(existingDoc?.images.find(i => i.isMainImage)?._id ?? null);
  }, [existingDoc]);

  const setExistingAsMain = useCallback((id: string) => {
    setExistingMainImageId(id);
    setPreviews(prev => prev.map(p => ({ ...p, isMainImage: false })));
  }, []);

  // ── Add files ──────────────────────────────────────────────────────────────
  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    setPreviews((prev) => {
      const newPreviews: PreviewFile[] = files.map((file, i) => ({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, ''),
        alt: '',
        isMainImage: false,
        order: prev.length + i,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
      }));
      return [...prev, ...newPreviews];
    });
  }, []);

  const updatePreview = useCallback(
    (index: number, patch: Partial<PreviewFile>) => {
      setPreviews((prev) =>
        prev.map((p, i) => {
          if (i === index) return { ...p, ...patch };
          if (patch.isMainImage) return { ...p, isMainImage: false };
          return p;
        })
      );
      if (patch.isMainImage) {
        setExistingMainImageId(null);
      }
    },
    []
  );

  // ── Remove a queued preview ────────────────────────────────────────────────
  const removePreview = useCallback((index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // ── Mark / unmark existing item for deletion ───────────────────────────────
  const markForDeletion = useCallback((mediaId: string) => {
    setDeletions((prev) => new Set(prev).add(mediaId));
  }, []);

  const unmarkForDeletion = useCallback((mediaId: string) => {
    setDeletions((prev) => {
      const next = new Set(prev);
      next.delete(mediaId);
      return next;
    });
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    setUploading(true);
    setError(null);

    try {
      const newDetails: NewMediaDetail[] = previews.map((p) => ({
        title: p.title,
        alt: p.alt,
        isMainImage: p.isMainImage,
        order: p.order,
        mediaType: p.mediaType,
      }));

      if (existingDoc) {
        // ── UPDATE mode ──────────────────────────────────────────────────────
        const isNewMainSelected = newDetails.some(d => d.isMainImage);
        const existingDetails: MediaItem[] = existingDoc.images.map((img) => ({
          ...img,
          isMainImage: isNewMainSelected ? false : (existingMainImageId ? img._id === existingMainImageId : false),
          markedForDeletion: img._id ? deletions.has(img._id) : false,
        }));

        const doc = await updateHeroMedia({
          id: existingDoc._id,
          files: previews.map((p) => p.file),
          imageDetails: [...existingDetails, ...newDetails],
        });
        onSuccess?.(doc);
      } else {
        // ── CREATE mode ──────────────────────────────────────────────────────
        if (previews.length === 0) {
          setError('Please add at least one file.');
          setUploading(false);
          return;
        }
        const doc = await uploadHeroMedia({
          files: previews.map((p) => p.file),
          imageDetails: newDetails,
        });
        onSuccess?.(doc);
      }

      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPreviews([]);
      setDeletions(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }, [previews, existingDoc, deletions, onSuccess]);

  return {
    previews, uploading, error, deletions, existingMainImageId,
    addFiles, updatePreview, removePreview, setExistingAsMain,
    markForDeletion, unmarkForDeletion, submit,
  };
}