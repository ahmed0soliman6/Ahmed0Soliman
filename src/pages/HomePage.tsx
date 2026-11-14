import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  Sun,
  Moon,
  ArrowUpRight,
  MessageCircle,
  Send,
  ShieldCheck,
  FolderKanban,
  User,
  Building2,
  BookOpen,
  Wrench,
  ArrowDown,
} from 'lucide-react';

type StudioDockTab = 'projects' | 'about' | 'clinics' | 'blog' | 'skills';

const OFFICIAL_WHATSAPP_URL = 'https://wa.me/Ahmed0soliman';
const OFFICIAL_FACEBOOK_URL = 'https://www.facebook.com/SoliMedical/';
const OFFICIAL_TELEGRAM_BOT_URL = 'https://t.me/SoliMedicalproBot';

export const HomePage: React.FC = () => {
  const { locale, setLocale, theme, toggleTheme, navigate, db, adminSession } = usePlatform();

  const homePage =
    db.pages.find((p) => p.slug === 'home' || p.id === 'page-home' || p.id === 'home') ||
    db.pages[0];
  const aboutPage =
    db.pages.find((p) => p.slug === 'about' || p.id === 'page-about' || p.id === 'about') ||
    db.pages[1] ||
    db.pages[0];
  const settings = db.siteSettings;

  const isPageVisible = (slugId: string) => {
    const found = db.pages.find((p) => p.slug === slugId || p.id === slugId);
    return found ? found.published !== false && found.archived !== true : false;
  };

  const hideVisitorHeaderNav =
    settings.hideVisitorHeaderNav !== false || Boolean(homePage?.standaloneByDefault);

  const [activeTab, setActiveTab] = useState<StudioDockTab>('projects');
  const [whatsAppQuickMsg, setWhatsAppQuickMsg] = useState('');

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

  // Preserved Neumorphic Console Surface Tokens (Light & Dark gray palettes + Turquoise accent)
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
    activeDockTab: isLight
      ? 'bg-[#ECEEF2] text-[#008C94] border border-[#00C2CB]/45 shadow-[6px_6px_14px_#C3C6CD,-4px_-4px_10px_#FFFFFF]'
      : 'bg-[#2A2E32] text-[#00C2CB] border border-[#00C2CB]/45 shadow-[6px_6px_14px_#141618,-4px_-4px_10px_#35393E]',
    inactiveDockTab: isLight
      ? 'text-[#52565E] hover:text-[#1D1F23] border border-transparent'
      : 'text-[#B4BAC0] hover:text-white border border-transparent',
    mutedText: isLight ? 'text-[#6A6F78]' : 'text-[#8E949B]',
    subText: isLight ? 'text-[#4C515A]' : 'text-[#B8BEC5]',
    divider: isLight ? 'border-black/6' : 'border-white/6',
  };

  // Preserved 5 Interactive Dock tabs (filtered dynamically by page visibility)
  const allDockItems: {
    id: StudioDockTab;
    pageSlug: string;
    labelAr: string;
    labelEn: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'projects', pageSlug: 'projects', labelAr: 'المشروعات', labelEn: 'Projects', icon: FolderKanban },
    { id: 'about', pageSlug: 'about', labelAr: 'من أنا', labelEn: 'About', icon: User },
    { id: 'clinics', pageSlug: 'clinics', labelAr: 'العيادات', labelEn: 'Clinics', icon: Building2 },
    { id: 'blog', pageSlug: 'blog', labelAr: 'المقالات', labelEn: 'Articles', icon: BookOpen },
    { id: 'skills', pageSlug: 'about', labelAr: 'المهارات', labelEn: 'Skills', icon: Wrench },
  ];

  const dockItems = allDockItems.filter((item) => isPageVisible(item.pageSlug));

  const headerNavLinks = hideVisitorHeaderNav
    ? []
    : [
        { id: 'about', labelAr: 'من أنا', labelEn: 'About', href: `/${locale}/about` },
        { id: 'projects', labelAr: 'المشروعات', labelEn: 'Projects', href: `/${locale}/projects` },
        { id: 'clinics', labelAr: 'العيادات', labelEn: 'Clinics', href: `/${locale}/clinics` },
        { id: 'blog', labelAr: 'المقالات', labelEn: 'Articles', href: `/${locale}/blog` },
      ].filter((item) => isPageVisible(item.id));

  const handleOpenAdmin = () => {
    if (adminSession) {
      navigate('/admin');
    } else {
      window.dispatchEvent(new CustomEvent('open-quick-admin-modal'));
    }
  };

  const handleJumpToProjects = () => {
    setActiveTab('projects');
    const el = document.getElementById('studio-dock-stage');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleWhatsAppSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text =
      whatsAppQuickMsg.trim() ||
      (locale === 'ar'
        ? 'مرحباً م. أحمد سليمان، أود الاستفسار عن تطوير الأنظمة الطبية وتنفيذ المشروعات.'
        : 'Hello Ahmed Soliman, I would like to inquire about medical software systems.');
    const waUrl = `${OFFICIAL_WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const stageHeader = {
    projects: {
      kicker: locale === 'ar' ? 'أعمال أحمد سليمان البرمجية' : 'Selected Software Systems',
      title: locale === 'ar' ? 'المشروعات والمنظومات الطبية' : 'Medical Systems & Platforms',
      sub:
        locale === 'ar'
          ? 'حزمة مشروعات برمجية مصممة من واقع العمل الطبي وإدارة الجودة، ومن ضمنها منظومة Soli Medical.'
          : 'Production healthcare platforms and clinical software engineered from real medical and quality workflows, including Soli Medical.',
      fullPageHref: isPageVisible('projects') ? `/${locale}/projects` : null,
      fullPageLabel: locale === 'ar' ? 'عرض جميع المشروعات' : 'All Projects',
    },
    about: {
      kicker: locale === 'ar' ? 'الملف الشخصي والخبرة الميدانية' : 'Clinical & Technical Biography',
      title: locale === 'ar' ? 'السيرة المهنية ومحطات الخبرة' : 'Experience & Career Milestones',
      sub:
        locale === 'ar'
          ? 'الربط بين التمريض وإدارة الجودة الصحية وبين هندسة البرمجيات لتقديم حلول عملية قابلة للتشغيل.'
          : 'Uniting critical care nursing and healthcare quality governance with full-stack software engineering.',
      fullPageHref: isPageVisible('about') ? `/${locale}/about` : null,
      fullPageLabel: locale === 'ar' ? 'صفحة من أنا الكاملة' : 'Full Profile',
    },
    clinics: {
      kicker: locale === 'ar' ? 'نماذج الصفحات الطبية المستقلة' : 'Standalone Clinic Portals',
      title: locale === 'ar' ? 'العيادات والمجمعات الطبية' : 'Featured Clinics & Medical Centers',
      sub:
        locale === 'ar'
          ? 'صفحات هبوط مخصصة لكل عيادة أو مجمع طبي تعرض الأطباء والخدمات مع الحجز المباشر.'
          : 'Dedicated clinic landing portals showcasing doctors, services, and instant patient booking.',
      fullPageHref: isPageVisible('clinics') ? `/${locale}/clinics` : null,
      fullPageLabel: locale === 'ar' ? 'دليل العيادات الكامل' : 'Clinics Directory',
    },
    blog: {
      kicker: locale === 'ar' ? 'المقالات التقنية والإكلينيكية' : 'Editorial & Technical Writing',
      title: locale === 'ar' ? 'أحدث المقالات والشروحات' : 'Latest Insights & Articles',
      sub:
        locale === 'ar'
          ? 'رؤى عملية حول رقمنة العيادات، مزامنة وحدات العناية المركزة، ومعايير جودة الرعاية.'
          : 'Practical guides on clinic digitalization, ICU coordination, and healthcare quality.',
      fullPageHref: isPageVisible('blog') ? `/${locale}/blog` : null,
      fullPageLabel: locale === 'ar' ? 'تصفح كل المقالات' : 'All Articles',
    },
    skills: {
      kicker: locale === 'ar' ? 'القدرات السريرية والتقنية' : 'Core Stack & Clinical Expertise',
      title: locale === 'ar' ? 'المهارات والأدوات المعتمدة' : 'Skills & Technical Toolkit',
      sub:
        locale === 'ar'
          ? 'مزيج عملي يجمع معايير الجودة الإكلينيكية وتطوير تطبيقات الويب الحديثة والأتمتة.'
          : 'A practical blend of clinical quality governance, modern web engineering, and workflow automation.',
      fullPageHref: isPageVisible('about') ? `/${locale}/about` : null,
      fullPageLabel: locale === 'ar' ? 'عرض السيرة الكاملة' : 'Full CV',
    },
  }[activeTab];

  const legacyDefaultAvatar = '/assets/aistudio/1770146906397_16665dd0.png';
  const homeHeroPortrait =
    homePage?.heroImage && homePage.heroImage !== legacyDefaultAvatar
      ? homePage.heroImage
      : settings.avatarUrl && settings.avatarUrl !== legacyDefaultAvatar
      ? settings.avatarUrl
      : homePage?.heroImage || settings.avatarUrl;
  const showHeroPortrait = homePage?.sectionVisibility?.heroImage !== false;

  const heroMetrics = (homePage?.metrics || []).slice(0, 3);
  const heroHeadline = homePage?.headline?.[locale] || settings.ownerName[locale];
  const heroLead =
    homePage?.subheadline?.[locale] ||
    (locale === 'ar'
      ? 'أخصائي تمريض وجودة رعاية صحية ومطوّر أنظمة طبية متكاملة للعيادات والمستشفيات.'
      : 'Healthcare quality specialist and full-stack developer building practical systems for clinics and hospitals.');

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
          image: homeHeroPortrait,
        }}
      />

      <div
        className={`relative min-h-screen w-full overflow-x-hidden py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-10 transition-colors duration-300 ${neu.pageBg}`}
      >
        {/* Atmospheric App Brand Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <img
            src="/assets/images/soli-personal-icon.jpg"
            alt=""
            className={`w-full h-full object-cover object-center scale-105 transition-opacity duration-500 ${
              isLight ? 'opacity-[0.06] blur-[1px]' : 'opacity-[0.11] blur-[1px]'
            }`}
          />
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto">
          {/* =============================================================== */}
          {/* SCULPTED NEUMORPHIC MAIN CONSOLE                                */}
          {/* =============================================================== */}
          <div
            className={`rounded-[30px] sm:rounded-[42px] p-4 sm:p-6 lg:p-8 flex flex-col gap-6 sm:gap-7 transition-all duration-300 ${neu.boardShell}`}
          >
            {/* ------------------------------------------------------------- */}
            {/* 1. COMPACT SINGLE-ROW HEADER AREA                             */}
            {/* ------------------------------------------------------------- */}
            <header
              className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${neu.divider}`}
            >
              {/* Zone 1: Compact Brand Identity */}
              <button
                type="button"
                onClick={() => navigate(`/${locale}`)}
                className="flex items-center gap-3 text-start cursor-pointer group shrink-0"
              >
                <span
                  className={`w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isLight
                      ? 'bg-[#ECEEF2] shadow-[5px_5px_12px_#C2C5CC,-4px_-4px_10px_#FFFFFF] border-2 border-[#E2E4E9]'
                      : 'bg-[#070E1A] shadow-[5px_5px_12px_#151719,-3px_-3px_10px_#3A3F45] border border-[#00C2CB]/35'
                  }`}
                >
                  <img
                    src="/assets/images/soli-personal-icon.jpg"
                    alt={settings.ownerName[locale]}
                    className="w-full h-full object-cover"
                  />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm sm:text-base font-black tracking-tight whitespace-nowrap">
                    {settings.ownerName[locale]}
                  </span>
                  <span className={`text-[11px] font-medium whitespace-nowrap ${neu.mutedText}`}>
                    {locale === 'ar'
                      ? 'المنصة الشخصية والأنظمة الطبية'
                      : 'Personal Platform & MedTech'}
                  </span>
                </span>
              </button>

              {/* Zone 2: Clean Single-Line Navigation Links (Desktop) */}
              <nav
                aria-label="Primary Pages"
                className="hidden lg:flex items-center gap-7 text-xs sm:text-sm font-bold"
              >
                {headerNavLinks.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#00C2CB] ${neu.subText}`}
                  >
                    {locale === 'ar' ? item.labelAr : item.labelEn}
                  </button>
                ))}
              </nav>

              {/* Zone 3: Language, Theme, Direct Contact & Single Admin Control */}
              <div className="flex items-center gap-2 sm:gap-2.5 ms-auto lg:ms-0 shrink-0">
                <button
                  type="button"
                  onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                  className={`h-10 px-3.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${neu.raisedPillBtn}`}
                  title={locale === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
                >
                  {locale === 'ar' ? 'EN' : 'عربي'}
                </button>

                {/* Tactile Sun / Moon Theme Switch */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle Light/Dark Studio Mode"
                  className={`w-16 h-10 rounded-full p-1 flex items-center transition-all cursor-pointer shrink-0 ${neu.recessedWell} ${
                    isLight ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${neu.raisedCard}`}
                  >
                    {isLight ? (
                      <Sun className="w-4 h-4 text-zinc-800" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#00C2CB]" />
                    )}
                  </span>
                </button>

                <a
                  href={OFFICIAL_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                  className={`hidden sm:inline-flex w-10 h-10 rounded-full items-center justify-center transition-all shrink-0 ${neu.raisedPillBtn}`}
                >
                  <MessageCircle className="w-4 h-4 text-[#00C2CB]" />
                </a>

                <button
                  type="button"
                  onClick={handleOpenAdmin}
                  className={`h-10 px-3.5 sm:px-4 rounded-full text-xs font-extrabold inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${neu.raisedPillBtn}`}
                >
                  {adminSession ? (
                    <img
                      src={
                        adminSession.photoUrl ||
                        settings.avatarUrl ||
                        '/assets/images/soli-personal-icon.jpg'
                      }
                      alt={adminSession.name || 'Admin'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-[#00C2CB]/50 shrink-0"
                    />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00C2CB]" />
                  )}
                  <span>
                    {adminSession
                      ? locale === 'ar'
                        ? 'لوحة الإدارة'
                        : 'Admin'
                      : locale === 'ar'
                      ? 'الإدارة'
                      : 'Admin'}
                  </span>
                </button>
              </div>
            </header>

            {/* ------------------------------------------------------------- */}
            {/* 2. BALANCED SPLIT HERO CONSOLE (Text + Prominent Portrait)     */}
            {/* ------------------------------------------------------------- */}
            <section
              aria-label={locale === 'ar' ? 'التعريف الرئيسي' : 'Hero Console'}
              className={`rounded-[26px] sm:rounded-[34px] p-5 sm:p-7 lg:p-9 ${neu.recessedWell}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-center">
                {/* Hero Narrative & Primary Actions (7 cols on Desktop) */}
                <div
                  className={`${
                    showHeroPortrait ? 'lg:col-span-7' : 'lg:col-span-12'
                  } flex flex-col gap-5 text-start order-2 lg:order-1`}
                >
                  <div className="space-y-3">
                    <div className={`text-xs sm:text-sm font-semibold ${neu.mutedText}`}>
                      <span>{settings.ownerRole[locale]}</span>
                      <span aria-hidden="true" className="mx-2 text-[#00C2CB]">
                        ·
                      </span>
                      <span>{locale === 'ar' ? 'مصر' : 'Egypt'}</span>
                    </div>

                    <h1
                      style={{ fontSize: 'clamp(1.75rem, 3.1vw, 2.75rem)' }}
                      className="font-black leading-[1.18] tracking-tight"
                    >
                      {heroHeadline}
                    </h1>

                    <p
                      className={`text-sm sm:text-base leading-[1.7] max-w-xl line-clamp-3 ${neu.subText}`}
                    >
                      {heroLead}
                    </p>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleJumpToProjects}
                      className="min-h-[44px] px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold bg-[#00C2CB] text-slate-950 hover:bg-[#00AEB7] transition-all inline-flex items-center justify-center gap-2 shadow-[6px_6px_16px_rgba(0,194,203,0.28)] cursor-pointer whitespace-nowrap"
                    >
                      <span>
                        {locale === 'ar' ? 'استعراض المشروعات والأنظمة' : 'Explore Medical Systems'}
                      </span>
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {isPageVisible('about') && (
                      <button
                        type="button"
                        onClick={() => navigate(`/${locale}/about`)}
                        className={`min-h-[44px] px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${neu.raisedPillBtn}`}
                      >
                        <span>{locale === 'ar' ? 'السيرة المهنية' : 'Professional Profile'}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Compact Key Metrics Strip */}
                  {heroMetrics.length > 0 && (
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t ${neu.divider}`}
                    >
                      {heroMetrics.map((metric, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="text-lg sm:text-xl font-black font-mono-tabular text-[#0099A3] dark:text-[#00C2CB]">
                            {metric.value}
                          </div>
                          <div className={`text-xs leading-snug line-clamp-2 ${neu.mutedText}`}>
                            {metric.label[locale]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prominent Portrait Showcase (5 cols on Desktop) */}
                {showHeroPortrait && (
                  <div className="lg:col-span-5 flex justify-center lg:justify-end order-1 lg:order-2">
                    <div
                      className={`w-full max-w-[290px] sm:max-w-[330px] lg:max-w-[360px] rounded-[28px] p-3 transition-all ${neu.raisedCard}`}
                    >
                      <div
                        className={`rounded-[20px] p-1.5 border border-[#00C2CB]/30 ${neu.recessedWell}`}
                      >
                        <div className="aspect-[4/5] w-full rounded-[16px] overflow-hidden">
                          <OptimizedImage
                            key={homeHeroPortrait}
                            src={homeHeroPortrait}
                            alt={settings.ownerName[locale]}
                            priority
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ------------------------------------------------------------- */}
            {/* 3. INTEGRATED HORIZONTAL INTERACTIVE DOCK (All Screen Sizes)  */}
            {/* ------------------------------------------------------------- */}
            <nav
              id="studio-dock-stage"
              aria-label={locale === 'ar' ? 'أقسام المنصة التفاعلية' : 'Studio Interactive Sections'}
              className={`rounded-[24px] lg:rounded-full p-2 sm:p-2.5 ${neu.recessedWell}`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {dockItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      aria-pressed={isActive}
                      className={`min-h-[44px] px-4 py-2.5 rounded-[16px] lg:rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap select-none ${
                        isActive ? neu.activeDockTab : neu.inactiveDockTab
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#00C2CB]' : 'opacity-75'
                        }`}
                      />
                      <span>{locale === 'ar' ? item.labelAr : item.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* ------------------------------------------------------------- */}
            {/* 4. STRUCTURED MAIN CONTENT AREA (Active Tab Stage)            */}
            {/* ------------------------------------------------------------- */}
            <section
              aria-live="polite"
              className={`rounded-[26px] sm:rounded-[34px] p-5 sm:p-7 flex flex-col gap-6 ${neu.recessedWell}`}
            >
              {/* Stage Section Header */}
              <div
                className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b ${neu.divider}`}
              >
                <div className="space-y-1.5 text-start">
                  <div className="text-xs font-bold text-[#0099A3] dark:text-[#00C2CB]">
                    {stageHeader.kicker}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    {stageHeader.title}
                  </h2>
                  <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${neu.subText}`}>
                    {stageHeader.sub}
                  </p>
                </div>

                {stageHeader.fullPageHref && (
                  <button
                    type="button"
                    onClick={() => navigate(stageHeader.fullPageHref!)}
                    className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto ${neu.raisedPillBtn}`}
                  >
                    <span>{stageHeader.fullPageLabel}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#00C2CB]" />
                  </button>
                )}
              </div>

              {/* TAB 1: PROJECTS (Soli Medical appears cleanly as a project with logo & image) */}
              {activeTab === 'projects' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {publishedProjects.slice(0, 6).map((project) => {
                    const isSoli = project.slug === 'soli-medical-clinic-system';
                    const targetUrl = isSoli
                      ? `/${locale}/solimedical`
                      : `/${locale}/projects/${project.slug}`;

                    return (
                      <article
                        key={project.id}
                        onClick={() => navigate(targetUrl)}
                        className={`rounded-[24px] overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer group ${neu.raisedCard}`}
                      >
                        <div>
                          {/* Project Visual Cover */}
                          <div className="relative aspect-[16/10] w-full overflow-hidden">
                            <OptimizedImage
                              src={project.coverImage}
                              alt={project.title[locale]}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                            {isSoli && (
                              <div
                                className={`absolute top-3 start-3 w-10 h-10 rounded-xl p-1.5 flex items-center justify-center ${neu.raisedCard}`}
                              >
                                <img
                                  src="/assets/aistudio/logo_ae3842b8.png"
                                  alt="Soli Medical Logo"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                          </div>

                          {/* Project Body */}
                          <div className="p-5 space-y-2.5 text-start">
                            <div className={`text-xs font-semibold ${neu.mutedText}`}>
                              <span>{project.categoryLabel[locale]}</span>
                              {project.techStack[0] && (
                                <>
                                  <span aria-hidden="true" className="mx-1.5 text-[#00C2CB]">
                                    ·
                                  </span>
                                  <span>{project.techStack[0]}</span>
                                </>
                              )}
                            </div>

                            <h3 className="text-base font-extrabold leading-snug group-hover:text-[#0099A3] dark:group-hover:text-[#00C2CB] transition-colors">
                              {project.title[locale]}
                            </h3>

                            <p className={`text-xs sm:text-[13px] leading-relaxed line-clamp-2 ${neu.subText}`}>
                              {project.summary[locale]}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`px-5 py-3.5 flex items-center justify-between gap-2 border-t ${neu.divider}`}
                        >
                          <span className="text-xs font-extrabold inline-flex items-center gap-1 text-[#0099A3] dark:text-[#00C2CB]">
                            <span>
                              {isSoli
                                ? locale === 'ar'
                                  ? 'عرض مشروع Soli Medical'
                                  : 'Open Soli Medical'
                                : locale === 'ar'
                                ? 'استعراض التفاصيل'
                                : 'Explore System'}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: ABOUT & EXPERIENCE TIMELINE */}
              {activeTab === 'about' && (
                <div className="space-y-5">
                  <div className={`rounded-[24px] p-5 sm:p-6 space-y-3 text-start ${neu.raisedCard}`}>
                    <h3 className="text-base sm:text-lg font-black">
                      {aboutPage?.headline?.[locale] || settings.ownerName[locale]}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-[1.75] ${neu.subText}`}>
                      {aboutPage?.biography?.[locale]}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {(aboutPage?.experienceTimeline || []).slice(0, 3).map((exp, i) => (
                      <div
                        key={i}
                        className={`rounded-[24px] p-5 space-y-2.5 text-start ${neu.raisedCard}`}
                      >
                        <div className="text-xs font-mono-tabular font-bold text-[#0099A3] dark:text-[#00C2CB]">
                          {exp.period[locale]}
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold leading-snug">
                          {exp.role[locale]}
                        </h3>
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

              {/* TAB 3: CLINICS & MEDICAL CENTERS */}
              {activeTab === 'clinics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {publishedClinics.map((clinic) => (
                    <article
                      key={clinic.id}
                      onClick={() => navigate(`/${locale}/clinics/${clinic.slug}`)}
                      className={`rounded-[24px] overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer group ${neu.raisedCard}`}
                    >
                      <div>
                        <div className="aspect-[16/9] w-full overflow-hidden">
                          <OptimizedImage
                            src={clinic.coverImage}
                            alt={clinic.name[locale]}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>

                        <div className="p-5 space-y-2 text-start">
                          <div className={`text-xs font-semibold ${neu.mutedText}`}>
                            <span>{clinic.specialtyBadge[locale]}</span>
                            <span aria-hidden="true" className="mx-1.5 text-[#00C2CB]">
                              ·
                            </span>
                            <span>{clinic.city[locale]}</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black group-hover:text-[#0099A3] dark:group-hover:text-[#00C2CB] transition-colors">
                            {clinic.name[locale]}
                          </h3>
                          <p className={`text-xs sm:text-[13px] leading-relaxed line-clamp-2 ${neu.subText}`}>
                            {clinic.tagline[locale]}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`px-5 py-3.5 flex items-center justify-between border-t ${neu.divider}`}
                      >
                        <span className="text-xs font-extrabold inline-flex items-center gap-1.5 text-[#0099A3] dark:text-[#00C2CB]">
                          <span>
                            {locale === 'ar' ? 'فتح بوابة العيادة' : 'Open Clinic Portal'}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* TAB 4: BLOG & KNOWLEDGE ARTICLES */}
              {activeTab === 'blog' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {publishedArticles.slice(0, 3).map((art) => (
                    <article
                      key={art.id}
                      onClick={() => navigate(`/${locale}/blog/${art.slug}`)}
                      className={`rounded-[24px] overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer group ${neu.raisedCard}`}
                    >
                      <div>
                        <div className="aspect-[16/10] w-full overflow-hidden">
                          <OptimizedImage
                            src={art.coverImage}
                            alt={art.title[locale]}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>

                        <div className="p-5 space-y-2 text-start">
                          <div className={`text-xs font-semibold ${neu.mutedText}`}>
                            <span>{art.category[locale]}</span>
                            <span aria-hidden="true" className="mx-1.5 text-[#00C2CB]">
                              ·
                            </span>
                            <span className="font-mono-tabular">
                              {art.readingTimeMinutes} {locale === 'ar' ? 'دقائق' : 'min'}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-extrabold leading-snug group-hover:text-[#0099A3] dark:group-hover:text-[#00C2CB] transition-colors">
                            {art.title[locale]}
                          </h3>
                          <p className={`text-xs leading-relaxed line-clamp-2 ${neu.subText}`}>
                            {art.excerpt[locale]}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`px-5 py-3.5 flex items-center justify-between border-t ${neu.divider}`}
                      >
                        <span className="text-xs font-extrabold inline-flex items-center gap-1 text-[#0099A3] dark:text-[#00C2CB]">
                          <span>{locale === 'ar' ? 'اقرأ المقال' : 'Read Article'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* TAB 5: SKILLS & TOOLKIT */}
              {activeTab === 'skills' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {(aboutPage?.skills || []).map((grp, idx) => (
                    <div
                      key={idx}
                      className={`rounded-[24px] p-5 space-y-3.5 text-start ${neu.raisedCard}`}
                    >
                      <h3 className="text-sm sm:text-base font-black">{grp.category[locale]}</h3>
                      <div className="flex flex-col gap-2">
                        {grp.items.map((sk, j) => (
                          <div
                            key={j}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${neu.recessedWell}`}
                          >
                            {sk}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ------------------------------------------------------------- */}
            {/* 5. DIRECT WHATSAPP CONSOLE BAR                                */}
            {/* ------------------------------------------------------------- */}
            <form
              onSubmit={handleWhatsAppSend}
              className={`rounded-[22px] sm:rounded-full p-2 sm:ps-5 sm:pe-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 ${neu.recessedWell}`}
            >
              <input
                type="text"
                value={whatsAppQuickMsg}
                onChange={(e) => setWhatsAppQuickMsg(e.target.value)}
                placeholder={
                  locale === 'ar'
                    ? 'هل لديك استفسار عن نظام طبي أو تطوير موقع عيادة؟ اكتب رسالتك هنا...'
                    : 'Have a question about a medical system or clinic portal? Write here...'
                }
                className="flex-1 min-h-[40px] px-3 sm:px-0 bg-transparent text-xs sm:text-sm font-medium focus:outline-none placeholder:opacity-75"
              />
              <button
                type="submit"
                className="min-h-[42px] px-5 rounded-full bg-[#00C2CB] text-slate-950 hover:bg-[#00AEB7] text-xs font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{locale === 'ar' ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}</span>
              </button>
            </form>
          </div>

          {/* =============================================================== */}
          {/* QUIET CONSOLE FOOTER (3 Official Channels + Attribution Only)   */}
          {/* =============================================================== */}
          <footer className="mt-6 px-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className={`text-center sm:text-start font-semibold ${neu.mutedText}`}>
              <span>{settings.ownerName[locale]}</span>
              <span aria-hidden="true" className="mx-2 text-[#00C2CB]">
                ·
              </span>
              <span>{settings.ownerRole[locale]}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 ${neu.raisedPillBtn}`}
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
              </a>

              <a
                href={OFFICIAL_TELEGRAM_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram Bot"
                title="Telegram Bot (@SoliMedicalproBot)"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 ${neu.raisedPillBtn}`}
              >
                <Send className="w-4 h-4 text-sky-500" />
              </a>

              <a
                href={OFFICIAL_FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook (SoliMedical)"
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-transform hover:scale-105 ${neu.raisedPillBtn}`}
              >
                f
              </a>
            </div>
          </footer>
        </div>
      </div>
    </LayoutResolver>
  );
};
