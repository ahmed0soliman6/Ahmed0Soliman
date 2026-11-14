import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import {
  Sun,
  Moon,
  Globe,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Eye,
  Menu,
  X,
  MessageCircle,
  Send,
  Home,
  Lock,
  Sparkles,
  AlertTriangle,
  LayoutDashboard,
} from 'lucide-react';

export type PageVisualWorld =
  | 'home-avoshu'
  | 'about-editorial'
  | 'projects-indigo'
  | 'clinics-teal'
  | 'blog-magazine'
  | 'soli-showcase'
  | 'admin-saas';

interface LayoutResolverProps {
  children: React.ReactNode;
  pageWorld?: PageVisualWorld;
  forceStandalone?: boolean;
  standaloneTitle?: string;
  standaloneSubtitle?: string;
  standaloneLogoUrl?: string;
  standaloneCtaLabel?: string;
  standaloneCtaHref?: string;
  onStandaloneCtaClick?: () => void;
  standaloneShowVisitorHeader?: boolean;
  standaloneAccentColor?: string;
  adminQuickEditPath?: string;
}

export const LayoutResolver: React.FC<LayoutResolverProps> = ({
  children,
  pageWorld = 'home-avoshu',
  forceStandalone = false,
  standaloneTitle,
  standaloneSubtitle,
  standaloneLogoUrl,
  standaloneCtaLabel,
  standaloneCtaHref,
  onStandaloneCtaClick,
  standaloneShowVisitorHeader = false,
  standaloneAccentColor = '#0D9488',
  adminQuickEditPath = '/admin',
}) => {
  const {
    locale,
    setLocale,
    theme,
    toggleTheme,
    pathname,
    searchParams,
    navigate,
    db,
    loading,
    adminSession,
    loginAsOwnerAdmin,
    logoutAdmin,
    isFirebaseConnected,
    toasts,
    dismissToast,
  } = usePlatform();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickAdminModalOpen, setQuickAdminModalOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isStandaloneQuery =
    searchParams.get('standalone') === '1' || searchParams.get('mode') === 'standalone';
  const adminBypassStandalone =
    Boolean(adminSession) && searchParams.get('preview_nav') === '1';

  const settings = db.siteSettings;
  const adminAvatarUrl =
    adminSession?.photoUrl || settings.avatarUrl || '/assets/aistudio/owner_portrait.png';

  const isPagePublished = (slugId: string) => {
    const found = db.pages.find(
      (p) => p.slug === slugId || p.id === slugId || p.id === `page-${slugId}`
    );
    return found ? found.published !== false && found.archived !== true : false;
  };

  const cleanRoutePath = pathname.replace(/^\/(ar|en)(?=\/|$)/, '') || '/';
  const currentRoutePageSlug = cleanRoutePath.startsWith('/landing/')
    ? decodeURIComponent(cleanRoutePath.slice('/landing/'.length).replace(/\/$/, ''))
    : cleanRoutePath.startsWith('/p/')
    ? decodeURIComponent(cleanRoutePath.slice('/p/'.length).replace(/\/$/, ''))
    : cleanRoutePath.includes('/about')
    ? 'about'
    : cleanRoutePath.includes('/solimedical') ||
      cleanRoutePath.includes('/campaign') ||
      cleanRoutePath === '/landing'
    ? 'solimedical'
    : cleanRoutePath.includes('/projects')
    ? 'projects'
    : cleanRoutePath.includes('/clinics')
    ? 'clinics'
    : cleanRoutePath.includes('/blog')
    ? 'blog'
    : 'home';

  const activePageRecord = db.pages.find(
    (p) =>
      p.slug === currentRoutePageSlug ||
      p.id === currentRoutePageSlug ||
      p.id === `page-${currentRoutePageSlug}`
  );
  const isPageStandaloneByDefault = Boolean(activePageRecord?.standaloneByDefault);
  const isStandalone =
    !isAdminRoute &&
    !adminBypassStandalone &&
    (forceStandalone || isStandaloneQuery || isPageStandaloneByDefault);

  const hideVisitorNav =
    !isAdminRoute &&
    !adminBypassStandalone &&
    (settings.hideVisitorHeaderNav !== false ||
      forceStandalone ||
      isStandaloneQuery ||
      isPageStandaloneByDefault);

  const isSoliProjectRouteHidden =
    cleanRoutePath.includes('/projects/soli-medical') && !isPagePublished('solimedical');
  const isCurrentPageHidden =
    !isAdminRoute && (!isPagePublished(currentRoutePageSlug) || isSoliProjectRouteHidden);

  const allNavItems = [
    {
      id: 'home',
      label: locale === 'ar' ? 'الرئيسية' : 'Home',
      href: `/${locale}`,
      match: (p: string) => p === '/' || p === `/${locale}` || p === `/${locale}/`,
    },
    {
      id: 'about',
      label: locale === 'ar' ? 'من أنا' : 'About',
      href: `/${locale}/about`,
      match: (p: string) => p.includes('/about'),
    },
    {
      id: 'projects',
      label: locale === 'ar' ? 'المشروعات' : 'Projects',
      href: `/${locale}/projects`,
      match: (p: string) => p.includes('/projects') || p.includes('/solimedical'),
    },
    {
      id: 'clinics',
      label: locale === 'ar' ? 'العيادات' : 'Clinics',
      href: `/${locale}/clinics`,
      match: (p: string) => p.includes('/clinics'),
    },
    {
      id: 'blog',
      label: locale === 'ar' ? 'المقالات' : 'Articles',
      href: `/${locale}/blog`,
      match: (p: string) => p.includes('/blog'),
    },
  ];

  // Unauthenticated visitors only see published pages; verified admins see all sections
  const navItems = allNavItems.filter((item) => Boolean(adminSession) || isPagePublished(item.id));

  const handleToggleLocale = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    setLocale(nextLocale);
  };

  const handleEnterStandalone = () => {
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.delete('preview_nav');
    nextParams.set('standalone', '1');
    const queryStr = nextParams.toString();
    navigate(`${pathname}${queryStr ? `?${queryStr}` : ''}`);
  };

  const handleExitStandalone = () => {
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.delete('standalone');
    nextParams.delete('mode');
    if (
      forceStandalone ||
      isPageStandaloneByDefault ||
      settings.hideVisitorHeaderNav !== false
    ) {
      nextParams.set('preview_nav', '1');
    } else {
      nextParams.delete('preview_nav');
    }
    const queryStr = nextParams.toString();
    navigate(`${pathname}${queryStr ? `?${queryStr}` : ''}`);
  };

  const handleAdminButtonClick = () => {
    if (adminSession) {
      navigate('/admin');
    } else {
      setQuickAdminModalOpen(true);
    }
  };

  React.useEffect(() => {
    const onOpenAdminModal = () => {
      if (adminSession) {
        navigate('/admin');
      } else {
        setQuickAdminModalOpen(true);
      }
    };
    window.addEventListener('open-quick-admin-modal', onOpenAdminModal);
    return () => window.removeEventListener('open-quick-admin-modal', onOpenAdminModal);
  }, [adminSession, navigate]);

  const handleQuickAdminGoogleSubmit = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      await loginAsOwnerAdmin();
      setQuickAdminModalOpen(false);
      navigate('/admin');
    } catch (err: any) {
      setLoginError(err?.message || 'Access denied');
    } finally {
      setLoginLoading(false);
    }
  };

  // World-specific root background & text styling so each page has its own distinct visual identity
  const getWorldContainerClasses = () => {
    if (isAdminRoute) {
      return 'bg-[#F4F6FA] dark:bg-[#070E1A] text-slate-900 dark:text-slate-100';
    }
    switch (pageWorld) {
      case 'home-avoshu':
        return theme === 'light'
          ? 'bg-[#E2E4E9] text-[#1E2024] selection:bg-[#1E2024] selection:text-white'
          : 'bg-[#2C3135] text-[#F1F3F5] selection:bg-[#00D4FF] selection:text-slate-950';
      case 'about-editorial':
        return 'bg-[#FFFFFF] text-[#111111] selection:bg-zinc-900 selection:text-white';
      case 'projects-indigo':
        return 'bg-[#080B1A] text-white selection:bg-[#7C3AED] selection:text-white';
      case 'clinics-teal':
        return 'bg-[#F2FBF9] text-[#0F172A] selection:bg-[#0D9488] selection:text-white';
      case 'blog-magazine':
        return 'bg-[#F5F4EF] dark:bg-[#111413] text-[#18181B] dark:text-[#EDEAE2] selection:bg-[#16382E] selection:text-white dark:selection:bg-[#6EE7B7] dark:selection:text-[#0F1715]';
      case 'soli-showcase':
        return 'bg-[#040D12] text-[#F0F9FF] selection:bg-[#00D4FF] selection:text-slate-950';
      default:
        return 'bg-slate-50 dark:bg-[#070E1A] text-slate-900 dark:text-slate-100';
    }
  };

  // Render Page-Specific Top Header
  const renderWorldHeader = () => {
    if (isAdminRoute) return null;

    // 1. STANDALONE HEADER (Triggered by ?standalone=1 or standaloneByDefault on page/clinic)
    // Displays ONLY page/clinic identity + Language Toggle + Direct Contact/Booking CTA (Zero cross-site nav links)
    if (isStandalone) {
      const resolvedStandaloneTitle =
        standaloneTitle ||
        (pageWorld === 'about-editorial'
          ? settings.ownerName[locale]
          : activePageRecord?.title?.[locale] || settings.brandName[locale]);

      const resolvedStandaloneSubtitle =
        standaloneSubtitle ||
        (pageWorld === 'about-editorial'
          ? settings.ownerRole[locale]
          : activePageRecord?.kicker?.[locale] || undefined);

      const isDarkStandaloneWorld =
        pageWorld === 'soli-showcase' || pageWorld === 'projects-indigo';
      const isMagazineStandaloneWorld = pageWorld === 'blog-magazine';
      const isEditorialStandaloneWorld = pageWorld === 'about-editorial';

      const headerClass = isDarkStandaloneWorld
        ? 'sticky top-0 z-40 h-16 px-4 sm:px-8 bg-[#040D12]/95 backdrop-blur-md border-b border-[#00D4FF]/20 text-white flex items-center justify-between gap-4'
        : isMagazineStandaloneWorld
        ? 'sticky top-0 z-40 h-16 px-4 sm:px-8 bg-[#F5F4EF]/95 dark:bg-[#111413]/95 backdrop-blur-md border-b border-stone-300 dark:border-stone-800 text-stone-900 dark:text-[#EDEAE2] flex items-center justify-between gap-4'
        : 'sticky top-0 z-40 h-16 px-4 sm:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 flex items-center justify-between gap-4 shadow-xs';

      const ctaDefaultLabel =
        pageWorld === 'clinics-teal'
          ? locale === 'ar'
            ? 'احجز موعدك الآن'
            : 'Book Appointment'
          : locale === 'ar'
          ? 'تواصل مباشر'
          : 'Direct Contact';

      const ctaButtonClass = isDarkStandaloneWorld
        ? 'px-4 py-2 rounded-xl text-xs font-extrabold bg-[#00D4FF] text-slate-950 hover:opacity-95 active:scale-[0.97] transition-all whitespace-nowrap shrink-0 cursor-pointer'
        : isEditorialStandaloneWorld
        ? 'px-4 py-2 rounded-full text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.97] transition-all whitespace-nowrap shrink-0 cursor-pointer'
        : isMagazineStandaloneWorld
        ? 'px-4 py-2 rounded-xl text-xs font-bold bg-[#16382E] text-white dark:bg-[#6EE7B7] dark:text-[#0F1715] hover:opacity-95 active:scale-[0.97] transition-all whitespace-nowrap shrink-0 cursor-pointer'
        : 'px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-95 active:scale-[0.97] transition-all whitespace-nowrap shrink-0 shadow-sm cursor-pointer';

      return (
        <header
          className={headerClass}
          style={
            pageWorld === 'clinics-teal'
              ? { borderColor: `${standaloneAccentColor}28` }
              : undefined
          }
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            {/* Brand identity container (strictly non-navigating inside Standalone mode) */}
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={
                  standaloneLogoUrl ||
                  (pageWorld === 'about-editorial' || pageWorld === 'home-avoshu'
                    ? '/assets/images/soli-personal-icon.jpg'
                    : '/assets/solimedical/soli-medical-icon.svg')
                }
                alt={resolvedStandaloneTitle}
                className="w-8 h-8 rounded-xl object-cover border border-slate-200/40 shadow-xs shrink-0"
              />
              <div className="min-w-0">
                <span className="block text-sm sm:text-base font-extrabold tracking-tight truncate">
                  {resolvedStandaloneTitle}
                </span>
                {resolvedStandaloneSubtitle && (
                  <span
                    className={`hidden md:block text-[11px] truncate ${
                      isDarkStandaloneWorld
                        ? 'text-slate-400'
                        : isMagazineStandaloneWorld
                        ? 'text-stone-500 dark:text-stone-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {resolvedStandaloneSubtitle}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isMagazineStandaloneWorld && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#171B1A] text-stone-700 dark:text-stone-200 cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleLocale}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isDarkStandaloneWorld
                    ? 'border-[#00D4FF]/30 text-slate-100 hover:border-[#00D4FF]'
                    : isMagazineStandaloneWorld
                    ? 'border-stone-300 dark:border-stone-700 bg-white dark:bg-[#171B1A] text-stone-800 dark:text-stone-100 hover:border-stone-500'
                    : 'border-slate-200 text-slate-800 hover:border-slate-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
              </button>

              {onStandaloneCtaClick ? (
                <button
                  type="button"
                  onClick={onStandaloneCtaClick}
                  style={
                    !isDarkStandaloneWorld && !isEditorialStandaloneWorld && !isMagazineStandaloneWorld
                      ? { backgroundColor: standaloneAccentColor }
                      : undefined
                  }
                  className={ctaButtonClass}
                >
                  {standaloneCtaLabel || ctaDefaultLabel}
                </button>
              ) : (
                <a
                  href={standaloneCtaHref || settings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={
                    !isDarkStandaloneWorld && !isEditorialStandaloneWorld && !isMagazineStandaloneWorld
                      ? { backgroundColor: standaloneAccentColor }
                      : undefined
                  }
                  className={ctaButtonClass}
                >
                  {standaloneCtaLabel || ctaDefaultLabel}
                </a>
              )}
            </div>
          </div>
        </header>
      );
    }

    // 2. WORLD 2: ABOUT PAGE ('about-editorial' — akhilakrishnan Pure Gallery White style)
    if (pageWorld === 'about-editorial') {
      return (
        <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-zinc-200/80">
          <div className="max-w-7xl mx-auto h-20 px-4 sm:px-10 flex items-center justify-between gap-6">
            {/* Minimal gallery navigation links */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => navigate(hideVisitorNav ? `/${locale}/about` : `/${locale}`)}
                className="flex items-center gap-2.5 text-sm font-black tracking-tight text-zinc-900 hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
              >
                <img
                  src="/assets/images/soli-personal-icon.jpg"
                  alt={locale === 'ar' ? 'من أنا' : 'About'}
                  className="w-8 h-8 rounded-xl object-cover border border-zinc-300 shadow-xs shrink-0"
                />
                <span>{locale === 'ar' ? 'من أنا' : 'ABOUT'}</span>
              </button>

              {!hideVisitorNav && (
                <nav className="hidden md:flex items-center gap-5">
                  {navItems.map((item) => {
                    const active = item.match(pathname);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className={`text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'text-zinc-950 underline underline-offset-8 decoration-2'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Right: Language Switcher + Admin CMS (verified admin only) + Circular Black Home Icon */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleLocale}
                className="px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-300 text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {locale === 'ar' ? 'EN' : 'عربي'}
              </button>

              {Boolean(adminSession) && (
                <button
                  type="button"
                  onClick={handleAdminButtonClick}
                  className="inline-flex items-center gap-2 ps-1.5 pe-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <img
                    src={adminAvatarUrl}
                    alt={adminSession?.name || 'Admin'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover border border-zinc-300 shrink-0"
                  />
                  <span>{locale === 'ar' ? 'لوحة الإدارة' : 'Admin'}</span>
                </button>
              )}

              {!hideVisitorNav && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/${locale}`)}
                    title={locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                    className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors shadow-sm cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={locale === 'ar' ? 'قائمة التنقل' : 'Navigation Menu'}
                    className="md:hidden p-2 rounded-full border border-zinc-300 text-zinc-900 cursor-pointer"
                  >
                    {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      );
    }

    // 3. WORLD 3: PROJECTS PAGE ('projects-indigo' — Deep Indigo & Violet Developer Showcase)
    if (pageWorld === 'projects-indigo') {
      return (
        <header className="sticky top-0 z-40 h-18 px-4 sm:px-8 bg-[#080B1A]/90 backdrop-blur-md border-b border-indigo-500/20">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => navigate(hideVisitorNav ? `/${locale}/projects` : `/${locale}`)}
              className="text-base sm:text-lg font-black tracking-wider text-white whitespace-nowrap shrink-0 flex items-center gap-2.5 cursor-pointer"
            >
              <img
                src="/assets/solimedical/soli-medical-icon.svg"
                alt="Soli Medical"
                className="w-8 h-8 rounded-xl object-cover border border-indigo-400/30 shadow-xs shrink-0"
              />
              <span>{locale === 'ar' ? 'المشروعات' : 'PROJECTS'}</span>
            </button>

            {!hideVisitorNav && (
              <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#121631] border border-indigo-500/25">
                {navItems.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.href)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                          : 'text-indigo-200/75 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleLocale}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-500/30 text-indigo-200 hover:border-purple-400 transition-colors cursor-pointer"
              >
                {locale === 'ar' ? 'EN' : 'عربي'}
              </button>

              {Boolean(adminSession) && (
                <button
                  type="button"
                  onClick={handleAdminButtonClick}
                  className="inline-flex items-center gap-2 ps-1.5 pe-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 transition-opacity shadow-md shadow-indigo-600/20 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <img
                    src={adminAvatarUrl}
                    alt={adminSession?.name || 'Admin'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-white/40 shrink-0"
                  />
                  <span>{locale === 'ar' ? 'لوحة الإدارة' : 'Admin CMS'}</span>
                </button>
              )}

              {!hideVisitorNav && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label={locale === 'ar' ? 'قائمة التنقل' : 'Navigation Menu'}
                  className="md:hidden p-2 rounded-lg border border-indigo-500/30 text-white cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </header>
      );
    }

    // 4. WORLD 4: CLINICS DIRECTORY & PORTAL ('clinics-teal' — Bright Clinical Mint & Teal)
    if (pageWorld === 'clinics-teal') {
      return (
        <header className="sticky top-0 z-40 h-18 px-4 sm:px-8 bg-white/95 backdrop-blur-md border-b border-teal-600/15 shadow-xs">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => navigate(`/${locale}/clinics`)}
              className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <img
                src={standaloneLogoUrl || '/assets/solimedical/soli-medical-icon.svg'}
                alt={standaloneTitle || 'Soli Medical'}
                className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
              <span>
                {locale === 'ar' ? 'دليل العيادات' : 'Medical Clinics Portal'}
              </span>
            </button>

            {!hideVisitorNav && (
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.href)}
                      className={`text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'text-[#0D9488] underline underline-offset-8 decoration-2'
                          : 'text-slate-600 hover:text-[#0D9488]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleLocale}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-teal-600/25 text-teal-800 hover:bg-teal-50 transition-colors cursor-pointer"
              >
                {locale === 'ar' ? 'EN' : 'عربي'}
              </button>

              {Boolean(adminSession) && (
                <button
                  type="button"
                  onClick={handleAdminButtonClick}
                  className="inline-flex items-center gap-2 ps-1.5 pe-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0D9488] text-white hover:bg-[#0F766E] transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
                >
                  <img
                    src={adminAvatarUrl}
                    alt={adminSession?.name || 'Admin'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-white/40 shrink-0"
                  />
                  <span>{locale === 'ar' ? 'لوحة الإدارة' : 'Admin CMS'}</span>
                </button>
              )}

              {!hideVisitorNav && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label={locale === 'ar' ? 'قائمة التنقل' : 'Navigation Menu'}
                  className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-800 cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </header>
      );
    }

    // 5. WORLD 5: BLOG & KNOWLEDGE HUB ('blog-magazine' — Ivory Daylight / Night Reading Magazine)
    if (pageWorld === 'blog-magazine') {
      return (
        <header className="sticky top-0 z-40 h-18 px-4 sm:px-8 bg-[#F5F4EF]/95 dark:bg-[#111413]/95 backdrop-blur-md border-b border-stone-300 dark:border-stone-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => navigate(`/${locale}/blog`)}
              className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-[#F5F3EE] whitespace-nowrap shrink-0 flex items-center gap-2.5 cursor-pointer"
            >
              <img
                src="/assets/solimedical/soli-medical-icon.svg"
                alt="Soli Medical"
                className="w-8 h-8 rounded-xl object-cover border border-stone-300 dark:border-stone-700 shadow-xs shrink-0"
              />
              <span>
                {locale === 'ar' ? 'مجلة المعرفة' : 'THE KNOWLEDGE JOURNAL'}
              </span>
            </button>

            {!hideVisitorNav && (
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.href)}
                      className={`text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'text-stone-950 dark:text-[#0F1715] bg-white dark:bg-[#6EE7B7] px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-transparent'
                          : 'text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to Daylight Mode' : 'Switch to Night Mode'}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#171B1A] text-stone-800 dark:text-stone-200 hover:border-stone-500 transition-colors cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[#16382E]" />
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleLocale}
                className="px-3 py-1.5 rounded-full text-xs font-bold border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#171B1A] text-stone-800 dark:text-stone-100 hover:border-stone-500 transition-colors cursor-pointer"
              >
                {locale === 'ar' ? 'EN' : 'عربي'}
              </button>

              {Boolean(adminSession) && (
                <button
                  type="button"
                  onClick={handleAdminButtonClick}
                  className="inline-flex items-center gap-2 ps-1.5 pe-3.5 py-1.5 rounded-full text-xs font-bold bg-stone-900 dark:bg-[#6EE7B7] text-white dark:text-[#0F1715] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <img
                    src={adminAvatarUrl}
                    alt={adminSession?.name || 'Admin'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-white/30 shrink-0"
                  />
                  <span>{locale === 'ar' ? 'لوحة الإدارة' : 'Admin'}</span>
                </button>
              )}

              {!hideVisitorNav && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label={locale === 'ar' ? 'قائمة التنقل' : 'Navigation Menu'}
                  className="md:hidden p-2 rounded-full border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </header>
      );
    }

    // 6. WORLD 6: SOLI MEDICAL & MEDICAL PROJECTS ('soli-showcase' — Dark Obsidian #040D12 & Cyan #00D4FF)
    if (pageWorld === 'soli-showcase') {
      return (
        <header className="sticky top-0 z-40 h-18 px-4 sm:px-8 bg-[#040D12]/90 backdrop-blur-md border-b border-[#00D4FF]/15">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={() =>
                navigate(
                  hideVisitorNav
                    ? cleanRoutePath.includes('/projects/')
                      ? `/${locale}/projects`
                      : `/${locale}/solimedical`
                    : `/${locale}`
                )
              }
              className="flex items-center gap-3 text-white font-extrabold text-sm sm:text-base whitespace-nowrap shrink-0 cursor-pointer"
            >
              <img
                src="/assets/solimedical/soli-medical-icon.svg"
                alt="Soli Medical"
                className="w-8 h-8 rounded-xl object-cover border border-[#00D4FF]/35 shadow-[0_0_12px_rgba(0,212,255,0.25)] shrink-0"
              />
              <span>
                {locale === 'ar'
                  ? 'الحلول والأنظمة الطبية'
                  : 'Medical Systems'}
              </span>
            </button>

            {!hideVisitorNav && (
              <nav className="hidden md:flex items-center gap-6" aria-label="Primary Navigation">
                {navItems.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.href)}
                      className={`text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active ? 'text-[#00D4FF]' : 'text-slate-300 hover:text-[#00D4FF]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleLocale}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-200 border border-[#00D4FF]/25 hover:border-[#00D4FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {locale === 'ar' ? 'EN' : 'عربي'}
              </button>

              {Boolean(adminSession) && (
                <button
                  type="button"
                  onClick={handleAdminButtonClick}
                  className="inline-flex items-center gap-2 ps-1.5 pe-4 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 shadow-[0_0_20px_rgba(0,212,255,0.35)] cursor-pointer"
                >
                  <img
                    src={adminAvatarUrl}
                    alt={adminSession?.name || 'Admin'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-slate-950/30 shrink-0"
                  />
                  <span>{locale === 'ar' ? 'لوحة الإدارة' : 'ADMIN CMS'}</span>
                </button>
              )}

              {!hideVisitorNav && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label={locale === 'ar' ? 'قائمة التنقل' : 'Navigation Menu'}
                  className="md:hidden p-2 rounded-lg border border-slate-800 text-slate-200 cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </header>
      );
    }

    // 7. WORLD 1: HOME PAGE ('home-avoshu' — LineStudio.art Neumorphic Console manages its own integrated top bar & dock)
    return null;
  };

  return (
    <div className={`relative min-h-screen flex flex-col transition-colors duration-300 ${getWorldContainerClasses()}`}>
      {/* Subtle Brand Atmospheric Background Layer (Personal pages only: Home & About) */}
      {!isAdminRoute && (pageWorld === 'home-avoshu' || pageWorld === 'about-editorial') && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <img
            src="/assets/images/soli-personal-icon.jpg"
            alt=""
            className="w-full h-full object-cover object-center opacity-[0.045] dark:opacity-[0.07] blur-[2px] scale-105"
          />
        </div>
      )}
      {/* Toast Feedback Stack */}
      <div className="fixed top-4 end-4 z-[9990] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md ${
              t.type === 'error'
                ? 'bg-red-950/95 border-red-700 text-red-100'
                : t.type === 'info'
                ? 'bg-slate-900/95 border-slate-700 text-slate-100'
                : 'bg-emerald-950/95 border-emerald-600 text-emerald-100'
            }`}
          >
            <span>{t.text}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-white shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Render the active page's custom header */}
      {renderWorldHeader()}

      {/* Mobile Navigation Drawer */}
      {!isAdminRoute && !isStandalone && !hideVisitorNav && mobileMenuOpen && (
        <div
          className={`md:hidden border-b px-4 py-4 space-y-2 z-40 ${
            pageWorld === 'about-editorial' || pageWorld === 'clinics-teal'
              ? 'bg-white text-slate-900 border-slate-200'
              : pageWorld === 'blog-magazine'
              ? 'bg-[#F5F4EF] dark:bg-[#171B1A] text-stone-900 dark:text-[#EDEAE2] border-stone-300 dark:border-stone-800'
              : 'bg-slate-950 text-white border-slate-800'
          }`}
        >
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(item.href);
                }}
                className={`w-full text-start px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  active
                    ? pageWorld === 'clinics-teal'
                      ? 'bg-[#0D9488] text-white'
                      : pageWorld === 'about-editorial'
                      ? 'bg-zinc-900 text-white'
                      : pageWorld === 'blog-magazine'
                      ? 'bg-[#16382E] text-white dark:bg-[#6EE7B7] dark:text-[#0F1715]'
                      : 'bg-[#00D4FF] text-slate-950'
                    : pageWorld === 'about-editorial' || pageWorld === 'clinics-teal'
                    ? 'text-slate-700 hover:bg-slate-100'
                    : pageWorld === 'blog-magazine'
                    ? 'text-stone-700 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-stone-800'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {Boolean(adminSession) && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleAdminButtonClick();
              }}
              className="w-full text-start px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>
                {locale === 'ar'
                  ? 'فتح لوحة الإدارة (/admin)'
                  : 'Open Admin Dashboard (/admin)'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Admin notice banner when viewing a currently hidden page/section */}
      {isCurrentPageHidden && Boolean(adminSession) && (
        <div className="bg-amber-950/90 border-b border-amber-700/70 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {locale === 'ar'
                ? 'تنبيه للمدير: هذه الصفحة / القسم مخفي حالياً عن جميع الزوار (تظهر لك فقط لأنك مسجل الدخول كمدير).'
                : 'Admin Notice: This page/section is currently hidden from all public visitors (visible to you as logged-in Admin).'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/pages')}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0 cursor-pointer"
          >
            {locale === 'ar' ? 'إدارة الصفحات' : 'Manage Pages'}
          </button>
        </div>
      )}

      {/* Main Content (Protected against hidden pages for unauthenticated visitors) */}
      <main className="flex-1">
        {isCurrentPageHidden && !adminSession ? (
          loading ? (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
              <div className="w-7 h-7 rounded-full border-2 border-current border-t-transparent animate-spin opacity-50" />
            </div>
          ) : (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
              <h1 className="text-2xl font-black">
                {locale === 'ar'
                  ? 'هذه الصفحة مخفية حالياً من قِبل إدارة المنصة'
                  : 'This Page is Currently Hidden'}
              </h1>
              <p className="text-xs sm:text-sm opacity-75 max-w-md">
                {locale === 'ar'
                  ? 'تم إخفاء هذا القسم مؤقتاً من العرض العام.'
                  : 'This section has been temporarily hidden from public view.'}
              </p>
            </div>
          )
        ) : (
          children
        )}
      </main>

      {/* Admin Quick Navigation Footer (Shown ONLY when Verified Admin is logged in on inner non-standalone pages) */}
      {Boolean(adminSession) && !isAdminRoute && !isStandalone && pageWorld !== 'home-avoshu' && (
        <footer
          className={`border-t py-10 px-4 sm:px-8 text-xs ${
            pageWorld === 'about-editorial'
              ? 'bg-zinc-50 border-zinc-200 text-zinc-600'
              : pageWorld === 'clinics-teal'
              ? 'bg-white border-teal-600/15 text-slate-600'
              : pageWorld === 'blog-magazine'
              ? 'bg-[#EAE8E1] dark:bg-[#171B1A] border-stone-300 dark:border-stone-800 text-stone-600 dark:text-stone-300'
              : 'bg-[#05070B] border-slate-800/80 text-slate-400'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div
                className={`text-sm font-black tracking-tight ${
                  pageWorld === 'about-editorial' ||
                  pageWorld === 'clinics-teal'
                    ? 'text-slate-900'
                    : pageWorld === 'blog-magazine'
                    ? 'text-stone-950 dark:text-stone-100'
                    : 'text-white'
                }`}
              >
                {settings.ownerName[locale]} — {settings.ownerRole[locale]}
              </div>
              <p className="text-xs opacity-80">{settings.location[locale]}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className="hover:underline font-semibold"
                >
                  {item.label}
                </button>
              ))}
              <span>·</span>
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline font-semibold"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
              <span>·</span>
              <button
                type="button"
                onClick={handleAdminButtonClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold bg-[#0066FF] text-white hover:bg-[#0052CC] transition-colors shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
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
            </div>
          </div>
        </footer>
      )}

      {/* Standalone Clinic WhatsApp Footer */}
      {!isAdminRoute && isStandalone && pageWorld === 'clinics-teal' && (
        <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-semibold text-slate-800">
              {standaloneTitle || settings.brandName[locale]}
            </div>
            <div className="flex items-center gap-4">
              <a
                href={standaloneCtaHref || settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: standaloneAccentColor }}
                className="font-bold hover:underline"
              >
                {locale === 'ar' ? 'الحجز والاستعلام عبر واتساب' : 'Book via WhatsApp'}
              </a>
            </div>
          </div>
        </footer>
      )}

      {/* ===================================================================== */}
      {/* QUICK ADMIN SIGN-IN MODAL (Minimal Google Icon Only)                  */}
      {/* ===================================================================== */}
      {quickAdminModalOpen && (
        <div
          onClick={() => setQuickAdminModalOpen(false)}
          className="fixed inset-0 z-[9995] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-[#0F172A] border border-slate-800 p-6 text-white space-y-5 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setQuickAdminModalOpen(false)}
              className="absolute top-3.5 end-3.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
              aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center pt-2 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                {locale === 'ar' ? 'تسجيل دخول الإدارة' : 'Admin Sign In'}
              </h3>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-700 text-xs text-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{loginError}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={loginLoading || !isFirebaseConnected}
              onClick={handleQuickAdminGoogleSubmit}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5 shadow-lg cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>
                {loginLoading
                  ? locale === 'ar'
                    ? 'جاري تسجيل الدخول...'
                    : 'Signing in...'
                  : locale === 'ar'
                  ? 'المتابعة باستخدام Google'
                  : 'Continue with Google'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Admin Control Bar when Admin is Authenticated on Public Pages */}
      {adminSession && !isAdminRoute && (
        <div className="fixed bottom-4 start-4 z-50 flex flex-wrap items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-900/95 text-slate-100 border border-[#00C2CB]/40 shadow-xl backdrop-blur-md text-xs">
          <img
            src={adminAvatarUrl}
            alt={adminSession.name}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full object-cover ring-2 ring-[#00C2CB] shrink-0"
          />
          <span className="font-bold hidden sm:inline truncate max-w-[140px]">
            {adminSession.name}
          </span>

          <button
            type="button"
            onClick={() => navigate(adminQuickEditPath)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00C2CB] text-slate-950 font-bold hover:bg-[#0099A3] transition-colors cursor-pointer"
          >
            <span>{locale === 'ar' ? 'لوحة الإدارة' : 'Admin CMS'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          {isStandalone ? (
            <button
              type="button"
              onClick={handleExitStandalone}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              <span>{locale === 'ar' ? 'إظهار القوائم' : 'Exit Standalone'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnterStandalone}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              <span>{locale === 'ar' ? 'معاينة مستقلة' : 'Standalone Preview'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={logoutAdmin}
            className="p-1 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title={locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
