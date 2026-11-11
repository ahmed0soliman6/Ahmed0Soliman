import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  ArrowUpRight,
  Check,
  Play,
  MessageCircle,
  ExternalLink,
  X,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { locale, navigate, db } = usePlatform();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const settings = db.siteSettings;
  const publishedProjects = db.projects.filter((p) => p.published);

  const categories = [
    { id: 'all', label: locale === 'ar' ? 'جميع المشروعات' : 'All Projects' },
    { id: 'medical-systems', label: locale === 'ar' ? 'أنظمة العيادات' : 'Clinic Systems' },
    {
      id: 'charitable-healthcare',
      label: locale === 'ar' ? 'المجمعات الطبية' : 'Medical Complexes',
    },
    { id: 'automation-bots', label: locale === 'ar' ? 'أتمتة وبوتات الحجز' : 'Booking Bots' },
  ];

  const filteredProjects =
    selectedCategory === 'all'
      ? publishedProjects
      : publishedProjects.filter((p) => p.category === selectedCategory);

  const projectWithComparison = publishedProjects.find(
    (p) => p.comparisonTable && p.comparisonTable.length > 0
  );

  return (
    <LayoutResolver adminQuickEditPath="/admin/projects">
      <SEOHead
        locale={locale}
        fallbackTitle={
          locale === 'ar'
            ? 'معرض المشروعات والأنظمة الطبية | أحمد سليمان'
            : 'Projects & Healthcare Systems Gallery | Ahmed Soliman'
        }
        fallbackDescription={
          locale === 'ar'
            ? 'استكشف الأنظمة البرمجية والمنصات الطبية التي طوّرها المهندس أحمد سليمان: نظام عيادة الطبيب الواحد، منظومة المجمعات الطبية، وبوت الحجز.'
            : 'Explore software systems and healthcare platforms engineered by Ahmed Soliman.'
        }
        pathname={`/${locale}/projects`}
      />

      {/* 1. CREATIVE PROJECT GALLERY HEADER & FILTER TABS */}
      <section className="py-14 lg:py-20 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="text-xs font-semibold text-[#00C2CB]">
                {locale === 'ar'
                  ? 'معرض المشروعات والأنظمة · Ahmed Soliman'
                  : 'Creative Project Gallery · Systems & Solutions'}
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'حلول برمجية للعيادات والمجمعات الطبية والمنصات الرقمية'
                  : 'Software Systems for Clinics, Medical Complexes & Web Platforms'}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {locale === 'ar'
                  ? 'اختر الحل المناسب لحجم منشأتك أو استعرض دراسات الحالة التفصيلية لكل نظام ومكوناته التشغيلية.'
                  : 'Compare solutions tailored to your facility size and explore in-depth architectural case studies.'}
              </p>
            </div>

            {/* Interactive Segmented Filter Bar */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-200/70 dark:bg-[#0F172A] border border-slate-300/60 dark:border-slate-800 self-start">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-[#00C2CB] text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. PROJECT CARDS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
            {filteredProjects.map((project, idx) => {
              const spanClass = idx === 0 ? 'lg:col-span-12' : 'lg:col-span-6';
              const whatsappHref = `https://wa.me/${
                settings.whatsappNumber || 'Ahmed0soliman'
              }?text=${encodeURIComponent(project.whatsappInquireText[locale])}`;

              return (
                <motion.article
                  key={project.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                  className={`${spanClass} rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB]/60 transition-colors overflow-hidden flex flex-col`}
                >
                  <div
                    className={`grid grid-cols-1 ${
                      idx === 0 ? 'lg:grid-cols-12' : ''
                    } gap-6 p-6 sm:p-8 flex-1`}
                  >
                    <div
                      className={`${
                        idx === 0 ? 'lg:col-span-7' : ''
                      } flex flex-col justify-between space-y-5`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="text-[#00C2CB] font-semibold">
                            {project.kicker[locale]}
                          </span>
                          <span>·</span>
                          <span>{project.categoryLabel[locale]}</span>
                        </div>

                        <h2
                          onClick={() => navigate(`/${locale}/projects/${project.slug}`)}
                          className="cursor-pointer text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white hover:text-[#00C2CB] transition-colors"
                        >
                          {project.title[locale]}
                        </h2>

                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                          {project.summary[locale]}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                          {(project.features[locale] || []).map((feat, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                            >
                              <Check className="w-4 h-4 text-[#00C2CB] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-5 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => navigate(`/${locale}/projects/${project.slug}`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>
                            {locale === 'ar'
                              ? 'استعراض دراسة الحالة والشاشات'
                              : 'View Case Study & Screens'}
                          </span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>

                        {project.youtubeId && (
                          <button
                            onClick={() => setActiveVideoId(project.youtubeId || null)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#00C2CB] hover:text-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
                          >
                            <Play className="w-3.5 h-3.5 text-[#00C2CB]" />
                            <span>
                              {locale === 'ar' ? 'شاهد الفيديو التعريفي' : 'Watch System Demo'}
                            </span>
                          </button>
                        )}

                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#00C2CB]" />
                          <span>{locale === 'ar' ? 'اطلب هذا النظام' : 'Request This System'}</span>
                        </a>
                      </div>
                    </div>

                    {/* Visual Media Frame */}
                    <div
                      onClick={() => navigate(`/${locale}/projects/${project.slug}`)}
                      className={`${
                        idx === 0 ? 'lg:col-span-5' : ''
                      } cursor-pointer rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#070E1A] flex items-center justify-center p-6 min-h-[240px] relative group`}
                    >
                      <OptimizedImage
                        src={project.coverImage}
                        alt={project.title[locale]}
                        containerClassName="w-44 h-44 sm:w-52 sm:h-52"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. SIDE-BY-SIDE ARCHITECTURAL COMPARISON MATRIX (Single Clinic vs Medical Complex) */}
      {projectWithComparison?.comparisonTable && (
        <section className="py-16 lg:py-22 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0B1324]/40">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="space-y-2 max-w-3xl">
              <div className="text-xs font-semibold text-[#00C2CB]">
                {locale === 'ar'
                  ? 'مقارنة الحلول الطبية · عيادة الطبيب الواحد مقابل المجمع الطبي'
                  : 'Architectural Comparison · Single-Doctor Clinic vs. Medical Complex'}
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'حلّان مختلفان، وطلب عرض يبدأ بالسؤال الصحيح.'
                  : 'Two Distinct Solutions Built Around How Your Facility Operates.'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                {locale === 'ar'
                  ? 'الجدول يوضح كيف تختلف نقطة البداية والوحدات التشغيلية بين العيادة الفردية والمجمع الطبي.'
                  : 'Compare how operational priorities and modules differ between a solo clinic and a multi-department complex.'}
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
              <table className="w-full text-start border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-[#070E1A]/60">
                    <th className="py-4 px-5 text-start font-bold text-slate-900 dark:text-white">
                      {locale === 'ar' ? 'محور المقارنة' : 'Comparison Axis'}
                    </th>
                    <th className="py-4 px-5 text-start font-bold text-[#00C2CB]">
                      {locale === 'ar' ? 'عيادة الطبيب الواحد' : 'Single-Doctor Clinic'}
                    </th>
                    <th className="py-4 px-5 text-start font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'مجمع العيادات أو مستشفى صغير'
                        : 'Medical Complex / Small Hospital'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {projectWithComparison.comparisonTable.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {row.axis[locale]}
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                        {row.singleClinic[locale]}
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                        {row.medicalComplex[locale]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* YouTube Demo Modal Lightbox */}
      {activeVideoId && (
        <div
          onClick={() => setActiveVideoId(null)}
          className="fixed inset-0 z-[9995] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-slate-950 border border-slate-800"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 text-white">
              <span className="text-sm font-semibold">
                {locale === 'ar' ? 'شاهد النظام وهو يعمل' : 'Watch Live System Walkthrough'}
              </span>
              <button
                onClick={() => setActiveVideoId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                title="System Walkthrough Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </LayoutResolver>
  );
};
