import React, { useState } from 'react';
import { Locale, ThemeMode } from '../../types/cms';
import {
  LayoutDashboard,
  Globe,
  FileText,
  BookOpen,
  FolderKanban,
  Building2,
  Image as ImageIcon,
  Upload,
  FileImage,
  SearchCode,
  Sliders,
  Database,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';

export type AdminSubRoute =
  | 'overview'
  | 'projects'
  | 'clinics'
  | 'pages'
  | 'blog'
  | 'media'
  | 'settings';

export type SidebarGroupId = 'main' | 'content' | 'media' | 'settings';

interface SidebarLinkItem {
  id: string;
  label: { ar: string; en: string };
  icon: React.ComponentType<{ className?: string }>;
  targetSubRoute: AdminSubRoute;
  targetPath: string;
  anchorId?: string;
  badge?: number;
}

interface SidebarGroup {
  id: SidebarGroupId;
  title: { ar: string; en: string };
  items: SidebarLinkItem[];
}

interface AdminSidebarProps {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  subRoute: AdminSubRoute;
  activeNavKey: string;
  adminUid: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectLink: (item: SidebarLinkItem) => void;
  onOpenPublicSite: () => void;
  onLogout: () => void;
  counts: {
    pages: number;
    articles: number;
    projects: number;
    clinics: number;
    media: number;
    drafts: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  locale,
  setLocale,
  theme,
  toggleTheme,
  subRoute,
  activeNavKey,
  adminUid,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
  onSelectLink,
  onOpenPublicSite,
  onLogout,
  counts,
}) => {
  const [openGroups, setOpenGroups] = useState<Record<SidebarGroupId, boolean>>({
    main: true,
    content: true,
    media: true,
    settings: true,
  });

  const toggleGroup = (groupId: SidebarGroupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const groups: SidebarGroup[] = [
    {
      id: 'main',
      title: { ar: 'الرئيسية', en: 'Main' },
      items: [
        {
          id: 'overview',
          label: { ar: 'لوحة المعلومات', en: 'Dashboard' },
          icon: LayoutDashboard,
          targetSubRoute: 'overview',
          targetPath: '/admin',
          badge: counts.drafts > 0 ? counts.drafts : undefined,
        },
        {
          id: 'site-overview',
          label: { ar: 'نظرة عامة على الموقع', en: 'Site Overview' },
          icon: Globe,
          targetSubRoute: 'overview',
          targetPath: '/admin#site-overview',
          anchorId: 'site-overview',
        },
      ],
    },
    {
      id: 'content',
      title: { ar: 'إدارة المحتوى', en: 'Content Management' },
      items: [
        {
          id: 'pages',
          label: { ar: 'إدارة الصفحات', en: 'Pages' },
          icon: FileText,
          targetSubRoute: 'pages',
          targetPath: '/admin/pages',
          badge: counts.pages,
        },
        {
          id: 'blog',
          label: { ar: 'إدارة المقالات', en: 'Articles & Blog' },
          icon: BookOpen,
          targetSubRoute: 'blog',
          targetPath: '/admin/blog',
          badge: counts.articles,
        },
        {
          id: 'projects',
          label: { ar: 'إدارة المشروعات', en: 'Projects' },
          icon: FolderKanban,
          targetSubRoute: 'projects',
          targetPath: '/admin/projects',
          badge: counts.projects,
        },
        {
          id: 'clinics',
          label: { ar: 'العيادات والأطباء والخدمات', en: 'Clinics & Services' },
          icon: Building2,
          targetSubRoute: 'clinics',
          targetPath: '/admin/clinics',
          badge: counts.clinics,
        },
      ],
    },
    {
      id: 'media',
      title: { ar: 'إدارة الوسائط', en: 'Media Management' },
      items: [
        {
          id: 'media-library',
          label: { ar: 'مكتبة الصور', en: 'Image Library' },
          icon: ImageIcon,
          targetSubRoute: 'media',
          targetPath: '/admin/media',
          badge: counts.media,
        },
        {
          id: 'media-upload',
          label: { ar: 'رفع الصور', en: 'Upload Images' },
          icon: Upload,
          targetSubRoute: 'media',
          targetPath: '/admin/media?view=upload',
          anchorId: 'media-upload-zone',
        },
        {
          id: 'media-article-images',
          label: { ar: 'الصور المستخدمة داخل المقالات', en: 'Article Images' },
          icon: FileImage,
          targetSubRoute: 'media',
          targetPath: '/admin/media?view=article-images',
        },
      ],
    },
    {
      id: 'settings',
      title: { ar: 'إعدادات الموقع', en: 'Site Settings' },
      items: [
        {
          id: 'settings-seo',
          label: { ar: 'إعدادات SEO', en: 'SEO Settings' },
          icon: SearchCode,
          targetSubRoute: 'settings',
          targetPath: '/admin/settings#settings-seo',
          anchorId: 'settings-seo',
        },
        {
          id: 'settings-identity',
          label: { ar: 'إعدادات الهوية واللغة', en: 'Identity & Language' },
          icon: Sliders,
          targetSubRoute: 'settings',
          targetPath: '/admin/settings#settings-identity',
          anchorId: 'settings-identity',
        },
        {
          id: 'settings-integrations',
          label: { ar: 'إعدادات Firebase وCloudinary', en: 'Firebase & Cloudinary' },
          icon: Database,
          targetSubRoute: 'settings',
          targetPath: '/admin/settings#settings-integrations',
          anchorId: 'settings-integrations',
        },
        {
          id: 'settings-backup',
          label: { ar: 'النسخ الاحتياطي والاستعادة', en: 'Backup & Restore' },
          icon: ArchiveRestore,
          targetSubRoute: 'settings',
          targetPath: '/admin/settings#settings-backup',
          anchorId: 'settings-backup',
        },
      ],
    },
  ];

  const GroupChevronClosed = locale === 'ar' ? ChevronLeft : ChevronRight;

  const renderSidebarBody = (isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full justify-between">
      <div className="p-4 space-y-5 overflow-y-auto flex-1">
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          {(!collapsed || isMobileDrawer) && (
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Ahmed Soliman CMS
              </div>
              <div className="text-[11px] text-[#0099A3] dark:text-[#00C2CB] font-mono-tabular truncate">
                UID: {adminUid.slice(0, 14)}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenPublicSite}
              className="p-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] transition-colors cursor-pointer"
              title={locale === 'ar' ? 'فتح الموقع العام' : 'Open Public Site'}
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {isMobileDrawer ? (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-red-400 lg:hidden cursor-pointer"
                aria-label={locale === 'ar' ? 'إغلاق القائمة' : 'Close navigation'}
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:inline-flex p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] transition-colors cursor-pointer"
                title={
                  collapsed
                    ? locale === 'ar'
                      ? 'توسيع القائمة الجانبية'
                      : 'Expand Sidebar'
                    : locale === 'ar'
                    ? 'طي القائمة الجانبية'
                    : 'Collapse Sidebar'
                }
              >
                {collapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav className="space-y-4" aria-label={locale === 'ar' ? 'قائمة لوحة التحكم' : 'CMS Navigation'}>
          {groups.map((group) => {
            const isOpen = openGroups[group.id];
            return (
              <div key={group.id} className="space-y-1">
                {(!collapsed || isMobileDrawer) && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <span className="truncate">{group.title[locale]}</span>
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <GroupChevronClosed className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>
                )}

                {(isOpen || (collapsed && !isMobileDrawer)) && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        activeNavKey === item.id ||
                        (activeNavKey === '' && subRoute === item.targetSubRoute && item.id === subRoute);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onSelectLink(item);
                            if (isMobileDrawer) onCloseMobile();
                          }}
                          title={collapsed && !isMobileDrawer ? item.label[locale] : undefined}
                          className={`w-full flex items-center ${
                            collapsed && !isMobileDrawer ? 'justify-center px-2' : 'justify-between px-3'
                          } py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#00C2CB] text-slate-950'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <Icon className="w-4 h-4 shrink-0" />
                            {(!collapsed || isMobileDrawer) && (
                              <span className="truncate">{item.label[locale]}</span>
                            )}
                          </span>

                          {(!collapsed || isMobileDrawer) && typeof item.badge === 'number' && (
                            <span
                              className={`text-[11px] font-mono-tabular px-1.5 py-0.5 rounded shrink-0 ${
                                isActive
                                  ? 'bg-slate-950/15 text-slate-950 font-bold'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Utilities */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
        <div
          className={`flex items-center ${
            collapsed && !isMobileDrawer ? 'flex-col gap-2' : 'justify-between'
          } text-slate-600 dark:text-slate-400`}
        >
          <button
            type="button"
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#00C2CB] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title={locale === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            {(!collapsed || isMobileDrawer) && (
              <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#00C2CB] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Moon className="w-3.5 h-3.5 shrink-0" />
            )}
            {(!collapsed || isMobileDrawer) && (
              <span>
                {theme === 'dark'
                  ? locale === 'ar'
                    ? 'الوضع النهاري'
                    : 'Light'
                  : locale === 'ar'
                  ? 'الوضع الليلي'
                  : 'Dark'}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          title={locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {(!collapsed || isMobileDrawer) && (
            <span className="whitespace-nowrap">
              {locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white dark:bg-[#0F172A] border-e border-slate-200 dark:border-slate-800 transition-all duration-200 sticky top-0 h-screen ${
          collapsed ? 'w-[76px]' : 'w-72'
        }`}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-xs lg:hidden flex"
          onClick={onCloseMobile}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="w-76 max-w-[85vw] h-full bg-white dark:bg-[#0F172A] border-e border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}
    </>
  );
};
