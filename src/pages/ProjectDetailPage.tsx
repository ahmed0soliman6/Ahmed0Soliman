import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { MagneticButton, TiltCard } from '../components/common/CustomCursorAndRipple';
import { CursorSpotlightRegion, RevealBlock } from '../components/projects/InteractiveShowcase';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  MessageCircle,
  Play,
  Maximize2,
  AlertTriangle,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';

interface ProjectDetailPageProps {
  slug: string;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ slug }) => {
  const { locale, navigate, db } = usePlatform();

  const project = db.projects.find((p) => p.slug === slug || p.id === slug);
  const settings = db.siteSettings;

  const [activeScreenIdx, setActiveScreenIdx] = useState(0);
  const [highlightedIdx, setHighlightedIdx] = useState(1);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!project) {
    return (
      <LayoutResolver pageWorld="soli-showcase">
        <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">
            {locale === 'ar' ? 'المشروع غير موجود' : 'Project Not Found'}
          </h1>
          <MagneticButton
            onClick={() => navigate(`/${locale}/projects`)}
            className="px-6 py-2.5 rounded-full text-xs font-black bg-[#00D4FF] text-slate-950 cursor-pointer"
          >
            {locale === 'ar' ? 'العودة إلى معرض المشروعات' : 'Back to Projects'}
          </MagneticButton>
        </div>
      </LayoutResolver>
    );
  }

  const isSoliFlagship =
    project.slug === 'soli-medical-clinic-system' || project.slug.includes('soli-medical');
  const whatsappHref = `https://wa.me/Ahmed0soliman?text=${encodeURIComponent(
    project.whatsappInquireText[locale]
  )}`;

  const screens = project.screens || [];
  const activeScreen = screens[activeScreenIdx] || null;
  const featureList = project.features[locale] || [];

  // Build 4 numbered feature pillars matching the 01–04 cards
  const fourFeatureCards = featureList.slice(0, 4).map((feat, idx) => {
    const parts = feat.split(':');
    const title =
      parts.length > 1
        ? parts[0]
        : locale === 'ar'
        ? ['ملف ورحلة علاجية', 'تشغيل يومي مرتب', 'مالية وتقارير دقيقة', 'عربي RTL من البداية'][idx] ||
          `ركيزة تشغيلية 0${idx + 1}`
        : ['Patient Care Journey', 'Structured Daily Flow', 'Auditable Analytics', 'Arabic RTL Native'][
            idx
          ] || `Core Pillar 0${idx + 1}`;
    const desc = parts.length > 1 ? parts.slice(1).join(':').trim() : feat;
    return {
      num: `0${idx + 1}`,
      title,
      desc,
    };
  });

  return (
    <LayoutResolver pageWorld="soli-showcase" adminQuickEditPath="/admin/projects">
      <SEOHead
        locale={locale}
        seo={project.seo}
        fallbackTitle={`${project.title[locale]} | ${settings.brandName[locale]}`}
        fallbackDescription={project.summary[locale]}
        pathname={`/${locale}/projects/${project.slug}`}
        structuredDataPayload={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: project.title[locale],
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Web, iOS, Android',
          description: project.summary[locale],
          author: {
            '@type': 'Person',
            name: settings.ownerName[locale],
          },
        }}
      />

      {/* =================================================================== */}
      {/* OBSIDIAN-TEAL & CYAN INTERACTIVE PROJECT SHOWCASE                   */}
      {/* =================================================================== */}
      <CursorSpotlightRegion className="bg-[#060a12] text-[#F0F9FF] overflow-hidden">
        <article className="relative py-12 lg:py-20 px-4 sm:px-8">
          <div className="soli-glow" aria-hidden="true" />
          <div className="soli-grain" aria-hidden="true" />

          <div className="max-w-5xl mx-auto space-y-16 relative z-10">
            {/* Top Navigation Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate(`/${locale}/projects`)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-[#00D4FF] active:scale-[0.97] transition-all cursor-pointer"
              >
                {locale === 'ar' ? (
                  <ArrowRight className="w-4 h-4" />
                ) : (
                  <ArrowLeft className="w-4 h-4" />
                )}
                <span>
                  {locale === 'ar' ? 'العودة إلى معرض المشروعات' : 'Back to Projects Gallery'}
                </span>
              </button>

              {isSoliFlagship && (
                <MagneticButton
                  onClick={() => navigate(`/${locale}/solimedical`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black bg-[#00D4FF]/15 border border-[#00D4FF]/50 text-[#00D4FF] hover:bg-[#00D4FF] hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {locale === 'ar'
                      ? 'افتح العرض التفاعلي الكامل لـ Soli Medical (/solimedical)'
                      : 'Open Full Soli Medical Interactive Showcase (/solimedical)'}
                  </span>
                </MagneticButton>
              )}
            </div>

            {/* =============================================================== */}
            {/* 1. CENTERED HERO + CYAN GRADIENT TITLE + ECG HEARTBEAT WAVE     */}
            {/* =============================================================== */}
            <RevealBlock className="text-center space-y-6 max-w-4xl mx-auto">
              <div className="inline-flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-[#14B8A6] tracking-wide">
                {project.logoImage && (
                  <img
                    src={project.logoImage}
                    alt={project.title[locale]}
                    className="w-6 h-6 rounded-md object-contain bg-slate-950/80 border border-[#00D4FF]/30 p-0.5"
                  />
                )}
                <span>
                  {project.kicker[locale]} · {project.categoryLabel[locale]}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.16]">
                <span className="bg-gradient-to-l from-white via-[#7DD3FC] to-[#00D4FF] bg-clip-text text-transparent">
                  {project.title[locale]}
                </span>
              </h1>

              <p className="text-sm sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-[1.85]">
                {project.description[locale]}
              </p>

              {/* Magnetic Pill CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <MagneticButton
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 rounded-full text-xs sm:text-sm font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 shadow-[0_0_28px_rgba(0,212,255,0.45)] hover:shadow-[0_0_40px_rgba(0,212,255,0.68)] inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {locale === 'ar' ? 'اطلب العرض المناسب' : 'Request Tailored Demo'}
                  </span>
                </MagneticButton>

                <MagneticButton
                  href="#pillars"
                  className="px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-[#09151E]/90 border border-slate-700/80 text-white hover:border-[#00D4FF]/60 hover:bg-[#0C1E28]"
                >
                  {locale === 'ar' ? 'استكشف الحلول' : 'Explore Capabilities'}
                </MagneticButton>

                {project.liveUrl && (
                  <MagneticButton
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold border border-[#00D4FF]/40 text-[#00D4FF] hover:bg-[#00D4FF] hover:text-slate-950 inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'معاينة حية' : 'Live Demo'}</span>
                  </MagneticButton>
                )}
              </div>

              {/* 3 Checkmarks Row */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs sm:text-sm text-slate-300 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D9488]/25 border border-[#14B8A6]/50 text-[#2DD4BF] flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{locale === 'ar' ? 'واجهة عربية RTL' : 'Native Arabic RTL'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D9488]/25 border border-[#14B8A6]/50 text-[#2DD4BF] flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>
                    {locale === 'ar'
                      ? 'مصمم للسوق المصري والعربي'
                      : 'Built for Egyptian & Arab Healthcare'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D9488]/25 border border-[#14B8A6]/50 text-[#2DD4BF] flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>
                    {locale === 'ar' ? 'يبدأ من احتياج المنشأة' : 'Scales With Your Facility'}
                  </span>
                </div>
              </div>

              {/* Balanced ECG Heartbeat Pulse Divider */}
              <div className="pt-3 max-w-2xl mx-auto opacity-85">
                <svg
                  className="w-full h-11 overflow-visible"
                  viewBox="0 0 900 70"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0,35 L260,35 L278,35 L290,10 L304,60 L318,16 L332,48 L344,35 L550,35 L568,35 L580,10 L594,60 L608,16 L622,48 L634,35 L900,35"
                    stroke="rgba(0, 212, 255, 0.16)"
                    strokeWidth="2"
                  />
                  <path
                    className="soli-ecg-path drop-shadow-[0_0_8px_rgba(0,212,255,0.75)]"
                    d="M0,35 L260,35 L278,35 L290,10 L304,60 L318,16 L332,48 L344,35 L550,35 L568,35 L580,10 L594,60 L608,16 L622,48 L634,35 L900,35"
                    stroke="#00D4FF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </RevealBlock>

            {/* =============================================================== */}
            {/* 2. ROUNDED MONITOR SCREEN FRAME WITH CYAN GLOW & TILT           */}
            {/* =============================================================== */}
            <RevealBlock delay={0.05} className="space-y-4">
              {screens.length > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {screens.map((scr, idx) => (
                    <button
                      key={scr.id}
                      type="button"
                      onClick={() => setActiveScreenIdx(idx)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-[0.96] ${
                        activeScreenIdx === idx
                          ? 'bg-[#00D4FF] text-slate-950 shadow-[0_0_16px_rgba(0,212,255,0.45)]'
                          : 'bg-[#0B1922] text-slate-300 border border-slate-800 hover:border-[#00D4FF]/50'
                      }`}
                    >
                      {scr.title[locale]}
                    </button>
                  ))}
                </div>
              )}

              <TiltCard
                intensity={2}
                enableBorderGlow
                onClick={() => setLightboxImage(activeScreen?.imageUrl || project.coverImage)}
                className="cursor-pointer rounded-[28px] p-3 sm:p-4 bg-[#07131B] border-2 border-[#122B3A] hover:border-[#00D4FF]/45 shadow-[0_0_60px_rgba(0,212,255,0.14)] relative group"
              >
                <div className="rounded-[20px] overflow-hidden bg-[#040D12] max-h-[500px] flex items-center justify-center">
                  <div
                    className="w-full h-full transition-transform duration-300 ease-out motion-reduce:transform-none"
                    style={{
                      transform:
                        'translate3d(calc(var(--card-px, 0) * -4px), calc(var(--card-py, 0) * -4px), 0)',
                    }}
                  >
                    <OptimizedImage
                      src={activeScreen?.imageUrl || project.coverImage}
                      alt={activeScreen?.title?.[locale] || project.title[locale]}
                      priority
                      containerClassName="w-full h-full max-h-[480px]"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Open Lightbox"
                  className="absolute bottom-6 end-6 p-2.5 rounded-xl bg-slate-950/90 text-[#00D4FF] border border-[#00D4FF]/40 group-hover:scale-105 transition-transform"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </TiltCard>
            </RevealBlock>

            {/* =============================================================== */}
            {/* 3. SECTION 01: NUMBERED VERTICAL FEATURE CARDS (01–04)          */}
            {/* =============================================================== */}
            <section id="pillars" className="pt-8 space-y-10">
              <RevealBlock className="space-y-3 text-start">
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-400">
                  <span className="text-2xl sm:text-3xl font-black font-mono-tabular text-[#00D4FF]">
                    01
                  </span>
                  <span>
                    {locale === 'ar'
                      ? 'حلول ومرتكزات النظام'
                      : 'Core System Pillars'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  {locale === 'ar'
                    ? 'ابدأ بالحجم الذي لديك اليوم، واترك مساحة للنمو.'
                    : 'Engineered Around Real Clinical & Operational Workflows.'}
                </h2>
              </RevealBlock>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {fourFeatureCards.map((card, idx) => {
                  const isActive = highlightedIdx === idx;
                  return (
                    <RevealBlock key={card.num} delay={idx * 0.05} className="h-full">
                      <TiltCard
                        intensity={2.75}
                        enableBorderGlow
                        onClick={() => setHighlightedIdx(idx)}
                        className={`h-full rounded-[26px] p-5 sm:p-7 flex flex-col items-start text-start gap-5 transition-all duration-300 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-b from-[#0A222E] to-[#07151E] border-2 border-[#00D4FF]/60 shadow-[0_0_35px_rgba(0,212,255,0.18)]'
                            : 'bg-[#07131B]/90 border border-slate-800/90 hover:border-[#00D4FF]/35'
                        }`}
                      >
                        <div
                          onMouseEnter={() => setHighlightedIdx(idx)}
                          className="w-full h-full flex flex-col items-start gap-5"
                        >
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono-tabular text-base font-black transition-transform duration-300 ${
                              isActive
                                ? 'bg-[#00D4FF] text-slate-950 -rotate-12 shadow-[0_0_24px_#00D4FF]'
                                : 'bg-[#0C1E28] text-[#00D4FF] border border-[#00D4FF]/25'
                            }`}
                          >
                            {card.num}
                          </div>

                          <h3
                            className={`text-lg sm:text-xl font-black leading-snug ${
                              isActive ? 'text-[#22D3EE]' : 'text-[#38BDF8]'
                            }`}
                          >
                            {card.title}
                          </h3>

                          <p className="text-xs sm:text-sm text-slate-300/90 leading-[1.85]">
                            {card.desc}
                          </p>
                        </div>
                      </TiltCard>
                    </RevealBlock>
                  );
                })}
              </div>
            </section>

            {/* =============================================================== */}
            {/* 4. PROBLEM VS. ENGINEERED SOLUTION + TECH STACK                 */}
            {/* =============================================================== */}
            {(project.problem?.[locale] || project.solution?.[locale]) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {project.problem?.[locale] && (
                  <RevealBlock className="h-full">
                    <TiltCard
                      intensity={2.4}
                      enableBorderGlow
                      className="h-full p-6 sm:p-8 rounded-[26px] bg-[#07131B] border border-amber-500/30 space-y-4"
                    >
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          {locale === 'ar'
                            ? 'التحدي التشغيلي (The Problem)'
                            : 'Operational Challenge'}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                        {project.problem[locale]}
                      </p>
                    </TiltCard>
                  </RevealBlock>
                )}

                {project.solution?.[locale] && (
                  <RevealBlock delay={0.08} className="h-full">
                    <TiltCard
                      intensity={2.4}
                      enableBorderGlow
                      className="h-full p-6 sm:p-8 rounded-[26px] bg-[#07131B] border border-[#00D4FF]/40 space-y-4"
                    >
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/15 text-[#00D4FF] text-xs font-bold">
                        <Wrench className="w-4 h-4" />
                        <span>
                          {locale === 'ar'
                            ? 'الحل الهندسي والتشغيلي (The Solution)'
                            : 'Engineered Solution'}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                        {project.solution[locale]}
                      </p>
                    </TiltCard>
                  </RevealBlock>
                )}
              </div>
            )}

            {/* Full Features Checklist & Tech Stack */}
            <RevealBlock>
              <div className="p-6 sm:p-8 rounded-[28px] bg-[#07131B] border border-[#00D4FF]/20 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {locale === 'ar'
                      ? 'جميع المميزات والقدرات التشغيلية'
                      : 'Complete Operational Capabilities'}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-mono-tabular font-bold bg-[#0C1E28] text-[#00D4FF] border border-[#00D4FF]/25"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featureList.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#040D12] border border-slate-800/90 hover:border-[#00D4FF]/35 transition-colors flex items-start gap-3 text-xs sm:text-sm text-slate-200"
                    >
                      <Check className="w-4 h-4 text-[#00D4FF] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </RevealBlock>

            {/* Video Walkthrough if available */}
            {project.youtubeId && (
              <RevealBlock>
                <div className="p-6 sm:p-8 rounded-[28px] bg-[#07131B] border border-[#00D4FF]/25 space-y-5">
                  <div className="flex items-center gap-2 text-[#00D4FF] font-bold text-sm">
                    <Play className="w-4 h-4" />
                    <h2>
                      {locale === 'ar' ? 'شاهد النظام وهو يعمل' : 'Watch Live System Video'}
                    </h2>
                  </div>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[#00D4FF]/30 bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${project.youtubeId}`}
                      title={project.title[locale]}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </RevealBlock>
            )}

            {/* Official Contact Channels Footer Strip */}
            <RevealBlock>
              <div className="p-6 sm:p-8 rounded-[28px] bg-[#07131B] border border-[#00D4FF]/25 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-black text-white">
                    {locale === 'ar'
                      ? 'هل ترغب في تفعيل هذا النظام لمنشأتك الطبية؟'
                      : 'Want to deploy this system for your facility?'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {locale === 'ar'
                      ? 'تواصل مباشرة عبر القنوات الرسمية المعتمدة:'
                      : 'Reach out directly via official channels:'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <MagneticButton
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full text-xs font-black bg-[#00D4FF] text-slate-950 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                  >
                    WhatsApp
                  </MagneticButton>
                  <a
                    href="https://www.facebook.com/SoliMedical/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full text-xs font-bold border border-[#00D4FF]/40 text-white hover:border-[#00D4FF] active:scale-[0.96] transition-all"
                  >
                    Facebook
                  </a>
                  <a
                    href="https://t.me/SoliMedicalproBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full text-xs font-bold border border-[#00D4FF]/40 text-white hover:border-[#00D4FF] active:scale-[0.96] transition-all"
                  >
                    @SoliMedicalproBot
                  </a>
                </div>
              </div>
            </RevealBlock>
          </div>

          {/* Floating WhatsApp Button */}
          <MagneticButton
            href="https://wa.me/Ahmed0soliman"
            target="_blank"
            rel="noopener noreferrer"
            ariaLabel="WhatsApp"
            className="fixed bottom-6 end-6 z-40 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-xs font-black shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:shadow-[0_12px_36px_rgba(37,211,102,0.6)]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{locale === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp'}</span>
          </MagneticButton>
        </article>
      </CursorSpotlightRegion>

      {/* Fullscreen Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[9995] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 end-6 p-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 hover:text-[#00D4FF] active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt={project.title[locale]}
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
          />
        </div>
      )}
    </LayoutResolver>
  );
};
