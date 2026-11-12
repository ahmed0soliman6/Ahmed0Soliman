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
  Search,
  Sparkles,
  Send,
  X,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { locale, navigate, db } = usePlatform();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const publishedProjects = db.projects
    .filter((p) => p.published)
    .sort((a, b) => a.order - b.order);

  const categories = [
    { id: 'all', label: locale === 'ar' ? 'جميع المشروعات' : 'All Projects' },
    { id: 'medical-systems', label: locale === 'ar' ? 'أنظمة العيادات' : 'Clinic Systems' },
    {
      id: 'charitable-healthcare',
      label: locale === 'ar' ? 'المستشفيات (ERP)' : 'Hospital ERP',
    },
    {
      id: 'inventory-systems',
      label: locale === 'ar' ? 'إدارة المخازن' : 'Inventory & Supply',
    },
    {
      id: 'quality-systems',
      label: locale === 'ar' ? 'إدارة الجودة' : 'Quality Systems',
    },
    { id: 'automation-bots', label: locale === 'ar' ? 'بوتات الحجز' : 'Booking Bots' },
  ];

  const filteredProjects = publishedProjects.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.ar.toLowerCase().includes(q) ||
      p.title.en.toLowerCase().includes(q) ||
      p.summary.ar.toLowerCase().includes(q) ||
      p.summary.en.toLowerCase().includes(q) ||
      p.techStack.some((t) => t.toLowerCase().includes(q))
    );
  });

  const projectWithComparison = publishedProjects.find(
    (p) => p.comparisonTable && p.comparisonTable.length > 0
  );

  return (
    <LayoutResolver pageWorld="soli-showcase" adminQuickEditPath="/admin/projects">
      <SEOHead
        locale={locale}
        fallbackTitle={
          locale === 'ar'
            ? 'معرض مشروعاتي والأنظمة الطبية | أحمد سليمان'
            : 'Featured Projects & Healthcare Systems | Ahmed Soliman'
        }
        fallbackDescription={
          locale === 'ar'
            ? 'استكشف الأنظمة البرمجية والمنصات الطبية التي طوّرها أحمد سليمان: Soli Medical، ICU-Sync، Mitali Hospital، وأنظمة إدارة المخازن والجودة.'
            : 'Explore software systems and healthcare platforms engineered by Ahmed Soliman: Soli Medical, ICU-Sync, Mitali Hospital, Medi-Logix, and Q-Care.'
        }
        pathname={`/${locale}/projects`}
      />

      <div className="bg-[#060a12] text-[#F0F9FF] relative min-h-screen overflow-hidden">
        {/* Ambient Glow & Grain Overlays from index.html */}
        <div className="soli-glow" aria-hidden="true" />
        <div className="soli-grain" aria-hidden="true" />

        {/* =================================================================== */}
        {/* 1. SOLI MEDICAL OBSIDIAN-CYAN HERO + ECG HEARTBEAT WAVE             */}
        {/* =================================================================== */}
        <section className="relative z-10 py-14 lg:py-22 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-12">
            {/* Centered Header Block */}
            <div className="text-center max-w-3xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {locale === 'ar'
                    ? 'هندسة وتطوير المنصات والأنظمة الطبية'
                    : 'Healthcare Software & Clinical Systems Engineering'}
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.15]">
                {locale === 'ar' ? (
                  <>
                    <span className="block text-white">أنظمة طبية مصممة</span>
                    <span className="block bg-gradient-to-l from-[#E0F2FE] via-[#38BDF8] to-[#00D4FF] bg-clip-text text-transparent">
                      لرعاية تتحرك معك
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-white">Clinical Systems Built</span>
                    <span className="block bg-gradient-to-r from-[#E0F2FE] via-[#38BDF8] to-[#00D4FF] bg-clip-text text-transparent">
                      Around Daily Care
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-lg text-[#94A3B8] leading-relaxed">
                {locale === 'ar'
                  ? 'استكشف المنظومات الطبية والبرمجية التي صمّمها وطوّرها أحمد سليمان لإدارة العيادات، المجمعات الطبية، وحدات الرعاية المركزة، المخازن، والجودة السريرية.'
                  : 'Explore clinical and operational platforms engineered by Ahmed Soliman for solo clinics, medical complexes, ICU units, inventory, and hospital quality.'}
              </p>

              {/* Official Contact & Showcase Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/${locale}/solimedical`)}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs sm:text-sm font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 shadow-[0_0_28px_rgba(0,212,255,0.45)] hover:shadow-[0_0_38px_rgba(0,212,255,0.7)] transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {locale === 'ar'
                      ? 'عرض Soli Medical التفاعلي الكامل'
                      : 'Full Soli Medical Showcase'}
                  </span>
                </button>

                <a
                  href="https://wa.me/Ahmed0soliman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-[#09151E]/90 border border-[#00D4FF]/40 text-white hover:border-[#00D4FF] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#00D4FF]" />
                  <span>{locale === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp Consultation'}</span>
                </a>

                <a
                  href="https://t.me/SoliMedicalproBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-[#09151E]/90 border border-slate-700/80 text-slate-200 hover:border-[#00D4FF]/60 transition-colors"
                >
                  <Send className="w-4 h-4 text-[#38BDF8]" />
                  <span>@SoliMedicalproBot</span>
                </a>

                <a
                  href="https://www.facebook.com/SoliMedical/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-[#09151E]/90 border border-slate-700/80 text-slate-200 hover:border-[#00D4FF]/60 transition-colors"
                >
                  <span>Facebook</span>
                </a>
              </div>

              {/* Animated Glowing ECG Heartbeat Pulse Divider */}
              <div className="pt-4 max-w-3xl mx-auto">
                <svg
                  className="w-full h-14 overflow-visible"
                  viewBox="0 0 900 70"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0,35 L260,35 L278,35 L290,10 L304,60 L318,16 L332,48 L344,35 L550,35 L568,35 L580,10 L594,60 L608,16 L622,48 L634,35 L900,35"
                    stroke="rgba(0, 212, 255, 0.22)"
                    strokeWidth="2"
                  />
                  <path
                    className="soli-ecg-path drop-shadow-[0_0_10px_#00D4FF]"
                    d="M0,35 L260,35 L278,35 L290,10 L304,60 L318,16 L332,48 L344,35 L550,35 L568,35 L580,10 L594,60 L608,16 L622,48 L634,35 L900,35"
                    stroke="#00D4FF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#07131B]/90 border border-[#00D4FF]/20 p-3.5 rounded-2xl shadow-[0_0_30px_rgba(0,212,255,0.06)]">
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 shadow-[0_0_16px_rgba(0,212,255,0.4)]'
                          : 'text-slate-300 hover:text-white hover:bg-[#0C1E28]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-[#00D4FF]/70 absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      locale === 'ar' ? 'ابحث في المشروعات...' : 'Search projects...'
                    }
                    className="w-full ps-9 pe-3.5 py-2 rounded-xl text-xs bg-[#040D12] border border-[#00D4FF]/25 text-white placeholder:text-slate-500 focus:border-[#00D4FF] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* 2. 3-COLUMN GLOWING CYAN PROJECT CARDS (Soli Medical Effects)   */}
            {/* =============================================================== */}
            {filteredProjects.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#07131B] border border-[#00D4FF]/25 text-center space-y-3">
                <p className="text-sm text-slate-300">
                  {locale === 'ar'
                    ? 'لا توجد مشروعات مطابقة لفلتر البحث الحالي.'
                    : 'No projects match your current filter or search.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00D4FF] text-slate-950"
                >
                  {locale === 'ar' ? 'إظهار جميع المشروعات' : 'Show All Projects'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredProjects.map((project, idx) => {
                  const isSoliFlagship = project.slug === 'soli-medical-clinic-system';

                  return (
                    <motion.article
                      key={project.id}
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.22 }}
                      className="rounded-[26px] bg-gradient-to-b from-[#0A1D28]/95 to-[#061118]/95 border border-[#00D4FF]/25 hover:border-[#00D4FF]/70 hover:shadow-[0_0_38px_rgba(0,212,255,0.18)] transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Screen Preview Frame */}
                        <div
                          onClick={() =>
                            navigate(
                              isSoliFlagship
                                ? `/${locale}/solimedical`
                                : `/${locale}/projects/${project.slug}`
                            )
                          }
                          className="cursor-pointer relative h-52 bg-[#040D12] overflow-hidden border-b border-[#00D4FF]/15 p-3"
                        >
                          <div className="w-full h-full rounded-2xl overflow-hidden border border-[#00D4FF]/25 relative">
                            <OptimizedImage
                              src={project.coverImage}
                              alt={project.title[locale]}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#060a12] via-transparent to-transparent opacity-80" />
                          </div>

                          {/* Top Numbered Cyan Badge + Category */}
                          <div className="absolute top-5 start-5 end-5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-[#00D4FF] text-slate-950 font-mono-tabular text-xs font-black flex items-center justify-center shadow-[0_0_14px_#00D4FF]">
                                0{idx + 1}
                              </span>
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#060a12]/90 text-[#38BDF8] border border-[#00D4FF]/35 backdrop-blur-md">
                                {project.categoryLabel[locale]}
                              </span>
                            </div>

                            {isSoliFlagship && project.logoImage && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/90 border border-[#00D4FF]/40">
                                <img
                                  src={project.logoImage}
                                  alt="Soli Medical"
                                  className="w-4 h-4 object-contain"
                                />
                                <span className="text-[10px] font-bold text-white">Soli Medical</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-4">
                          <h3
                            onClick={() =>
                              navigate(
                                isSoliFlagship
                                  ? `/${locale}/solimedical`
                                  : `/${locale}/projects/${project.slug}`
                              )
                            }
                            className="cursor-pointer text-xl font-black text-white group-hover:text-[#00D4FF] transition-colors leading-snug"
                          >
                            {project.title[locale]}
                          </h3>

                          <p className="text-xs sm:text-sm text-slate-300/85 leading-relaxed line-clamp-3">
                            {project.summary[locale]}
                          </p>

                          {/* Key Features Preview */}
                          <div className="space-y-1.5 pt-1">
                            {(project.features[locale] || []).slice(0, 2).map((feat, fIdx) => (
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
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {project.techStack.slice(0, 4).map((tech, tIdx) => (
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
                      <div className="px-6 py-4 bg-[#040D12]/80 border-t border-[#00D4FF]/15 flex items-center justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              isSoliFlagship
                                ? `/${locale}/solimedical`
                                : `/${locale}/projects/${project.slug}`
                            )
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 hover:opacity-95 transition-opacity cursor-pointer shadow-[0_0_16px_rgba(0,212,255,0.25)]"
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
                        </button>

                        {project.youtubeId ? (
                          <button
                            type="button"
                            onClick={() => setActiveVideoId(project.youtubeId || null)}
                            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold border border-[#00D4FF]/40 text-slate-200 hover:border-[#00D4FF] hover:text-[#00D4FF] transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 text-[#00D4FF]" />
                            <span>{locale === 'ar' ? 'فيديو' : 'Demo'}</span>
                          </button>
                        ) : project.liveUrl ? (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold border border-[#00D4FF]/40 text-slate-200 hover:border-[#00D4FF] hover:text-[#00D4FF] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#00D4FF]" />
                            <span>{locale === 'ar' ? 'معاينة' : 'Live'}</span>
                          </a>
                        ) : null}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. ARCHITECTURAL COMPARISON TABLE (Single Clinic vs Medical Complex) */}
        {/* =================================================================== */}
        {projectWithComparison?.comparisonTable && (
          <section className="relative z-10 py-16 lg:py-22 px-4 sm:px-8 border-t border-[#00D4FF]/15 bg-[#040D12]/90">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]">
                    {locale === 'ar'
                      ? 'مقارنة معمارية · عيادة الطبيب الواحد مقابل المجمع الطبي'
                      : 'Architectural Comparison · Single-Doctor Clinic vs. Medical Complex'}
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white">
                    {locale === 'ar'
                      ? 'كيف تختلف بنية النظام حسب حجم منشأتك الطبية؟'
                      : 'How System Modules Scale From Solo Clinics to Hospitals'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/${locale}/solimedical`)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 hover:opacity-95 transition-opacity self-start cursor-pointer shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                >
                  <span>
                    {locale === 'ar'
                      ? 'فتح صفحة عرض Soli Medical الكاملة'
                      : 'Open Full Soli Medical Showcase'}
                  </span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#00D4FF]/25 bg-[#07131B]">
                <table className="w-full text-start border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#00D4FF]/25 bg-[#040D12] text-white">
                      <th className="py-4 px-5 text-start font-bold">
                        {locale === 'ar' ? 'محور المقارنة' : 'Comparison Axis'}
                      </th>
                      <th className="py-4 px-5 text-start font-bold text-[#00D4FF]">
                        {locale === 'ar' ? 'عيادة الطبيب الواحد' : 'Single-Doctor Clinic'}
                      </th>
                      <th className="py-4 px-5 text-start font-bold text-[#2DD4BF]">
                        {locale === 'ar'
                          ? 'مجمع العيادات أو مستشفى صغير'
                          : 'Medical Complex / Small Hospital'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#00D4FF]/15">
                    {projectWithComparison.comparisonTable.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#0A1D28]/60 transition-colors">
                        <td className="py-4 px-5 font-bold text-white whitespace-nowrap">
                          {row.axis[locale]}
                        </td>
                        <td className="py-4 px-5 text-slate-200">
                          {row.singleClinic[locale]}
                        </td>
                        <td className="py-4 px-5 text-slate-200">
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

        {/* Floating WhatsApp Button from index.html */}
        <a
          href="https://wa.me/Ahmed0soliman"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="fixed bottom-6 end-6 z-40 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-xs font-black shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-105 transition-transform"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{locale === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp'}</span>
        </a>
      </div>

      {/* YouTube Demo Modal Lightbox */}
      {activeVideoId && (
        <div
          onClick={() => setActiveVideoId(null)}
          className="fixed inset-0 z-[9995] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-slate-950 border border-[#00D4FF]/40"
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
