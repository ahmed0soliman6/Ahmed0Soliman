import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  Sun,
  Moon,
  ArrowDown,
  ArrowUpRight,
  Link2,
  MessageCircle,
  Send,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';

type StudioDockTab = 'projects' | 'about' | 'clinics' | 'blog' | 'skills';

const OFFICIAL_WHATSAPP_URL = 'https://wa.me/Ahmed0soliman';
const OFFICIAL_FACEBOOK_URL = 'https://www.facebook.com/SoliMedical/';
const OFFICIAL_TELEGRAM_BOT_URL = 'https://t.me/SoliMedicalproBot';

export const HomePage: React.FC = () => {
  const { locale, setLocale, theme, toggleTheme, navigate, db, adminSession } = usePlatform();

  const homePage =
    db.pages.find((p) => p.slug === 'home' || p.id === 'page-home') || db.pages[0];
  const aboutPage =
    db.pages.find((p) => p.slug === 'about' || p.id === 'page-about') || db.pages[1] || db.pages[0];
  const settings = db.siteSettings;

  const isPageVisible = (slugId: string) => {
    const found = db.pages.find((p) => p.slug === slugId || p.id === slugId);
    return found ? found.published !== false : true;
  };

  const [activeTab, setActiveTab] = useState<StudioDockTab>('projects');
  const [whatsAppQuickMsg, setWhatsAppQuickMsg] = useState('');
  const [previewWeight, setPreviewWeight] = useState<number>(700);

  const publishedProjects = db.projects
    .filter((p) => p.published)
    .sort((a, b) => a.order - b.order);
  const publishedClinics = db.clinics
    .filter((c) => c.published)
    .sort((a, b) => a.order - b.order);
  const publishedArticles = db.articles
    .filter((a) => a.published)
    .sort((a, b) => a.order - b.order);

  const isLight = theme === 'light';

  // Neumorphic surface palette tokens matching linestudio.art Light & Dark modes
  const neu = {
    pageBg: isLight ? 'bg-[#E2E4E9] text-[#1D1F23]' : 'bg-[#2C3135] text-[#F1F3F5]',
    boardShell: isLight
      ? 'bg-[#ECEEF2] border border-white/80 shadow-[20px_20px_45px_#C6C9D0,-16px_-16px_40px_#FFFFFF]'
      : 'bg-[#25282B] border border-white/5 shadow-[22px_22px_50px_#17191B,-14px_-14px_36px_#33383C]',
    recessedWell: isLight
      ? 'bg-[#E3E5EA] border border-white/60 shadow-[inset_6px_6px_14px_#C7CAD1,inset_-6px_-6px_14px_#FFFFFF]'
      : 'bg-[#202326] border border-black/40 shadow-[inset_6px_6px_14px_#151719,inset_-5px_-5px_12px_#2B2F33]',
    raisedCard: isLight
      ? 'bg-[#ECEEF2] border border-white/85 shadow-[10px_10px_22px_#C8CBD2,-8px_-8px_20px_#FFFFFF] hover:shadow-[14px_14px_28px_#BFC2CA,-10px_-10px_24px_#FFFFFF]'
      : 'bg-[#282B2E] border border-white/5 shadow-[10px_10px_22px_#181A1C,-7px_-7px_18px_#34383C] hover:shadow-[14px_14px_28px_#141618,-8px_-8px_20px_#383D42]',
    raisedPillBtn: isLight
      ? 'bg-[#ECEEF2] text-[#1D1F23] border border-white/90 shadow-[5px_5px_12px_#C5C8CF,-4px_-4px_10px_#FFFFFF] hover:shadow-[inset_3px_3px_6px_#C5C8CF,inset_-3px_-3px_6px_#FFFFFF]'
      : 'bg-[#26292C] text-[#F1F3F5] border border-white/10 shadow-[5px_5px_12px_#17191B,-4px_-4px_10px_#33373B] hover:shadow-[inset_3px_3px_6px_#17191B,inset_-3px_-3px_6px_#33373B]',
    activeDockCircle: isLight
      ? 'bg-[#E1E3E8] text-[#1D1F23] font-black shadow-[inset_4px_4px_8px_#C3C6CD,inset_-4px_-4px_8px_#FFFFFF]'
      : 'bg-[#1D2022] text-white font-black shadow-[inset_4px_4px_8px_#131517,inset_-4px_-4px_8px_#2B2F33]',
    mutedText: isLight ? 'text-[#777B84]' : 'text-[#8E949B]',
    subText: isLight ? 'text-[#52565E]' : 'text-[#B4BAC0]',
  };

  // Automatically filter out any section that was hidden by the Admin in /admin/pages
  const allDockItems: {
    id: StudioDockTab;
    pageSlug: string;
    labelAr: string;
    labelEn: string;
  }[] = [
    { id: 'projects', pageSlug: 'projects', labelAr: 'مشروعاتي', labelEn: 'Projects' },
    { id: 'about', pageSlug: 'about', labelAr: 'من أنا', labelEn: 'About' },
    { id: 'clinics', pageSlug: 'clinics', labelAr: 'العيادات', labelEn: 'Clinics' },
    { id: 'blog', pageSlug: 'blog', labelAr: 'المقالات', labelEn: 'Articles' },
    { id: 'skills', pageSlug: 'about', labelAr: 'أدواتي', labelEn: 'Skills' },
  ];

  const dockItems = allDockItems.filter((item) => isPageVisible(item.pageSlug));

  const handleOpenAdmin = () => {
    if (adminSession) {
      navigate('/admin');
    } else {
      window.dispatchEvent(new CustomEvent('open-quick-admin-modal'));
    }
  };

  const handleWhatsAppSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text =
      whatsAppQuickMsg.trim() ||
      (locale === 'ar'
        ? 'مرحباً م. أحمد سليمان، أود الاستفسار عن الأنظمة الطبية وتطوير المشروعات.'
        : 'Hello Ahmed Soliman, I would like to inquire about your medical software systems.');
    const waUrl = `${OFFICIAL_WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const stageHeader = {
    projects: {
      kicker: locale === 'ar' ? 'الأنظمة والبرمجيات الطبية' : 'Medical Systems & Platforms',
      title: locale === 'ar' ? 'أنظمة تُسرّع عملك الطبي' : 'Systems That Accelerate Care',
      sub:
        locale === 'ar'
          ? 'تفعيل فوري، واجهة عربية وإنجليزية من البداية، وتحديثات مستمرة تناسب العيادات والمستشفيات.'
          : 'Cloud clinical platforms, ICU telemetry, and automated patient bots built from real ICU & clinic workflows.',
    },
    about: {
      kicker: locale === 'ar' ? 'السيرة المهنية والإكلينيكية' : 'Clinical & Technical Profile',
      title: locale === 'ar' ? 'الجمع بين الطب والبرمجة' : 'Bridging ICU Care & Software',
      sub:
        locale === 'ar'
          ? 'خبرة عملية في العناية المركزة وإدارة الجودة الصحية مقترنة بهندسة الأنظمة السحابية.'
          : 'Intensive Care leadership combined with full-stack healthcare systems engineering.',
    },
    clinics: {
      kicker: locale === 'ar' ? 'بوابات العيادات والمراكز' : 'Standalone Clinic Portals',
      title: locale === 'ar' ? 'صفحات هبوط مستقلة للعيادات' : 'Dedicated Clinic Landing Portals',
      sub:
        locale === 'ar'
          ? 'لكل عيادة أو مركز طبي هويته المستقلة، جدول أطبائه، وأسعار خدماته مع الحجز الفوري عبر واتساب.'
          : 'Independent patient-facing landing pages for clinics with doctor rosters, pricing, and instant WhatsApp booking.',
    },
    blog: {
      kicker: locale === 'ar' ? 'مساحة المعرفة والمقالات' : 'Knowledge & Editorial Hub',
      title: locale === 'ar' ? 'مقالات وتجارب من أرض الواقع' : 'Clinical & Tech Insights',
      sub:
        locale === 'ar'
          ? 'شروحات تقنية وطبية حول التحول الرقمي للعيادات، إدارة العناية المركزة، وجودة الرعاية الصحية.'
          : 'Articles and practical guides on digital clinic transformation, ICU synchronization, and healthcare quality.',
    },
    skills: {
      kicker: locale === 'ar' ? 'المهارات والأدوات' : 'Competencies & Stack',
      title: locale === 'ar' ? 'أدوات وتقنيات متكاملة' : 'Full-Stack & Clinical Toolkit',
      sub:
        locale === 'ar'
          ? 'من قيادة وحدات الرعاية الحرجة إلى تطوير تطبيقات React وTypeScript وFirebase وبوتات التليجرام.'
          : 'From high-acuity ICU leadership to React, TypeScript, Firebase, and automated medical bots.',
    },
  }[activeTab];

  const badgeColors = [
    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25',
    'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25',
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25',
  ];

  return (
    <LayoutResolver pageWorld="home-avoshu" adminQuickEditPath="/admin/pages">
      <SEOHead
        locale={locale}
        seo={homePage?.seo}
        fallbackTitle={`${settings.ownerName[locale]} | ${settings.tagline[locale]}`}
        fallbackDescription={settings.seo.description[locale]}
        pathname={`/${locale}`}
        structuredDataPayload={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: settings.ownerName[locale],
          jobTitle: settings.ownerRole[locale],
          url: window.location.origin,
          image: settings.avatarUrl,
        }}
      />

      {/* =================================================================== */}
      {/* LINESTUDIO.ART TACTILE NEUMORPHIC STUDIO WORKSPACE                   */}
      {/* =================================================================== */}
      <div
        className={`min-h-screen w-full flex flex-col items-center justify-center py-6 px-3 sm:px-6 lg:px-10 transition-colors duration-300 ${neu.pageBg}`}
      >
        {/* Main Console Wrapper + External Right Vertical Pill Dock */}
        <div className="w-full max-w-[1320px] flex flex-col lg:flex-row items-stretch gap-5 lg:gap-6">
          {/* =============================================================== */}
          {/* 1. RIGHT VERTICAL PILL DOCK (In RTL this sits on the Right)     */}
          {/* =============================================================== */}
          <aside className="order-1 lg:order-1 flex lg:flex-col items-center justify-between gap-3">
            {/* Tall Sculpted Vertical Pill Bar */}
            <nav
              aria-label="Studio Sections"
              className={`w-full lg:w-[88px] flex-1 rounded-[36px] lg:rounded-[44px] p-2.5 lg:py-5 lg:px-2.5 flex flex-row lg:flex-col items-center justify-around lg:justify-between gap-2 ${neu.boardShell}`}
            >
              {dockItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center text-[11px] sm:text-xs transition-all cursor-pointer select-none ${
                      isActive
                        ? neu.activeDockCircle
                        : `${neu.subText} hover:scale-105 font-bold`
                    }`}
                  >
                    <span>{locale === 'ar' ? item.labelAr : item.labelEn}</span>
                  </button>
                );
              })}

              {isPageVisible('projects') && (
                <button
                  type="button"
                  onClick={() => navigate(`/${locale}/projects`)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${neu.subText} hover:scale-105`}
                  title={locale === 'ar' ? 'فتح صفحة المشروعات الكاملة' : 'Open Projects Page'}
                >
                  <span>{locale === 'ar' ? 'المعرض' : 'Gallery'}</span>
                </button>
              )}

              {/* Prominent Admin Dashboard Button in the Dock */}
              <button
                type="button"
                onClick={handleOpenAdmin}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold transition-all cursor-pointer ${neu.activeDockCircle}`}
                title={locale === 'ar' ? 'لوحة الإدارة (/admin)' : 'Admin Dashboard (/admin)'}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                <span>{locale === 'ar' ? 'الإدارة' : 'Admin'}</span>
              </button>
            </nav>
          </aside>

          {/* =============================================================== */}
          {/* 2. SCULPTED MAIN STUDIO CONSOLE BOARD (Center + Compact Card)   */}
          {/* =============================================================== */}
          <div
            className={`order-2 lg:order-2 flex-1 rounded-[38px] sm:rounded-[48px] p-4 sm:p-6 lg:p-7 flex flex-col gap-5 relative transition-all duration-300 ${neu.boardShell}`}
          >
            {/* ------------------------------------------------------------- */}
            {/* TOP CONSOLE BAR: Page Shortcuts + Admin Button + Theme Toggle */}
            {/* ------------------------------------------------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Top Section Navigation Shortcuts + Prominent Admin Dashboard Button */}
              <div className="flex flex-wrap items-center gap-2">
                {isPageVisible('about') && (
                  <button
                    type="button"
                    onClick={() => navigate(`/${locale}/about`)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${neu.raisedPillBtn}`}
                  >
                    {locale === 'ar' ? 'صفحة من أنا' : 'About Page'}
                  </button>
                )}
                {isPageVisible('solimedical') && (
                  <button
                    type="button"
                    onClick={() => navigate(`/${locale}/solimedical`)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${neu.raisedPillBtn}`}
                  >
                    Soli Medical
                  </button>
                )}
                {isPageVisible('clinics') && (
                  <button
                    type="button"
                    onClick={() => navigate(`/${locale}/clinics`)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${neu.raisedPillBtn}`}
                  >
                    {locale === 'ar' ? 'العيادات' : 'Clinics'}
                  </button>
                )}
                {isPageVisible('blog') && (
                  <button
                    type="button"
                    onClick={() => navigate(`/${locale}/blog`)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${neu.raisedPillBtn}`}
                  >
                    {locale === 'ar' ? 'المقالات' : 'Blog'}
                  </button>
                )}

                {/* Prominent Admin Dashboard Button right inside the Home Page Top Bar */}
                <button
                  type="button"
                  onClick={handleOpenAdmin}
                  className={`px-4 py-2 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer ${neu.raisedPillBtn}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {adminSession
                      ? locale === 'ar'
                        ? 'لوحة الإدارة (متصل)'
                        : 'Admin Dashboard'
                      : locale === 'ar'
                      ? 'لوحة الإدارة'
                      : 'Admin CMS'}
                  </span>
                </button>
              </div>

              {/* Left/End cluster: Language Switch + Tactile Sun/Moon Switch + Ribbed Emblem */}
              <div className="flex items-center gap-3 ms-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                  className={`px-3.5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer shrink-0 ${neu.raisedPillBtn}`}
                  title="Switch Language"
                >
                  {locale === 'ar' ? 'EN' : 'عربي'}
                </button>

                {/* Tactile Sun / Moon Theme Switch */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle Light/Dark Studio Mode"
                  className={`w-20 h-11 rounded-full p-1.5 flex items-center transition-all cursor-pointer shrink-0 ${neu.recessedWell} ${
                    isLight ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${neu.raisedCard}`}
                  >
                    {isLight ? (
                      <Sun className="w-4 h-4 text-zinc-800" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#FF4D4D] fill-[#FF4D4D]" />
                    )}
                  </span>
                </button>

                {/* Circular Ribbed Brand Dial */}
                <button
                  type="button"
                  onClick={() => navigate(`/${locale}/about`)}
                  title={settings.ownerName[locale]}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                    isLight
                      ? 'bg-[#ECEEF2] shadow-[8px_8px_18px_#C2C5CC,-6px_-6px_16px_#FFFFFF] border-4 border-[#E2E4E9]'
                      : 'bg-gradient-to-br from-[#9EA4AA] via-[#585D63] to-[#2B2F33] shadow-[8px_8px_18px_#151719,-4px_-4px_12px_#3A3F45] p-1'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isLight ? 'bg-[#ECEEF2]' : 'bg-[#C4C9CE]'
                    }`}
                  >
                    <span className="w-2.5 h-4 bg-[#1B1D20] rounded-[2px]" />
                  </span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* MAIN CONSOLE BODY: Expanded Center Stage (9 Cols) + Compact Profile Card (3 Cols) */}
            {/* ------------------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
              {/* =========================================================== */}
              {/* CENTER CARVED STAGE (9 Columns)                             */}
              {/* =========================================================== */}
              <div
                className={`lg:col-span-9 rounded-[32px] p-5 sm:p-7 flex flex-col justify-between gap-6 ${neu.recessedWell}`}
              >
                {/* Stage Header */}
                <div className="space-y-1.5 text-start">
                  <div className={`text-xs font-bold ${neu.mutedText}`}>
                    {stageHeader.kicker}
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                    {stageHeader.title}
                  </h1>
                  <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${neu.subText}`}>
                    {stageHeader.sub}
                  </p>
                </div>

                {/* --------------------------------------------------------- */}
                {/* TAB 1: PROJECTS (3-Column Tactile Cards + Interactive Bar) */}
                {/* --------------------------------------------------------- */}
                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                      {publishedProjects.slice(0, 6).map((project, idx) => {
                        const isSoli = project.slug === 'soli-medical-clinic-system';
                        const badgeClass = badgeColors[idx % badgeColors.length];
                        const targetUrl = isSoli
                          ? `/${locale}/solimedical`
                          : `/${locale}/projects/${project.slug}`;

                        return (
                          <div
                            key={project.id}
                            onClick={() => navigate(targetUrl)}
                            className={`rounded-[26px] p-5 flex flex-col justify-between gap-4 transition-all duration-300 cursor-pointer group ${neu.raisedCard}`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-0.5">
                                  <h2 className="text-sm sm:text-base font-extrabold leading-snug group-hover:underline">
                                    {project.title[locale]}
                                  </h2>
                                  <div className={`text-[11px] font-semibold ${neu.mutedText}`}>
                                    {project.categoryLabel[locale]}
                                  </div>
                                </div>

                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${neu.recessedWell}`}
                                >
                                  {isSoli ? (
                                    <img
                                      src="/assets/aistudio/logo_ae3842b8.png"
                                      alt="Soli Medical"
                                      className="w-6 h-6 object-contain"
                                    />
                                  ) : (
                                    <span>{locale === 'ar' ? 'ط' : 'M'}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-start">
                                <span
                                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${badgeClass}`}
                                >
                                  {project.techStack[0] || 'Cloud System'}
                                </span>
                              </div>

                              <p className={`text-xs leading-relaxed line-clamp-3 ${neu.subText}`}>
                                • {project.summary[locale]}
                              </p>
                            </div>

                            <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(targetUrl);
                                }}
                                className={`px-3.5 py-2 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer ${neu.raisedPillBtn}`}
                              >
                                <span>
                                  {isSoli
                                    ? locale === 'ar'
                                      ? 'عرض Soli Medical'
                                      : 'Soli Medical'
                                    : locale === 'ar'
                                    ? 'استعراض النظام'
                                    : 'Explore'}
                                </span>
                                <ArrowDown className="w-3 h-3" />
                              </button>

                              <span className="text-xs font-black">
                                {isSoli
                                  ? locale === 'ar'
                                    ? 'متاح الآن'
                                    : 'Live'
                                  : locale === 'ar'
                                  ? 'معتمد'
                                  : 'Verified'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Interactive Typography Showcase Bar */}
                    {isPageVisible('solimedical') && (
                      <div className={`rounded-[26px] p-5 space-y-4 ${neu.raisedCard}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${neu.recessedWell}`}
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <div className="text-xs font-extrabold">
                                {locale === 'ar'
                                  ? 'Soli Medical — نظام العيادات والمجمعات الطبية'
                                  : 'Soli Medical — Clinic & Polyclinic Suite'}
                              </div>
                              <div className={`text-[11px] ${neu.mutedText}`}>
                                {locale === 'ar'
                                  ? 'نسخة عيادة الطبيب الواحد + نسخة المجمعات الطبية'
                                  : 'Single-Doctor Clinic + Medical Complex Edition'}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/${locale}/solimedical`)}
                            className={`px-4 py-2 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${neu.raisedPillBtn}`}
                          >
                            <span>
                              {locale === 'ar'
                                ? 'فتح صفحة Soli Medical التفاعلية'
                                : 'Open Soli Medical Showcase'}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div
                          style={{ fontWeight: previewWeight }}
                          className="text-xl sm:text-3xl tracking-tight text-center py-2 transition-all"
                        >
                          {locale === 'ar'
                            ? 'نظامان عربيان لرعاية تتحرك معك — من يوميات العيادة إلى قرار إداري أوضح'
                            : 'Two Bilingual Clinical Systems Engineered Around Real Daily Care'}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono-tabular font-bold">
                            <span>{previewWeight}</span>
                            <span>swash · RTL</span>
                          </div>
                          <div className={`h-4 rounded-full p-1 flex items-center ${neu.recessedWell}`}>
                            <input
                              type="range"
                              min={400}
                              max={900}
                              step={100}
                              value={previewWeight}
                              onChange={(e) => setPreviewWeight(Number(e.target.value))}
                              aria-label="Preview font weight"
                              className="w-full accent-zinc-800 dark:accent-cyan-400 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* TAB 2: ABOUT & TIMELINE                                    */}
                {/* --------------------------------------------------------- */}
                {activeTab === 'about' && (
                  <div className="space-y-5">
                    <div className={`rounded-[26px] p-6 space-y-4 ${neu.raisedCard}`}>
                      <h2 className="text-lg sm:text-xl font-black">
                        {aboutPage?.headline?.[locale] || settings.ownerName[locale]}
                      </h2>
                      <p className={`text-xs sm:text-sm leading-relaxed ${neu.subText}`}>
                        {aboutPage?.biography?.[locale]}
                      </p>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/${locale}/about`)}
                          className={`px-5 py-2.5 rounded-full text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer ${neu.raisedPillBtn}`}
                        >
                          <span>
                            {locale === 'ar'
                              ? 'فتح صفحة السيرة الذاتية التحريرية الكاملة'
                              : 'Open Full Editorial Profile & CV'}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(aboutPage?.experienceTimeline || []).slice(0, 3).map((exp, i) => (
                        <div key={i} className={`rounded-[24px] p-5 space-y-2 ${neu.raisedCard}`}>
                          <div className="text-[11px] font-mono-tabular font-bold text-amber-600 dark:text-amber-400">
                            {exp.period[locale]}
                          </div>
                          <h3 className="text-sm font-extrabold">{exp.role[locale]}</h3>
                          <div className={`text-xs font-semibold ${neu.mutedText}`}>
                            {exp.organization[locale]}
                          </div>
                          <p className={`text-xs leading-relaxed line-clamp-3 ${neu.subText}`}>
                            {exp.description[locale]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* TAB 3: CLINICS & MEDICAL CENTERS                           */}
                {/* --------------------------------------------------------- */}
                {activeTab === 'clinics' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {publishedClinics.map((clinic) => (
                        <div
                          key={clinic.id}
                          onClick={() => navigate(`/${locale}/clinics/${clinic.slug}`)}
                          className={`rounded-[26px] p-6 flex flex-col justify-between gap-4 cursor-pointer ${neu.raisedCard}`}
                        >
                          <div className="space-y-2">
                            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300">
                              {clinic.specialtyBadge[locale]}
                            </span>
                            <h2 className="text-lg font-black">{clinic.name[locale]}</h2>
                            <p className={`text-xs leading-relaxed ${neu.subText}`}>
                              {clinic.tagline[locale]}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/${locale}/clinics/${clinic.slug}`);
                              }}
                              className={`px-4 py-2 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 ${neu.raisedPillBtn}`}
                            >
                              <span>
                                {locale === 'ar' ? 'فتح بوابة العيادة' : 'Open Clinic Portal'}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <span className={`text-xs font-bold ${neu.mutedText}`}>
                              {clinic.city[locale]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/${locale}/clinics`)}
                        className={`px-5 py-2.5 rounded-full text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer ${neu.raisedPillBtn}`}
                      >
                        <span>
                          {locale === 'ar'
                            ? 'عرض دليل العيادات والمراكز الطبية بالكامل'
                            : 'View Full Medical Clinics Directory'}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* TAB 4: BLOG & KNOWLEDGE ARTICLES                           */}
                {/* --------------------------------------------------------- */}
                {activeTab === 'blog' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {publishedArticles.slice(0, 3).map((art) => (
                        <div
                          key={art.id}
                          onClick={() => navigate(`/${locale}/blog/${art.slug}`)}
                          className={`rounded-[26px] p-5 flex flex-col justify-between gap-4 cursor-pointer ${neu.raisedCard}`}
                        >
                          <div className="space-y-2.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                              {art.category[locale]}
                            </span>
                            <h2 className="text-sm sm:text-base font-extrabold leading-snug">
                              {art.title[locale]}
                            </h2>
                            <p className={`text-xs leading-relaxed line-clamp-3 ${neu.subText}`}>
                              {art.excerpt[locale]}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                            <button
                              type="button"
                              className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold ${neu.raisedPillBtn}`}
                            >
                              {locale === 'ar' ? 'اقرأ المقال ←' : 'Read Article →'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/${locale}/blog`)}
                        className={`px-5 py-2.5 rounded-full text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer ${neu.raisedPillBtn}`}
                      >
                        <span>
                          {locale === 'ar'
                            ? 'فتح مجلة المعرفة والمقالات الكاملة'
                            : 'Open Full Knowledge Magazine'}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* TAB 5: SKILLS & TOOLKIT                                    */}
                {/* --------------------------------------------------------- */}
                {activeTab === 'skills' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(aboutPage?.skills || []).map((grp, idx) => (
                      <div key={idx} className={`rounded-[26px] p-5 space-y-3 ${neu.raisedCard}`}>
                        <h2 className="text-sm sm:text-base font-black">{grp.category[locale]}</h2>
                        <div className="flex flex-wrap gap-2">
                          {grp.items.map((sk, j) => (
                            <span
                              key={j}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold ${neu.recessedWell}`}
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom Recessed WhatsApp Direct Bar */}
                <form
                  onSubmit={handleWhatsAppSend}
                  className={`h-12 rounded-full px-4 flex items-center justify-between gap-3 ${neu.raisedCard}`}
                >
                  <input
                    type="text"
                    value={whatsAppQuickMsg}
                    onChange={(e) => setWhatsAppQuickMsg(e.target.value)}
                    placeholder={
                      locale === 'ar'
                        ? 'تحتاج شيئاً محدداً؟ راسلنا عبر واتساب...'
                        : 'Need a custom medical system? Message on WhatsApp...'
                    }
                    className="flex-1 bg-transparent text-xs font-semibold focus:outline-none placeholder:opacity-75"
                  />
                  <button
                    type="submit"
                    className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                    title={locale === 'ar' ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}
                  >
                    <span className="w-2 h-3.5 bg-current rounded-[1px]" />
                  </button>
                </form>
              </div>

              {/* =========================================================== */}
              {/* LEFT SIDE DOCK (3 Columns: Compact Personal Profile Card)   */}
              {/* =========================================================== */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                <div
                  className={`rounded-[30px] p-5 flex flex-col items-center text-center gap-4 ${neu.recessedWell}`}
                >
                  {/* Compact Circular Avatar */}
                  <div
                    className={`w-20 h-20 rounded-full p-1 overflow-hidden shrink-0 ${neu.raisedCard}`}
                  >
                    <OptimizedImage
                      src={settings.avatarUrl}
                      alt={settings.ownerName[locale]}
                      priority
                      containerClassName="w-full h-full rounded-full overflow-hidden"
                      className="w-full h-full object-cover object-top rounded-full"
                    />
                  </div>

                  {/* Name & Title */}
                  <div className="space-y-1">
                    <h2 className="text-base sm:text-lg font-black tracking-tight">
                      {settings.ownerName[locale]}
                    </h2>
                    <p className={`text-[11px] font-bold leading-snug ${neu.mutedText}`}>
                      {settings.ownerRole[locale]}
                    </p>
                  </div>

                  <p className={`text-xs leading-relaxed ${neu.subText}`}>
                    {locale === 'ar'
                      ? 'أخصائي عناية مركزة ومطور أنظمة برمجية طبية (Soli Medical · ICU-Sync · Mitali Hospital).'
                      : 'ICU Specialist & Healthcare Systems Developer (Soli Medical · ICU-Sync · Mitali Hospital).'}
                  </p>

                  {/* Primary Action Buttons */}
                  <div className="w-full space-y-2 pt-1">
                    {isPageVisible('about') && (
                      <button
                        type="button"
                        onClick={() => navigate(`/${locale}/about`)}
                        className={`w-full py-2.5 px-3 rounded-full text-xs font-extrabold cursor-pointer ${neu.raisedPillBtn}`}
                      >
                        {locale === 'ar' ? 'السيرة الذاتية ←' : 'Full Biography →'}
                      </button>
                    )}

                    {isPageVisible('solimedical') && (
                      <button
                        type="button"
                        onClick={() => navigate(`/${locale}/solimedical`)}
                        className={`w-full py-2.5 px-3 rounded-full text-xs font-extrabold cursor-pointer ${neu.raisedPillBtn}`}
                      >
                        Soli Medical
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleOpenAdmin}
                      className={`w-full py-2.5 px-3 rounded-full text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer ${neu.raisedPillBtn}`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        {locale === 'ar' ? 'فتح لوحة الإدارة' : 'Open Admin Dashboard'}
                      </span>
                    </button>
                  </div>

                  {/* 3 Official Contact Channels Only (WhatsApp, Telegram Bot, Facebook) */}
                  <div className="w-full pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-center gap-2.5">
                    <a
                      href={OFFICIAL_WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${neu.raisedPillBtn}`}
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                    </a>

                    <a
                      href={OFFICIAL_TELEGRAM_BOT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${neu.raisedPillBtn}`}
                      title="Telegram Bot (@SoliMedicalproBot)"
                    >
                      <Send className="w-4 h-4 text-sky-500" />
                    </a>

                    <a
                      href={OFFICIAL_FACEBOOK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-transform hover:scale-105 ${neu.raisedPillBtn}`}
                      title="Facebook (SoliMedical)"
                    >
                      f
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BOTTOM BAR BELOW THE CONSOLE (Only 3 Official Channels + Admin)   */}
        {/* ================================================================= */}
        <footer className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
          <a
            href={OFFICIAL_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 ${neu.raisedPillBtn}`}
            title="WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          <a
            href={OFFICIAL_TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 ${neu.raisedPillBtn}`}
            title="Telegram Bot"
          >
            <Send className="w-4 h-4" />
          </a>

          <a
            href={OFFICIAL_FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-transform hover:scale-105 ${neu.raisedPillBtn}`}
            title="Facebook"
          >
            f
          </a>

          <button
            type="button"
            onClick={() => navigate(`/${locale}/about`)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${neu.raisedPillBtn}`}
          >
            {locale === 'ar' ? (
              <>
                التصميم والأنظمة بواسطة <strong className="font-black">AHMED SOLIMAN</strong>
              </>
            ) : (
              <>
                Designed & Engineered by <strong className="font-black">AHMED SOLIMAN</strong>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenAdmin}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${neu.raisedPillBtn}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {adminSession
                ? locale === 'ar'
                  ? 'لوحة الإدارة (متصل)'
                  : 'Admin CMS (Active)'
                : locale === 'ar'
                ? 'دخول لوحة الإدارة (/admin)'
                : 'Admin Login (/admin)'}
            </span>
          </button>
        </footer>
      </div>
    </LayoutResolver>
  );
};
