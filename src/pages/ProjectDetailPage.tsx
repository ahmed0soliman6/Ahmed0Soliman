import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  MessageCircle,
  Play,
  Maximize2,
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
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!project) {
    return (
      <LayoutResolver>
        <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {locale === 'ar' ? 'المشروع غير موجود' : 'Project Not Found'}
          </h1>
          <button
            onClick={() => navigate(`/${locale}/projects`)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950"
          >
            {locale === 'ar' ? 'العودة إلى معرض المشروعات' : 'Back to Projects'}
          </button>
        </div>
      </LayoutResolver>
    );
  }

  const whatsappHref = `https://wa.me/${
    settings.whatsappNumber || 'Ahmed0soliman'
  }?text=${encodeURIComponent(project.whatsappInquireText[locale])}`;

  const screens = project.screens || [];
  const activeScreen = screens[activeScreenIdx] || null;

  return (
    <LayoutResolver adminQuickEditPath="/admin/projects">
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

      <article className="py-12 lg:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-14">
          {/* Breadcrumb / Back Navigation */}
          <div>
            <button
              onClick={() => navigate(`/${locale}/projects`)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00C2CB] transition-colors"
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
          </div>

          {/* Hero Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-[#00C2CB]">{project.kicker[locale]}</span>
                <span>·</span>
                <span>{project.categoryLabel[locale]}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                {project.title[locale]}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {project.description[locale]}
              </p>

              <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                {locale === 'ar' ? 'التقنيات المستخدمة: ' : 'Tech Stack: '}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {project.techStack.join(' · ')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3.5 pt-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {locale === 'ar' ? 'اطلب هذا النظام عبر واتساب' : 'Request System on WhatsApp'}
                  </span>
                </a>

                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
                  >
                    <ExternalLink className="w-4 h-4 text-[#00C2CB]" />
                    <span>{locale === 'ar' ? 'معاينة حية' : 'Live Demo'}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div
                onClick={() => setLightboxImage(project.coverImage)}
                className="cursor-pointer group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#070E1A] p-8 flex items-center justify-center min-h-[320px]"
              >
                <OptimizedImage
                  src={project.coverImage}
                  alt={project.title[locale]}
                  containerClassName="w-56 h-56 sm:w-64 sm:h-64"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  aria-label="Open Lightbox"
                  className="absolute bottom-4 end-4 p-2 rounded-lg bg-slate-900/80 text-slate-200 border border-slate-700 hover:text-[#00C2CB]"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Core Features Checklist */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {locale === 'ar'
                ? 'المميزات والقدرات التشغيلية للنظام'
                : 'Core Operational Capabilities & Features'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(project.features[locale] || []).map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200"
                >
                  <Check className="w-4 h-4 text-[#00C2CB] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive System Screens & Video Walkthrough */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {screens.length > 0 && (
              <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {locale === 'ar' ? 'جولة في شاشات النظام' : 'System Screens Walkthrough'}
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {screens.map((scr, idx) => (
                      <button
                        key={scr.id}
                        onClick={() => setActiveScreenIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          activeScreenIdx === idx
                            ? 'bg-[#00C2CB] text-slate-950'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {scr.title[locale]}
                      </button>
                    ))}
                  </div>
                </div>

                {activeScreen && (
                  <div className="space-y-4">
                    <div
                      onClick={() => setLightboxImage(activeScreen.imageUrl)}
                      className="cursor-pointer rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#070E1A] p-6 flex items-center justify-center h-64"
                    >
                      <OptimizedImage
                        src={activeScreen.imageUrl}
                        alt={activeScreen.title[locale]}
                        containerClassName="w-44 h-44"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {activeScreen.caption[locale]}
                    </p>
                  </div>
                )}
              </div>
            )}

            {project.youtubeId && (
              <div
                className={`${
                  screens.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'
                } p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-5`}
              >
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#00C2CB]" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {locale === 'ar' ? 'شاهد النظام وهو يعمل' : 'Watch Live System Video'}
                  </h2>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${project.youtubeId}`}
                    title={project.title[locale]}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Fullscreen Image Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[9995] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 end-6 p-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 hover:text-[#00C2CB]"
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
