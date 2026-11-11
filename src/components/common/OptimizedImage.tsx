import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fallbackLabel?: string;
}

/**
 * Automatically applies Cloudinary URL transformations (f_auto,q_auto,w_...)
 * for WebP/AVIF delivery and responsive sizing, with lazy loading and a resilient fallback container.
 */
export function optimizeCloudinaryUrl(url?: string, targetWidth = 1200): string {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // Inject f_auto,q_auto,c_limit,w_{targetWidth} if not already transformed
    if (!url.includes('f_auto')) {
      return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${targetWidth}/`);
    }
  }
  return url;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'relative overflow-hidden',
  width = 1200,
  priority = false,
  fallbackLabel,
}) => {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const finalSrc = optimizeCloudinaryUrl(src, width);

  if (!finalSrc || hasError) {
    return (
      <div
        className={`${containerClassName} bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-950 flex flex-col items-center justify-center p-6 text-center border border-slate-800/80`}
      >
        <div className="w-12 h-12 rounded-xl bg-[#00C2CB]/10 border border-[#00C2CB]/30 flex items-center justify-center text-[#00C2CB] mb-3">
          <ImageIcon className="w-6 h-6" />
        </div>
        <span className="text-xs font-medium text-slate-300 line-clamp-2 max-w-[220px]">
          {fallbackLabel || alt || 'Ahmed Soliman Platform'}
        </span>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-slate-200/60 dark:bg-slate-800/50 animate-pulse"
        />
      )}
      <img
        src={finalSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
