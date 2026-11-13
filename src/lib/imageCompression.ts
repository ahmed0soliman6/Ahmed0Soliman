import { MediaAsset } from '../types/cms';
import {
  slugifyText,
  validateImageUploadFile,
  validateMediaAssetPayload,
  ValidationResult,
} from './validationSchemas';

export type OutputImageFormat = 'image/webp' | 'image/jpeg' | 'image/png';

export type CompressionPresetId = 'hero' | 'article' | 'card' | 'avatar';

export interface CompressionOptions {
  preset?: CompressionPresetId;
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0.55 - 0.95
  format: OutputImageFormat;
}

export interface CompressedImageResult {
  originalFile: File;
  compressedFile: File;
  originalBytes: number;
  compressedBytes: number;
  savingsBytes: number;
  savingsPercent: number;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  format: OutputImageFormat;
  previewOriginalUrl: string;
  previewCompressedUrl: string;
}

export const COMPRESSION_PRESETS: Record<
  CompressionPresetId,
  {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    label: { ar: string; en: string };
    hint: { ar: string; en: string };
  }
> = {
  hero: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    label: { ar: 'غلاف وبانر (1920px)', en: 'Hero / Banner (1920px)' },
    hint: { ar: 'جودة عالية للشاشات الواسعة', en: 'High clarity for wide headers' },
  },
  article: {
    maxWidth: 1440,
    maxHeight: 1440,
    quality: 0.82,
    label: { ar: 'مقالات وصفحات (1440px)', en: 'Article / Content (1440px)' },
    hint: { ar: 'توازن مثالي بين الحجم والوضوح', en: 'Balanced size & editorial crispness' },
  },
  card: {
    maxWidth: 1000,
    maxHeight: 1000,
    quality: 0.8,
    label: { ar: 'بطاقات المشاريع (1000px)', en: 'Cards & Grids (1000px)' },
    hint: { ar: 'تحميل فوري لشبكات المشاريع', en: 'Fast loading for project grids' },
  },
  avatar: {
    maxWidth: 640,
    maxHeight: 640,
    quality: 0.78,
    label: { ar: 'أيقونات وبروفايل (640px)', en: 'Avatar / Compact (640px)' },
    hint: { ar: 'أصغر حجم للصور المصغرة', en: 'Ultra-light thumbnails & avatars' },
  },
};

const ALLOWED_RAW_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_RAW_INPUT_BYTES = 20 * 1024 * 1024; // Allow up to 20MB before browser compression

export function validateRawImageForCompression(file: {
  type: string;
  size: number;
}): ValidationResult {
  const errors: string[] = [];
  if (!ALLOWED_RAW_MIMES.includes(file.type)) {
    errors.push(
      `Unsupported image format (${file.type || 'unknown'}). Allowed: JPG, PNG, WebP, AVIF.`
    );
  }
  if (file.size <= 0) {
    errors.push('Selected file is empty.');
  } else if (file.size > MAX_RAW_INPUT_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    errors.push(
      `Raw image (${sizeMb} MB) exceeds the 20.00 MB pre-compression limit.`
    );
  }
  return { valid: errors.length === 0, errors };
}

export function formatBytes(bytes?: number): string {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Computes proportional output dimensions without upscaling smaller images.
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const safeOrigW = Math.max(1, Math.round(origWidth));
  const safeOrigH = Math.max(1, Math.round(origHeight));
  const safeMaxW = Math.max(64, Math.round(maxWidth));
  const safeMaxH = Math.max(64, Math.round(maxHeight));

  const scale = Math.min(1, safeMaxW / safeOrigW, safeMaxH / safeOrigH);
  return {
    width: Math.max(1, Math.round(safeOrigW * scale)),
    height: Math.max(1, Math.round(safeOrigH * scale)),
  };
}

function getExtensionForMime(mime: OutputImageFormat): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  return 'webp';
}

function loadImageElement(srcUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode selected image file.'));
    img.src = srcUrl;
  });
}

/**
 * Compresses & resizes an image file in the browser using HTML5 Canvas
 * before uploading to Cloudinary, preserving aspect ratio and stripping heavy EXIF bloat.
 */
