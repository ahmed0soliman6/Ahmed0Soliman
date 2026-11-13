import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, ExternalLink, Play, Sparkles } from 'lucide-react';
import { ProjectItem, Locale } from '../../types/cms';
import { OptimizedImage } from '../common/OptimizedImage';
import {
  TiltCard,
  MagneticButton,
  canRunFinePointerEffects,
} from '../common/CustomCursorAndRipple';

/**
 * Full-showcase Cursor Spotlight backdrop.
 * - Zero React state updates on pointer move (rAF + CSS variables).
 * - Automatically inactive on touch devices and prefers-reduced-motion.
 */
export const CursorSpotlightRegion: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !canRunFinePointerEffects()) return;
    const el = containerRef.current;
    if (!el) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      el.style.setProperty('--spot-x', `${x.toFixed(1)}px`);
      el.style.setProperty('--spot-y', `${y.toFixed(1)}px`);
      el.style.setProperty('--spot-alpha', '1');
    });
  };

  const handlePointerLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty('--spot-alpha', '0');
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      className={`relative ${className}`}
    >
      {/* Subtle Turquoise/Cyan Cursor Spotlight overlay (desktop pointer only) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 z-0"
        style={{
          opacity: 'var(--spot-alpha, 0)',
          background:
            'radial-gradient(640px circle at var(--spot-x, 50%) var(--spot-y, 20%), rgba(0, 212, 255, 0.11), rgba(56, 189, 248, 0.04) 40%, transparent 72%)',
        }}
      />
      {children}
    </div>
  );
};

/**
 * Smooth Scroll Reveal block via motion/react, respecting prefers-reduced-motion.
 */
export const RevealBlock: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.48, delay: Math.min(delay, 0.35), ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface InteractiveProjectCardProps {
  project: ProjectItem;
  index: number;
  locale: Locale;
  colSpanClass: string;
  isFeaturedWide?: boolean;
  onNavigate: (path: string) => void;
  onOpenVideo: (youtubeId: string) => void;
}

/**
 * Interactive Dark Tech Project Card with:
 * - 3D Card Tilt (strictly <= 3deg on desktop fine pointers)
 * - Cursor-tracked Cyan Border Glow & soft inner sheen
 * - Subtle Image Parallax driven by CSS custom properties (--card-px / --card-py)
 * - Magnetic CTA button + clear click feedback
 * - Smooth reveal entrance
 */
export const InteractiveProjectCard: React.FC<InteractiveProjectCardProps> = ({
  project,
  index,
  locale,
  colSpanClass,
  isFeaturedWide = false,
  onNavigate,
  onOpenVideo,
}) => {
  const isSoliFlagship =
    project.slug === 'soli-medical-clinic-system' || project.slug.includes('soli-medical');
  const detailPath = isSoliFlagship
    ? `/${locale}/solimedical`
    : `/${locale}/projects/${project.slug}`;

  const numberLabel = index < 9 ? `0${index + 1}` : `${index + 1}`;
  const featurePreviewLimit = isFeaturedWide ? 3 : 2;
  const techPreviewLimit = isFeaturedWide ? 5 : 4;

  return (
    <RevealBlock delay={index * 0.05} className={`h-full ${colSpanClass}`}>
      <TiltCard
        intensity={2.75}
        enableBorderGlow
        className={`h-full rounded-[26px] bg-gradient-to-b from-[#0A1D28]/95 to-[#061118]/95 border ${
          isSoliFlagship
            ? 'border-[#00D4FF]/40 shadow-[0_0_40px_rgba(0,212,255,0.12)]'
            : 'border-[#00D4FF]/22 hover:border-[#00D4FF]/55'
        } hover:shadow-[0_18px_46px_rgba(0,212,255,0.16)] overflow-hidden flex flex-col justify-between group`}
      >
        {/* Subtle inner cursor surface sheen driven by --glow-x / --glow-y */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-10"
          style={{
            opacity: 'calc(var(--glow-opacity, 0) * 0.65)',
            background:
              'radial-gradient(420px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(0, 212, 255, 0.09), transparent 68%)',
          }}
        />

        {isFeaturedWide ? (
          /* Featured Flagship Wide Layout (desktop horizontal split, stacked on mobile) */
          <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-12 flex-1">
            {/* Preview Monitor Side */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onNavigate(detailPath)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(detailPath);
                }
              }}
              className="lg:col-span-7 cursor-pointer relative min-h-[240px] sm:min-h-[280px] lg:min-h-[340px] bg-[#040D12] overflow-hidden border-b lg:border-b-0 lg:border-e border-[#00D4FF]/15 p-3.5 sm:p-4 flex"
            >
              <div className="w-full h-full rounded-2xl overflow-hidden border border-[#00D4FF]/28 relative bg-[#03090E]">
                <div
                  className="w-full h-full transition-transform duration-300 ease-out motion-reduce:transform-none"
                  style={{
                    transform:
                      'translate3d(calc(var(--card-px, 0) * -7px), calc(var(--card-py, 0) * -7px), 0) scale(1.05)',
                  }}
                >
                  <OptimizedImage
                    src={project.coverImage}
                    alt={project.title[locale]}
                    priority
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover group-hover:brightness-110 transition-[filter,transform] duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#060a12]/85 via-transparent to-[#060a12]/25 pointer-events-none" />
              </div>

              {/* Top Badges inside Screen Frame */}
              <div className="absolute top-6 start-6 end-6 flex items-center justify-between gap-2 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#00D4FF] text-slate-950 font-mono-tabular text-xs font-black flex items-center justify-center shadow-[0_0_16px_#00D4FF]">
                    {numberLabel}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#060a12]/90 text-[#38BDF8] border border-[#00D4FF]/35 backdrop-blur-md">
                    {project.categoryLabel[locale]}
                  </span>
                </div>

                {(isSoliFlagship || project.logoImage) && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/90 border border-[#00D4FF]/45 backdrop-blur-md shadow-[0_0_16px_rgba(0,212,255,0.2)]">
                    {project.logoImage ? (
                      <img
                        src={project.logoImage}
                        alt={project.title[locale]}
                        className="w-4 h-4 object-contain"
                      />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
                    )}
                    <span className="text-[10px] font-bold text-white">
                      {isSoliFlagship
                        ? 'Soli Medical'
                        : locale === 'ar'
                        ? 'مشروع مميز'
                        : 'Featured'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Details & Actions Side */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 gap-5">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00D4FF] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isSoliFlagship
                      ? locale === 'ar'
                        ? 'المنظومة الرائدة · عرض تفاعلي كامل'
                        : 'Flagship Ecosystem · Full Showcase'
                      : project.kicker[locale]}
                  </span>
                </div>

                <h3
                  onClick={() => onNavigate(detailPath)}
                  className="cursor-pointer text-xl sm:text-2xl font-black text-white group-hover:text-[#00D4FF] transition-colors leading-snug"
                >
                  {project.title[locale]}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed line-clamp-3">
                  {project.summary[locale]}
                </p>

                {/* Key Features Preview */}
                <div className="space-y-2 pt-1">
                  {(project.features[locale] || [])
                    .slice(0, featurePreviewLimit)
                    .map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-start gap-2 text-xs text-slate-200"
                      >
                        <Check className="w-3.5 h-3.5 text-[#00D4FF] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{feat}</span>
                      </div>
                    ))}
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.techStack.slice(0, techPreviewLimit).map((tech, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-mono-tabular font-semibold bg-[#040D12] text-[#38BDF8] border border-[#00D4FF]/25"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#00D4FF]/15 flex flex-wrap items-center gap-2.5">
                <MagneticButton
                  onClick={() => onNavigate(detailPath)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 hover:shadow-[0_0_24px_rgba(0,212,255,0.45)] cursor-pointer shadow-[0_0_16px_rgba(0,212,255,0.28)]"
                >
                  <span>
                    {isSoliFlagship
                      ? locale === 'ar'
                        ? 'صفحة النظام الكاملة'
                        : 'Live Showcase'
                      : locale === 'ar'
                      ? 'دراسة الحالة والشاشات'
                      : 'Case Study'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </MagneticButton>

                {project.youtubeId ? (
                  <MagneticButton
                    onClick={() => onOpenVideo(project.youtubeId!)}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold border border-[#00D4FF]/40 text-slate-200 hover:border-[#00D4FF] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>{locale === 'ar' ? 'فيديو' : 'Demo'}</span>
                  </MagneticButton>
                ) : project.liveUrl ? (
                  <MagneticButton
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold border border-[#00D4FF]/40 text-slate-200 hover:border-[#00D4FF] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>{locale === 'ar' ? 'معاينة' : 'Live'}</span>
                  </MagneticButton>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          /* Standard / Medium Vertical Project Card */
          <>
            <div className="relative z-10">
              {/* Top Screen Preview Frame with Image Parallax */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onNavigate(detailPath)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigate(detailPath);
                  }
                }}
                className="cursor-pointer relative h-52 sm:h-56 bg-[#040D12] overflow-hidden border-b border-[#00D4FF]/15 p-3"
              >
                <div className="w-full h-full rounded-2xl overflow-hidden border border-[#00D4FF]/25 relative bg-[#03090E]">
                  <div
                    className="w-full h-full transition-transform duration-300 ease-out motion-reduce:transform-none"
                    style={{
                      transform:
                        'translate3d(calc(var(--card-px, 0) * -6px), calc(var(--card-py, 0) * -6px), 0) scale(1.05)',
                    }}
                  >
                    <OptimizedImage
                      src={project.coverImage}
                      alt={project.title[locale]}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:brightness-110 transition-[filter,transform] duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060a12]/85 via-transparent to-[#060a12]/20 pointer-events-none" />
                </div>

                {/* Top Numbered Cyan Badge + Category + Project Logo */}
                <div className="absolute top-5 start-5 end-5 flex items-center justify-between gap-2 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#00D4FF] text-slate-950 font-mono-tabular text-xs font-black flex items-center justify-center shadow-[0_0_14px_#00D4FF]">
                      {numberLabel}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#060a12]/90 text-[#38BDF8] border border-[#00D4FF]/35 backdrop-blur-md">
                      {project.categoryLabel[locale]}
                    </span>
                  </div>

                  {project.logoImage && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/90 border border-[#00D4FF]/40 backdrop-blur-md">
                      <img
                        src={project.logoImage}
                        alt={project.title[locale]}
                        className="w-4 h-4 object-contain"
                      />
                      {isSoliFlagship && (
                        <span className="text-[10px] font-bold text-white">Soli Medical</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <h3
                  onClick={() => onNavigate(detailPath)}
                  className="cursor-pointer text-lg sm:text-xl font-black text-white group-hover:text-[#00D4FF] transition-colors leading-snug"
                >
                  {project.title[locale]}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300/85 leading-relaxed line-clamp-3">
                  {project.summary[locale]}
                </p>

                {/* Key Features Preview */}
                <div className="space-y-1.5 pt-1">
                  {(project.features[locale] || [])
                    .slice(0, featurePreviewLimit)
                    .map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-start gap-2 text-xs text-slate-200"
                      >
                        <Check className="w-3.5 h-3.5 text-[#00D4FF] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{feat}</span>
                      </div>
                    ))}
                </div>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.techStack.slice(0, techPreviewLimit).map((tech, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-mono-tabular font-semibold bg-[#040D12] text-[#38BDF8] border border-[#00D4FF]/25"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Bottom Actions */}
            <div className="relative z-10 px-6 py-4 bg-[#040D12]/80 border-t border-[#00D4FF]/15 flex items-center justify-between gap-2.5">
              <MagneticButton
                onClick={() => onNavigate(detailPath)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 hover:shadow-[0_0_22px_rgba(0,212,255,0.45)] cursor-pointer shadow-[0_0_16px_rgba(0,212,255,0.25)]"
              >
                <span>
                  {isSoliFlagship
                    ? locale === 'ar'
                      ? 'صفحة النظام الكاملة'
                      : 'Live Showcase'
                    : locale === 'ar'
                    ? 'دراسة الحالة والشاشات'
                    : 'Case Study'}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </MagneticButton>

              {project.youtubeId ? (
                <MagneticButton
                  onClick={() => onOpenVideo(project.youtubeId!)}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold border border-[#00D4FF]/40 text-slate-200 hover:border-[#00D4FF] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>{locale === 'ar' ? 'فيديو' : 'Demo'}</span>
                </MagneticButton>
              ) : project.liveUrl ? (
                <MagneticButton
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold border border-[#00D4FF]/40 text-slate-200 hover:border-[#00D4FF] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>{locale === 'ar' ? 'معاينة' : 'Live'}</span>
                </MagneticButton>
              ) : null}
            </div>
          </>
        )}
      </TiltCard>
    </RevealBlock>
  );
};
