/**
 * Re-encodes an image through a canvas before upload. This strips ALL
 * metadata — EXIF, GPS, camera serial — because canvas re-encoding only
 * preserves pixels. Also downscales to keep uploads small.
 *
 * Returns a JPEG Blob.
 */
export async function processImageForUpload(file, maxDim = 1600, quality = 0.85) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files can be uploaded.')
  }
  // imageOrientation: 'from-image' bakes EXIF rotation into the pixels so the
  // photo still displays upright after the metadata is gone.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Image encoding failed.'))),
        'image/jpeg',
        quality,
      )
    })
    return blob
  } finally {
    bitmap.close()
  }
}
