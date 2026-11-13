import React, { useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver, PageVisualWorld } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { getPageCanonicalPath } from '../lib/validationSchemas';
import { Locale, PageConfig } from '../types/cms';
import {
  ArrowUpRight,
  CheckCircle2,
  FileWarning,
  Globe,
  Home,
  MessageCircle,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface CustomCmsPageProps {
  slug?: string;
  expectedType?: 'landing' | 'general';
  previewPage?: Partial<PageConfig>;
  previewLocale?: Locale;
  embeddedPreview?: boolean;
  previewStandalone?: boolean;
}

export const CustomCmsPage: React.FC<CustomCmsPageProps> = ({
  slug,
  expectedType,
  previewPage,
  previewLocale,
  embeddedPreview = false,
  previewStandalone,
}) => {
  const {
    locale: contextLocale,
    pathname,
    navigate,
    db,
    adminSession,
  } = usePlatform();

  const activeLocale: Locale = previewLocale || contextLocale;
  const settings = db.siteSettings;
  const cleanSlug = (slug || '').trim().toLowerCase();

  const matchedDbPage = !previewPage
    ? (db.pages || []).find((p) => p.slug?.toLowerCase() === cleanSlug)
    : undefined;

  const page: Partial<PageConfig> | undefined = previewPage || matchedDbPage;

  // Canonical redirect if someone opens a landing page at /p/[slug] or a general page at /landing/[slug]
  useEffect(() => {
    if (embeddedPreview || !matchedDbPage || !expectedType) return;
    if (
      matchedDbPage.pageType &&
      matchedDbPage.pageType !== 'core' &&
      matchedDbPage.pageType !== expectedType
    ) {
      const targetPath = getPageCanonicalPath(matchedDbPage, activeLocale);
      const search = window.location.search || '';
      window.history.replaceState({}, '', `${targetPath}${search}`);
      navigate(`${targetPath}${search}`);
    }
  }, [embeddedPreview, matchedDbPage, expectedType, activeLocale, navigate]);

  const isHiddenForVisitor =
    !embeddedPreview &&
    (!page || Boolean(page.archived) || (!page.published && !adminSession));

  if (!embeddedPreview && isHiddenForVisitor) {
    return (
      <LayoutResolver pageWorld="about-editorial">
        <div
          dir={activeLocale === 'ar' ? 'rtl' : 'ltr'}
          className="min-h-[75vh] flex flex-col items-center justify-center px-6 py-16 text-center space-y-5 bg-white text-slate-900"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <FileWarning className="w-7 h-7" />
          </div>
          <div className="space-y-2 max-w-md">
            <h1 className="text-2xl font-black">
              {activeLocale === 'ar' ? 'الصفحة غير متاحة حالياً' : 'Page Unavailable'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {activeLocale === 'ar'
                ? 'قد تكون هذه الصفحة مسودة غير منشورة بعد، أو تم أرشفتها أو تعديل رابطها.'
                : 'This page is either an unpublished draft, archived, or no longer exists at this URL.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/${activeLocale}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{activeLocale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </button>
        </div>
      </LayoutResolver>
    );
  }

  const resolvedPage = page!;
  const effectiveType =
    resolvedPage.pageType || expectedType || 'general';
  const variant =
    resolvedPage.layoutVariant ||
    (effectiveType === 'landing' ? 'landing-hero' : 'editorial');
  const isLandingDark = variant === 'landing-hero' || variant === 'campaign' || variant === 'home';
  const accent = resolvedPage.accentColor || (isLandingDark ? '#00C2CB' : '#0D9488');
  const visibility = {
    heroImage: resolvedPage.sectionVisibility?.heroImage !== false,
    body: resolvedPage.sectionVisibility?.body !== false,
    highlights: resolvedPage.sectionVisibility?.highlights !== false,
    metrics: resolvedPage.sectionVisibility?.metrics !== false,
    timeline: resolvedPage.sectionVisibility?.timeline !== false,
    blocks: resolvedPage.sectionVisibility?.blocks !== false,
    cta: resolvedPage.sectionVisibility?.cta !== false,
  };

  const title =
    resolvedPage.title?.[activeLocale] ||
    resolvedPage.title?.ar ||
    resolvedPage.title?.en ||
    '';
  const kicker =
    resolvedPage.kicker?.[activeLocale] ||
    resolvedPage.kicker?.ar ||
    resolvedPage.kicker?.en ||
    '';
  const headline =
    resolvedPage.headline?.[activeLocale] ||
    resolvedPage.headline?.ar ||
    resolvedPage.headline?.en ||
    title;
  const subheadline =
    resolvedPage.subheadline?.[activeLocale] ||
    resolvedPage.subheadline?.ar ||
    resolvedPage.subheadline?.en ||
    '';
  const body =
    resolvedPage.biography?.[activeLocale] ||
    resolvedPage.biography?.ar ||
    resolvedPage.biography?.en ||
    '';
  const highlights = resolvedPage.highlights?.[activeLocale] || [];
  const metrics = resolvedPage.metrics || [];
  const blocks = resolvedPage.blocks || [];
  const timeline = resolvedPage.experienceTimeline || [];
  const additionalImages = (resolvedPage.additionalImages || []).filter(Boolean);

  const ctaLabel =
    resolvedPage.ctaLabel?.[activeLocale] ||
    (activeLocale === 'ar' ? 'تواصل مباشر عبر واتساب' : 'Direct Consultation');
  const ctaHref = resolvedPage.ctaHref || settings.whatsappUrl;

  const isStandaloneView = embeddedPreview
    ? Boolean(previewStandalone ?? resolvedPage.standaloneByDefault)
    : Boolean(resolvedPage.standaloneByDefault);

  const pageWorld: PageVisualWorld = isLandingDark
    ? 'soli-showcase'
    : 'about-editorial';

  const canonicalPath = getPageCanonicalPath(resolvedPage, activeLocale);

  const bodyContent = (
    <div
      dir={activeLocale === 'ar' ? 'rtl' : 'ltr'}
      className={`min-h-full transition-colors ${
        isLandingDark
          ? 'bg-[#040D12] text-[#F0F9FF]'
          : 'bg-[#FFFFFF] text-[#111827]'
      }`}
    >
      {/* Embedded Preview Simulated Header (Reflects Standalone vs Standard Navigation accurately) */}
      {embeddedPreview && (
        <div
          className={`px-4 sm:px-6 h-12 border-b flex items-center justify-between text-xs ${
            isLandingDark
              ? 'bg-[#070E1A] border-slate-800 text-slate-200'
              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2 font-bold truncate">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: accent }}
            />
            <span className="truncate">{title || settings.brandName[activeLocale]}</span>
          </div>

          {!isStandaloneView ? (
            <div className="hidden sm:flex items-center gap-3 text-[11px] opacity-75">
              <span>{activeLocale === 'ar' ? 'الرئيسية' : 'Home'}</span>
              <span>{activeLocale === 'ar' ? 'من أنا' : 'About'}</span>
              <span>{activeLocale === 'ar' ? 'المشروعات' : 'Projects'}</span>
              <span>{activeLocale === 'ar' ? 'العيادات' : 'Clinics'}</span>
              <span>{activeLocale === 'ar' ? 'المقالات' : 'Articles'}</span>
            </div>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-bold">
              {activeLocale === 'ar' ? 'وضع مستقل Standalone' : 'Standalone Mode'}
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-current/20 text-[10px] font-semibold">
              <Globe className="w-3 h-3" />
              {activeLocale === 'ar' ? 'EN' : 'عربي'}
            </span>
            {isStandaloneView && (
              <span
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-950"
                style={{ backgroundColor: accent }}
              >
                {ctaLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Admin Draft Notice Banner on Live Route */}
      {!embeddedPreview && adminSession && (!resolvedPage.published || resolvedPage.archived) && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            {resolvedPage.archived
              ? activeLocale === 'ar'
                ? 'معاينة المدير فقط — هذه الصفحة موجودة في الأرشيف ومخفية عن الزوار.'
                : 'Admin Preview Only — This page is archived and hidden from visitors.'
              : activeLocale === 'ar'
              ? 'معاينة المدير فقط — هذه الصفحة في حالة مسودة ومخفية عن الزوار.'
              : 'Admin Preview Only — This page is a draft and hidden from public visitors.'}
          </span>
        </div>
      )}

      {/* HERO SECTION */}
      <section
        className={`relative overflow-hidden ${
          isLandingDark
            ? 'pt-14 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-8 border-b border-white/10'
            : 'pt-12 pb-12 sm:pt-16 sm:pb-16 px-4 sm:px-10 border-b border-zinc-200'
        }`}
      >
        {isLandingDark && (
          <div
            className="pointer-events-none absolute -top-28 start-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: accent }}
          />
        )}

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative">
          <div
            className={
              visibility.heroImage && resolvedPage.heroImage
                ? 'lg:col-span-7 space-y-5'
                : 'lg:col-span-12 max-w-4xl space-y-5'
            }
          >
            {kicker && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                style={
                  isLandingDark
                    ? {
                        backgroundColor: `${accent}18`,
                        color: accent,
                        border: `1px solid ${accent}40`,
                      }
                    : {
                        backgroundColor: '#F4F4F5',
                        color: '#18181B',
                        border: '1px solid #E4E4E7',
                      }
                }
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{kicker}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.18] tracking-tight">
              {headline}
            </h1>

            {subheadline && (
              <p
                className={`text-base sm:text-lg leading-relaxed ${
                  isLandingDark ? 'text-slate-300' : 'text-zinc-600'
                }`}
              >
                {subheadline}
              </p>
            )}

            {visibility.cta && ctaLabel && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={ctaHref}
                  target={ctaHref?.startsWith('http') ? '_blank' : undefined}
                  rel={ctaHref?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  style={{ backgroundColor: accent }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold text-slate-950 shadow-lg hover:opacity-95 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{ctaLabel}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {visibility.heroImage && resolvedPage.heroImage && (
            <div className="lg:col-span-5">
              <div
                className={`rounded-2xl overflow-hidden border ${
                  isLandingDark
                    ? 'bg-[#0B1622] border-slate-800 shadow-2xl'
                    : 'bg-zinc-50 border-zinc-200 shadow-lg'
                }`}
              >
                <OptimizedImage
                  src={resolvedPage.heroImage}
                  alt={headline || title}
                  containerClassName="w-full aspect-[4/3]"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* METRICS STRIP */}
      {visibility.metrics && metrics.length > 0 && (
        <section
          className={`py-10 px-4 sm:px-8 border-b ${
            isLandingDark ? 'bg-[#07111A] border-white/10' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border ${
                  isLandingDark
                    ? 'bg-[#0B1622] border-slate-800'
                    : 'bg-white border-zinc-200'
                }`}
              >
                <div
                  className="text-2xl sm:text-3xl font-black font-mono-tabular"
                  style={{ color: accent }}
                >
                  {m.value}
                </div>
                <p
                  className={`mt-1.5 text-xs leading-relaxed ${
                    isLandingDark ? 'text-slate-300' : 'text-zinc-600'
                  }`}
                >
                  {m.label?.[activeLocale] || m.label?.en || m.label?.ar}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MAIN BODY COPY & HIGHLIGHTS */}
      {((visibility.body && body.trim()) ||
        (visibility.highlights && highlights.length > 0)) && (
        <section className="py-14 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto space-y-10">
            {visibility.body && body.trim() && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border whitespace-pre-line text-sm sm:text-base leading-8 ${
                  isLandingDark
                    ? 'bg-[#08131E] border-slate-800/90 text-slate-200'
                    : 'bg-white border-zinc-200 text-zinc-800'
                }`}
              >
                {body}
              </div>
            )}

            {visibility.highlights && highlights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      isLandingDark
                        ? 'bg-[#091521] border-slate-800 text-slate-200'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <CheckCircle2
                      className="w-5 h-5 shrink-0 mt-0.5"
                      style={{ color: accent }}
                    />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* STRUCTURED CONTENT BLOCKS */}
      {visibility.blocks && blocks.length > 0 && (
        <section className="pb-14 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {blocks.map((block, idx) => {
              const bTitle = block.title?.[activeLocale] || block.title?.ar || block.title?.en;
              const bBody = block.body?.[activeLocale] || block.body?.ar || block.body?.en;
              const bCta = block.ctaLabel?.[activeLocale] || block.ctaLabel?.ar || block.ctaLabel?.en;
              return (
                <article
                  key={block.id || idx}
                  className={`rounded-2xl border overflow-hidden grid grid-cols-1 ${
                    block.imageUrl ? 'md:grid-cols-12' : ''
                  } ${
                    isLandingDark
                      ? 'bg-[#08131E] border-slate-800'
                      : 'bg-white border-zinc-200'
                  }`}
                >
                  <div
                    className={`${
                      block.imageUrl ? 'md:col-span-7' : ''
                    } p-6 sm:p-8 flex flex-col justify-center space-y-3`}
                  >
                    {bTitle && (
                      <h2 className="text-xl sm:text-2xl font-bold">{bTitle}</h2>
                    )}
                    {bBody && (
                      <p
                        className={`text-sm leading-7 whitespace-pre-line ${
                          isLandingDark ? 'text-slate-300' : 'text-zinc-600'
                        }`}
                      >
                        {bBody}
                      </p>
                    )}
                    {bCta && block.ctaHref && (
                      <div className="pt-2">
                        <a
                          href={block.ctaHref}
                          target={block.ctaHref.startsWith('http') ? '_blank' : undefined}
                          rel={block.ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                          style={{ color: accent }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
                        >
                          <span>{bCta}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                  {block.imageUrl && (
                    <div className="md:col-span-5 bg-slate-950/30 min-h-[220px]">
                      <OptimizedImage
                        src={block.imageUrl}
                        alt={bTitle || title}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ADDITIONAL GALLERY IMAGES */}
      {additionalImages.length > 0 && (
        <section className="pb-14 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {additionalImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className={`rounded-xl overflow-hidden border ${
                  isLandingDark ? 'border-slate-800 bg-[#08131E]' : 'border-zinc-200 bg-zinc-50'
                }`}
              >
                <OptimizedImage
                  src={imgUrl}
                  alt={`${title} ${idx + 1}`}
                  containerClassName="w-full aspect-video"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* OPTIONAL TIMELINE */}
      {visibility.timeline && timeline.length > 0 && (
        <section className="pb-14 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto space-y-4">
            {timeline.map((step, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border space-y-1.5 ${
                  isLandingDark
                    ? 'bg-[#08131E] border-slate-800'
                    : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="text-xs font-mono-tabular font-bold" style={{ color: accent }}>
                  {step.period?.[activeLocale]}
                </div>
                <div className="text-base font-bold">{step.role?.[activeLocale]}</div>
                <div className={`text-xs ${isLandingDark ? 'text-slate-400' : 'text-zinc-500'}`}>
                  {step.organization?.[activeLocale]}
                </div>
                <p className={`text-sm leading-relaxed ${isLandingDark ? 'text-slate-300' : 'text-zinc-700'}`}>
                  {step.description?.[activeLocale]}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BOTTOM CONVERSION CALLOUT */}
      {visibility.cta && ctaLabel && (
        <section className="pb-16 px-4 sm:px-8">
          <div
            className={`max-w-5xl mx-auto p-8 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
              isLandingDark
                ? 'bg-[#071521] border-slate-800'
                : 'bg-zinc-900 text-white border-zinc-800'
            }`}
          >
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              {subheadline && <p className="text-xs sm:text-sm text-slate-300">{subheadline}</p>}
            </div>
            <a
              href={ctaHref}
              target={ctaHref?.startsWith('http') ? '_blank' : undefined}
              rel={ctaHref?.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{ backgroundColor: accent }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold text-slate-950 shrink-0 hover:opacity-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{ctaLabel}</span>
            </a>
          </div>
        </section>
      )}
    </div>
  );

  if (embeddedPreview) {
    return bodyContent;
  }

  return (
    <LayoutResolver
      pageWorld={pageWorld}
      forceStandalone={Boolean(resolvedPage.standaloneByDefault)}
      standaloneTitle={title}
      standaloneSubtitle={kicker || settings.ownerRole[activeLocale]}
      standaloneCtaLabel={ctaLabel}
      standaloneCtaHref={ctaHref}
      standaloneAccentColor={accent}
      adminQuickEditPath="/admin/pages"
    >
      <SEOHead
        locale={activeLocale}
        seo={{
          title: {
            ar: resolvedPage.seo?.title?.ar || resolvedPage.title?.ar || headline,
            en: resolvedPage.seo?.title?.en || resolvedPage.title?.en || headline,
          },
          description: {
            ar:
              resolvedPage.seo?.description?.ar ||
              resolvedPage.subheadline?.ar ||
              settings.seo.description.ar,
            en:
              resolvedPage.seo?.description?.en ||
              resolvedPage.subheadline?.en ||
              settings.seo.description.en,
          },
          ogImage: resolvedPage.seo?.ogImage || resolvedPage.heroImage,
          canonicalSlug: resolvedPage.seo?.canonicalSlug || canonicalPath,
          noindex: resolvedPage.seo?.noindex,
          structuredDataType: resolvedPage.seo?.structuredDataType || 'WebSite',
        }}
        fallbackTitle={headline || title}
        fallbackDescription={subheadline || settings.seo.description[activeLocale]}
        pathname={pathname}
      />
      {bodyContent}
    </LayoutResolver>
  );
};
