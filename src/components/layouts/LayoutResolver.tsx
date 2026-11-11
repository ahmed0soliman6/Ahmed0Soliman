import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import {
  Sun,
  Moon,
  Globe,
  ShieldCheck,
  Edit3,
  ExternalLink,
  Menu,
  X,
  Phone,
  MessageCircle,
  Send,
  LogOut,
  Eye,
  Layout,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';

interface LayoutResolverProps {
  children: React.ReactNode;
  forceStandalone?: boolean;
  standaloneContext?: {
    title: string;
    subtitle?: string;
    whatsappUrl?: string;
    phone?: string;
    ctaLabel?: string;
    editPath?: string;
  };
  adminQuickEditPath?: string;
}

export const LayoutResolver: React.FC<LayoutResolverProps> = ({
  children,
  forceStandalone = false,
  standaloneContext,
  adminQuickEditPath,
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
    adminSession,
    logoutAdmin,
    toasts,
    dismissToast,
  } = usePlatform();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isStandaloneQuery =
    searchParams.get('standalone') === '1' || searchParams.get('mode') === 'landing';
  const isStandalone = forceStandalone || isStandaloneQuery;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  const settings = db.siteSettings;
  const brandName = settings.brandName[locale] || 'Ahmed Soliman';

  const navItems = [
    {
      label: locale === 'ar' ? 'الرئيسية' : 'Home',
      href: `/${locale}`,
      active: pathname === '/' || pathname === `/${locale}`,
    },
    {
      label: locale === 'ar' ? 'من أنا' : 'About',
      href: `/${locale}/about`,
      active: pathname === `/${locale}/about`,
    },
    {
      label: locale === 'ar' ? 'المشروعات' : 'Projects',
      href: `/${locale}/projects`,
      active: pathname.startsWith(`/${locale}/projects`),
    },
    {
      label: locale === 'ar' ? 'العيادات' : 'Clinics',
      href: `/${locale}/clinics`,
      active: pathname.startsWith(`/${locale}/clinics`),
    },
    {
      label: locale === 'ar' ? 'المقالات' : 'Blog',
      href: `/${locale}/blog`,
      active: pathname.startsWith(`/${locale}/blog`),
    },
  ];

  // Toast Overlay (shared across all layouts)
  const renderToasts = () => (
    <div className="fixed bottom-5 end-5 z-[9990] flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all ${
            t.type === 'error'
              ? 'bg-red-950/95 border-red-700 text-red-100'
              : t.type === 'info'
              ? 'bg-slate-900/95 border-slate-700 text-slate-100'
              : 'bg-slate-900/95 border-[#00C2CB]/50 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : t.type === 'info' ? (
              <Info className="w-4 h-4 text-[#00C2CB] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#00C2CB] shrink-0" />
            )}
            <span>{t.text}</span>
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );

  // Admin Floating Control Bar when logged-in Admin browses Public or Standalone pages
  const renderAdminFloatingOverlay = () => {
    if (!adminSession || isAdminRoute) return null;
    return (
      <div className="bg-[#070E1A] text-slate-100 border-b border-[#00C2CB]/30 px-4 sm:px-8 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#00C2CB]">
              <ShieldCheck className="w-4 h-4" />
              {locale === 'ar' ? 'وضع المدير المعتمد:' : 'Verified Admin Mode:'}
            </span>
            <span className="text-slate-300 font-mono-tabular">{adminSession.email}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {adminQuickEditPath && (
              <button
                onClick={() => navigate(adminQuickEditPath)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#00C2CB]/15 text-[#00C2CB] hover:bg-[#00C2CB]/25 border border-[#00C2CB]/30 font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'تعديل هذه الصفحة' : 'Edit This Page'}</span>
              </button>
            )}

            <button
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams);
                if (isStandalone) {
                  nextParams.delete('standalone');
                  nextParams.delete('mode');
                } else {
                  nextParams.set('standalone', '1');
                }
                const qs = nextParams.toString();
                navigate(`${pathname}${qs ? `?${qs}` : ''}`);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Eye className="w-3.5 h-3.5 text-[#00C2CB]" />
              <span>
                {isStandalone
                  ? locale === 'ar'
                    ? 'عرض الموقع الكامل'
                    : 'Switch to Public Layout'
                  : locale === 'ar'
                  ? 'معاينة العرض المستقل'
                  : 'Preview Standalone Layout'}
              </span>
            </button>

            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#00C2CB] text-slate-950 font-semibold hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'لوحة الإدارة' : 'Admin CMS'}</span>
            </button>

            <button
              onClick={logoutAdmin}
              title={locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // MODE 3: ADMIN CMS LAYOUT (Handled inside AdminDashboard component)
  // ---------------------------------------------------------------------------
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070E1A] text-slate-900 dark:text-slate-100">
        {children}
        {renderToasts()}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MODE 2: STANDALONE LANDING LAYOUT (Section 6)
  // Used for clinic landing pages or standalone profile pages when visited directly
  // or via campaign links (?standalone=1). Displays NO main site navigation.
  // ---------------------------------------------------------------------------
  if (isStandalone) {
    const standaloneTitle = standaloneContext?.title || brandName;
    const standaloneWhatsapp = standaloneContext?.whatsappUrl || settings.whatsappUrl;
    const standalonePhone = standaloneContext?.phone || '';
    const standaloneCta =
      standaloneContext?.ctaLabel ||
      (locale === 'ar' ? 'تواصل واحجز عبر واتساب' : 'Book via WhatsApp');

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070E1A] text-slate-900 dark:text-slate-100 transition-colors">
        {renderAdminFloatingOverlay()}

        {/* Standalone Focused Header: Only Entity Brand + Language/Theme + Direct Contact CTA */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#070E1A]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {standaloneTitle}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
              </button>

              <button
                onClick={toggleTheme}
                aria-label={locale === 'ar' ? 'تبديل المظهر' : 'Toggle theme'}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] transition-colors shrink-0"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {standalonePhone && (
                <a
                  href={`tel:${standalonePhone}`}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
                >
                  <Phone className="w-3.5 h-3.5 text-[#00C2CB]" />
                  <span className="font-mono-tabular">{standalonePhone}</span>
                </a>
              )}

              <a
                href={standaloneWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{standaloneCta}</span>
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Minimal Standalone Footer: Only entity copyright and direct contact channels */}
        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1324] py-8 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <p className="font-medium text-slate-700 dark:text-slate-300">{standaloneTitle}</p>
            <div className="flex items-center gap-4">
              <a
                href={standaloneWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#00C2CB] transition-colors"
              >
                WhatsApp
              </a>
              <span>·</span>
              <a
                href={settings.telegramBotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#00C2CB] transition-colors"
              >
                Telegram Bot
              </a>
            </div>
          </div>
        </footer>

        {renderToasts()}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MODE 1: PUBLIC WEBSITE LAYOUT (Section 6 + Top Bar Contract)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070E1A] text-slate-900 dark:text-slate-100 transition-colors">
      {renderAdminFloatingOverlay()}

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#070E1A]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href={`/${locale}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/${locale}`);
            }}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:text-[#00C2CB] dark:hover:text-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
          >
            {brandName}
          </a>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  item.active
                    ? 'border-[#00C2CB] text-slate-950 dark:text-white font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: 1 Primary CTA Action (+ mobile menu trigger on small screens) */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={settings.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#00C2CB] text-slate-950 rounded-lg hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
            >
              <span>{locale === 'ar' ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}</span>
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
              className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Secondary Preference Ribbon (Language & Theme & Admin Access) below main nav */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-100/70 dark:bg-[#0B1324]/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-1.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{settings.tagline[locale]}</span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                className="inline-flex items-center gap-1 hover:text-[#00C2CB] font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}</span>
              </button>

              <span aria-hidden="true">·</span>

              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-1 hover:text-[#00C2CB] font-medium transition-colors whitespace-nowrap shrink-0"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>{locale === 'ar' ? 'الوضع النهاري' : 'Light Mode'}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-700" />
                    <span>{locale === 'ar' ? 'الوضع الليلي' : 'Dark Mode'}</span>
                  </>
                )}
              </button>

              <span aria-hidden="true">·</span>

              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1 hover:text-[#00C2CB] font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'الإدارة' : 'Admin'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1324] px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  navigate(item.href);
                }}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  item.active
                    ? 'bg-[#00C2CB]/15 text-[#00C2CB]'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2.5 px-4 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950"
              >
                {locale === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp Contact'}
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1324] py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-200 dark:border-slate-800/80">
          <div className="md:col-span-5 space-y-3">
            <div className="text-lg font-bold text-slate-900 dark:text-white">{brandName}</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              {settings.tagline[locale]} — {settings.location[locale]}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#00C2CB] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#00C2CB]" />
                <span>WhatsApp</span>
              </a>
              <span>·</span>
              <a
                href={settings.telegramBotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#00C2CB] transition-colors"
              >
                <Send className="w-4 h-4 text-[#00C2CB]" />
                <span>@SoliMedicalproBot</span>
              </a>
              <span>·</span>
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#00C2CB] transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-[#00C2CB]" />
                <span>Facebook</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              {locale === 'ar' ? 'أقسام المنصة' : 'Platform Sections'}
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.href);
                    }}
                    className="hover:text-[#00C2CB] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              {locale === 'ar' ? 'روابط سريعة وفهرسة' : 'Quick Links & Indexing'}
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#00C2CB] transition-colors"
                >
                  Sitemap.xml
                </a>
              </li>
              <li>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#00C2CB] transition-colors"
                >
                  Robots.txt
                </a>
              </li>
              <li>
                <button
                  onClick={() => navigate('/admin')}
                  className="hover:text-[#00C2CB] transition-colors"
                >
                  {locale === 'ar' ? 'لوحة إدارة المحتوى (Admin CMS)' : 'Admin CMS Portal'}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} {brandName}.{' '}
            {locale === 'ar'
              ? 'جميع الحقوق محفوظة — منصة رقمية مستقلة.'
              : 'All rights reserved — Independent Digital Platform.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              className="hover:text-[#00C2CB] transition-colors"
            >
              {locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            </button>
            <span>·</span>
            <button onClick={toggleTheme} className="hover:text-[#00C2CB] transition-colors">
              {theme === 'dark'
                ? locale === 'ar'
                  ? 'الوضع النهاري'
                  : 'Light Theme'
                : locale === 'ar'
                ? 'الوضع الليلي'
                : 'Dark Theme'}
            </button>
          </div>
        </div>
      </footer>

      {renderToasts()}
    </div>
  );
};
