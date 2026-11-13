import React, { useEffect, useRef, useState } from 'react';
import { Locale, MediaAsset } from '../../types/cms';
import {
  COMPRESSION_PRESETS,
  CompressedImageResult,
  CompressionPresetId,
  OutputImageFormat,
  compressImageFile,
  formatBytes,
} from '../../lib/imageCompression';
import {
  CloudUpload,
  Image as ImageIcon,
  Minimize2,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';

interface ImageUploadPreviewModalProps {
  file: File;
  locale: Locale;
  initialAltAr?: string;
  initialAltEn?: string;
  initialCategory?: MediaAsset['category'];
  replacingAsset?: MediaAsset | null;
  cloudinaryConfigured?: boolean;
  uploading: boolean;
  onCancel: () => void;
  onConfirmUpload: (payload: {
    result: CompressedImageResult;
    altAr: string;
    altEn: string;
    category: MediaAsset['category'];
  }) => Promise<void>;
}

export const ImageUploadPreviewModal: React.FC<ImageUploadPreviewModalProps> = ({
  file,
  locale,
  initialAltAr = '',
  initialAltEn = '',
  initialCategory = 'general',
  replacingAsset,
  cloudinaryConfigured,
  uploading,
  onCancel,
  onConfirmUpload,
}) => {
  const isAr = locale === 'ar';
  const defaultBaseAlt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');

  const [preset, setPreset] = useState<CompressionPresetId>(
    initialCategory === 'profile'
      ? 'avatar'
      : initialCategory === 'project'
      ? 'card'
      : 'article'
  );
  const [format, setFormat] = useState<OutputImageFormat>('image/webp');
  const [quality, setQuality] = useState<number>(82); // 55..95
  const [altAr, setAltAr] = useState<string>(initialAltAr || replacingAsset?.alt.ar || defaultBaseAlt);
  const [altEn, setAltEn] = useState<string>(initialAltEn || replacingAsset?.alt.en || defaultBaseAlt);
  const [category, setCategory] = useState<MediaAsset['category']>(
    replacingAsset?.category || initialCategory
  );
  const [viewCompare, setViewCompare] = useState<'compressed' | 'split'>('split');

  const [result, setResult] = useState<CompressedImageResult | null>(null);
  const [compressing, setCompressing] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setCompressing(true);
    setErrorMsg(null);

    const cfg = COMPRESSION_PRESETS[preset];
    compressImageFile(file, {
      preset,
      maxWidth: cfg.maxWidth,
      maxHeight: cfg.maxHeight,
      quality: quality / 100,
      format,
    })
      .then((res) => {
        if (cancelled) {
          URL.revokeObjectURL(res.previewOriginalUrl);
          URL.revokeObjectURL(res.previewCompressedUrl);
          return;
        }
        // Revoke previous object URLs
        activeUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
        activeUrlsRef.current = [res.previewOriginalUrl, res.previewCompressedUrl];
        setResult(res);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Failed to compress image');
        }
      })
      .finally(() => {
        if (!cancelled) setCompressing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file, preset, format, quality]);

  // Cleanup all object URLs on unmount
  useEffect(() => {
    return () => {
      activeUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      activeUrlsRef.current = [];
    };
  }, []);

  const handleConfirm = async () => {
    if (!result || compressing || uploading) return;
    await onConfirmUpload({
      result,
      altAr,
      altEn,
      category,
    });
  };

  return (
    <div
      onClick={() => !uploading && onCancel()}
      className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* HEADER */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-[#0B1222] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#00C2CB]/15 text-[#00C2CB] flex items-center justify-center shrink-0">
              <Minimize2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {replacingAsset
                  ? isAr
                    ? `ضغط ومعاينة قبل الاستبدال: ${replacingAsset.alt[locale]}`
                    : `Compress & Preview Replacement: ${replacingAsset.alt[locale]}`
                  : isAr
                  ? 'ضغط ومعاينة الصورة قبل الرفع السحابي'
                  : 'Image Compression & Pre-Upload Preview'}
              </h3>
              <p className="text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400 truncate">
                {file.name} · {formatBytes(file.size)}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-white cursor-pointer disabled:opacity-40"
            aria-label={isAr ? 'إلغاء' : 'Cancel'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* METRICS COMPARISON BAR */}
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-500">
                  {isAr ? 'الصورة الأصلية' : 'Original File'}
                </div>
                <div className="text-base font-extrabold font-mono-tabular text-slate-800 dark:text-slate-200">
                  {formatBytes(result.originalBytes)}
                </div>
                <div className="text-[11px] font-mono-tabular text-slate-400">
                  {result.originalWidth} × {result.originalHeight} px
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#00C2CB]/10 border border-[#00C2CB]/35 space-y-1">
                <div className="text-[11px] text-[#0099A3] dark:text-[#00C2CB] font-bold">
                  {isAr ? 'بعد الضغط والتحسين' : 'Compressed Output'}
                </div>
                <div className="text-base font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                  {compressing ? '...' : formatBytes(result.compressedBytes)}
                </div>
                <div className="text-[11px] font-mono-tabular text-[#0099A3] dark:text-[#00C2CB]">
                  {result.outputWidth} × {result.outputHeight} px ·{' '}
                  {result.format.replace('image/', '').toUpperCase()}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  result.savingsPercent > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-50 dark:bg-[#070E1A] border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'نسبة تقليص الحجم' : 'Payload Reduction'}
                </div>
                <div
                  className={`text-base font-extrabold font-mono-tabular ${
                    result.savingsPercent > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {result.savingsPercent > 0
                    ? `-${result.savingsPercent}%`
                    : `${result.savingsPercent}%`}
                </div>
                <div className="text-[11px] font-mono-tabular text-slate-500">
                  {result.savingsBytes > 0
                    ? `${isAr ? 'وفّرنا' : 'Saved'} ${formatBytes(result.savingsBytes)}`
                    : isAr
                    ? 'محسّنة مسبقاً'
                    : 'Already compact'}
                </div>
              </div>
            </div>
          )}

          {/* VISUAL COMPARISON PREVIEW */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#00C2CB]" />
                <span>{isAr ? 'المعاينة البصرية للجودة' : 'Visual Quality Preview'}</span>
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewCompare('split')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                    viewCompare === 'split'
                      ? 'bg-[#00C2CB] text-slate-950'
                      : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {isAr ? 'مقارنة مزدوجة' : 'Before / After'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewCompare('compressed')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                    viewCompare === 'compressed'
                      ? 'bg-[#00C2CB] text-slate-950'
                      : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {isAr ? 'المضغوطة فقط' : 'Compressed Only'}
                </button>
              </div>
            </div>

            {result && (
              <div
                className={`grid gap-4 ${
                  viewCompare === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {viewCompare === 'split' && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#070E1A] flex flex-col">
                    <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                      <span>{isAr ? 'قبل الضغط (الأصل)' : 'Before (Original)'}</span>
                      <span className="font-mono-tabular">
                        {formatBytes(result.originalBytes)}
                      </span>
                    </div>
                    <div className="h-52 p-3 flex items-center justify-center">
                      <img
                        src={result.previewOriginalUrl}
                        alt="Original Preview"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    </div>
                  </div>
                )}

                <div className="rounded-xl overflow-hidden border border-[#00C2CB]/40 bg-[#070E1A] flex flex-col">
                  <div className="px-3 py-1.5 bg-[#00C2CB]/15 border-b border-[#00C2CB]/30 flex items-center justify-between text-[11px] text-[#00C2CB] font-bold">
                    <span>
                      {isAr ? 'بعد الضغط (جاهزة للرفع)' : 'After (Ready to Upload)'}
                    </span>
                    <span className="font-mono-tabular">
                      {compressing ? '...' : formatBytes(result.compressedBytes)}
                    </span>
                  </div>
                  <div className="h-52 p-3 flex items-center justify-center">
                    <img
                      src={result.previewCompressedUrl}
                      alt="Compressed Preview"
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COMPRESSION CONTROLS: PRESET / FORMAT / QUALITY SLIDER */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Sliders className="w-3.5 h-3.5 text-[#00C2CB]" />
              <span>{isAr ? 'إعدادات الضغط والأبعاد' : 'Compression & Resolution Controls'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dimension Preset */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {isAr ? 'أقصى أبعاد مستهدفة' : 'Target Dimension Preset'}
                </label>
                <select
                  value={preset}
                  onChange={(e) => {
                    const next = e.target.value as CompressionPresetId;
                    setPreset(next);
                    setQuality(Math.round(COMPRESSION_PRESETS[next].quality * 100));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                >
                  {(Object.keys(COMPRESSION_PRESETS) as CompressionPresetId[]).map((id) => (
                    <option key={id} value={id}>
                      {COMPRESSION_PRESETS[id].label[locale]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">
                  {COMPRESSION_PRESETS[preset].hint[locale]}
                </p>
              </div>

              {/* Output Format */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {isAr ? 'صيغة الملف الناتج' : 'Output Format'}
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputImageFormat)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                >
                  <option value="image/webp">
                    {isAr ? 'WebP (أعلى ضغط وجودة)' : 'WebP (Recommended)'}
                  </option>
                  <option value="image/jpeg">JPEG (Universal Photo)</option>
                  <option value="image/png">PNG (Lossless Transparency)</option>
                </select>
              </div>

              {/* Quality Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? 'جودة الضغط' : 'Quality Ratio'}
                  </label>
                  <span className="font-mono-tabular font-bold text-[#00C2CB]">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={55}
                  max={95}
                  step={1}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={format === 'image/png'}
                  className="w-full accent-[#00C2CB] cursor-pointer disabled:opacity-40"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  {format === 'image/png'
                    ? isAr
                      ? 'صيغة PNG تحافظ على الشفافية بدون ضغط جودة'
                      : 'PNG retains full lossless transparency'
                    : isAr
                    ? 'يُنصح بـ 78% – 85% لتوازن ممتاز'
                    : '78%–85% recommended for optimal clarity'}
                </p>
              </div>
            </div>
          </div>

          {/* ALT TEXT & CATEGORY METADATA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">
                {isAr ? 'النص البديل بالعربية (Alt AR)' : 'Arabic Alt Text (AR)'}
              </label>
              <input
                type="text"
                dir="rtl"
                value={altAr}
                onChange={(e) => setAltAr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                {isAr ? 'النص البديل بالإنجليزية (Alt EN)' : 'English Alt Text (EN)'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={altEn}
                onChange={(e) => setAltEn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                {isAr ? 'تصنيف الوسائط' : 'Asset Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MediaAsset['category'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
              >
                <option value="general">General</option>
                <option value="profile">Profile / About</option>
                <option value="project">Project / System</option>
                <option value="clinic">Medical Clinic</option>
                <option value="blog">Blog Article</option>
              </select>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#0B1222] border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-[#00C2CB]" />
            <span>
              {cloudinaryConfigured
                ? isAr
                  ? 'سيتم الرفع مباشرة إلى Cloudinary CDN عبر توقيع خادم آمن'
                  : 'Uploads compressed file directly to Cloudinary CDN via signed request'
                : isAr
                ? 'يتطلب الرفع ضبط متغيرات Cloudinary على الخادم (يُمنع تخزين Base64 في قاعدة البيانات)'
                : 'Requires server Cloudinary configuration (Base64 database storage is blocked)'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={uploading}
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-40"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={!result || compressing || uploading || Boolean(errorMsg)}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className="w-4 h-4" />
              <span>
                {uploading
                  ? isAr
                    ? 'جاري الرفع السحابي...'
                    : 'Uploading...'
                  : isAr
                  ? 'اعتماد الضغط والرفع الآن'
                  : 'Confirm Compression & Upload'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