export async function compressImageFile(
  file: File,
  options?: Partial<CompressionOptions>
): Promise<CompressedImageResult> {
  const preCheck = validateRawImageForCompression(file);
  if (!preCheck.valid) {
    throw new Error(preCheck.errors.join(' '));
  }

  const presetCfg = options?.preset
    ? COMPRESSION_PRESETS[options.preset]
    : COMPRESSION_PRESETS.article;

  const maxWidth = options?.maxWidth ?? presetCfg.maxWidth;
  const maxHeight = options?.maxHeight ?? presetCfg.maxHeight;
  const quality = Math.min(0.95, Math.max(0.5, options?.quality ?? presetCfg.quality));
  const format: OutputImageFormat = options?.format || 'image/webp';

  const previewOriginalUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(previewOriginalUrl);
    const origWidth = img.naturalWidth || img.width || 1200;
    const origHeight = img.naturalHeight || img.height || 800;

    const target = calculateTargetDimensions(origWidth, origHeight, maxWidth, maxHeight);
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser Canvas 2D context is unavailable.');
    }

    // For JPEG (no alpha), paint neutral background to avoid black transparency edges
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#070E1A';
      ctx.fillRect(0, 0, target.width, target.height);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, target.width, target.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b && b.size > 0) resolve(b);
          else reject(new Error('Failed to encode compressed image blob.'));
        },
        format,
        quality
      );
    });

    const baseName =
      slugifyText(file.name.replace(/\.[^.]+$/, '')) || `image-${Date.now()}`;
    const ext = getExtensionForMime(format);
    const compressedFile = new File([blob], `${baseName}.${ext}`, {
      type: format,
      lastModified: Date.now(),
    });

    const finalCheck = validateImageUploadFile(compressedFile);
    if (!finalCheck.valid) {
      throw new Error(finalCheck.errors.join(' '));
    }

    const originalBytes = file.size;
    const compressedBytes = compressedFile.size;
    const savingsBytes = originalBytes - compressedBytes;
    const savingsPercent =
      originalBytes > 0
        ? Math.round(((originalBytes - compressedBytes) / originalBytes) * 100)
        : 0;

    const previewCompressedUrl = URL.createObjectURL(compressedFile);

    return {
      originalFile: file,
      compressedFile,
      originalBytes,
      compressedBytes,
      savingsBytes,
      savingsPercent,
      originalWidth: origWidth,
      originalHeight: origHeight,
      outputWidth: target.width,
      outputHeight: target.height,
      format,
      previewOriginalUrl,
      previewCompressedUrl,
    };
  } catch (err) {
    URL.revokeObjectURL(previewOriginalUrl);
    throw err;
  }
}

export interface UploadMediaParams {
  result: CompressedImageResult;
  adminToken: string;
  altAr: string;
  altEn: string;
  category: MediaAsset['category'];
  replacingAsset?: MediaAsset | null;
  fetchImpl?: typeof fetch;
}

/**
 * Signs and uploads a compressed image directly to Cloudinary CDN.
 * Never falls back to Base64 Data URLs if Cloudinary is unconfigured or fails.
 */
export async function uploadCompressedMediaToCloudinary({
  result,
  adminToken,
  altAr,
  altEn,
  category,
  replacingAsset,
  fetchImpl = fetch,
}: UploadMediaParams): Promise<{
  mediaRecord: MediaAsset;
  uploadedToCloudinary: boolean;
}> {
  const { compressedFile, outputWidth, outputHeight, format } = result;

  const postCheck = validateImageUploadFile(compressedFile);
  if (!postCheck.valid) {
    throw new Error(postCheck.errors.join(' '));
  }

  const signRes = await fetchImpl('/api/cloudinary/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      fileType: compressedFile.type,
      fileSize: compressedFile.size,
    }),
  });

  const signData = await signRes.json().catch(() => ({}));
  if (!signRes.ok || !signData?.configured) {
    throw new Error(
      signData?.error ||
        signData?.message ||
        'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured on the server. Upload aborted to prevent Base64 storage.'
    );
  }

  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('api_key', signData.apiKey);
  formData.append('timestamp', String(signData.timestamp));
  formData.append('signature', signData.signature);
  formData.append('folder', signData.folder);

  const uploadRes = await fetchImpl(
    `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  const uploadJson = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(uploadJson?.error?.message || 'Cloudinary upload failed');
  }

  const finalSecureUrl = String(uploadJson.secure_url || '').trim();
  const finalPublicId = String(uploadJson.public_id || '').trim();
  const width = uploadJson.width || outputWidth;
  const height = uploadJson.height || outputHeight;
  const finalBytes = uploadJson.bytes || compressedFile.size;
  const finalFormat = uploadJson.format || format.split('/')[1] || 'webp';

  const baseAltName = result.originalFile.name.replace(/\.[^.]+$/, '');
  const mediaRecord: MediaAsset = {
    id: replacingAsset ? replacingAsset.id : `media-${Date.now()}`,
    publicId: finalPublicId,
    secureUrl: finalSecureUrl,
    format: finalFormat,
    width,
    height,
    bytes: finalBytes,
    alt: {
      ar: altAr.trim() || replacingAsset?.alt.ar || baseAltName,
      en: altEn.trim() || replacingAsset?.alt.en || baseAltName,
    },
    category,
    createdAt: replacingAsset?.createdAt || new Date().toISOString(),
  };

  const mediaValidation = validateMediaAssetPayload(mediaRecord);
  if (!mediaValidation.valid) {
    throw new Error(mediaValidation.errors.join(' '));
  }

  return { mediaRecord, uploadedToCloudinary: true };
}

