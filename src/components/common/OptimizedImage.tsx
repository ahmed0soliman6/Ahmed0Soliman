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
 * Automatically applies Cloudinary URL transformations (f_auto,q_auto,dpr_auto,c_limit,w_...)
 * for WebP/AVIF delivery, retina pixel-ratio scaling, and resilient fallback rendering.
 */
export function optimizeCloudinaryUrl(url?: string, targetWidth = 1200): string {
  if (!url || typeof url !== 'string') return '';
  if (url === '/assets/aistudio/1770146906397_16665dd0.png') {
    return '/assets/aistudio/owner_portrait.png';
  }
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('f_auto')) {
      return url.replace(
        '/upload/',
        `/upload/f_auto,q_auto,dpr_auto,c_limit,w_${targetWidth}/`
      );
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
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const finalSrc = optimizeCloudinaryUrl(src, width);
  const resolvedContainerClass = containerClassName.includes('relative')
    ? containerClassName
    : `relative overflow-hidden ${containerClassName}`;

  React.useEffect(() => {
    setHasError(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [finalSrc]);

  if (!finalSrc || hasError) {
    return (
      <div
        className={`${resolvedContainerClass} bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-950 flex flex-col items-center justify-center p-4 text-center border border-slate-800/80`}
      >
        <div className="w-10 h-10 rounded-xl bg-[#00C2CB]/10 border border-[#00C2CB]/30 flex items-center justify-center text-[#00C2CB] mb-2">
          <ImageIcon className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-medium text-slate-300 line-clamp-2 max-w-[200px]">
          {fallbackLabel || alt || 'Ahmed Soliman Platform'}
        </span>
      </div>
    );
  }

  return (
    <div className={resolvedContainerClass}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-slate-200/40 dark:bg-slate-800/40 animate-pulse pointer-events-none"
        />
      )}
      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-95'
        }`}
      />
    </div>
  );
};
