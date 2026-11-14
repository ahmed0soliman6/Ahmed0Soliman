import React, { useMemo, useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { MagneticButton } from '../components/common/CustomCursorAndRipple';
import {
  CursorSpotlightRegion,
  InteractiveProjectCard,
  RevealBlock,
} from '../components/projects/InteractiveShowcase';
import {
  ArrowUpRight,
  MessageCircle,
  Search,
  Sparkles,
  Send,
  X,
  Layers,
} from 'lucide-react';

/**
 * Computes responsive grid column spans on a 6-column desktop (2-col tablet, 1-col mobile)
 * grid so cards feature intentional size hierarchy (wider flagship card first) with zero orphan gaps.
 */
function getCardLayoutConfig(
  index: number,
  total: number,
  isDefaultAllView: boolean
): { colSpanClass: string; isFeaturedWide: boolean } {
  if (total === 1) {
    return {
      colSpanClass: 'md:col-span-2 lg:col-span-6',
      isFeaturedWide: true,
    };
  }

  if (isDefaultAllView) {
    if (total === 3) {
      if (index === 0) {
        return { colSpanClass: 'md:col-span-2 lg:col-span-6', isFeaturedWide: true };
      }
      return { colSpanClass: 'md:col-span-1 lg:col-span-3', isFeaturedWide: false };
    }

    // total >= 2 (except 3): Row 1 pairs wide featured [4] + companion [2]
    if (index === 0) {
      return { colSpanClass: 'md:col-span-2 lg:col-span-4', isFeaturedWide: true };
    }
    if (index === 1) {
      return { colSpanClass: 'md:col-span-1 lg:col-span-2', isFeaturedWide: false };
    }

    const remaining = total - 2;
    const remIndex = index - 2;

    if (remaining % 3 === 0) {
      return { colSpanClass: 'md:col-span-1 lg:col-span-2', isFeaturedWide: false };
    }
    if (remaining % 2 === 0) {
      return { colSpanClass: 'md:col-span-1 lg:col-span-3', isFeaturedWide: false };
    }
    // Odd >= 5 remaining: first 3 as 3-up (2 cols each), final 2 as 2-up (3 cols each)
    if (remIndex < remaining - 2) {
      return { colSpanClass: 'md:col-span-1 lg:col-span-2', isFeaturedWide: false };
    }
    return { colSpanClass: 'md:col-span-1 lg:col-span-3', isFeaturedWide: false };
  }

  // Filtered view
  if (total === 2 || total === 4) {
    return { colSpanClass: 'md:col-span-1 lg:col-span-3', isFeaturedWide: false };
  }
  if (total % 3 === 0) {
    return { colSpanClass: 'md:col-span-1 lg:col-span-2', isFeaturedWide: false };
  }
  if (index < total - 2) {
    return { colSpanClass: 'md:col-span-1 lg:col-span-2', isFeaturedWide: false };
  }
  return { colSpanClass: 'md:col-span-1 lg:col-span-3', isFeaturedWide: false };
}

export const ProjectsPage: React.FC = () => {
  const { locale, navigate, db } = usePlatform();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const publishedProjects = useMemo(
    () =>
      db.projects
        .filter((p) => p.published)
        .sort((a, b) => a.order - b.order),
    [db.projects]
  );

  const categories = [
    { id: 'all', label: locale === 'ar' ? 'جميع المشروعات' : 'All Projects' },
    { id: 'medical-systems', label: locale === 'ar' ? 'أنظمة العيادات' : 'Clinic Systems' },
    {
      id: 'charitable-healthcare',
      label: locale === 'ar' ? 'المستشفيات (ERP)' : 'Hospital ERP',
    },
    {
      id: 'inventory-erp',
      label: locale === 'ar' ? 'إدارة المخازن' : 'Inventory & Supply',
    },
    {
      id: 'quality-systems',
      label: locale === 'ar' ? 'إدارة الجودة' : 'Quality Systems',
    },
    { id: 'automation-bots', label: locale === 'ar' ? 'بوتات الحجز' : 'Booking Bots' },
  ];

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedProjects.filter((p) => {
      const cat = p.category as string;
      const matchesCategory =
        selectedCategory === 'all' ||
        cat === selectedCategory ||
        (selectedCategory === 'inventory-erp' && cat === 'inventory-systems');
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        p.title.ar.toLowerCase().includes(q) ||
        p.title.en.toLowerCase().includes(q) ||
        p.summary.ar.toLowerCase().includes(q) ||
        p.summary.en.toLowerCase().includes(q) ||
        p.categoryLabel.ar.toLowerCase().includes(q) ||
        p.categoryLabel.en.toLowerCase().includes(q) ||
        p.techStack.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [publishedProjects, selectedCategory, searchQuery]);

  const isDefaultAllView = selectedCategory === 'all' && !searchQuery.trim();

  const projectWithComparison = useMemo(
    () => publishedProjects.find((p) => p.comparisonTable && p.comparisonTable.length > 0),
    [publishedProjects]
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
            ? 'استكشف الأنظمة البرمجية والمنصات الطبية التي طوّرها أحمد سليمان: Soli Medical، ICU-Sync، Soli Medical Hospital، وأنظمة إدارة المخازن والجودة.'
            : 'Explore software systems and healthcare platforms engineered by Ahmed Soliman: Soli Medical, ICU-Sync, Soli Medical Hospital, Medi-Logix, and Q-Care.'
        }
        pathname={`/${locale}/projects`}
      />

      <CursorSpotlightRegion className="bg-[#060a12] text-[#F0F9FF] min-h-screen overflow-hidden">
        {/* Ambient Glow & Grain Overlays from index.html */}
        <div className="soli-glow" aria-hidden="true" />
        <div className="soli-grain" aria-hidden="true" />

        {/* =================================================================== */}
        {/* 1. DARK TECH HERO HEADER + SUBTLE ECG HEARTBEAT DIVIDER             */}
        {/* =================================================================== */}
        <section className="relative z-10 pt-12 pb-16 lg:pt-16 lg:pb-22 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-10 lg:space-y-12">
            {/* Refined Centered Header Block */}
            <RevealBlock className="text-center max-w-3xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-xs font-bold shadow-[0_0_20px_rgba(0,212,255,0.12)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {locale === 'ar'
                    ? 'معرض المشروعات · هندسة الأنظمة الطبية والتقنية'
                    : 'Projects Gallery · Healthcare Software & Systems Engineering'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.16]">
                {locale === 'ar' ? (
                  <>
                    <span className="block text-white">أنظمة طبية وبرمجية</span>
                    <span className="block bg-gradient-to-l from-[#E0F2FE] via-[#38BDF8] to-[#00D4FF] bg-clip-text text-transparent">
                      مصممة لبيئة العمل الفعلية
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-white">Clinical & Operational Systems</span>
                    <span className="block bg-gradient-to-r from-[#E0F2FE] via-[#38BDF8] to-[#00D4FF] bg-clip-text text-transparent">
                      Engineered Around Daily Care
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-[#94A3B8] leading-relaxed max-w-2xl mx-auto">
                {locale === 'ar'
                  ? 'استكشف المنظومات الطبية والبرمجية التي صمّمها وطوّرها أحمد سليمان لإدارة العيادات، المجمعات الطبية، وحدات الرعاية المركزة، المخازن، والجودة السريرية.'
                  : 'Explore clinical and operational platforms engineered by Ahmed Soliman for solo clinics, medical complexes, ICU units, inventory, and hospital quality.'}
              </p>

              {/* Magnetic Primary & Contact Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <MagneticButton
                  onClick={() => navigate(`/${locale}/solimedical`)}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs sm:text-sm font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 shadow-[0_0_28px_rgba(0,212,255,0.42)] hover:shadow-[0_0_40px_rgba(0,212,255,0.68)] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {locale === 'ar'
                      ? 'عرض Soli Medical التفاعلي الكامل'
                      : 'Full Soli Medical Showcase'}
                  </span>
                </MagneticButton>

                <MagneticButton
                  href="https://wa.me/Ahmed0soliman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-[#09151E]/90 border border-[#00D4FF]/40 text-white hover:border-[#00D4FF] hover:bg-[#0C1E2B]"
                >
                  <MessageCircle className="w-4 h-4 text-[#00D4FF]" />
                  <span>{locale === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp Consultation'}</span>
                </MagneticButton>

                <a
                  href="https://t.me/SoliMedicalproBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-bold bg-[#09151E]/90 border border-slate-700/80 text-slate-200 hover:border-[#00D4FF]/60 hover:text-white active:scale-[0.96] transition-all"
                >
                  <Send className="w-4 h-4 text-[#38BDF8]" />
                  <span>@SoliMedicalproBot</span>
                </a>

                <a
                  href="https://www.facebook.com/SoliMedical/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-bold bg-[#09151E]/90 border border-slate-700/80 text-slate-200 hover:border-[#00D4FF]/60 hover:text-white active:scale-[0.96] transition-all"
                >
                  <span>Facebook</span>
                </a>
              </div>

              {/* Balanced Architectural ECG Heartbeat Pulse Divider */}
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
            {/* 2. FILTER CATEGORIES + SEARCH TOOLBAR                           */}
            {/* =============================================================== */}
            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#07131B]/90 backdrop-blur-md border border-[#00D4FF]/22 p-3.5 sm:p-4 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
                {/* Category Tabs */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.96] ${
                          isActive
                            ? 'bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 shadow-[0_0_18px_rgba(0,212,255,0.42)]'
                            : 'text-slate-300 hover:text-white hover:bg-[#0C1E28] border border-transparent hover:border-[#00D4FF]/25'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Search Box + Results Counter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-64 lg:w-72">
                    <Search className="w-4 h-4 text-[#00D4FF]/70 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        locale === 'ar' ? 'ابحث باسم المشروع أو التقنية...' : 'Search projects or tech...'
                      }
                      className="w-full ps-9 pe-9 py-2.5 rounded-xl text-xs bg-[#040D12] border border-[#00D4FF]/25 text-white placeholder:text-slate-500 focus:border-[#00D4FF] focus:shadow-[0_0_14px_rgba(0,212,255,0.2)] focus:outline-none transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label={locale === 'ar' ? 'مسح البحث' : 'Clear search'}
                        className="absolute top-1/2 -translate-y-1/2 end-2.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#040D12] border border-[#00D4FF]/15 text-[11px] font-mono-tabular font-semibold text-[#38BDF8] shrink-0">
                    <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>
                      {filteredProjects.length} / {publishedProjects.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* 3. BENTO-INSPIRED INTERACTIVE PROJECTS GRID                     */}
            {/* =============================================================== */}
            {filteredProjects.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#07131B]/95 border border-[#00D4FF]/25 text-center space-y-4">
                <p className="text-sm text-slate-300">
                  {locale === 'ar'
                    ? 'لا توجد مشروعات مطابقة لفلتر البحث الحالي.'
                    : 'No projects match your current filter or search.'}
                </p>
                <MagneticButton
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-[#00D4FF] text-slate-950 cursor-pointer"
                >
                  {locale === 'ar' ? 'إظهار جميع المشروعات' : 'Show All Projects'}
                </MagneticButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-7">
                {filteredProjects.map((project, idx) => {
                  const { colSpanClass, isFeaturedWide } = getCardLayoutConfig(
                    idx,
                    filteredProjects.length,
                    isDefaultAllView
                  );
                  return (
                    <InteractiveProjectCard
                      key={project.id}
                      project={project}
                      index={idx}
                      locale={locale}
                      colSpanClass={colSpanClass}
                      isFeaturedWide={isFeaturedWide}
                      onNavigate={navigate}
                      onOpenVideo={(ytId) => setActiveVideoId(ytId)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =================================================================== */}
        {/* 4. ARCHITECTURAL COMPARISON TABLE (Single Clinic vs Medical Complex) */}
        {/* =================================================================== */}
        {projectWithComparison?.comparisonTable && (
          <section className="relative z-10 py-16 lg:py-22 px-4 sm:px-8 border-t border-[#00D4FF]/15 bg-[#040D12]/90">
            <RevealBlock className="max-w-7xl mx-auto space-y-8">
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

                <MagneticButton
                  onClick={() => navigate(`/${locale}/solimedical`)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 hover:shadow-[0_0_26px_rgba(0,212,255,0.45)] self-start cursor-pointer shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                >
                  <span>
                    {locale === 'ar'
                      ? 'فتح صفحة عرض Soli Medical الكاملة'
                      : 'Open Full Soli Medical Showcase'}
                  </span>
                  <ArrowUpRight className="w-4 h-4" />
                </MagneticButton>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#00D4FF]/25 bg-[#07131B] shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
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
                      <tr key={rIdx} className="hover:bg-[#0A1D28]/65 transition-colors">
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
            </RevealBlock>
          </section>
        )}

        {/* Floating WhatsApp Magnetic CTA */}
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
      </CursorSpotlightRegion>

      {/* YouTube Demo Modal Lightbox */}
      {activeVideoId && (
        <div
          onClick={() => setActiveVideoId(null)}
          className="fixed inset-0 z-[9995] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-slate-950 border border-[#00D4FF]/40 shadow-[0_0_50px_rgba(0,212,255,0.2)]"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 text-white">
              <span className="text-sm font-semibold">
                {locale === 'ar' ? 'شاهد النظام وهو يعمل' : 'Watch Live System Walkthrough'}
              </span>
              <button
                type="button"
                onClick={() => setActiveVideoId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
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
