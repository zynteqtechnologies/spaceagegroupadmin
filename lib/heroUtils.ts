// lib/heroUtils.ts
// Utility to normalize hero image document structure across all API routes

export function normalizeHeroDoc(doc: any) {
  if (!doc) return null;
  const rawImages = (doc.images as any[]) || [];
  let hasMain = false;
  
  const normalizedImages = rawImages.map((img, idx) => {
    const isMain = !!img.isMainImage && !hasMain;
    if (isMain) hasMain = true;
    const idVal = img._id || img.id || img.cloudinaryId || `img-${idx}`;
    return {
      ...img,
      _id: idVal,
      id: idVal,
      isMainImage: isMain,
    };
  });

  // If no main image was found, set the first image as main
  if (!hasMain && normalizedImages.length > 0) {
    normalizedImages[0].isMainImage = true;
  }

  return {
    ...doc,
    _id: doc.id || doc._id,
    images: normalizedImages,
  };
}
