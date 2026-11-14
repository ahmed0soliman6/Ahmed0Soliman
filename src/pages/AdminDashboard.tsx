import React, { useState, useEffect, useMemo } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { AdminSidebar, AdminSubRoute } from '../components/admin/AdminSidebar';
import { AdminPagination } from '../components/admin/AdminPagination';
import { PageEditor } from '../components/admin/PageEditor';
import { ArticleEditor } from '../components/admin/ArticleEditor';
import { ImageUploadPreviewModal } from '../components/admin/ImageUploadPreviewModal';
import {
  CompressedImageResult,
  formatBytes,
  uploadCompressedMediaToCloudinary,
  validateRawImageForCompression,
} from '../lib/imageCompression';
import {
  validateProjectPayload,
  validateClinicPayload,
  validateDoctorPayload,
  validateServicePayload,
  validateArticlePayload,
  validateArticleSlug,
  validatePagePayload,
  checkArticleInSiteReferences,
  checkMediaInPublishedContent,
  checkPageInSiteReferences,
  countArticleWords,
  estimateArticleReadingTime,
  getPageCanonicalPath,
  isCoreProtectedPage,
  slugifyText,
} from '../lib/validationSchemas';
import {
  getSavedFirebaseConfig,
  saveExternalFirebaseConfig,
} from '../lib/firebaseClient';
import {
  ProjectItem,
  ClinicItem,
  DoctorItem,
  ServiceItem,
  ArticleItem,
  PageConfig,
  MediaAsset,
  SiteSettings,
} from '../types/cms';
import {
  FolderKanban,
  Building2,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Upload,
  ShieldCheck,
  Database,
  ExternalLink,
  AlertTriangle,
  Copy,
  RefreshCw,
  Menu,
  Clock,
  ArrowUpDown,
  FilePlus2,
  FolderPlus,
  Cloud,
  CheckCircle2,
  FileImage,
  Lock,
  RotateCcw,
  Star,
  Tag,
} from 'lucide-react';

interface AdminDashboardProps {
  subRoute: AdminSubRoute;
}

type AdminSortOption = 'updatedAt' | 'createdAt' | 'order' | 'title';

function formatAdminDate(iso?: string, locale: 'ar' | 'en' = 'en'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

function getTimestampValue(iso?: string): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

function extractArticleInlineImageUrls(articles: ArticleItem[]): Map<string, string[]> {
  const usageMap = new Map<string, string[]>();
  const addRef = (url: string, label: string) => {
    if (!url || typeof url !== 'string') return;
    const clean = url.trim();
    if (!clean) return;
    const list = usageMap.get(clean) || [];
    if (!list.includes(label)) {
      list.push(label);
      usageMap.set(clean, list);
    }
  };

  for (const art of articles) {
    const label = art.title.en || art.title.ar || art.slug;
    if (art.coverImage) addRef(art.coverImage, `${label} (Cover)`);
    if (art.seo?.ogImage) addRef(art.seo.ogImage, `${label} (OG)`);

    for (const raw of [art.content?.ar || '', art.content?.en || '']) {
      if (!raw) continue;
      // Markdown image links ![alt](url)
      const mdRegex = /!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g;
      let m: RegExpExecArray | null;
      while ((m = mdRegex.exec(raw)) !== null) {
        addRef(m[1], `${label} (Inline)`);
      }
      // HTML <img src="...">
      const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      while ((m = htmlRegex.exec(raw)) !== null) {
        addRef(m[1], `${label} (Inline)`);
      }
      // Tiptap JSON nodes (if stored JSON stringified)
      if (raw.trim().startsWith('{')) {
        try {
          const walk = (node: any) => {
            if (!node || typeof node !== 'object') return;
            if (node.type === 'image' && typeof node.attrs?.src === 'string') {
              addRef(node.attrs.src, `${label} (Inline)`);
            }
            if (Array.isArray(node.content)) {
              node.content.forEach(walk);
            }
          };
          walk(JSON.parse(raw));
        } catch {
          // plain text starting with '{'
        }
      }
    }
  }
  return usageMap;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ subRoute }) => {
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
    error,
    adminSession,
    loginAsOwnerAdmin,
    logoutAdmin,
    saveSiteSettings,
    upsertRecord,
    deleteRecord,
    reorderRecords,
    seedBaselineDatabase,
    showToast,
    isFirebaseConnected,
    refreshData,
  } = usePlatform();

  // Sidebar & Global Workspace Navigation State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeNavKey, setActiveNavKey] = useState<string>(subRoute);
  const [globalQuery, setGlobalQuery] = useState('');
  const [confirmSeedOpen, setConfirmSeedOpen] = useState(false);

  // Login Gate State
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin Management State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUid, setNewAdminUid] = useState('');
  const [adminManageBusy, setAdminManageBusy] = useState(false);
  const [purgingAuthUsers, setPurgingAuthUsers] = useState(false);

  // Unified Search, Filter, Sort & Pagination State
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'trash'>('all');
  const [sortBy, setSortBy] = useState<AdminSortOption>('order');
  const [currentPage, setCurrentPage] = useState(1);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<'all' | MediaAsset['category']>('all');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState<string>('all');
  const PAGE_SIZE = 12;

  // Clinic Sub-tab: 'clinics' | 'doctors' | 'services'
  const [clinicSubTab, setClinicSubTab] = useState<'clinics' | 'doctors' | 'services'>('clinics');

  // Modals State
  const [editingProject, setEditingProject] = useState<Partial<ProjectItem> | null>(null);
  const [editingClinic, setEditingClinic] = useState<Partial<ClinicItem> | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Partial<DoctorItem> | null>(null);
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);
  const [editingArticle, setEditingArticle] = useState<Partial<ArticleItem> | null>(null);
  const [editingArticleIsNew, setEditingArticleIsNew] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<PageConfig> | null>(null);
  const [editingPageIsNew, setEditingPageIsNew] = useState(false);
  const [pageTrashConfirm, setPageTrashConfirm] = useState<PageConfig | null>(null);
  const [articleTrashConfirm, setArticleTrashConfirm] = useState<ArticleItem | null>(null);
  const [deleteConfirmLiteralInput, setDeleteConfirmLiteralInput] = useState('');
  const [previewItem, setPreviewItem] = useState<{
    type: string;
    title: string;
    subtitle: string;
    body: string;
    image?: string;
    published?: boolean;
  } | null>(null);

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    collection: 'pages' | 'projects' | 'clinics' | 'doctors' | 'services' | 'articles' | 'media';
    id: string;
    title: string;
    warning?: string;
    requireLiteralConfirm?: boolean;
    expectedLiteralName?: string;
  } | null>(null);

  // Cover Image Picker Modal
  const [imagePickerCallback, setImagePickerCallback] = useState<
    ((selectedUrl: string) => void) | null
  >(null);

  // Cloudinary Upload & Compression State
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaAltAr, setMediaAltAr] = useState('');
  const [mediaAltEn, setMediaAltEn] = useState('');
  const [mediaCategory, setMediaCategory] = useState<MediaAsset['category']>('general');
  const [cloudinaryStatus, setCloudinaryStatus] = useState<{
    configured: boolean;
    cloudName: string;
    folder: string;
  } | null>(null);
  const [replacingMediaItem, setReplacingMediaItem] = useState<MediaAsset | null>(null);
  const [pendingUploadPayload, setPendingUploadPayload] = useState<{
    file: File;
    onAfterUploaded?: (url: string) => void;
  } | null>(null);
  const [mediaDragActive, setMediaDragActive] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState<'all' | MediaAsset['category']>('all');
  const [editingMediaAlt, setEditingMediaAlt] = useState<MediaAsset | null>(null);

  // Settings & External Firebase State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(db.siteSettings);
  const [fbConfigForm, setFbConfigForm] = useState(() => {
    const saved = getSavedFirebaseConfig();
    return {
      apiKey: saved?.apiKey || '',
      authDomain: saved?.authDomain || '',
      projectId: saved?.projectId || '',
      appId: saved?.appId || '',
      messagingSenderId: saved?.messagingSenderId || '',
      databaseId: saved?.databaseId || '(default)',
    };
  });

  useEffect(() => {
    setSettingsForm(db.siteSettings);
  }, [db.siteSettings]);

  // Check Cloudinary server configuration & initial Audit Report when Admin is logged in
  const [auditReport, setAuditReport] = useState<{
    timestamp: string;
    overallStatus: string;
    summary: {
      functionalPassed: number;
      functionalTotal: number;
      securityPassed: number;
      securityTotal: number;
      criticalVulnerabilities: number;
    };
    functionalTests: {
      id: string;
      category: string;
      title: { ar: string; en: string };
      passed: boolean;
      details: { ar: string; en: string };
    }[];
    securityAuditItems: {
      id: string;
      area: string;
      severity: string;
      status: string;
      finding: { ar: string; en: string };
    }[];
  } | null>(null);
  const [runningAudit, setRunningAudit] = useState(false);

  const runLiveAudit = async () => {
    if (!adminSession) return;
    setRunningAudit(true);
    try {
      const res = await fetch('/api/audit/run', {
        headers: { Authorization: `Bearer ${adminSession.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditReport(data);
      }
    } catch {
      // ignore
    } finally {
      setRunningAudit(false);
    }
  };

  useEffect(() => {
    if (!adminSession) return;
    fetch('/api/cloudinary/status', {
      headers: { Authorization: `Bearer ${adminSession.token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setCloudinaryStatus(data);
      })
      .catch(() => {});
    runLiveAudit();
  }, [adminSession]);

  // Reset pagination & contextual sub-filters on section switch
  useEffect(() => {
    setCurrentPage(1);
    setSearchFilter('');
    setStatusFilter('all');
    setBlogCategoryFilter('all');
    setGlobalQuery('');
    const viewParam = searchParams.get('view');
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (subRoute === 'media') {
      if (viewParam === 'upload') setActiveNavKey('media-upload');
      else if (viewParam === 'article-images') setActiveNavKey('media-article-images');
      else setActiveNavKey('media-library');
    } else if (subRoute === 'settings') {
      if (hash === 'settings-seo') setActiveNavKey('settings-seo');
      else if (hash === 'settings-identity') setActiveNavKey('settings-identity');
      else if (hash === 'settings-integrations') setActiveNavKey('settings-integrations');
      else if (hash === 'settings-backup') setActiveNavKey('settings-backup');
      else setActiveNavKey('settings-identity');
    } else if (subRoute === 'overview' && hash === 'site-overview') {
      setActiveNavKey('site-overview');
    } else {
      setActiveNavKey(subRoute);
    }

    if (hash) {
      window.setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }, [subRoute, pathname, searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, statusFilter, sortBy, clinicSubTab, mediaCategoryFilter, blogCategoryFilter]);

  const mediaView = useMemo<'gallery' | 'upload' | 'article-images'>(() => {
    const view = searchParams.get('view');
    if (view === 'upload') return 'upload';
    if (view === 'article-images') return 'article-images';
    return 'gallery';
  }, [searchParams]);

  const articleInlineMediaUsage = useMemo(
    () => extractArticleInlineImageUrls(db.articles || []),
    [db.articles]
  );

  // Real computed statistics directly from Firestore / PlatformDatabase
  const realStats = useMemo(() => {
    const pages = (db.pages || []).filter((p) => !p.archived);
    const projects = db.projects || [];
    const clinics = db.clinics || [];
    const doctors = db.doctors || [];
    const services = db.services || [];
    const articles = (db.articles || []).filter((a) => !a.archived);
    const media = db.media || [];

    const publishedPages = pages.filter((p) => p.published).length;
    const publishedProjects = projects.filter((p) => p.published).length;
    const publishedClinics = clinics.filter((c) => c.published).length;
    const publishedDoctors = doctors.filter((d) => d.published).length;
    const publishedServices = services.filter((s) => s.published).length;
    const publishedArticles = articles.filter((a) => a.published).length;
    const featuredArticles = articles.filter((a) => a.featured).length;

    const totalDrafts =
      (pages.length - publishedPages) +
      (projects.length - publishedProjects) +
      (clinics.length - publishedClinics) +
      (doctors.length - publishedDoctors) +
      (services.length - publishedServices) +
      (articles.length - publishedArticles);

    const totalContentRecords =
      pages.length + projects.length + clinics.length + doctors.length + services.length + articles.length;

    const latestArticles = [...articles]
      .sort(
        (a, b) =>
          getTimestampValue(b.updatedAt || b.createdAt) -
          getTimestampValue(a.updatedAt || a.createdAt)
      )
      .slice(0, 5);

    const latestPages = [...pages]
      .sort(
        (a, b) =>
          getTimestampValue(b.updatedAt || b.createdAt) -
          getTimestampValue(a.updatedAt || a.createdAt)
      )
      .slice(0, 5);

    return {
      pagesTotal: pages.length,
      publishedPages,
      projectsTotal: projects.length,
      publishedProjects,
      clinicsTotal: clinics.length,
      publishedClinics,
      doctorsTotal: doctors.length,
      publishedDoctors,
      servicesTotal: services.length,
      publishedServices,
      articlesTotal: articles.length,
      publishedArticles,
      featuredArticles,
      mediaTotal: media.length,
      totalDrafts,
      totalContentRecords,
      latestArticles,
      latestPages,
    };
  }, [db]);

  const globalSearchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return [];
    const hits: {
      id: string;
      kind: 'page' | 'article' | 'project' | 'clinic';
      title: string;
      subtitle: string;
      published: boolean;
      route: string;
      onOpen: () => void;
    }[] = [];

    for (const p of db.pages || []) {
      if (
        p.title.ar.toLowerCase().includes(q) ||
        p.title.en.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      ) {
        hits.push({
          id: `g-page-${p.id}`,
          kind: 'page',
          title: p.title[locale] || p.title.en || p.title.ar,
          subtitle: `/${p.slug}`,
          published: p.published,
          route: '/admin/pages',
          onOpen: () => {
            navigate('/admin/pages');
            setEditingPageIsNew(false);
            setEditingPage({ ...p });
            setGlobalQuery('');
          },
        });
      }
    }

    for (const a of db.articles || []) {
      if (
        a.title.ar.toLowerCase().includes(q) ||
        a.title.en.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
      ) {
        hits.push({
          id: `g-art-${a.id}`,
          kind: 'article',
          title: a.title[locale] || a.title.en || a.title.ar,
          subtitle: `/blog/${a.slug}`,
          published: a.published,
          route: '/admin/blog',
          onOpen: () => {
            navigate('/admin/blog');
            setEditingArticleIsNew(false);
            setEditingArticle({ ...a });
            setGlobalQuery('');
          },
        });
      }
    }

    for (const pr of db.projects || []) {
      if (
        pr.title.ar.toLowerCase().includes(q) ||
        pr.title.en.toLowerCase().includes(q) ||
        pr.slug.toLowerCase().includes(q)
      ) {
        hits.push({
          id: `g-proj-${pr.id}`,
          kind: 'project',
          title: pr.title[locale] || pr.title.en || pr.title.ar,
          subtitle: `/projects/${pr.slug}`,
          published: pr.published,
          route: '/admin/projects',
          onOpen: () => {
            navigate('/admin/projects');
            setEditingProject({ ...pr });
            setGlobalQuery('');
          },
        });
      }
    }

    for (const c of db.clinics || []) {
      if (
        c.name.ar.toLowerCase().includes(q) ||
        c.name.en.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
      ) {
        hits.push({
          id: `g-cli-${c.id}`,
          kind: 'clinic',
          title: c.name[locale] || c.name.en || c.name.ar,
          subtitle: `/clinics/${c.slug}`,
          published: c.published,
          route: '/admin/clinics',
          onOpen: () => {
            navigate('/admin/clinics');
            setClinicSubTab('clinics');
            setEditingClinic({ ...c });
            setGlobalQuery('');
          },
        });
      }
    }

    return hits.slice(0, 8);
  }, [globalQuery, db, locale, navigate]);

  // ---------------------------------------------------------------------------
  // RENDER ADMIN AUTHENTICATION GATE IF NOT LOGGED IN (Google + Firebase ID Token)
  // ---------------------------------------------------------------------------
  if (!adminSession) {
    const handleGoogleOwnerLogin = async () => {
      setLoginError(null);
      setLoginLoading(true);
      try {
        await loginAsOwnerAdmin();
      } catch (err: any) {
        setLoginError(err?.message || 'Access denied');
      } finally {
        setLoginLoading(false);
      }
    };

    const handleSavePublicClientConfig = (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError(null);
      const pid = fbConfigForm.projectId.trim();
      const candidate = {
        apiKey: fbConfigForm.apiKey.trim(),
        projectId: pid,
        authDomain: fbConfigForm.authDomain.trim() || (pid ? `${pid}.firebaseapp.com` : ''),
        appId: fbConfigForm.appId.trim(),
        messagingSenderId: fbConfigForm.messagingSenderId.trim(),
        databaseId: fbConfigForm.databaseId.trim() || '(default)',
      };
      saveExternalFirebaseConfig(candidate);
      if (!getSavedFirebaseConfig()) {
        setLoginError(
          locale === 'ar'
            ? 'يرجى التأكد من صحة مفتاح Web API Key (يبدأ بـ AIza) ومعرّف المشروع (Project ID).'
            : 'Please enter a valid Firebase Web API Key (starts with AIza) and Project ID.'
        );
      } else {
        showToast(
          locale === 'ar'
            ? 'تم حفظ إعدادات Firebase العامة وتفعيل زر الدخول عبر Google'
            : 'Public Firebase config saved — Google Sign-In enabled',
          'success'
        );
      }
    };

    return (
      <LayoutResolver>
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070E1A]">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-7 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'تسجيل دخول الإدارة' : 'Admin Sign-In'}
              </h1>
              <button
                onClick={() => navigate(`/${locale}`)}
                className="text-xs text-slate-500 hover:text-[#00C2CB] cursor-pointer"
              >
                {locale === 'ar' ? 'العودة للموقع ←' : '← Back'}
              </button>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/80 text-xs text-red-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{loginError}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={loginLoading || !isFirebaseConnected}
              onClick={handleGoogleOwnerLogin}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 shadow-md cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
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

            {!isFirebaseConnected && (
              <form
                onSubmit={handleSavePublicClientConfig}
                className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/60 space-y-3 text-xs"
              >
                <div className="flex items-start gap-2 text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {locale === 'ar'
                      ? 'أدخل مفتاح الويب العام ومعرّف المشروع لتفعيل زر Google:'
                      : 'Enter your public Web API Key and Project ID to enable Google Sign-In:'}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">
                    {locale === 'ar' ? 'مفتاح الويب العام (VITE_FIREBASE_API_KEY)' : 'Public Web API Key'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AIzaSy..."
                    value={fbConfigForm.apiKey}
                    onChange={(e) =>
                      setFbConfigForm((prev) => ({ ...prev, apiKey: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">
                    {locale === 'ar' ? 'معرّف المشروع (VITE_FIREBASE_PROJECT_ID)' : 'Firebase Project ID'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ahmed0soliman"
                    value={fbConfigForm.projectId}
                    onChange={(e) =>
                      setFbConfigForm((prev) => ({ ...prev, projectId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-3 rounded-lg font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  {locale === 'ar'
                    ? 'حفظ إعدادات Firebase العامة وتفعيل زر Google'
                    : 'Save Public Config & Enable Google Sign-In'}
                </button>
              </form>
            )}
          </div>
        </div>
      </LayoutResolver>
    );
  }

  // ---------------------------------------------------------------------------
  // HELPER HANDLERS FOR CRUD, ORDERING & MEDIA
  // ---------------------------------------------------------------------------
  const handleMoveItemOrder = async (
    collection: 'pages' | 'projects' | 'clinics' | 'doctors' | 'services' | 'articles',
    list: { id: string }[],
    index: number,
    direction: 'up' | 'down'
  ) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const ids = list.map((item) => item.id);
    const temp = ids[index];
    ids[index] = ids[targetIdx];
    ids[targetIdx] = temp;
    await reorderRecords(collection, ids);
  };

  const handleTogglePublished = async (
    collection: 'pages' | 'projects' | 'clinics' | 'doctors' | 'services' | 'articles',
    item: any
  ) => {
    await upsertRecord(collection, {
      ...item,
      published: !item.published,
    });
  };

  const openCompressionPreviewForFile = (
    file: File | undefined,
    onAfterUploaded?: (url: string) => void
  ) => {
    if (!file) return;
    const check = validateRawImageForCompression(file);
    if (!check.valid) {
      showToast(check.errors.join(' '), 'error');
      return;
    }
    setPendingUploadPayload({ file, onAfterUploaded });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    openCompressionPreviewForFile(file);
    e.target.value = '';
  };

  const handleConfirmCompressedUpload = async ({
    result,
    altAr,
    altEn,
    category,
  }: {
    result: CompressedImageResult;
    altAr: string;
    altEn: string;
    category: MediaAsset['category'];
  }) => {
    if (!pendingUploadPayload) return;
    setUploadingMedia(true);
    try {
      const { mediaRecord, uploadedToCloudinary } =
        await uploadCompressedMediaToCloudinary({
          result,
          adminToken: adminSession.token || '',
          altAr,
          altEn,
          category,
          replacingAsset: replacingMediaItem,
        });

      await upsertRecord('media', mediaRecord);
      setMediaAltAr('');
      setMediaAltEn('');
      setReplacingMediaItem(null);

      const savingsBadge =
        result.savingsPercent > 0 ? ` (-${result.savingsPercent}%)` : '';
      showToast(
        locale === 'ar'
          ? `تم ضغط ورفع الصورة${savingsBadge} · ${formatBytes(mediaRecord.bytes)}${
              uploadedToCloudinary ? ' على Cloudinary' : ''
            }`
          : `Compressed & uploaded${savingsBadge} · ${formatBytes(mediaRecord.bytes)}${
              uploadedToCloudinary ? ' to Cloudinary' : ''
            }`,
        'success'
      );

      const cb = pendingUploadPayload.onAfterUploaded;
      setPendingUploadPayload(null);
      if (cb) {
        cb(mediaRecord.secureUrl);
      }
    } catch (err: any) {
      showToast(err?.message || 'Upload failed', 'error');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRequestDeleteMedia = (asset: MediaAsset) => {
    const usage = checkMediaInPublishedContent(asset, db);
    if (usage.inUse) {
      showToast(
        locale === 'ar'
          ? `لا يمكن حذف الصورة لأنها مستخدمة في محتوى منشور: ${usage.usedIn.join('، ')}`
          : `Cannot delete image while used in published content: ${usage.usedIn.join(', ')}`,
        'error'
      );
      return;
    }
    setDeleteConfirm({
      collection: 'media',
      id: asset.id,
      title: asset.alt[locale] || asset.publicId,
    });
  };

  const subRouteLabels: Record<AdminSubRoute, { ar: string; en: string }> = {
    overview: { ar: 'لوحة المعلومات', en: 'Dashboard Overview' },
    pages: { ar: 'إدارة الصفحات', en: 'Pages Management' },
    blog: { ar: 'إدارة المقالات والمدونة', en: 'Articles & Blog' },
    projects: { ar: 'إدارة المشروعات', en: 'Projects Management' },
    clinics: { ar: 'العيادات والأطباء والخدمات', en: 'Clinics, Doctors & Services' },
    media: { ar: 'مكتبة الوسائط والصور', en: 'Media & Image Library' },
    settings: { ar: 'إعدادات الموقع والربط', en: 'Site Settings & Integrations' },
  };

  const openNewPageEditor = (defaultType: 'landing' | 'general' = 'landing') => {
    navigate('/admin/pages');
    setEditingPageIsNew(true);
    setEditingPage({
      id: `page-${Date.now()}`,
      slug: '',
      pageType: defaultType,
      layoutVariant: defaultType === 'landing' ? 'landing-hero' : 'editorial',
      isCore: false,
      title: { ar: '', en: '' },
      kicker: { ar: '', en: '' },
      headline: { ar: '', en: '' },
      subheadline: { ar: '', en: '' },
      biography: { ar: '', en: '' },
      highlights: { ar: [], en: [] },
      metrics: [],
      experienceTimeline: [],
      skills: [],
      blocks: [],
      additionalImages: [],
      heroImage: '/assets/aistudio/logo_ae3842b8.png',
      standaloneByDefault: defaultType === 'landing',
      published: false,
      archived: false,
      order: (db.pages || []).length + 1,
      seo: { title: { ar: '', en: '' }, description: { ar: '', en: '' } },
    });
  };

  const openNewArticleEditor = () => {
    navigate('/admin/blog');
    const defaultCover =
      db.media?.find((m) => m.category === 'blog')?.secureUrl ||
      db.media?.[0]?.secureUrl ||
      '';
    setEditingArticleIsNew(true);
    setEditingArticle({
      id: `art-${Date.now()}`,
      slug: '',
      title: { ar: '', en: '' },
      excerpt: { ar: '', en: '' },
      content: { ar: '', en: '' },
      category: { ar: 'هندسة الأنظمة الطبية', en: 'Healthcare Engineering' },
      tags: ['Soli Medical', 'Healthcare Software'],
      coverImage: defaultCover,
      authorName: { ar: 'أحمد سليمان', en: 'Ahmed Soliman' },
      featured: false,
      published: false,
      archived: false,
      order: db.articles.length + 1,
      seo: { title: { ar: '', en: '' }, description: { ar: '', en: '' } },
    });
  };

  const openNewProjectEditor = () => {
    navigate('/admin/projects');
    setEditingProject({
      id: `proj-${Date.now()}`,
      slug: '',
      title: { ar: '', en: '' },
      kicker: { ar: 'مشروع رقمي', en: 'Digital Project' },
      summary: { ar: '', en: '' },
      description: { ar: '', en: '' },
      category: 'medical-systems',
      categoryLabel: { ar: 'أنظمة طبية', en: 'Medical Systems' },
      coverImage: '/assets/aistudio/logo_ae3842b8.png',
      whatsappInquireText: {
        ar: 'مرحباً، أريد الاستفسار عن هذا المشروع.',
        en: 'Hello, I want to inquire about this project.',
      },
      features: { ar: ['ميزة أساسية 1'], en: ['Core capability 1'] },
      techStack: ['React', 'TypeScript'],
      screens: [],
      featured: true,
      published: false,
      order: db.projects.length + 1,
      seo: { title: { ar: '', en: '' }, description: { ar: '', en: '' } },
    });
  };

  return (
    <LayoutResolver>
      <div className="min-h-screen flex bg-slate-50 dark:bg-[#070E1A] text-slate-900 dark:text-slate-100">
        {/* GROUPED COLLAPSIBLE RESPONSIVE SIDEBAR */}
        <AdminSidebar
          locale={locale}
          setLocale={setLocale}
          theme={theme}
          toggleTheme={toggleTheme}
          subRoute={subRoute}
          activeNavKey={activeNavKey}
          adminUid={adminSession.uid}
          adminName={adminSession.name}
          adminEmail={adminSession.email}
          adminPhotoUrl={adminSession.photoUrl || db.siteSettings.avatarUrl}
          adminRole={adminSession.role}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onSelectLink={(item) => {
            setActiveNavKey(item.id);
            navigate(item.targetPath);
            if (item.anchorId) {
              window.setTimeout(() => {
                const el = document.getElementById(item.anchorId!);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 140);
            }
          }}
          onOpenPublicSite={() => navigate(`/${locale}`)}
          onLogout={logoutAdmin}
          counts={{
            pages: realStats.pagesTotal,
            articles: realStats.articlesTotal,
            projects: realStats.projectsTotal,
            clinics: realStats.clinicsTotal,
            media: realStats.mediaTotal,
            drafts: realStats.totalDrafts,
          }}
        />

        {/* MAIN WORKSPACE VIEWPORT */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Breadcrumb + Global Admin Search + Primary Actions */}
          <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] cursor-pointer shrink-0"
                aria-label={locale === 'ar' ? 'فتح القائمة الجانبية' : 'Open sidebar navigation'}
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                <span className="hidden sm:inline whitespace-nowrap">Admin CMS</span>
                <span className="hidden sm:inline">/</span>
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {subRouteLabels[subRoute][locale]}
                </span>
              </div>
            </div>

            {/* Global Quick Jump Search */}
            <div className="relative flex-1 max-w-sm hidden md:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                type="text"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder={
                  locale === 'ar'
                    ? 'بحث سريع في الصفحات، المقالات، المشروعات...'
                    : 'Quick jump to pages, articles, projects...'
                }
                className="w-full ps-8 pe-8 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#00C2CB]"
              />
              {globalQuery && (
                <button
                  type="button"
                  onClick={() => setGlobalQuery('')}
                  className="absolute top-1/2 -translate-y-1/2 end-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  aria-label="Clear global search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {globalQuery.trim() && (
                <div className="absolute top-full mt-2 start-0 end-0 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-50">
                  {globalSearchResults.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                      {locale === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching records found'}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                      {globalSearchResults.map((hit) => (
                        <button
                          key={hit.id}
                          type="button"
                          onClick={hit.onOpen}
                          className="w-full px-3.5 py-2.5 text-start hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {hit.title}
                            </div>
                            <div className="text-[11px] font-mono-tabular text-slate-500 truncate">
                              {hit.kind} · {hit.subtitle}
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-semibold shrink-0 ${
                              hit.published ? 'text-emerald-500' : 'text-amber-500'
                            }`}
                          >
                            {hit.published
                              ? locale === 'ar'
                                ? 'منشور'
                                : 'Published'
                              : locale === 'ar'
                              ? 'مسودة'
                              : 'Draft'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                title={adminSession.email}
              >
                {adminSession.photoUrl || db.siteSettings.avatarUrl ? (
                  <img
                    src={adminSession.photoUrl || db.siteSettings.avatarUrl}
                    alt={adminSession.name || adminSession.email}
                    className="w-6 h-6 rounded-full object-cover border border-[#00C2CB]/50 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#00C2CB] shrink-0" />
                )}
                <span className="hidden xl:inline text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[140px] truncate">
                  {adminSession.name || adminSession.email}
                </span>
              </div>

              <button
                type="button"
                onClick={() => refreshData()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {locale === 'ar' ? 'تحديث البيانات' : 'Refresh'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/${locale}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {locale === 'ar' ? 'فتح الموقع العام' : 'Public Site'}
                </span>
              </button>
            </div>
          </header>

          {/* Loading & Error Feedback Strip */}
          {loading && (
            <div className="px-6 py-2 bg-[#00C2CB]/10 border-b border-[#00C2CB]/20 text-xs font-medium text-[#0099A3] dark:text-[#00C2CB] flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>
                {locale === 'ar'
                  ? 'جاري مزامنة بيانات المحتوى من قاعدة البيانات...'
                  : 'Synchronizing CMS records with Firestore...'}
              </span>
            </div>
          )}

          {error && (
            <div className="px-6 py-2.5 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => refreshData()}
                className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold shrink-0 cursor-pointer"
              >
                {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          )}

          <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl w-full">
            {/* =============================================================== */}
            {/* TAB 1: OVERVIEW (/admin) — 100% REAL CMS TELEMETRY */}
            {/* =============================================================== */}
            {subRoute === 'overview' && (
              <div className="space-y-8">
                {/* 1. Executive Banner + Quick Creation Shortcuts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-8 rounded-2xl bg-gradient-to-br from-[#0B172A] via-[#0F243D] to-[#113A47] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
                    <div className="space-y-3 max-w-xl">
                      <div className="text-xs font-bold tracking-wide text-[#00C2CB]">
                        {locale === 'ar'
                          ? 'مركز إدارة المحتوى التنفيذي'
                          : 'Executive CMS Workspace'}
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                        {locale === 'ar'
                          ? 'مرحباً بك، أحمد سليمان'
                          : 'Welcome back, Ahmed Soliman'}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {locale === 'ar'
                          ? 'إدارة موحدة للصفحات، المقالات، المشروعات، العيادات المستقلة، مكتبة الصور، وإعدادات SEO الثنائية اللغة.'
                          : 'Unified editorial workspace for pages, bilingual articles, systems portfolio, standalone clinic landing pages, and Cloudinary media.'}
                      </p>

                      {/* Quick Creation Shortcuts */}
                      <div className="pt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={openNewArticleEditor}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <FilePlus2 className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'مقال جديد' : 'New Article'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={openNewProjectEditor}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'مشروع جديد' : 'New Project'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate('/admin/media?view=upload')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'رفع صورة' : 'Upload Image'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmSeedOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-transparent hover:bg-white/10 text-slate-300 border border-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'مزامنة البيانات الأساسية' : 'Sync Baseline'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#00C2CB]/40 shrink-0 bg-slate-950">
                      <OptimizedImage
                        src={db.siteSettings.avatarUrl}
                        alt={db.siteSettings.ownerName[locale]}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>

                  {/* Connection & Quick Shortcuts Card */}
                  <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0099A3] dark:text-[#00C2CB]">
                          {locale === 'ar' ? 'حالة الربط والمزامنة' : 'System Readiness'}
                        </span>
                        <span className="text-[11px] font-mono-tabular text-slate-400">
                          {realStats.totalContentRecords} {locale === 'ar' ? 'سجل' : 'records'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-600 dark:text-slate-400">
                            {locale === 'ar' ? 'قاعدة بيانات Firestore' : 'Firestore Connection'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              isFirebaseConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {isFirebaseConnected
                                ? locale === 'ar'
                                  ? 'متصل'
                                  : 'Connected'
                                : locale === 'ar'
                                ? 'مزامنة محلية'
                                : 'Local Sync'}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-600 dark:text-slate-400">
                            {locale === 'ar' ? 'تخزين Cloudinary' : 'Cloudinary CDN'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              cloudinaryStatus?.configured
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            <Cloud className="w-3.5 h-3.5" />
                            <span>
                              {cloudinaryStatus?.configured
                                ? cloudinaryStatus.cloudName || (locale === 'ar' ? 'جاهز' : 'Configured')
                                : locale === 'ar'
                                ? 'اختياري'
                                : 'Fallback Mode'}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-slate-600 dark:text-slate-400">
                            {locale === 'ar' ? 'العيادات النشطة' : 'Active Clinics'}
                          </span>
                          <span className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                            {realStats.publishedClinics} / {realStats.clinicsTotal}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => navigate('/admin/pages')}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:text-[#00C2CB] text-center cursor-pointer transition-colors"
                      >
                        {locale === 'ar' ? 'إدارة الصفحات' : 'Pages'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/clinics')}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:text-[#00C2CB] text-center cursor-pointer transition-colors"
                      >
                        {locale === 'ar' ? 'إدارة العيادات' : 'Clinics'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. REAL COMPUTED KPI SUMMARY CARDS (4 METRICS FROM LIVE DB) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/projects')}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB] text-start space-y-2.5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{locale === 'ar' ? 'المشروعات المنشورة' : 'Published Projects'}</span>
                      <FolderKanban className="w-4 h-4 text-[#00C2CB]" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono-tabular text-slate-900 dark:text-white">
                        {realStats.publishedProjects}
                      </span>
                      <span className="text-xs font-mono-tabular text-slate-400">
                        / {realStats.projectsTotal}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-[#00C2CB]"
                        style={{
                          width: `${
                            realStats.projectsTotal > 0
                              ? Math.round((realStats.publishedProjects / realStats.projectsTotal) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/admin/blog')}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB] text-start space-y-2.5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{locale === 'ar' ? 'المقالات المنشورة' : 'Published Articles'}</span>
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono-tabular text-slate-900 dark:text-white">
                        {realStats.publishedArticles}
                      </span>
                      <span className="text-xs font-mono-tabular text-slate-400">
                        / {realStats.articlesTotal}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                      {realStats.featuredArticles}{' '}
                      {locale === 'ar' ? 'مقالات مميزة' : 'featured articles'}
                    </div>
                  </button>

                  <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{locale === 'ar' ? 'المسودات غير المنشورة' : 'Total Drafts'}</span>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono-tabular text-slate-900 dark:text-white">
                        {realStats.totalDrafts}
                      </span>
                      <span className="text-xs text-slate-400">
                        {locale === 'ar' ? 'بانتظار النشر' : 'unpublished'}
                      </span>
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {realStats.totalDrafts === 0
                        ? locale === 'ar'
                          ? 'جميع السجلات منشورة'
                          : 'All content records live'
                        : locale === 'ar'
                        ? 'متاح للمراجعة والنشر'
                        : 'Ready for review'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/admin/media')}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB] text-start space-y-2.5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>
                        {locale === 'ar' ? 'الصفحات والعيادات والوسائط' : 'Pages, Clinics & Media'}
                      </span>
                      <ImageIcon className="w-4 h-4 text-sky-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono-tabular text-slate-900 dark:text-white">
                        {realStats.mediaTotal}
                      </span>
                      <span className="text-xs text-slate-400">
                        {locale === 'ar' ? 'صورة مسجلة' : 'media assets'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                      {realStats.pagesTotal} {locale === 'ar' ? 'صفحات' : 'pages'} ·{' '}
                      {realStats.clinicsTotal} {locale === 'ar' ? 'عيادات' : 'clinics'} ·{' '}
                      {realStats.doctorsTotal} {locale === 'ar' ? 'أطباء' : 'doctors'}
                    </div>
                  </button>
                </div>

                {/* 3. SITE OVERVIEW BREAKDOWN (#site-overview) — REAL COLLECTION METRICS */}
                <section
                  id="site-overview"
                  className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-5 scroll-mt-20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {locale === 'ar'
                          ? 'نظرة عامة على بنية المحتوى الفعلية'
                          : 'Live Site Content Distribution'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'إحصاءات مباشرة محسوبة من السجلات الفعلية لكل قسم في المنصة'
                          : 'Exact counts calculated directly from active Firestore / CMS collections'}
                      </p>
                    </div>
                    <span className="text-xs font-mono-tabular font-semibold text-[#0099A3] dark:text-[#00C2CB]">
                      {realStats.totalContentRecords + realStats.mediaTotal}{' '}
                      {locale === 'ar' ? 'إجمالي الأصول والسجلات' : 'Total CMS Objects'}
                    </span>
                  </div>

                  {/* Proportional Stacked Bar */}
                  {realStats.totalContentRecords > 0 && (
                    <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                      {[
                        { count: realStats.projectsTotal, color: 'bg-[#00C2CB]', label: 'Projects' },
                        { count: realStats.clinicsTotal, color: 'bg-teal-500', label: 'Clinics' },
                        { count: realStats.doctorsTotal + realStats.servicesTotal, color: 'bg-sky-500', label: 'Doctors & Services' },
                        { count: realStats.articlesTotal, color: 'bg-emerald-500', label: 'Articles' },
                        { count: realStats.pagesTotal, color: 'bg-indigo-500', label: 'Pages' },
                      ].map((seg) => {
                        const pct = (seg.count / realStats.totalContentRecords) * 100;
                        if (pct <= 0) return null;
                        return (
                          <div
                            key={seg.label}
                            style={{ width: `${pct}%` }}
                            className={`${seg.color} h-full`}
                            title={`${seg.label}: ${seg.count}`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Clean Structured Collections Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-start border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                          <th className="py-2.5 pe-4 font-semibold text-start">
                            {locale === 'ar' ? 'القسم' : 'Collection'}
                          </th>
                          <th className="py-2.5 px-3 font-semibold text-end">
                            {locale === 'ar' ? 'الإجمالي' : 'Total'}
                          </th>
                          <th className="py-2.5 px-3 font-semibold text-end">
                            {locale === 'ar' ? 'منشور' : 'Published'}
                          </th>
                          <th className="py-2.5 px-3 font-semibold text-end">
                            {locale === 'ar' ? 'مسودة' : 'Draft'}
                          </th>
                          <th className="py-2.5 ps-3 font-semibold text-end">
                            {locale === 'ar' ? 'الإدارة' : 'Action'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {[
                          {
                            key: 'pages',
                            label: locale === 'ar' ? 'الصفحات الأساسية والهبوط' : 'Pages',
                            total: realStats.pagesTotal,
                            pub: realStats.publishedPages,
                            color: 'bg-indigo-500',
                            path: '/admin/pages',
                          },
                          {
                            key: 'projects',
                            label: locale === 'ar' ? 'المشروعات والأنظمة' : 'Projects',
                            total: realStats.projectsTotal,
                            pub: realStats.publishedProjects,
                            color: 'bg-[#00C2CB]',
                            path: '/admin/projects',
                          },
                          {
                            key: 'clinics',
                            label: locale === 'ar' ? 'العيادات الطبية' : 'Medical Clinics',
                            total: realStats.clinicsTotal,
                            pub: realStats.publishedClinics,
                            color: 'bg-teal-500',
                            path: '/admin/clinics',
                          },
                          {
                            key: 'doctors',
                            label: locale === 'ar' ? 'الأطباء والاستشاريون' : 'Doctors',
                            total: realStats.doctorsTotal,
                            pub: realStats.publishedDoctors,
                            color: 'bg-sky-500',
                            path: '/admin/clinics',
                          },
                          {
                            key: 'services',
                            label: locale === 'ar' ? 'الخدمات والأسعار' : 'Services & Pricing',
                            total: realStats.servicesTotal,
                            pub: realStats.publishedServices,
                            color: 'bg-sky-400',
                            path: '/admin/clinics',
                          },
                          {
                            key: 'articles',
                            label: locale === 'ar' ? 'المقالات والمدونة' : 'Blog Articles',
                            total: realStats.articlesTotal,
                            pub: realStats.publishedArticles,
                            color: 'bg-emerald-500',
                            path: '/admin/blog',
                          },
                        ].map((row) => (
                          <tr
                            key={row.key}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 pe-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-xs ${row.color} shrink-0`} />
                              <span>{row.label}</span>
                            </td>
                            <td className="py-2.5 px-3 text-end font-mono-tabular font-semibold">
                              {row.total}
                            </td>
                            <td className="py-2.5 px-3 text-end font-mono-tabular text-emerald-600 dark:text-emerald-400 font-semibold">
                              {row.pub}
                            </td>
                            <td className="py-2.5 px-3 text-end font-mono-tabular text-amber-600 dark:text-amber-400">
                              {row.total - row.pub}
                            </td>
                            <td className="py-2.5 ps-3 text-end">
                              <button
                                type="button"
                                onClick={() => navigate(row.path)}
                                className="text-[#0099A3] dark:text-[#00C2CB] font-semibold hover:underline cursor-pointer whitespace-nowrap"
                              >
                                {locale === 'ar' ? 'فتح ←' : 'Open →'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 4. LAST MODIFIED ARTICLES & LAST MODIFIED PAGES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Last Modified Articles */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        {locale === 'ar' ? 'آخر المقالات المعدّلة' : 'Last Modified Articles'}
                      </h2>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/blog')}
                        className="text-xs font-semibold text-[#0099A3] dark:text-[#00C2CB] hover:underline cursor-pointer"
                      >
                        {locale === 'ar' ? 'عرض الكل' : 'View All'}
                      </button>
                    </div>

                    {realStats.latestArticles.length === 0 ? (
                      <div className="py-8 text-center space-y-3">
                        <p className="text-xs text-slate-500">
                          {locale === 'ar' ? 'لا توجد مقالات مسجلة حتى الآن.' : 'No articles yet.'}
                        </p>
                        <button
                          type="button"
                          onClick={openNewArticleEditor}
                          className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950 cursor-pointer"
                        >
                          {locale === 'ar' ? '+ كتابة أول مقال' : '+ Write First Article'}
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {realStats.latestArticles.map((art) => (
                          <div
                            key={art.id}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {art.title[locale] || art.title.en || art.title.ar}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="font-mono-tabular text-[#0099A3] dark:text-[#00C2CB]">
                                  /blog/{art.slug}
                                </span>
                                <span>·</span>
                                <span className="font-mono-tabular">
                                  {formatAdminDate(art.updatedAt || art.createdAt, locale)}
                                </span>
                                <span>·</span>
                                <span
                                  className={
                                    art.published
                                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                      : 'text-amber-600 dark:text-amber-400 font-semibold'
                                  }
                                >
                                  {art.published
                                    ? locale === 'ar'
                                      ? 'منشور'
                                      : 'Published'
                                    : locale === 'ar'
                                    ? 'مسودة'
                                    : 'Draft'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  navigate('/admin/blog');
                                  setEditingArticleIsNew(false);
                                  setEditingArticle({ ...art });
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#00C2CB] hover:text-slate-950 transition-colors cursor-pointer"
                              >
                                {locale === 'ar' ? 'تعديل' : 'Edit'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Last Modified Pages */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        {locale === 'ar' ? 'آخر الصفحات المعدّلة' : 'Last Modified Pages'}
                      </h2>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/pages')}
                        className="text-xs font-semibold text-[#0099A3] dark:text-[#00C2CB] hover:underline cursor-pointer"
                      >
                        {locale === 'ar' ? 'عرض الكل' : 'View All'}
                      </button>
                    </div>

                    {realStats.latestPages.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        {locale === 'ar' ? 'لا توجد صفحات مسجلة حالياً.' : 'No pages configured.'}
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {realStats.latestPages.map((page) => (
                          <div
                            key={page.id}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {page.title[locale] || page.title.en || page.title.ar}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="font-mono-tabular text-[#0099A3] dark:text-[#00C2CB]">
                                  /{page.slug}
                                </span>
                                <span>·</span>
                                <span className="font-mono-tabular">
                                  {formatAdminDate(page.updatedAt || page.createdAt, locale)}
                                </span>
                                <span>·</span>
                                <span
                                  className={
                                    page.published
                                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                      : 'text-amber-600 dark:text-amber-400 font-semibold'
                                  }
                                >
                                  {page.published
                                    ? locale === 'ar'
                                      ? 'منشور'
                                      : 'Published'
                                    : locale === 'ar'
                                    ? 'مسودة'
                                    : 'Draft'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  navigate('/admin/pages');
                                  setEditingPageIsNew(false);
                                  setEditingPage({ ...page });
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#00C2CB] hover:text-slate-950 transition-colors cursor-pointer"
                              >
                                {locale === 'ar' ? 'تعديل' : 'Edit'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Functional Testing (PROMPT 5.1) & Security Audit (PROMPT 5.2) Report Center */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#00C2CB]">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {locale === 'ar'
                            ? 'تقرير الاختبار الوظيفي (PROMPT 5.1) والمراجعة الأمنية (PROMPT 5.2)'
                            : 'Live Functional Testing (PROMPT 5.1) & Security Audit (PROMPT 5.2)'}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                        {auditReport
                          ? locale === 'ar'
                            ? `الحالة العامة: ${
                                auditReport.overallStatus === 'PASSED'
                                  ? 'اجتاز جميع الاختبارات بنجاح (0 ثغرات حرجة)'
                                  : 'يتطلب مراجعة'
                              }`
                            : `Overall Status: ${auditReport.overallStatus} (0 Critical Vulnerabilities)`
                          : locale === 'ar'
                          ? 'جاري تشغيل الفحص الحي...'
                          : 'Running live verification suite...'}
                      </h2>
                    </div>

                    <button
                      onClick={runLiveAudit}
                      disabled={runningAudit}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${runningAudit ? 'animate-spin' : ''}`} />
                      <span>
                        {locale === 'ar' ? 'إعادة تشغيل الاختبارات الحية' : 'Re-run Live Audit'}
                      </span>
                    </button>
                  </div>

                  {auditReport && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Column 1: Functional Tests (PROMPT 5.1) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <span>
                            {locale === 'ar'
                              ? '1. نتائج الاختبار الوظيفي (Functional Testing)'
                              : '1. Functional Testing Results'}
                          </span>
                          <span className="font-mono-tabular text-emerald-500">
                            {auditReport.summary.functionalPassed}/
                            {auditReport.summary.functionalTotal} PASSED
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {auditReport.functionalTests.map((ft) => (
                            <div
                              key={ft.id}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  [{ft.id}] {ft.title[locale]}
                                </span>
                                <span
                                  className={`font-mono-tabular font-bold shrink-0 ${
                                    ft.passed ? 'text-emerald-500' : 'text-red-500'
                                  }`}
                                >
                                  {ft.passed ? 'PASS' : 'FAIL'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                {ft.details[locale]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: Security Audit (PROMPT 5.2) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <span>
                            {locale === 'ar'
                              ? '2. نتائج المراجعة الأمنية (Security Audit)'
                              : '2. Security Audit Findings'}
                          </span>
                          <span className="font-mono-tabular text-emerald-500">
                            {auditReport.summary.securityPassed}/{auditReport.summary.securityTotal}{' '}
                            SECURE
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {auditReport.securityAuditItems.map((sec) => (
                            <div
                              key={sec.id}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  [{sec.id}] {sec.area}
                                </span>
                                <span
                                  className={`font-mono-tabular font-bold shrink-0 ${
                                    sec.status === 'SECURE' ? 'text-emerald-500' : 'text-red-500'
                                  }`}
                                >
                                  {sec.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                {sec.finding[locale]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 2: PAGES MANAGEMENT (/admin/pages) — COMPLETE CMS CRUD */}
            {/* =============================================================== */}
            {subRoute === 'pages' && (() => {
              const allPages = db.pages || [];
              const archivedCount = allPages.filter((p) => p.archived).length;

              const filteredPages = [...allPages]
                .filter((page) => {
                  if (statusFilter === 'trash') {
                    if (!page.archived) return false;
                  } else {
                    if (page.archived) return false;
                    if (statusFilter === 'published' && !page.published) return false;
                    if (statusFilter === 'draft' && page.published) return false;
                  }
                  if (!searchFilter.trim()) return true;
                  const q = searchFilter.toLowerCase();
                  return (
                    page.title.ar.toLowerCase().includes(q) ||
                    page.title.en.toLowerCase().includes(q) ||
                    page.slug.toLowerCase().includes(q) ||
                    page.headline.ar.toLowerCase().includes(q) ||
                    page.headline.en.toLowerCase().includes(q)
                  );
                })
                .sort((a, b) => {
                  if (sortBy === 'updatedAt') {
                    return getTimestampValue(b.updatedAt) - getTimestampValue(a.updatedAt);
                  }
                  if (sortBy === 'createdAt') {
                    return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt);
                  }
                  if (sortBy === 'title') {
                    return (a.title[locale] || '').localeCompare(b.title[locale] || '');
                  }
                  return (a.order ?? 0) - (b.order ?? 0);
                });

              const paginatedPages = filteredPages.slice(
                (currentPage - 1) * PAGE_SIZE,
                currentPage * PAGE_SIZE
              );

              const handleRequestPermanentPageDelete = (page: PageConfig) => {
                if (isCoreProtectedPage(page)) {
                  showToast(
                    locale === 'ar'
                      ? 'لا يمكن حذف الصفحات الأساسية المحمية من المنصة نهائياً.'
                      : 'Core protected system pages cannot be permanently deleted.',
                    'error'
                  );
                  return;
                }
                const refs = checkPageInSiteReferences(page, db);
                if (refs.inUse) {
                  showToast(
                    locale === 'ar'
                      ? `لا يمكن الحذف النهائي: هذه الصفحة مرتبطة داخل محتوى آخر (${refs.usedIn.join('، ')}).`
                      : `Cannot permanently delete: page is referenced in (${refs.usedIn.join(', ')}).`,
                    'error'
                  );
                  return;
                }
                const expectedName = page.title[locale] || page.title.en || page.title.ar;
                setDeleteConfirmLiteralInput('');
                setDeleteConfirm({
                  collection: 'pages',
                  id: page.id,
                  title: `${page.title.ar} — ${page.title.en}`,
                  requireLiteralConfirm: true,
                  expectedLiteralName: expectedName,
                });
              };

              return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        {locale === 'ar'
                          ? 'إدارة الصفحات وصفحات الهبوط'
                          : 'Pages & Landing Pages Management'}
                      </h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'إنشاء صفحات هبوط (/landing/slug) وصفحات محتوى (/p/slug) وإدارة الصفحات الأساسية وإعدادات SEO والمعاينة الحية.'
                          : 'Create landing (/landing/slug) and content (/p/slug) pages, manage core pages, SEO, standalone mode, and live preview.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openNewPageEditor('general')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-[#00C2CB] cursor-pointer"
                      >
                        <FilePlus2 className="w-3.5 h-3.5 text-[#00C2CB]" />
                        <span>{locale === 'ar' ? '+ صفحة عامة' : '+ General Page'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openNewPageEditor('landing')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{locale === 'ar' ? '+ صفحة هبوط جديدة' : '+ New Landing Page'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Visitor Header Navigation Isolation Control Bar */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {locale === 'ar'
                            ? 'عزل الصفحات وإخفاء قائمة الهيدر العلوي للزوار'
                            : 'Isolate Shared Pages & Hide Top Visitor Header Navigation'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            db.siteSettings?.hideVisitorHeaderNav !== false
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {db.siteSettings?.hideVisitorHeaderNav !== false
                            ? locale === 'ar'
                              ? 'مفعّل — قائمة الهيدر مخفية للزوار'
                              : 'Active — Visitor Nav Hidden'
                            : locale === 'ar'
                            ? 'غير مفعّل — قائمة الهيدر ظاهرة للزوار'
                            : 'Inactive — Visitor Nav Visible'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'عند التفعيل، لا تظهر روابط التنقل العلوية (الرئيسية، من أنا، المشروعات، العيادات، المقالات) لأي زائر عند مشاركة رابط العيادات أو المقالات أو أي صفحة مستقلة.'
                          : 'When enabled, visitors opening shared links (Clinics, Articles, Soli Medical, etc.) will not see top header links to other pages.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const nextVal = !(db.siteSettings?.hideVisitorHeaderNav !== false);
                        const nextSettings = {
                          ...db.siteSettings,
                          hideVisitorHeaderNav: nextVal,
                        };
                        setSettingsForm(nextSettings);
                        await saveSiteSettings(nextSettings);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shrink-0 cursor-pointer transition-colors ${
                        db.siteSettings?.hideVisitorHeaderNav !== false
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                          : 'bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3]'
                      }`}
                    >
                      {db.siteSettings?.hideVisitorHeaderNav !== false ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {locale === 'ar'
                              ? 'إظهار قائمة الهيدر للزوار'
                              : 'Show Header Nav to Visitors'}
                          </span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>
                            {locale === 'ar'
                              ? 'إخفاء قائمة الهيدر عن الزوار'
                              : 'Hide Header Nav from Visitors'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Unified Search, Status Filter (inc. Trash) & Sort Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder={locale === 'ar' ? 'بحث في الصفحات...' : 'Search pages...'}
                        className="w-full ps-9 pe-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0F172A] border border-slate-300/60 dark:border-slate-800 overflow-x-auto">
                        {(
                          [
                            { id: 'all', label: { ar: 'الكل', en: 'All' } },
                            { id: 'published', label: { ar: 'المنشورة', en: 'Published' } },
                            { id: 'draft', label: { ar: 'المسودات', en: 'Draft' } },
                            {
                              id: 'trash',
                              label: {
                                ar: `الأرشيف (${archivedCount})`,
                                en: `Trash (${archivedCount})`,
                              },
                            },
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setStatusFilter(st.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                              statusFilter === st.id
                                ? 'bg-[#00C2CB] text-slate-950'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {st.label[locale]}
                          </button>
                        ))}
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as AdminSortOption)}
                          className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                          aria-label={locale === 'ar' ? 'ترتيب الصفحات' : 'Sort pages'}
                        >
                          <option value="order" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'ترتيب العرض' : 'Display Order'}
                          </option>
                          <option value="updatedAt" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'الأحدث تعديلاً' : 'Recently Updated'}
                          </option>
                          <option value="createdAt" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'الأحدث إنشاءً' : 'Recently Created'}
                          </option>
                          <option value="title" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'الاسم أبجدياً' : 'Title A–Z'}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {filteredPages.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-3">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {statusFilter === 'trash'
                          ? locale === 'ar'
                            ? 'سلة المحذوفات / الأرشيف فارغة حالياً'
                            : 'Archive / Trash is currently empty'
                          : locale === 'ar'
                          ? 'لا توجد صفحات مطابقة لمعايير البحث الحالية'
                          : 'No pages match your current filter criteria'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchFilter('');
                          setStatusFilter('all');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 cursor-pointer"
                      >
                        {locale === 'ar' ? 'إعادة تعيين البحث' : 'Reset Filters'}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-[#0B1222] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                              <th className="py-3.5 px-4 font-semibold text-start">
                                {locale === 'ar' ? 'الصفحة (عربي / إنجليزي)' : 'Page Title (AR / EN)'}
                              </th>
                              <th className="py-3.5 px-3 font-semibold text-start">
                                {locale === 'ar' ? 'الرابط (Slug & URL)' : 'Slug & Canonical URL'}
                              </th>
                              <th className="py-3.5 px-3 font-semibold text-start">
                                {locale === 'ar' ? 'النوع' : 'Type'}
                              </th>
                              <th className="py-3.5 px-3 font-semibold text-start">
                                {locale === 'ar' ? 'الحالة' : 'Status'}
                              </th>
                              <th className="py-3.5 px-3 font-semibold text-start">
                                {locale === 'ar' ? 'آخر تعديل' : 'Last Modified'}
                              </th>
                              <th className="py-3.5 px-4 font-semibold text-end">
                                {locale === 'ar' ? 'الإجراءات' : 'Actions'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {paginatedPages.map((page) => {
                              const isCore = isCoreProtectedPage(page);
                              const pageUrl = getPageCanonicalPath(page, locale);
                              const typeBadge = isCore
                                ? locale === 'ar'
                                  ? 'أساسية'
                                  : 'Core'
                                : page.pageType === 'landing'
                                ? locale === 'ar'
                                  ? 'هبوط'
                                  : 'Landing'
                                : locale === 'ar'
                                ? 'عامة'
                                : 'General';

                              return (
                                <tr
                                  key={page.id}
                                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/35 transition-colors"
                                >
                                  <td className="py-4 px-4 align-top max-w-xs">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                                          {page.title.ar}
                                        </span>
                                        {isCore && (
                                          <span
                                            title={
                                              locale === 'ar'
                                                ? 'صفحة أساسية محمية من الحذف النهائي'
                                                : 'Core protected page'
                                            }
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500 text-[10px] font-bold"
                                          >
                                            <Lock className="w-2.5 h-2.5" />
                                            <span>{locale === 'ar' ? 'محمية' : 'Core'}</span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        {page.title.en}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-4 px-3 align-top">
                                    <div className="space-y-1">
                                      <div className="font-mono-tabular text-[#0099A3] dark:text-[#00C2CB] font-semibold">
                                        {pageUrl}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const full = `${window.location.origin}${pageUrl}`;
                                            navigator.clipboard?.writeText(full);
                                            showToast(
                                              locale === 'ar' ? 'تم نسخ الرابط' : 'URL copied',
                                              'info'
                                            );
                                          }}
                                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#00C2CB] cursor-pointer"
                                        >
                                          <Copy className="w-3 h-3" />
                                          <span>{locale === 'ar' ? 'نسخ' : 'Copy'}</span>
                                        </button>
                                        <a
                                          href={pageUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#00C2CB]"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          <span>{locale === 'ar' ? 'فتح' : 'Open'}</span>
                                        </a>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-4 px-3 align-top whitespace-nowrap">
                                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                                      {typeBadge}
                                    </span>
                                  </td>

                                  <td className="py-4 px-3 align-top whitespace-nowrap">
                                    <div className="flex flex-col items-start gap-1">
                                      <span
                                        className={`font-bold ${
                                          page.archived
                                            ? 'text-red-500'
                                            : page.published
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-amber-600 dark:text-amber-400'
                                        }`}
                                      >
                                        {page.archived
                                          ? locale === 'ar'
                                            ? 'مؤرشف'
                                            : 'Archived'
                                          : page.published
                                          ? locale === 'ar'
                                            ? 'منشور'
                                            : 'Published'
                                          : locale === 'ar'
                                          ? 'مسودة'
                                          : 'Draft'}
                                      </span>
                                      {page.standaloneByDefault && (
                                        <span className="text-[10px] font-semibold text-[#0099A3] dark:text-[#00C2CB]">
                                          Standalone
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="py-4 px-3 align-top whitespace-nowrap font-mono-tabular text-slate-500 dark:text-slate-400">
                                    {formatAdminDate(page.updatedAt || page.createdAt, locale)}
                                  </td>

                                  <td className="py-4 px-4 align-top">
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                      {!page.archived ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleTogglePublished('pages', page)}
                                            className={`px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                              page.published
                                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                            }`}
                                            title={page.published ? 'Hide Page' : 'Publish Page'}
                                          >
                                            {page.published ? (
                                              <>
                                                <EyeOff className="w-3.5 h-3.5" />
                                                <span>{locale === 'ar' ? 'إخفاء' : 'Hide'}</span>
                                              </>
                                            ) : (
                                              <>
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>{locale === 'ar' ? 'نشر' : 'Publish'}</span>
                                              </>
                                            )}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingPageIsNew(false);
                                              setEditingPage({ ...page });
                                            }}
                                            className="px-3 py-1.5 rounded-lg font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] inline-flex items-center gap-1 cursor-pointer"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            <span>{locale === 'ar' ? 'تحرير' : 'Edit'}</span>
                                          </button>

                                          {!isCore ? (
                                            <button
                                              type="button"
                                              onClick={() => setPageTrashConfirm(page)}
                                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                                              title={
                                                locale === 'ar'
                                                  ? 'نقل إلى سلة المحذوفات'
                                                  : 'Move to Trash'
                                              }
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          ) : (
                                            <span
                                              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                              title={
                                                locale === 'ar'
                                                  ? 'الصفحات الأساسية محمية من الحذف النهائي'
                                                  : 'Core pages cannot be deleted'
                                              }
                                            >
                                              <Lock className="w-3.5 h-3.5" />
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              upsertRecord('pages', {
                                                ...page,
                                                archived: false,
                                                archivedAt: undefined,
                                                published: false,
                                              })
                                            }
                                            className="px-3 py-1.5 rounded-lg font-bold bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 inline-flex items-center gap-1 cursor-pointer"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>{locale === 'ar' ? 'استعادة' : 'Restore'}</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleRequestPermanentPageDelete(page)}
                                            className="px-3 py-1.5 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>
                                              {locale === 'ar' ? 'حذف نهائي' : 'Delete Forever'}
                                            </span>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <AdminPagination
                    locale={locale}
                    totalItems={filteredPages.length}
                    pageSize={PAGE_SIZE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              );
            })()}

            {/* =============================================================== */}
            {/* TAB 3: PROJECTS MANAGEMENT (/admin/projects) */}
            {/* =============================================================== */}
            {subRoute === 'projects' && (() => {
              const filteredProjects = [...(db.projects || [])]
                .filter((p) => {
                  if (statusFilter === 'published' && !p.published) return false;
                  if (statusFilter === 'draft' && p.published) return false;
                  if (!searchFilter.trim()) return true;
                  const q = searchFilter.toLowerCase();
                  return (
                    p.title.ar.toLowerCase().includes(q) ||
                    p.title.en.toLowerCase().includes(q) ||
                    p.slug.toLowerCase().includes(q)
                  );
                })
                .sort((a, b) => {
                  if (sortBy === 'updatedAt') {
                    return getTimestampValue(b.updatedAt) - getTimestampValue(a.updatedAt);
                  }
                  if (sortBy === 'createdAt') {
                    return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt);
                  }
                  if (sortBy === 'title') {
                    return (a.title[locale] || '').localeCompare(b.title[locale] || '');
                  }
                  return (a.order ?? 0) - (b.order ?? 0);
                });

              const paginatedProjects = filteredProjects.slice(
                (currentPage - 1) * PAGE_SIZE,
                currentPage * PAGE_SIZE
              );

              return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        {locale === 'ar' ? 'إدارة المشروعات والأنظمة' : 'Manage Projects & Systems'}
                      </h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'إضافة، تعديل، ترتيب، مسودة/نشر، وإدارة الروابط (Slugs) وصور الغلاف.'
                          : 'Create, edit, reorder, toggle Draft/Published, and manage slugs & covers.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openNewProjectEditor}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{locale === 'ar' ? 'إضافة مشروع جديد' : 'Add New Project'}</span>
                    </button>
                  </div>

                  {/* Search, Status Filter & Sort Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder={locale === 'ar' ? 'بحث في المشروعات...' : 'Search projects...'}
                        className="w-full ps-9 pe-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0F172A] border border-slate-300/60 dark:border-slate-800">
                        {(
                          [
                            { id: 'all', label: { ar: 'الكل', en: 'All' } },
                            { id: 'published', label: { ar: 'المنشورة', en: 'Published' } },
                            { id: 'draft', label: { ar: 'المسودات', en: 'Draft' } },
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setStatusFilter(st.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                              statusFilter === st.id
                                ? 'bg-[#00C2CB] text-slate-950'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {st.label[locale]}
                          </button>
                        ))}
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as AdminSortOption)}
                          className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="order" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'ترتيب العرض' : 'Display Order'}
                          </option>
                          <option value="updatedAt" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'الأحدث تعديلاً' : 'Recently Updated'}
                          </option>
                          <option value="createdAt" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'الأحدث إنشاءً' : 'Recently Created'}
                          </option>
                          <option value="title" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'الاسم أبجدياً' : 'Title A–Z'}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {filteredProjects.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-3">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {locale === 'ar'
                          ? 'لا توجد مشروعات مطابقة للبحث أو التصفية'
                          : 'No projects match your search or filter'}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchFilter('');
                            setStatusFilter('all');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 cursor-pointer"
                        >
                          {locale === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
                        </button>
                        <button
                          type="button"
                          onClick={openNewProjectEditor}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 cursor-pointer"
                        >
                          {locale === 'ar' ? '+ إضافة مشروع' : '+ New Project'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginatedProjects.map((proj, idx, arr) => (
                        <div
                          key={proj.id}
                          className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#070E1A] border border-slate-700 p-1.5 shrink-0">
                              <OptimizedImage
                                src={proj.coverImage}
                                alt={proj.title[locale]}
                                containerClassName="w-full h-full"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-mono-tabular text-slate-400">#{proj.order}</span>
                                <span>·</span>
                                <span className="font-mono-tabular text-[#0099A3] dark:text-[#00C2CB]">
                                  /projects/{proj.slug}
                                </span>
                                <span>·</span>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublished('projects', proj)}
                                  className={`font-semibold underline cursor-pointer ${
                                    proj.published
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-amber-600 dark:text-amber-400'
                                  }`}
                                >
                                  {proj.published
                                    ? locale === 'ar'
                                      ? 'منشور'
                                      : 'Published'
                                    : locale === 'ar'
                                    ? 'مسودة'
                                    : 'Draft'}
                                </button>
                                <span>·</span>
                                <span className="font-mono-tabular text-slate-400">
                                  {formatAdminDate(proj.updatedAt || proj.createdAt, locale)}
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {proj.title.ar} / {proj.title.en}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                {proj.summary[locale]}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveItemOrder('projects', arr, idx, 'up')}
                              disabled={idx === 0 || sortBy !== 'order'}
                              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveItemOrder('projects', arr, idx, 'down')}
                              disabled={idx === arr.length - 1 || sortBy !== 'order'}
                              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePublished('projects', proj)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                                proj.published
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              }`}
                            >
                              {proj.published ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>{locale === 'ar' ? 'إخفاء' : 'Hide'}</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{locale === 'ar' ? 'إظهار' : 'Show'}</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewItem({
                                  type: 'Project',
                                  title: proj.title[locale],
                                  subtitle: proj.summary[locale],
                                  body: proj.description[locale],
                                  image: proj.coverImage,
                                  published: proj.published,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] cursor-pointer"
                            >
                              {locale === 'ar' ? 'معاينة' : 'Preview'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProject({ ...proj })}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950 cursor-pointer"
                            >
                              {locale === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirm({
                                  collection: 'projects',
                                  id: proj.id,
                                  title: proj.title[locale],
                                })
                              }
                              className="p-2 rounded-lg text-red-500 hover:bg-red-950/30 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <AdminPagination
                    locale={locale}
                    totalItems={filteredProjects.length}
                    pageSize={PAGE_SIZE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              );
            })()}

            {/* =============================================================== */}
            {/* TAB 4: CLINICS, DOCTORS & SERVICES (/admin/clinics) */}
            {/* =============================================================== */}
            {subRoute === 'clinics' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'إدارة صفحات العيادات والأطباء والخدمات والأسعار'
                        : 'Manage Clinics, Doctors & Services Pricing'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'تحكم في صفحات الهبوط الطبية المستقلة، الأطباء، وقائمة الخدمات والأسعار.'
                        : 'Manage medical landing pages, physicians, and published fee schedules.'}
                    </p>
                  </div>

                  {/* Sub-Navigation between Clinics, Doctors, Services */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0F172A] border border-slate-300/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setClinicSubTab('clinics')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        clinicSubTab === 'clinics'
                          ? 'bg-[#00C2CB] text-slate-950'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {locale === 'ar' ? 'العيادات' : 'Clinics'} ({db.clinics.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClinicSubTab('doctors')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        clinicSubTab === 'doctors'
                          ? 'bg-[#00C2CB] text-slate-950'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {locale === 'ar' ? 'الأطباء' : 'Doctors'} ({db.doctors.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClinicSubTab('services')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        clinicSubTab === 'services'
                          ? 'bg-[#00C2CB] text-slate-950'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {locale === 'ar' ? 'الخدمات والأسعار' : 'Services & Prices'} (
                      {db.services.length})
                    </button>
                  </div>
                </div>

                {/* Unified Search & Status Filter for Clinics Section */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder={
                        locale === 'ar' ? 'بحث في العيادات والأطباء والخدمات...' : 'Search clinics, doctors, services...'
                      }
                      className="w-full ps-9 pe-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0F172A] border border-slate-300/60 dark:border-slate-800">
                    {(
                      [
                        { id: 'all', label: { ar: 'الكل', en: 'All' } },
                        { id: 'published', label: { ar: 'المنشورة', en: 'Published' } },
                        { id: 'draft', label: { ar: 'المسودات', en: 'Draft' } },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatusFilter(st.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          statusFilter === st.id
                            ? 'bg-[#00C2CB] text-slate-950'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {st.label[locale]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SUB-TAB A: CLINICS */}
                {clinicSubTab === 'clinics' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingClinic({
                            id: `clinic-${Date.now()}`,
                            slug: '',
                            name: { ar: '', en: '' },
                            specialtyBadge: { ar: 'عيادة تخصصية', en: 'Specialized Clinic' },
                            tagline: { ar: '', en: '' },
                            description: { ar: '', en: '' },
                            coverImage: '/assets/aistudio/logo_ae3842b8.png',
                            logoUrl: '/assets/aistudio/logo_ae3842b8.png',
                            phone: '',
                            whatsapp: 'https://wa.me/Ahmed0soliman',
                            address: { ar: 'القاهرة، مصر', en: 'Cairo, Egypt' },
                            city: { ar: 'القاهرة', en: 'Cairo' },
                            workingHours: [
                              {
                                days: { ar: 'السبت – الخميس', en: 'Saturday – Thursday' },
                                hours: { ar: '10:00 ص – 09:00 م', en: '10:00 AM – 09:00 PM' },
                                isOpen: true,
                              },
                            ],
                            highlights: {
                              ar: ['حجز فوري عبر واتساب'],
                              en: ['Instant WhatsApp Booking'],
                            },
                            standaloneByDefault: false,
                            published: false,
                            order: db.clinics.length + 1,
                            seo: { title: { ar: '', en: '' }, description: { ar: '', en: '' } },
                          })
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'إضافة عيادة جديدة' : 'Add New Clinic'}</span>
                      </button>
                    </div>

                    {db.clinics
                      .filter((c) => {
                        if (statusFilter === 'published' && !c.published) return false;
                        if (statusFilter === 'draft' && c.published) return false;
                        if (!searchFilter.trim()) return true;
                        const q = searchFilter.toLowerCase();
                        return (
                          c.name.ar.toLowerCase().includes(q) ||
                          c.name.en.toLowerCase().includes(q) ||
                          c.slug.toLowerCase().includes(q)
                        );
                      })
                      .map((clinic) => (
                      <div
                        key={clinic.id}
                        className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono-tabular text-[#00C2CB]">
                              /clinics/{clinic.slug}
                            </span>
                            <span>·</span>
                            <button
                              onClick={() => handleTogglePublished('clinics', clinic)}
                              className={`font-semibold underline ${
                                clinic.published ? 'text-emerald-500' : 'text-amber-500'
                              }`}
                            >
                              {clinic.published
                                ? locale === 'ar'
                                  ? 'منشور'
                                  : 'Published'
                                : locale === 'ar'
                                ? 'مسودة'
                                : 'Draft'}
                            </button>
                            <span>·</span>
                            <span className="text-slate-400">
                              {clinic.standaloneByDefault
                                ? locale === 'ar'
                                  ? 'عرض مستقل افتراضي'
                                  : 'Standalone by Default'
                                : locale === 'ar'
                                ? 'عرض عام + رابط مستقل'
                                : 'Public + Standalone URL'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {clinic.name.ar} — {clinic.name.en}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {clinic.tagline[locale]}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTogglePublished('clinics', clinic)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              clinic.published
                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                            }`}
                          >
                            {clinic.published ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'إخفاء' : 'Hide'}</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'إظهار' : 'Show'}</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/${locale}/clinics/${clinic.slug}?standalone=1`)
                            }
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB]"
                          >
                            {locale === 'ar' ? 'معاينة العرض المستقل' : 'Preview Standalone'}
                          </button>
                          <button
                            onClick={() => setEditingClinic({ ...clinic })}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950"
                          >
                            {locale === 'ar' ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                collection: 'clinics',
                                id: clinic.id,
                                title: clinic.name[locale],
                              })
                            }
                            className="p-2 rounded-lg text-red-500 hover:bg-red-950/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SUB-TAB B: DOCTORS */}
                {clinicSubTab === 'doctors' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          setEditingDoctor({
                            id: `doc-${Date.now()}`,
                            clinicId: db.clinics[0]?.id || '',
                            name: { ar: '', en: '' },
                            title: { ar: 'أخصائي / استشاري', en: 'Specialist / Consultant' },
                            specialty: { ar: '', en: '' },
                            bio: { ar: '', en: '' },
                            photoUrl: '/assets/aistudio/logo_ae3842b8.png',
                            qualifications: { ar: ['ماجستير / دكتوراه'], en: ['M.Sc. / MD'] },
                            scheduleSummary: {
                              ar: 'السبت – الأربعاء (05:00 م – 09:00 م)',
                              en: 'Sat – Wed (05:00 PM – 09:00 PM)',
                            },
                            consultationFee: 250,
                            currency: 'EGP',
                            published: true,
                            order: db.doctors.length + 1,
                          })
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'إضافة طبيب جديد' : 'Add Doctor'}</span>
                      </button>
                    </div>

                    {db.doctors.map((doc) => {
                      const parentClinic = db.clinics.find((c) => c.id === doc.clinicId);
                      return (
                        <div
                          key={doc.id}
                          className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="text-[#00C2CB] font-semibold">
                                {parentClinic?.name[locale] || doc.clinicId}
                              </span>
                              <span>·</span>
                              <span className="font-mono-tabular">
                                {doc.consultationFee} {doc.currency}
                              </span>
                              <span>·</span>
                              <button
                                onClick={() => handleTogglePublished('doctors', doc)}
                                className={
                                  doc.published
                                    ? 'text-emerald-500 font-semibold'
                                    : 'text-amber-500'
                                }
                              >
                                {doc.published ? 'Published' : 'Draft'}
                              </button>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {doc.name.ar} — {doc.name.en}
                            </h3>
                            <p className="text-xs text-slate-500">{doc.specialty[locale]}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingDoctor({ ...doc })}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950"
                            >
                              {locale === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  collection: 'doctors',
                                  id: doc.id,
                                  title: doc.name[locale],
                                })
                              }
                              className="p-2 rounded-lg text-red-500 hover:bg-red-950/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SUB-TAB C: SERVICES & PRICING */}
                {clinicSubTab === 'services' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          setEditingService({
                            id: `srv-${Date.now()}`,
                            clinicId: db.clinics[0]?.id || '',
                            name: { ar: '', en: '' },
                            category: { ar: 'الكشف والتشخيص', en: 'Consultation & Diagnostics' },
                            description: { ar: '', en: '' },
                            price: 250,
                            currency: 'EGP',
                            durationMinutes: 25,
                            popular: false,
                            published: true,
                            order: db.services.length + 1,
                          })
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'إضافة خدمة وسعر' : 'Add Service & Price'}</span>
                      </button>
                    </div>

                    {db.services.map((srv) => {
                      const parentClinic = db.clinics.find((c) => c.id === srv.clinicId);
                      return (
                        <div
                          key={srv.id}
                          className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="text-[#00C2CB] font-semibold">
                                {parentClinic?.name[locale] || srv.clinicId}
                              </span>
                              <span>·</span>
                              <span className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                                {srv.price} {srv.currency}
                              </span>
                              <span>·</span>
                              <span className="font-mono-tabular">{srv.durationMinutes} min</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {srv.name.ar} — {srv.name.en}
                            </h3>
                            <p className="text-xs text-slate-500">{srv.description[locale]}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingService({ ...srv })}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950"
                            >
                              {locale === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  collection: 'services',
                                  id: srv.id,
                                  title: srv.name[locale],
                                })
                              }
                              className="p-2 rounded-lg text-red-500 hover:bg-red-950/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 5: BLOG ARTICLES MANAGEMENT (/admin/blog) */}
            {/* =============================================================== */}
            {subRoute === 'blog' && (() => {
              const allArticles = db.articles || [];
              const activeArticles = allArticles.filter((a) => !a.archived);
              const archivedArticlesCount = allArticles.filter((a) => Boolean(a.archived)).length;
              const publishedArticlesCount = activeArticles.filter((a) => a.published).length;
              const draftArticlesCount = activeArticles.filter((a) => !a.published).length;
              const featuredArticlesCount = activeArticles.filter((a) => a.featured).length;

              const availableCategories = Array.from(
                new Map(
                  activeArticles.map((a) => {
                    const key = (a.category?.en || a.category?.ar || 'General').trim();
                    return [
                      key,
                      {
                        key,
                        ar: a.category?.ar || key,
                        en: a.category?.en || key,
                      },
                    ];
                  })
                ).values()
              );

              const filteredArticles = [...allArticles]
                .filter((art) => {
                  const isArchived = Boolean(art.archived);
                  if (statusFilter === 'trash') {
                    if (!isArchived) return false;
                  } else {
                    if (isArchived) return false;
                    if (statusFilter === 'published' && !art.published) return false;
                    if (statusFilter === 'draft' && art.published) return false;
                  }

                  if (blogCategoryFilter === '__featured__') {
                    if (!art.featured) return false;
                  } else if (blogCategoryFilter !== 'all') {
                    const catKey = (art.category?.en || art.category?.ar || '').trim();
                    if (catKey !== blogCategoryFilter) return false;
                  }

                  if (!searchFilter.trim()) return true;
                  const q = searchFilter.toLowerCase();
                  return (
                    (art.title?.ar || '').toLowerCase().includes(q) ||
                    (art.title?.en || '').toLowerCase().includes(q) ||
                    (art.slug || '').toLowerCase().includes(q) ||
                    (art.excerpt?.ar || '').toLowerCase().includes(q) ||
                    (art.excerpt?.en || '').toLowerCase().includes(q) ||
                    (art.category?.ar || '').toLowerCase().includes(q) ||
                    (art.category?.en || '').toLowerCase().includes(q) ||
                    (art.tags || []).some((t) => t.toLowerCase().includes(q))
                  );
                })
                .sort((a, b) => {
                  if (sortBy === 'updatedAt') {
                    return getTimestampValue(b.updatedAt) - getTimestampValue(a.updatedAt);
                  }
                  if (sortBy === 'createdAt') {
                    return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt);
                  }
                  if (sortBy === 'title') {
                    return (a.title[locale] || '').localeCompare(b.title[locale] || '');
                  }
                  return (a.order ?? 0) - (b.order ?? 0);
                });

              const paginatedArticles = filteredArticles.slice(
                (currentPage - 1) * PAGE_SIZE,
                currentPage * PAGE_SIZE
              );

              const handleCloneArticle = async (source: ArticleItem) => {
                const baseSlug = slugifyText(`${source.slug || 'article'}-copy`);
                let candidateSlug = baseSlug;
                let counter = 2;
                while (
                  allArticles.some((a) => a.slug?.toLowerCase() === candidateSlug.toLowerCase())
                ) {
                  candidateSlug = `${baseSlug}-${counter}`;
                  counter += 1;
                }

                const nowIso = new Date().toISOString();
                const cloned: ArticleItem = {
                  ...source,
                  id: `art-${Date.now()}`,
                  slug: candidateSlug,
                  title: {
                    ar: `${source.title.ar} (نسخة)`,
                    en: `${source.title.en} (Copy)`,
                  },
                  featured: false,
                  published: false,
                  archived: false,
                  archivedAt: undefined,
                  order: allArticles.length + 1,
                  createdAt: nowIso,
                  updatedAt: nowIso,
                };

                await upsertRecord('articles', cloned);
                showToast(
                  locale === 'ar'
                    ? `تم استنساخ المقال كمسودة جديدة (/blog/${candidateSlug})`
                    : `Article cloned as a new draft (/blog/${candidateSlug})`,
                  'success'
                );
              };

              const handleRequestPermanentArticleDelete = (art: ArticleItem) => {
                const refs = checkArticleInSiteReferences(art, db);
                if (refs.inUse) {
                  showToast(
                    locale === 'ar'
                      ? `لا يمكن الحذف النهائي: رابط المقال مستخدم في (${refs.usedIn.join('، ')}).`
                      : `Cannot permanently delete: article is referenced in (${refs.usedIn.join(', ')}).`,
                    'error'
                  );
                  return;
                }
                const expectedName = art.title[locale] || art.title.en || art.title.ar || art.slug;
                setDeleteConfirmLiteralInput('');
                setDeleteConfirm({
                  collection: 'articles',
                  id: art.id,
                  title: `${art.title.ar} — ${art.title.en}`,
                  requireLiteralConfirm: true,
                  expectedLiteralName: expectedName,
                });
              };

              return (
                <div className="space-y-6">
                  {/* Top Header & Quick Stats Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        {locale === 'ar' ? 'إدارة المقالات والمدونة' : 'Manage Blog Articles'}
                      </h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'إنشاء، تحرير، استنساخ، معاينة، ونشر المقالات باللغتين مع إحصاء الكلمات ووقت القراءة وسلة المحذوفات.'
                          : 'Create, edit, clone, preview, and publish bilingual articles with live word counts, reading time, and safe archive/trash.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openNewArticleEditor}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{locale === 'ar' ? '+ مقال جديد' : '+ New Article'}</span>
                    </button>
                  </div>

                  {/* Quick Editorial KPI Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {locale === 'ar' ? 'إجمالي النشطة' : 'Active Articles'}
                        </div>
                        <div className="text-lg font-black font-mono-tabular text-slate-900 dark:text-white">
                          {activeArticles.length}
                        </div>
                      </div>
                      <BookOpen className="w-4 h-4 text-[#00C2CB]" />
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {locale === 'ar' ? 'المنشورة للجمهور' : 'Published Live'}
                        </div>
                        <div className="text-lg font-black font-mono-tabular text-emerald-500">
                          {publishedArticlesCount}
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {locale === 'ar' ? 'المسودات قيد التحرير' : 'Drafts'}
                        </div>
                        <div className="text-lg font-black font-mono-tabular text-amber-500">
                          {draftArticlesCount}
                        </div>
                      </div>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {locale === 'ar' ? 'المميزة / الأرشيف' : 'Featured / Trash'}
                        </div>
                        <div className="text-lg font-black font-mono-tabular text-slate-900 dark:text-white">
                          {featuredArticlesCount} /{' '}
                          <span className="text-red-400">{archivedArticlesCount}</span>
                        </div>
                      </div>
                      <Star className="w-4 h-4 text-[#00C2CB]" />
                    </div>
                  </div>

                  {/* Unified Search, Status Tabs (All/Published/Draft/Trash), Category Filter & Sort Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder={
                          locale === 'ar'
                            ? 'بحث في العنوان، الرابط (Slug)، الملخص، التصنيف، أو الوسوم...'
                            : 'Search title, slug, excerpt, category, or tags...'
                        }
                        className="w-full ps-9 pe-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Filter Pills */}
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0F172A] border border-slate-300/60 dark:border-slate-800 overflow-x-auto">
                        {(
                          [
                            {
                              id: 'all',
                              label: {
                                ar: `الكل (${activeArticles.length})`,
                                en: `All (${activeArticles.length})`,
                              },
                            },
                            {
                              id: 'published',
                              label: {
                                ar: `المنشورة (${publishedArticlesCount})`,
                                en: `Published (${publishedArticlesCount})`,
                              },
                            },
                            {
                              id: 'draft',
                              label: {
                                ar: `المسودات (${draftArticlesCount})`,
                                en: `Draft (${draftArticlesCount})`,
                              },
                            },
                            {
                              id: 'trash',
                              label: {
                                ar: `الأرشيف (${archivedArticlesCount})`,
                                en: `Trash (${archivedArticlesCount})`,
                              },
                            },
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setStatusFilter(st.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                              statusFilter === st.id
                                ? 'bg-[#00C2CB] text-slate-950'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {st.label[locale]}
                          </button>
                        ))}
                      </div>

                      {/* Category / Featured Filter */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={blogCategoryFilter}
                          onChange={(e) => setBlogCategoryFilter(e.target.value)}
                          className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                          aria-label={locale === 'ar' ? 'تصفية حسب التصنيف' : 'Filter by category'}
                        >
                          <option value="all" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'جميع التصنيفات' : 'All Categories'}
                          </option>
                          <option value="__featured__" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? '★ المقالات المميزة فقط' : '★ Featured Only'}
                          </option>
                          {availableCategories.map((cat) => (
                            <option key={cat.key} value={cat.key} className="dark:bg-[#0F172A]">
                              {cat[locale]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sort Selector */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as AdminSortOption)}
                          className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                          aria-label={locale === 'ar' ? 'ترتيب المقالات' : 'Sort articles'}
                        >
                          <option value="order" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'ترتيب العرض' : 'Display Order'}
                          </option>
                          <option value="updatedAt" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'الأحدث تعديلاً' : 'Recently Updated'}
                          </option>
                          <option value="createdAt" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'الأحدث إنشاءً' : 'Recently Created'}
                          </option>
                          <option value="title" className="dark:bg-[#0F172A]">
                            {locale === 'ar' ? 'العنوان أبجدياً' : 'Title A–Z'}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {filteredArticles.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-3">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {statusFilter === 'trash'
                          ? locale === 'ar'
                            ? 'سلة المحذوفات / أرشيف المقالات فارغة حالياً'
                            : 'Article Archive / Trash is currently empty'
                          : locale === 'ar'
                          ? 'لا توجد مقالات مطابقة لمعايير البحث أو التصفية الحالية'
                          : 'No articles match your current search or filter criteria'}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchFilter('');
                            setStatusFilter('all');
                            setBlogCategoryFilter('all');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 cursor-pointer"
                        >
                          {locale === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
                        </button>
                        {statusFilter !== 'trash' && (
                          <button
                            type="button"
                            onClick={openNewArticleEditor}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 cursor-pointer"
                          >
                            {locale === 'ar' ? '+ مقال جديد' : '+ New Article'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginatedArticles.map((art, idx, arr) => {
                        const arWords = countArticleWords(art.content?.ar, art.contentJson?.ar);
                        const enWords = countArticleWords(art.content?.en, art.contentJson?.en);
                        const computedReadMin =
                          art.readingTimeMinutes && art.readingTimeMinutes > 0
                            ? art.readingTimeMinutes
                            : estimateArticleReadingTime(arWords, enWords);
                        const publicArticlePath = `/${locale}/blog/${art.slug}`;

                        return (
                          <div
                            key={art.id}
                            className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0F172A] border transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                              art.archived
                                ? 'border-red-500/30 bg-red-950/5'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            {/* Left: Cover Thumbnail + Editorial Details */}
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              {/* Cover Thumbnail */}
                              <div className="w-24 sm:w-28 aspect-[16/10] rounded-xl overflow-hidden bg-[#070E1A] border border-slate-200 dark:border-slate-800 shrink-0 relative">
                                {art.coverImage ? (
                                  <OptimizedImage
                                    src={art.coverImage}
                                    alt={art.title[locale] || art.slug}
                                    containerClassName="w-full h-full"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    <BookOpen className="w-5 h-5" />
                                  </div>
                                )}
                                <span className="absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono-tabular text-slate-200">
                                  #{art.order}
                                </span>
                              </div>

                              <div className="space-y-1.5 min-w-0 flex-1">
                                {/* Top Meta Row: Status, Featured, Category, URL + Copy/Open */}
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  {/* Status Badge */}
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                      art.archived
                                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                        : art.published
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                    }`}
                                  >
                                    {art.archived
                                      ? locale === 'ar'
                                        ? 'مؤرشف (مسودة)'
                                        : 'Archived (Draft)'
                                      : art.published
                                      ? locale === 'ar'
                                        ? 'منشور'
                                        : 'Published'
                                      : locale === 'ar'
                                      ? 'مسودة'
                                      : 'Draft'}
                                  </span>

                                  {/* Featured Toggle Badge */}
                                  {!art.archived && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        upsertRecord('articles', {
                                          ...art,
                                          featured: !art.featured,
                                        })
                                      }
                                      title={
                                        locale === 'ar'
                                          ? 'تعيين كمقال رئيسي مميز في أعلى المدونة'
                                          : 'Toggle Featured Cover Story'
                                      }
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                                        art.featured
                                          ? 'bg-[#00C2CB]/15 text-[#0099A3] dark:text-[#00C2CB] border border-[#00C2CB]/40'
                                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-300'
                                      }`}
                                    >
                                      <Star
                                        className={`w-3 h-3 ${
                                          art.featured ? 'fill-current' : ''
                                        }`}
                                      />
                                      <span>
                                        {art.featured
                                          ? locale === 'ar'
                                            ? 'مقال مميز'
                                            : 'Featured'
                                          : locale === 'ar'
                                          ? 'تمييز'
                                          : 'Feature'}
                                      </span>
                                    </button>
                                  )}

                                  {/* Category Badge */}
                                  {(art.category?.ar || art.category?.en) && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                                      {art.category[locale] || art.category.ar || art.category.en}
                                    </span>
                                  )}

                                  {/* Permalink Slug + Copy & Open */}
                                  <span className="font-mono-tabular text-[#0099A3] dark:text-[#00C2CB] font-semibold">
                                    /blog/{art.slug}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const fullUrl = `${window.location.origin}${publicArticlePath}`;
                                      navigator.clipboard?.writeText(fullUrl);
                                      showToast(
                                        locale === 'ar'
                                          ? 'تم نسخ رابط المقال'
                                          : 'Article URL copied to clipboard',
                                        'info'
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#00C2CB] cursor-pointer"
                                    title={locale === 'ar' ? 'نسخ رابط المقال' : 'Copy article link'}
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>{locale === 'ar' ? 'نسخ الرابط' : 'Copy Link'}</span>
                                  </button>
                                  <a
                                    href={publicArticlePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#00C2CB]"
                                    title={locale === 'ar' ? 'فتح المقال في صفحة جديدة' : 'Open article'}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>{locale === 'ar' ? 'فتح' : 'Open'}</span>
                                  </a>
                                </div>

                                {/* Bilingual Titles & Excerpt */}
                                <div>
                                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                                    {art.title.ar}
                                  </h3>
                                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {art.title.en}
                                  </p>
                                </div>

                                {art.excerpt?.[locale] && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                    {art.excerpt[locale]}
                                  </p>
                                )}

                                {/* Bottom Editorial Stats: Word Count, Reading Time, Created & Updated Dates */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400">
                                  <span>
                                    {locale === 'ar'
                                      ? `${arWords} كلمة (ع) · ${enWords} كلمة (EN)`
                                      : `${arWords} words (AR) · ${enWords} words (EN)`}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {computedReadMin}{' '}
                                    {locale === 'ar' ? 'د قراءة' : 'min read'}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {locale === 'ar' ? 'إنشاء: ' : 'Created: '}
                                    {formatAdminDate(art.createdAt, locale)}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {locale === 'ar' ? 'تحديث: ' : 'Updated: '}
                                    {formatAdminDate(art.updatedAt || art.createdAt, locale)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Action Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                              {!art.archived ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveItemOrder('articles', arr, idx, 'up')}
                                    disabled={idx === 0 || sortBy !== 'order'}
                                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                                    title={locale === 'ar' ? 'تحريك لأعلى' : 'Move Up'}
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveItemOrder('articles', arr, idx, 'down')}
                                    disabled={idx === arr.length - 1 || sortBy !== 'order'}
                                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                                    title={locale === 'ar' ? 'تحريك لأسفل' : 'Move Down'}
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleTogglePublished('articles', art)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                                      art.published
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                    }`}
                                  >
                                    {art.published ? (
                                      <>
                                        <EyeOff className="w-3.5 h-3.5" />
                                        <span>{locale === 'ar' ? 'إخفاء لمسودة' : 'Unpublish'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>{locale === 'ar' ? 'نشر المقال' : 'Publish'}</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCloneArticle(art)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] inline-flex items-center gap-1 cursor-pointer"
                                    title={
                                      locale === 'ar'
                                        ? 'استنساخ المقال كمسودة جديدة'
                                        : 'Duplicate article as a new draft'
                                    }
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>{locale === 'ar' ? 'استنساخ' : 'Clone'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewItem({
                                        type: 'Article',
                                        title: art.title[locale],
                                        subtitle: art.excerpt[locale],
                                        body: art.content[locale],
                                        image: art.coverImage,
                                        published: art.published,
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                                  >
                                    {locale === 'ar' ? 'معاينة' : 'Preview'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingArticleIsNew(false);
                                      setEditingArticle({ ...art });
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>{locale === 'ar' ? 'تحرير' : 'Edit'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setArticleTrashConfirm(art)}
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-950/30 cursor-pointer"
                                    title={
                                      locale === 'ar'
                                        ? 'نقل المقال إلى الأرشيف (مسودة)'
                                        : 'Move article to Trash / Archive'
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      upsertRecord('articles', {
                                        ...art,
                                        archived: false,
                                        archivedAt: undefined,
                                        published: false,
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>{locale === 'ar' ? 'استعادة كمسودة' : 'Restore to Draft'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRequestPermanentArticleDelete(art)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{locale === 'ar' ? 'حذف نهائي' : 'Delete Forever'}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <AdminPagination
                    locale={locale}
                    totalItems={filteredArticles.length}
                    pageSize={PAGE_SIZE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              );
            })()}

            {/* =============================================================== */}
            {/* TAB 6: CLOUDINARY MEDIA MANAGEMENT (/admin/media) */}
            {/* =============================================================== */}
            {subRoute === 'media' && (() => {
              const filteredMedia = [...(db.media || [])].filter((asset) => {
                if (mediaCategoryFilter !== 'all' && asset.category !== mediaCategoryFilter) {
                  return false;
                }
                if (mediaView === 'article-images') {
                  const usedInArticle =
                    asset.category === 'blog' || articleInlineMediaUsage.has(asset.secureUrl);
                  if (!usedInArticle) return false;
                }
                if (!searchFilter.trim()) return true;
                const q = searchFilter.toLowerCase();
                return (
                  asset.alt.ar.toLowerCase().includes(q) ||
                  asset.alt.en.toLowerCase().includes(q) ||
                  asset.publicId.toLowerCase().includes(q)
                );
              });

              const paginatedMedia = filteredMedia.slice(
                (currentPage - 1) * PAGE_SIZE,
                currentPage * PAGE_SIZE
              );

              return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        {locale === 'ar'
                          ? 'مكتبة الصور والوسائط — Cloudinary Media Manager'
                          : 'Cloudinary Signed Media Library'}
                      </h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'رفع الصور عبر توقيع خادم آمن (Signed Upload)، معاينة، استبدال، والتحقق من الاستخدام قبل الحذف.'
                          : 'Server-side Signed Upload, image replacement, and usage verification.'}
                      </p>
                    </div>

                    {/* View Mode Tabs Matching Sidebar */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0F172A] border border-slate-300/60 dark:border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate('/admin/media')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          mediaView === 'gallery'
                            ? 'bg-[#00C2CB] text-slate-950'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {locale === 'ar' ? 'كل المكتبة' : 'All Library'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/media?view=upload')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          mediaView === 'upload'
                            ? 'bg-[#00C2CB] text-slate-950'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {locale === 'ar' ? 'رفع الصور' : 'Upload'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/media?view=article-images')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          mediaView === 'article-images'
                            ? 'bg-[#00C2CB] text-slate-950'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {locale === 'ar' ? 'صور المقالات' : 'Article Images'}
                      </button>
                    </div>
                  </div>

                  {/* Media Library Summary Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400">
                        {locale === 'ar' ? 'إجمالي الملفات' : 'Total Media Assets'}
                      </div>
                      <div className="text-lg font-extrabold font-mono-tabular text-slate-900 dark:text-white mt-0.5">
                        {db.media.length}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400">
                        {locale === 'ar' ? 'الحجم المسجل' : 'Tracked Storage'}
                      </div>
                      <div className="text-lg font-extrabold font-mono-tabular text-[#00C2CB] mt-0.5">
                        {formatBytes(
                          db.media.reduce((acc, m) => acc + (Number(m.bytes) || 0), 0)
                        )}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400">
                        {locale === 'ar' ? 'صور مرتبطة بمحتوى' : 'In Active Content'}
                      </div>
                      <div className="text-lg font-extrabold font-mono-tabular text-emerald-500 mt-0.5">
                        {
                          db.media.filter((m) => checkMediaInPublishedContent(m, db).inUse)
                            .length
                        }
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400">
                        {locale === 'ar' ? 'خدمة التخزين' : 'CDN Delivery'}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 truncate">
                        {cloudinaryStatus?.configured
                          ? `Cloudinary (${cloudinaryStatus.cloudName})`
                          : locale === 'ar'
                          ? 'وضع التطوير المحلي'
                          : 'Local Fallback'}
                      </div>
                    </div>
                  </div>

                  {/* Upload / Replace Form Card with Drag & Drop Compression */}
                  <div
                    id="media-upload-zone"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setMediaDragActive(true);
                    }}
                    onDragLeave={() => setMediaDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setMediaDragActive(false);
                      const droppedFile = e.dataTransfer?.files?.[0];
                      openCompressionPreviewForFile(droppedFile);
                    }}
                    className={`p-6 rounded-2xl bg-white dark:bg-[#0F172A] border-2 border-dashed transition-colors space-y-4 scroll-mt-20 ${
                      mediaDragActive
                        ? 'border-[#00C2CB] bg-[#00C2CB]/5'
                        : mediaView === 'upload'
                        ? 'border-[#00C2CB] ring-1 ring-[#00C2CB]/30'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        {replacingMediaItem
                          ? locale === 'ar'
                            ? `استبدال الصورة: ${replacingMediaItem.alt[locale]}`
                            : `Replace Image: ${replacingMediaItem.alt[locale]}`
                          : locale === 'ar'
                          ? 'رفع وضغط صورة جديدة (اسحب الصورة هنا أو اختر ملفاً — حتى 20MB قبل الضغط)'
                          : 'Upload & Compress Image (Drag & drop here or choose file — up to 20MB pre-compression)'}
                      </h2>
                      {replacingMediaItem && (
                        <button
                          type="button"
                          onClick={() => setReplacingMediaItem(null)}
                          className="text-xs text-slate-400 hover:text-white cursor-pointer"
                        >
                          {locale === 'ar' ? 'إلغاء الاستبدال' : 'Cancel Replace'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input
                        type="text"
                        value={mediaAltAr}
                        onChange={(e) => setMediaAltAr(e.target.value)}
                        placeholder={locale === 'ar' ? 'النص البديل بالعربية (Alt AR)' : 'Arabic Alt Text'}
                        className="px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        value={mediaAltEn}
                        onChange={(e) => setMediaAltEn(e.target.value)}
                        placeholder={
                          locale === 'ar' ? 'النص البديل بالإنجليزية (Alt EN)' : 'English Alt Text'
                        }
                        className="px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                      <select
                        value={mediaCategory}
                        onChange={(e) => setMediaCategory(e.target.value as MediaAsset['category'])}
                        className="px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      >
                        <option value="general">General</option>
                        <option value="profile">Profile / About</option>
                        <option value="project">Project / System</option>
                        <option value="clinic">Medical Clinic</option>
                        <option value="blog">Blog Article</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>
                          {uploadingMedia
                            ? locale === 'ar'
                              ? 'جاري التوقيع والرفع...'
                              : 'Signing & Uploading...'
                            : replacingMediaItem
                            ? locale === 'ar'
                              ? 'اختر الملف البديل للمعاينة'
                              : 'Select Replacement for Compression'
                            : locale === 'ar'
                            ? 'اختر صورة للمعاينة والضغط'
                            : 'Choose Image to Compress & Upload'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          disabled={uploadingMedia}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <span className="text-xs text-slate-500">
                        {locale === 'ar'
                          ? 'تحويل تلقائي لصيغة WebP وتقليص الحجم مع مقارنة بصرية قبل الرفع.'
                          : 'Automatic WebP optimization & live before/after inspection prior to upload.'}
                      </span>
                    </div>
                  </div>

                  {/* Article Inline Images Reference Summary (when in article-images view) */}
                  {mediaView === 'article-images' && (
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <FileImage className="w-4 h-4 text-[#00C2CB]" />
                        <span>
                          {locale === 'ar'
                            ? `الصور المرتبطة بالمقالات (${articleInlineMediaUsage.size})`
                            : `Images Referenced Inside Articles (${articleInlineMediaUsage.size})`}
                        </span>
                      </div>
                      {articleInlineMediaUsage.size === 0 ? (
                        <p className="text-xs text-slate-500">
                          {locale === 'ar'
                            ? 'لا توجد صور مضافة داخل المقالات بعد.'
                            : 'No images embedded in articles yet.'}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                          {Array.from(articleInlineMediaUsage.entries()).map(([imgUrl, refs]) => (
                            <div
                              key={imgUrl}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 flex items-center gap-3"
                            >
                              <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                                <OptimizedImage
                                  src={imgUrl}
                                  alt={refs[0]}
                                  containerClassName="w-full h-full"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-white truncate">
                                  {refs.join(' · ')}
                                </div>
                                <div className="text-[11px] font-mono-tabular text-slate-400 truncate">
                                  {imgUrl}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Search & Category Filter Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder={locale === 'ar' ? 'بحث في الصور والوسائط...' : 'Search media assets...'}
                        className="w-full ps-9 pe-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <select
                      value={mediaCategoryFilter}
                      onChange={(e) => setMediaCategoryFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                    >
                      <option value="all">{locale === 'ar' ? 'كل التصنيفات' : 'All Categories'}</option>
                      <option value="general">General</option>
                      <option value="profile">Profile / About</option>
                      <option value="project">Project</option>
                      <option value="clinic">Medical Clinic</option>
                      <option value="blog">Blog Article</option>
                    </select>
                  </div>

                  {/* Media Gallery Grid */}
                  {filteredMedia.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-3">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {locale === 'ar'
                          ? 'لا توجد صور مطابقة للبحث في مكتبة الوسائط'
                          : 'No media assets match your current criteria'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchFilter('');
                          setMediaCategoryFilter('all');
                          navigate('/admin/media');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 cursor-pointer"
                      >
                        {locale === 'ar' ? 'عرض كل المكتبة' : 'Show Full Library'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedMedia.map((asset) => {
                        const usage = checkMediaInPublishedContent(asset, db);
                        return (
                          <div
                            key={asset.id}
                            className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
                          >
                            <div className="h-48 bg-[#070E1A] p-4 flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
                              <OptimizedImage
                                src={asset.secureUrl}
                                alt={asset.alt[locale]}
                                containerClassName="w-full h-full"
                                className="w-full h-full object-contain"
                              />
                            </div>

                            <div className="p-4 space-y-3">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {asset.alt[locale]}
                                  </div>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 shrink-0">
                                    {asset.format}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-slate-400 mt-1">
                                  <span>
                                    {asset.width}×{asset.height}
                                  </span>
                                  {asset.bytes ? (
                                    <>
                                      <span>·</span>
                                      <span className="text-[#00C2CB] font-semibold">
                                        {formatBytes(asset.bytes)}
                                      </span>
                                    </>
                                  ) : null}
                                  <span>·</span>
                                  <span className="uppercase text-[10px]">{asset.category}</span>
                                </div>
                                <div className="text-[10px] font-mono-tabular text-slate-500 truncate mt-0.5">
                                  public_id: {asset.publicId}
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-500">
                                {usage.inUse ? (
                                  <span className="text-[#0099A3] dark:text-[#00C2CB] font-medium">
                                    {locale === 'ar' ? 'مستخدم في: ' : 'Used in: '}
                                    {usage.usedIn.join(', ')}
                                  </span>
                                ) : (
                                  <span>
                                    {locale === 'ar'
                                      ? 'غير مستخدم حالياً في محتوى منشور'
                                      : 'Not currently used in published content'}
                                  </span>
                                )}
                              </div>

                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(asset.secureUrl);
                                    showToast(
                                      locale === 'ar' ? 'تم نسخ رابط الصورة' : 'Image URL copied',
                                      'info'
                                    );
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-[#00C2CB] cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{locale === 'ar' ? 'نسخ' : 'Copy'}</span>
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingMediaAlt({ ...asset })}
                                    className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] cursor-pointer"
                                    title={locale === 'ar' ? 'تعديل الوصف والتصنيف' : 'Edit Alt & Category'}
                                  >
                                    {locale === 'ar' ? 'البيانات' : 'Alt'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplacingMediaItem(asset);
                                      setMediaAltAr(asset.alt.ar);
                                      setMediaAltEn(asset.alt.en);
                                      setMediaCategory(asset.category);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] cursor-pointer"
                                  >
                                    {locale === 'ar' ? 'استبدال' : 'Replace'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRequestDeleteMedia(asset)}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-950/30 cursor-pointer"
                                    title={locale === 'ar' ? 'حذف الصورة' : 'Delete Image'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <AdminPagination
                    locale={locale}
                    totalItems={filteredMedia.length}
                    pageSize={PAGE_SIZE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              );
            })()}

            {/* =============================================================== */}
            {/* TAB 7: SITE SETTINGS, EXISTING FIREBASE & SEO (/admin/settings) */}
            {/* =============================================================== */}
            {subRoute === 'settings' && (
              <div className="space-y-8">
                {/* 1. Connect Existing Firebase Project & Read-only Cloudinary Diagnostics */}
                <div
                  id="settings-integrations"
                  className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-5 scroll-mt-20"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#00C2CB]">
                      {locale === 'ar'
                        ? 'ربط مشروع Firebase الحالي وخدمات Cloudinary'
                        : 'Connect Your Existing Firebase & Cloudinary Status'}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'إعدادات Firebase Authentication & Cloud Firestore'
                        : 'Existing Firebase Web SDK & Cloudinary Configuration'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'أدخل بيانات تطبيق الويب من مشروعك الحالي في Firebase Console (أو ضعها في متغيرات البيئة VITE_FIREBASE_*) ليتم الربط المباشر بقاعدة بياناتك.'
                        : 'Paste your existing Firebase Web App configuration below (or via VITE_FIREBASE_* environment variables).'}
                    </p>
                  </div>

                  {/* Read-only Cloudinary Security Summary */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Cloud className="w-4 h-4 text-[#00C2CB] shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {locale === 'ar'
                            ? 'حالة الربط مع Cloudinary (توقيع آمن على الخادم)'
                            : 'Cloudinary Server-Signed Integration'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono-tabular">
                          Cloud: {cloudinaryStatus?.cloudName || '—'} · Folder:{' '}
                          {cloudinaryStatus?.folder || 'ahmed-soliman-platform'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-semibold shrink-0 ${
                        cloudinaryStatus?.configured
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {cloudinaryStatus?.configured
                        ? locale === 'ar'
                          ? 'متصل ومفعل (المفتاح السري محمي)'
                          : 'Configured (Secret Protected Server-Side)'
                        : locale === 'ar'
                        ? 'بانتظار متغيرات الخادم'
                        : 'Awaiting Server Env Vars'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Project ID</label>
                      <input
                        type="text"
                        value={fbConfigForm.projectId}
                        onChange={(e) =>
                          setFbConfigForm({ ...fbConfigForm, projectId: e.target.value.trim() })
                        }
                        placeholder="my-existing-firebase-project"
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Web API Key</label>
                      <input
                        type="text"
                        value={fbConfigForm.apiKey}
                        onChange={(e) =>
                          setFbConfigForm({ ...fbConfigForm, apiKey: e.target.value.trim() })
                        }
                        placeholder="AIzaSy..."
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Auth Domain</label>
                      <input
                        type="text"
                        value={fbConfigForm.authDomain}
                        onChange={(e) =>
                          setFbConfigForm({ ...fbConfigForm, authDomain: e.target.value.trim() })
                        }
                        placeholder="my-project.firebaseapp.com"
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">App ID</label>
                      <input
                        type="text"
                        value={fbConfigForm.appId}
                        onChange={(e) =>
                          setFbConfigForm({ ...fbConfigForm, appId: e.target.value.trim() })
                        }
                        placeholder="1:123456789:web:abcdef"
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          !fbConfigForm.apiKey.startsWith('AIza') ||
                          fbConfigForm.apiKey.length < 30 ||
                          !fbConfigForm.projectId ||
                          fbConfigForm.projectId === 'my-existing-firebase-project'
                        ) {
                          showToast(
                            locale === 'ar'
                              ? 'يرجى إدخال Project ID و Web API Key صالحين من مشروع Firebase الحالي.'
                              : 'Please enter a valid Project ID and Web API Key from your Firebase Console.',
                            'error'
                          );
                          return;
                        }
                        saveExternalFirebaseConfig(fbConfigForm);
                        await refreshData();
                        showToast(
                          locale === 'ar'
                            ? 'تم حفظ إعدادات مشروع Firebase الحالي بنجاح'
                            : 'Existing Firebase project configuration saved',
                          'success'
                        );
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 cursor-pointer"
                    >
                      {locale === 'ar'
                        ? 'حفظ والاتصال بمشروع Firebase الحالي'
                        : 'Save & Connect Existing Firebase Project'}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        saveExternalFirebaseConfig(null);
                        setFbConfigForm({
                          apiKey: '',
                          authDomain: '',
                          projectId: '',
                          appId: '',
                          messagingSenderId: '',
                          databaseId: '(default)',
                        });
                        await refreshData();
                        showToast(
                          locale === 'ar'
                            ? 'تم مسح إعدادات Firebase الخارجية والعودة للتخزين المحلي المتزامن'
                            : 'Cleared external Firebase config; using synchronized local persistence',
                          'info'
                        );
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-400 cursor-pointer"
                    >
                      {locale === 'ar' ? 'إلغاء الربط / مسح الإعدادات' : 'Disconnect / Clear Config'}
                    </button>
                  </div>
                </div>

                {/* 2. Global Brand Identity, Contact Links & Default SEO */}
                <form
                  id="settings-identity"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await saveSiteSettings(settingsForm);
                  }}
                  className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-5 scroll-mt-20"
                >
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {locale === 'ar'
                      ? 'إعدادات الهوية، روابط التواصل، واللغة'
                      : 'Global Brand Identity, Contact Links & Language'}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {locale === 'ar' ? 'اسم المنصة (عربي)' : 'Brand Name (AR)'}
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brandName.ar}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            brandName: { ...settingsForm.brandName, ar: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {locale === 'ar' ? 'اسم المنصة (إنجليزي)' : 'Brand Name (EN)'}
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brandName.en}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            brandName: { ...settingsForm.brandName, en: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">WhatsApp URL</label>
                      <input
                        type="text"
                        value={settingsForm.whatsappUrl}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, whatsappUrl: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Telegram Bot URL</label>
                      <input
                        type="text"
                        value={settingsForm.telegramBotUrl}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, telegramBotUrl: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                      />
                    </div>
                    <div className="sm:col-span-2 pt-2">
                      <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.hideVisitorHeaderNav !== false}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              hideVisitorHeaderNav: e.target.checked,
                            })
                          }
                          className="mt-0.5 w-4 h-4 accent-[#00C2CB] rounded cursor-pointer"
                        />
                        <div className="space-y-0.5 text-xs">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {locale === 'ar'
                              ? 'إخفاء قائمة تنقل الصفحات في الهيدر العلوي عن الزوار (عزل الروابط المشتركة)'
                              : 'Hide Top Header Page Navigation from Visitors (Isolate Shared Links)'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {locale === 'ar'
                              ? 'عند تفعيل هذا الخيار، لن يرى الزائر أزرار التنقل بين الصفحات في الهيدر العلوي عند فتح رابط العيادات أو المقالات أو سولي ميديكال.'
                              : 'When enabled, visitors will not see cross-page navigation links in the top header.'}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* SEO Section Anchor */}
                  <div
                    id="settings-seo"
                    className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 scroll-mt-20"
                  >
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {locale === 'ar' ? 'إعدادات SEO الافتراضية' : 'Default Site SEO Settings'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          {locale === 'ar' ? 'عنوان SEO الافتراضي (عربي)' : 'Default SEO Title (AR)'}
                        </label>
                        <input
                          type="text"
                          value={settingsForm.seo.title.ar}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              seo: {
                                ...settingsForm.seo,
                                title: { ...settingsForm.seo.title, ar: e.target.value },
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          {locale === 'ar'
                            ? 'عنوان SEO الافتراضي (إنجليزي)'
                            : 'Default SEO Title (EN)'}
                        </label>
                        <input
                          type="text"
                          value={settingsForm.seo.title.en}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              seo: {
                                ...settingsForm.seo,
                                title: { ...settingsForm.seo.title, en: e.target.value },
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          {locale === 'ar' ? 'وصف SEO الافتراضي (عربي)' : 'Default SEO Description (AR)'}
                        </label>
                        <textarea
                          rows={2}
                          value={settingsForm.seo.description.ar}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              seo: {
                                ...settingsForm.seo,
                                description: {
                                  ...settingsForm.seo.description,
                                  ar: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          {locale === 'ar'
                            ? 'وصف SEO الافتراضي (إنجليزي)'
                            : 'Default SEO Description (EN)'}
                        </label>
                        <textarea
                          rows={2}
                          value={settingsForm.seo.description.en}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              seo: {
                                ...settingsForm.seo,
                                description: {
                                  ...settingsForm.seo.description,
                                  en: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] cursor-pointer"
                  >
                    {locale === 'ar' ? 'حفظ إعدادات الهوية وSEO' : 'Save Identity & SEO Settings'}
                  </button>
                </form>

                {/* 3. Full Platform Backup & Restore JSON */}
                <div
                  id="settings-backup"
                  className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-20"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#00C2CB]">
                      {locale === 'ar'
                        ? 'النسخ الاحتياطي والاستعادة الشاملة (Backup & Restore)'
                        : 'Full Platform Backup & Restore'}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'تصدير أو استعادة قاعدة بيانات المحتوى بالكامل (JSON)'
                        : 'Export or Restore Complete Content Snapshot (JSON)'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'يمكنك تحميل نسخة احتياطية كاملة لجميع الصفحات والمشروعات والعيادات والأطباء والخدمات والمقالات والصور، أو استعادتها في أي وقت.'
                        : 'Download a full JSON backup of all pages, projects, clinics, doctors, services, articles, and media assets, or restore from a saved snapshot.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!adminSession) return;
                        try {
                          const res = await fetch('/api/cms/backup', {
                            headers: { Authorization: `Bearer ${adminSession.token}` },
                          });
                          if (!res.ok) throw new Error('Backup failed');
                          const data = await res.json();
                          const blob = new Blob([JSON.stringify(data, null, 2)], {
                            type: 'application/json',
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `ahmed-soliman-platform-backup-${new Date()
                            .toISOString()
                            .slice(0, 10)}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          showToast(
                            locale === 'ar'
                              ? 'تم تصدير النسخة الاحتياطية بنجاح'
                              : 'Full JSON backup exported successfully',
                            'success'
                          );
                        } catch {
                          showToast(
                            locale === 'ar'
                              ? 'تعذر تصدير النسخة الاحتياطية'
                              : 'Failed to export backup',
                            'error'
                          );
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3]"
                    >
                      <Database className="w-4 h-4" />
                      <span>
                        {locale === 'ar'
                          ? 'تصدير نسخة احتياطية كاملة (Download Backup JSON)'
                          : 'Download Full Backup (JSON)'}
                      </span>
                    </button>

                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#00C2CB] hover:text-[#00C2CB]">
                      <Upload className="w-4 h-4" />
                      <span>
                        {locale === 'ar'
                          ? 'استعادة من ملف نسخة احتياطية (Restore JSON)'
                          : 'Restore from Backup JSON'}
                      </span>
                      <input
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !adminSession) return;
                          try {
                            const text = await file.text();
                            const parsed = JSON.parse(text);
                            const res = await fetch('/api/cms/restore', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${adminSession.token}`,
                              },
                              body: JSON.stringify(parsed),
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(err.error || 'Restore failed');
                            }
                            await refreshData();
                            showToast(
                              locale === 'ar'
                                ? 'تمت استعادة النسخة الاحتياطية بنجاح'
                                : 'Platform database restored from backup successfully',
                              'success'
                            );
                          } catch (err: any) {
                            showToast(
                              err?.message ||
                                (locale === 'ar'
                                  ? 'ملف النسخة الاحتياطية غير صالح'
                                  : 'Invalid backup JSON file'),
                              'error'
                            );
                          } finally {
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* 4. Multi-Admin Access & Write Permissions Management (#settings-admins) */}
                <div
                  id="settings-admins"
                  className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-6 scroll-mt-20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-[#00C2CB]">
                        {locale === 'ar'
                          ? 'إدارة المديرين وصلاحيات الكتابة'
                          : 'Administrators & Write Permissions'}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {locale === 'ar'
                          ? 'المديرون المعتمدون وحماية حسابات Firebase Authentication'
                          : 'Authorized Admins & Firebase Auth Protection'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'أي حساب Google غير مدرج هنا يتم رفض دخوله فوراً وحذفه تلقائياً من قائمة Firebase Authentication.'
                          : 'Any Google account not listed here is automatically rejected and deleted from Firebase Authentication.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={purgingAuthUsers}
                      onClick={async () => {
                        if (!adminSession) return;
                        setPurgingAuthUsers(true);
                        try {
                          const res = await fetch('/api/cms/admins/purge-unauthorized', {
                            method: 'POST',
                            headers: {
                              Authorization: `Bearer ${adminSession.token}`,
                            },
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            throw new Error(data.error || 'Failed to purge unauthorized users');
                          }
                          const count = Number(data.deletedCount || 0);
                          showToast(
                            locale === 'ar'
                              ? count > 0
                                ? `تم تنظيف وحذف ${count} حساب غير مصرح به من Firebase Auth`
                                : 'قائمة Firebase Auth نظيفة تماماً — لا توجد حسابات غير مصرح بها'
                              : count > 0
                              ? `Purged ${count} unauthorized user(s) from Firebase Auth`
                              : 'Firebase Auth is clean — no unauthorized users found',
                            'success'
                          );
                        } catch (err: any) {
                          showToast(
                            err?.message ||
                              (locale === 'ar'
                                ? 'تعذر تنظيف حسابات Firebase Auth'
                                : 'Failed to purge Firebase Auth users'),
                            'error'
                          );
                        } finally {
                          setPurgingAuthUsers(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${purgingAuthUsers ? 'animate-spin' : ''}`} />
                      <span>
                        {locale === 'ar'
                          ? 'تنظيف الحسابات غير المصرحة من Firebase Auth'
                          : 'Purge Unauthorized Firebase Auth Users'}
                      </span>
                    </button>
                  </div>

                  {/* Add / Invite Secondary Admin Form */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!adminSession || !newAdminEmail.trim()) return;
                      setAdminManageBusy(true);
                      try {
                        const res = await fetch('/api/cms/admins/manage', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${adminSession.token}`,
                          },
                          body: JSON.stringify({
                            email: newAdminEmail.trim().toLowerCase(),
                            name: newAdminName.trim() || newAdminEmail.trim().split('@')[0],
                            uid: newAdminUid.trim() || undefined,
                          }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          throw new Error(data.error || 'Failed to add administrator');
                        }
                        setNewAdminEmail('');
                        setNewAdminName('');
                        setNewAdminUid('');
                        await refreshData();
                        showToast(
                          locale === 'ar'
                            ? 'تمت إضافة المدير ومنحه صلاحيات الكتابة بنجاح'
                            : 'Administrator added with write permissions',
                          'success'
                        );
                      } catch (err: any) {
                        showToast(err?.message || 'Failed to add admin', 'error');
                      } finally {
                        setAdminManageBusy(false);
                      }
                    }}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'إضافة مدير جديد بصلاحيات الكتابة والتحرير'
                        : 'Add New Administrator with Write Permissions'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          {locale === 'ar' ? 'البريد الإلكتروني (Google Email) *' : 'Google Email *'}
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="editor@gmail.com"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          {locale === 'ar' ? 'الاسم المعروض' : 'Display Name'}
                        </label>
                        <input
                          type="text"
                          placeholder={locale === 'ar' ? 'اسم المدير' : 'Admin Name'}
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          {locale === 'ar'
                            ? 'Firebase UID (اختياري — يُربط تلقائياً عند أول دخول)'
                            : 'Firebase UID (Optional — auto-linked on first login)'}
                        </label>
                        <input
                          type="text"
                          placeholder={locale === 'ar' ? 'تلقائي عند أول دخول' : 'Auto on first sign-in'}
                          value={newAdminUid}
                          onChange={(e) => setNewAdminUid(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={adminManageBusy || !newAdminEmail.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] disabled:opacity-50 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {locale === 'ar'
                            ? 'إضافة مدير بصلاحية الكتابة'
                            : 'Grant Admin Write Access'}
                        </span>
                      </button>
                    </div>
                  </form>

                  {/* Authorized Admins List */}
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {(db.admins || []).map((adm) => {
                      const isPrimaryOwner = adm.role === 'owner';
                      const avatarSrc =
                        adm.photoUrl ||
                        (isPrimaryOwner ? adminSession?.photoUrl || db.siteSettings.avatarUrl : '');
                      return (
                        <div
                          key={adm.id}
                          className="p-4 bg-white dark:bg-[#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={adm.name || adm.email}
                                className="w-9 h-9 rounded-full object-cover border border-[#00C2CB]/50 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#00C2CB]/15 border border-[#00C2CB]/40 flex items-center justify-center text-[#00C2CB] shrink-0">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {adm.name || adm.email}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isPrimaryOwner
                                      ? 'bg-[#00C2CB]/15 text-[#00C2CB]'
                                      : adm.disabled
                                      ? 'bg-red-500/15 text-red-400'
                                      : 'bg-emerald-500/15 text-emerald-400'
                                  }`}
                                >
                                  {isPrimaryOwner
                                    ? locale === 'ar'
                                      ? 'المالك الأساسي (Owner)'
                                      : 'Primary Owner'
                                    : adm.disabled
                                    ? locale === 'ar'
                                      ? 'موقوف مؤقتاً'
                                      : 'Disabled'
                                    : locale === 'ar'
                                    ? 'مدير بصلاحية كتابة (Admin)'
                                    : 'Authorized Admin'}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400 truncate">
                                {adm.email}
                                {adm.uid ? ` · UID: ${adm.uid.slice(0, 10)}…` : locale === 'ar' ? ' · بانتظار أول دخول عبر Google' : ' · Pending first Google sign-in'}
                              </div>
                            </div>
                          </div>

                          {!isPrimaryOwner && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={adminManageBusy}
                                onClick={async () => {
                                  if (!adminSession) return;
                                  setAdminManageBusy(true);
                                  try {
                                    const res = await fetch(`/api/cms/admins/manage/${encodeURIComponent(adm.id)}`, {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${adminSession.token}`,
                                      },
                                      body: JSON.stringify({ disabled: !adm.disabled }),
                                    });
                                    if (!res.ok) {
                                      const err = await res.json().catch(() => ({}));
                                      throw new Error(err.error || 'Update failed');
                                    }
                                    await refreshData();
                                    showToast(
                                      locale === 'ar'
                                        ? adm.disabled
                                          ? 'تم تفعيل صلاحيات المدير'
                                          : 'تم إيقاف صلاحيات المدير مؤقتاً'
                                        : adm.disabled
                                        ? 'Admin access re-enabled'
                                        : 'Admin access disabled',
                                      'info'
                                    );
                                  } catch (err: any) {
                                    showToast(err?.message || 'Failed to update admin', 'error');
                                  } finally {
                                    setAdminManageBusy(false);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] cursor-pointer"
                              >
                                {adm.disabled
                                  ? locale === 'ar'
                                    ? 'تفعيل'
                                    : 'Enable'
                                  : locale === 'ar'
                                  ? 'إيقاف مؤقت'
                                  : 'Disable'}
                              </button>

                              <button
                                type="button"
                                disabled={adminManageBusy}
                                onClick={async () => {
                                  if (!adminSession) return;
                                  setAdminManageBusy(true);
                                  try {
                                    const res = await fetch(`/api/cms/admins/manage/${encodeURIComponent(adm.id)}`, {
                                      method: 'DELETE',
                                      headers: {
                                        Authorization: `Bearer ${adminSession.token}`,
                                      },
                                    });
                                    if (!res.ok) {
                                      const err = await res.json().catch(() => ({}));
                                      throw new Error(err.error || 'Delete failed');
                                    }
                                    await refreshData();
                                    showToast(
                                      locale === 'ar'
                                        ? 'تم حذف المدير وإلغاء صلاحياته'
                                        : 'Administrator removed',
                                      'info'
                                    );
                                  } catch (err: any) {
                                    showToast(err?.message || 'Failed to remove admin', 'error');
                                  } finally {
                                    setAdminManageBusy(false);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-950/30 cursor-pointer"
                                title={locale === 'ar' ? 'حذف المدير' : 'Remove Admin'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL: EDIT PROJECT */}
      {/* ===================================================================== */}
      {editingProject && (
        <div className="fixed inset-0 z-[9992] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'تحرير بيانات المشروع' : 'Edit Project'}
              </h3>
              <button onClick={() => setEditingProject(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1">Title (AR) *</label>
                <input
                  type="text"
                  value={editingProject.title?.ar || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      title: { ar: e.target.value, en: editingProject.title?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Title (EN) *</label>
                <input
                  type="text"
                  value={editingProject.title?.en || ''}
                  onChange={(e) => {
                    const enVal = e.target.value;
                    setEditingProject({
                      ...editingProject,
                      title: { ar: editingProject.title?.ar || '', en: enVal },
                      slug: editingProject.slug || slugifyText(enVal),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">URL Slug *</label>
                <input
                  type="text"
                  value={editingProject.slug || ''}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, slug: slugifyText(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Cover Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingProject.coverImage || ''}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, coverImage: e.target.value })
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImagePickerCallback(() => (url: string) =>
                        setEditingProject((prev) => (prev ? { ...prev, coverImage: url } : null))
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 font-semibold shrink-0"
                  >
                    {locale === 'ar' ? 'اختر' : 'Pick'}
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Summary (AR) *</label>
                <textarea
                  rows={2}
                  value={editingProject.summary?.ar || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      summary: { ar: e.target.value, en: editingProject.summary?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Summary (EN) *</label>
                <textarea
                  rows={2}
                  value={editingProject.summary?.en || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      summary: { ar: editingProject.summary?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Full Description (AR)</label>
                <textarea
                  rows={3}
                  value={editingProject.description?.ar || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      description: { ar: e.target.value, en: editingProject.description?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Full Description (EN)</label>
                <textarea
                  rows={3}
                  value={editingProject.description?.en || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      description: { ar: editingProject.description?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">The Problem / Challenge (AR)</label>
                <textarea
                  rows={2}
                  value={editingProject.problem?.ar || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      problem: { ar: e.target.value, en: editingProject.problem?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">The Problem / Challenge (EN)</label>
                <textarea
                  rows={2}
                  value={editingProject.problem?.en || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      problem: { ar: editingProject.problem?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Engineered Solution (AR)</label>
                <textarea
                  rows={2}
                  value={editingProject.solution?.ar || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      solution: { ar: e.target.value, en: editingProject.solution?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Engineered Solution (EN)</label>
                <textarea
                  rows={2}
                  value={editingProject.solution?.en || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      solution: { ar: editingProject.solution?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingProject.published)}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, published: e.target.checked })
                  }
                />
                <span>
                  {locale === 'ar' ? 'نشر المشروع للجمهور (Published)' : 'Publish Project Live'}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-800"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    const check = validateProjectPayload(editingProject);
                    if (!check.valid) {
                      showToast(check.errors.join(' '), 'error');
                      return;
                    }
                    await upsertRecord('projects', editingProject);
                    setEditingProject(null);
                  }}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950"
                >
                  {locale === 'ar' ? 'حفظ المشروع' : 'Save Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT CLINIC */}
      {/* ===================================================================== */}
      {editingClinic && (
        <div className="fixed inset-0 z-[9992] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'تحرير صفحة العيادة' : 'Edit Medical Clinic Landing Page'}
              </h3>
              <button onClick={() => setEditingClinic(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-medium mb-1">Clinic Name (AR) *</label>
                <input
                  type="text"
                  value={editingClinic.name?.ar || ''}
                  onChange={(e) =>
                    setEditingClinic({
                      ...editingClinic,
                      name: { ar: e.target.value, en: editingClinic.name?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Clinic Name (EN) *</label>
                <input
                  type="text"
                  value={editingClinic.name?.en || ''}
                  onChange={(e) => {
                    const enVal = e.target.value;
                    setEditingClinic({
                      ...editingClinic,
                      name: { ar: editingClinic.name?.ar || '', en: enVal },
                      slug: editingClinic.slug || slugifyText(enVal),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Clinic Slug *</label>
                <input
                  type="text"
                  value={editingClinic.slug || ''}
                  onChange={(e) =>
                    setEditingClinic({ ...editingClinic, slug: slugifyText(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingClinic.phone || ''}
                  onChange={(e) => setEditingClinic({ ...editingClinic, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Clinic Brand Theme Color (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingClinic.themeColor || '#0D9488'}
                    onChange={(e) =>
                      setEditingClinic({ ...editingClinic, themeColor: e.target.value })
                    }
                    className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingClinic.themeColor || '#0D9488'}
                    onChange={(e) =>
                      setEditingClinic({ ...editingClinic, themeColor: e.target.value })
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Google Maps Embed URL</label>
                <input
                  type="text"
                  value={editingClinic.mapEmbedUrl || ''}
                  onChange={(e) =>
                    setEditingClinic({ ...editingClinic, mapEmbedUrl: e.target.value })
                  }
                  placeholder="https://www.google.com/maps/embed?..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Tagline (AR)</label>
                <input
                  type="text"
                  value={editingClinic.tagline?.ar || ''}
                  onChange={(e) =>
                    setEditingClinic({
                      ...editingClinic,
                      tagline: { ar: e.target.value, en: editingClinic.tagline?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Tagline (EN)</label>
                <input
                  type="text"
                  value={editingClinic.tagline?.en || ''}
                  onChange={(e) =>
                    setEditingClinic({
                      ...editingClinic,
                      tagline: { ar: editingClinic.tagline?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Description (AR)</label>
                <textarea
                  rows={2}
                  value={editingClinic.description?.ar || ''}
                  onChange={(e) =>
                    setEditingClinic({
                      ...editingClinic,
                      description: { ar: e.target.value, en: editingClinic.description?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Description (EN)</label>
                <textarea
                  rows={2}
                  value={editingClinic.description?.en || ''}
                  onChange={(e) =>
                    setEditingClinic({
                      ...editingClinic,
                      description: { ar: editingClinic.description?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingClinic.published)}
                    onChange={(e) =>
                      setEditingClinic({ ...editingClinic, published: e.target.checked })
                    }
                  />
                  <span>{locale === 'ar' ? 'منشور للجمهور' : 'Published'}</span>
                </label>

                <label className="inline-flex items-center gap-2 font-semibold cursor-pointer text-[#00C2CB]">
                  <input
                    type="checkbox"
                    checked={Boolean(editingClinic.standaloneByDefault)}
                    onChange={(e) =>
                      setEditingClinic({
                        ...editingClinic,
                        standaloneByDefault: e.target.checked,
                      })
                    }
                  />
                  <span>
                    {locale === 'ar'
                      ? 'تفعيل العرض المستقل افتراضياً (Standalone Mode)'
                      : 'Standalone Layout by Default'}
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingClinic(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    const check = validateClinicPayload(editingClinic);
                    if (!check.valid) {
                      showToast(check.errors.join(' '), 'error');
                      return;
                    }
                    await upsertRecord('clinics', editingClinic);
                    setEditingClinic(null);
                  }}
                  className="px-5 py-2 rounded-lg font-semibold bg-[#00C2CB] text-slate-950"
                >
                  {locale === 'ar' ? 'حفظ العيادة' : 'Save Clinic'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT DOCTOR */}
      {/* ===================================================================== */}
      {editingDoctor && (
        <div className="fixed inset-0 z-[9992] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {locale === 'ar' ? 'بيانات الطبيب والتخصص' : 'Edit Doctor Profile'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Clinic</label>
                <select
                  value={editingDoctor.clinicId || ''}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, clinicId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                >
                  {db.clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.ar} — {c.name.en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Doctor Name (AR) *</label>
                <input
                  type="text"
                  value={editingDoctor.name?.ar || ''}
                  onChange={(e) =>
                    setEditingDoctor({
                      ...editingDoctor,
                      name: { ar: e.target.value, en: editingDoctor.name?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Doctor Name (EN) *</label>
                <input
                  type="text"
                  value={editingDoctor.name?.en || ''}
                  onChange={(e) =>
                    setEditingDoctor({
                      ...editingDoctor,
                      name: { ar: editingDoctor.name?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Specialty (AR) *</label>
                <input
                  type="text"
                  value={editingDoctor.specialty?.ar || ''}
                  onChange={(e) =>
                    setEditingDoctor({
                      ...editingDoctor,
                      specialty: { ar: e.target.value, en: editingDoctor.specialty?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Specialty (EN) *</label>
                <input
                  type="text"
                  value={editingDoctor.specialty?.en || ''}
                  onChange={(e) =>
                    setEditingDoctor({
                      ...editingDoctor,
                      specialty: { ar: editingDoctor.specialty?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Consultation Fee (EGP)</label>
                <input
                  type="number"
                  value={editingDoctor.consultationFee ?? 250}
                  onChange={(e) =>
                    setEditingDoctor({
                      ...editingDoctor,
                      consultationFee: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingDoctor(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  const check = validateDoctorPayload(editingDoctor);
                  if (!check.valid) {
                    showToast(check.errors.join(' '), 'error');
                    return;
                  }
                  await upsertRecord('doctors', editingDoctor);
                  setEditingDoctor(null);
                }}
                className="px-5 py-2 rounded-lg font-semibold bg-[#00C2CB] text-slate-950"
              >
                {locale === 'ar' ? 'حفظ الطبيب' : 'Save Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT SERVICE & PRICE */}
      {/* ===================================================================== */}
      {editingService && (
        <div className="fixed inset-0 z-[9992] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {locale === 'ar' ? 'تحرير الخدمة والسعر' : 'Edit Service & Pricing'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Clinic</label>
                <select
                  value={editingService.clinicId || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, clinicId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                >
                  {db.clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.ar} — {c.name.en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Service Name (AR) *</label>
                <input
                  type="text"
                  value={editingService.name?.ar || ''}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      name: { ar: e.target.value, en: editingService.name?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Service Name (EN) *</label>
                <input
                  type="text"
                  value={editingService.name?.en || ''}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      name: { ar: editingService.name?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Price *</label>
                <input
                  type="number"
                  value={editingService.price ?? 0}
                  onChange={(e) =>
                    setEditingService({ ...editingService, price: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  value={editingService.durationMinutes ?? 25}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingService(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  const check = validateServicePayload(editingService);
                  if (!check.valid) {
                    showToast(check.errors.join(' '), 'error');
                    return;
                  }
                  await upsertRecord('services', editingService);
                  setEditingService(null);
                }}
                className="px-5 py-2 rounded-lg font-semibold bg-[#00C2CB] text-slate-950"
              >
                {locale === 'ar' ? 'حفظ الخدمة' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* WIDE 4-TAB TIPTAP ARTICLE EDITOR (Content / Details / SEO / Publish)  */}
      {/* ===================================================================== */}
      {editingArticle && (
        <ArticleEditor
          initialArticle={editingArticle}
          isNew={editingArticleIsNew}
          existingArticles={db.articles || []}
          db={db}
          locale={locale}
          onClose={() => {
            setEditingArticle(null);
            setEditingArticleIsNew(false);
          }}
          onSave={async (updatedArticle) => {
            await upsertRecord('articles', updatedArticle);
            setEditingArticle(null);
            setEditingArticleIsNew(false);
          }}
          onOpenImagePicker={(cb) => setImagePickerCallback(() => cb)}
          onShowToast={showToast}
        />
      )}

      {/* ===================================================================== */}
      {/* WIDE 5-TAB PAGE EDITOR (Content / Design / SEO / Preview / Publish)   */}
      {/* ===================================================================== */}
      {editingPage && (
        <PageEditor
          initialPage={editingPage}
          isNew={editingPageIsNew}
          existingPages={db.pages || []}
          locale={locale}
          onClose={() => {
            setEditingPage(null);
            setEditingPageIsNew(false);
          }}
          onSave={async (updatedPage) => {
            const savedPage = await upsertRecord('pages', updatedPage);
            if (
              savedPage &&
              (savedPage.id === 'home' || savedPage.slug === 'home') &&
              savedPage.heroImage &&
              savedPage.heroImage !== db.siteSettings?.avatarUrl
            ) {
              await saveSiteSettings({
                ...db.siteSettings,
                avatarUrl: savedPage.heroImage,
              }).catch(() => {});
            }
            setEditingPage(null);
            setEditingPageIsNew(false);
          }}
          onOpenImagePicker={(cb) => setImagePickerCallback(() => cb)}
          onShowToast={showToast}
        />
      )}

      {/* ===================================================================== */}
      {/* MODAL: ENHANCED MEDIA LIBRARY PICKER & QUICK UPLOAD                   */}
      {/* ===================================================================== */}
      {imagePickerCallback && (() => {
        const pq = pickerSearch.trim().toLowerCase();
        const pickerItems = db.media.filter((m) => {
          if (pickerCategory !== 'all' && m.category !== pickerCategory) return false;
          if (!pq) return true;
          return (
            m.alt.ar.toLowerCase().includes(pq) ||
            m.alt.en.toLowerCase().includes(pq) ||
            m.publicId.toLowerCase().includes(pq)
          );
        });

        return (
          <div
            onClick={() => setImagePickerCallback(null)}
            className="fixed inset-0 z-[9996] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[88vh] flex flex-col"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {locale === 'ar'
                      ? 'اختيار أو رفع صورة مضغوطة من مكتبة الوسائط'
                      : 'Select or Upload Compressed Image'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {locale === 'ar'
                      ? 'اضغط على أي صورة لإدراجها فوراً، أو ارفع صورة جديدة مع معاينة الضغط.'
                      : 'Click any image to insert, or compress & upload a new image right from here.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] hover:text-white transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'رفع وضغط صورة جديدة' : 'Upload & Compress'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploadingMedia}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        const cb = imagePickerCallback;
                        openCompressionPreviewForFile(file, (uploadedUrl) => {
                          cb(uploadedUrl);
                          setImagePickerCallback(null);
                        });
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setImagePickerCallback(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search + Category Filter inside Picker */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder={
                      locale === 'ar' ? 'ابحث في الصور...' : 'Search media assets...'
                    }
                    className="w-full ps-8 pe-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <select
                  value={pickerCategory}
                  onChange={(e) => setPickerCategory(e.target.value as any)}
                  className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                >
                  <option value="all">{locale === 'ar' ? 'كل التصنيفات' : 'All'}</option>
                  <option value="blog">Blog</option>
                  <option value="project">Projects</option>
                  <option value="clinic">Clinics</option>
                  <option value="profile">Profile</option>
                  <option value="general">General</option>
                </select>
              </div>

              {pickerItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {locale === 'ar'
                    ? 'لا توجد صور مطابقة — يمكنك رفع وضغط صورة جديدة الآن.'
                    : 'No matching images — use Upload & Compress above to add one.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pr-1">
                  {pickerItems.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        imagePickerCallback(m.secureUrl);
                        setImagePickerCallback(null);
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB] bg-[#070E1A] flex flex-col items-center gap-2 text-center cursor-pointer transition-colors"
                    >
                      <OptimizedImage
                        src={m.secureUrl}
                        alt={m.alt[locale]}
                        width={400}
                        containerClassName="relative w-full h-24 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center"
                        className="w-full h-full object-contain"
                      />
                      <span className="text-[11px] font-semibold text-slate-200 truncate w-full">
                        {m.alt[locale] || m.publicId}
                      </span>
                      <span className="text-[10px] font-mono-tabular text-slate-400">
                        {m.width}×{m.height} · {m.format.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* MODAL: EDIT MEDIA ALT TEXT & CATEGORY                                 */}
      {/* ===================================================================== */}
      {editingMediaAlt && (
        <div
          onClick={() => setEditingMediaAlt(null)}
          className="fixed inset-0 z-[9997] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'تعديل بيانات الصورة البديلة' : 'Edit Media Alt & Category'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMediaAlt(null)}
                className="text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Alt (AR)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={editingMediaAlt.alt.ar}
                  onChange={(e) =>
                    setEditingMediaAlt({
                      ...editingMediaAlt,
                      alt: { ...editingMediaAlt.alt, ar: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Alt (EN)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingMediaAlt.alt.en}
                  onChange={(e) =>
                    setEditingMediaAlt({
                      ...editingMediaAlt,
                      alt: { ...editingMediaAlt.alt, en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {locale === 'ar' ? 'التصنيف' : 'Category'}
                </label>
                <select
                  value={editingMediaAlt.category}
                  onChange={(e) =>
                    setEditingMediaAlt({
                      ...editingMediaAlt,
                      category: e.target.value as MediaAsset['category'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                >
                  <option value="general">General</option>
                  <option value="profile">Profile / About</option>
                  <option value="project">Project / System</option>
                  <option value="clinic">Medical Clinic</option>
                  <option value="blog">Blog Article</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMediaAlt(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await upsertRecord('media', editingMediaAlt);
                  setEditingMediaAlt(null);
                  showToast(
                    locale === 'ar' ? 'تم تحديث بيانات الصورة' : 'Media metadata updated',
                    'success'
                  );
                }}
                className="px-4 py-2 rounded-xl font-bold bg-[#00C2CB] text-slate-950 cursor-pointer"
              >
                {locale === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PRE-UPLOAD IMAGE COMPRESSION & QUALITY PREVIEW (z-[9998])      */}
      {/* ===================================================================== */}
      {pendingUploadPayload && (
        <ImageUploadPreviewModal
          file={pendingUploadPayload.file}
          locale={locale}
          initialAltAr={mediaAltAr}
          initialAltEn={mediaAltEn}
          initialCategory={mediaCategory}
          replacingAsset={replacingMediaItem}
          cloudinaryConfigured={cloudinaryStatus?.configured}
          uploading={uploadingMedia}
          onCancel={() => setPendingUploadPayload(null)}
          onConfirmUpload={handleConfirmCompressedUpload}
        />
      )}

      {/* ===================================================================== */}
      {/* MODAL: LIVE PREVIEW BEFORE PUBLISHING */}
      {/* ===================================================================== */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-[9995] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#00C2CB]">{previewItem.type} Preview</span>
                <span>·</span>
                <span>{previewItem.published ? 'Published' : 'Draft Mode'}</span>
              </div>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            {previewItem.image && (
              <div className="h-48 rounded-xl bg-[#070E1A] p-4 flex items-center justify-center">
                <img
                  src={previewItem.image}
                  alt={previewItem.title}
                  className="max-h-full object-contain"
                />
              </div>
            )}
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {previewItem.title}
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {previewItem.subtitle}
            </p>
            <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {previewItem.body}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: MOVE CUSTOM PAGE TO TRASH / ARCHIVE (SOFT DELETE) */}
      {/* ===================================================================== */}
      {pageTrashConfirm && (
        <div
          onClick={() => setPageTrashConfirm(null)}
          className="fixed inset-0 z-[9997] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-amber-500/40 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'نقل الصفحة إلى سلة المحذوفات'
                  : 'Move Page to Trash / Archive'}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                {pageTrashConfirm.title.ar} — {pageTrashConfirm.title.en}
              </div>
              <div className="font-mono-tabular text-[#00C2CB]">
                {getPageCanonicalPath(pageTrashConfirm, locale)}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {locale === 'ar'
                ? 'سيتم تحويل هذه الصفحة إلى مسودة ونقلها إلى الأرشيف، فتختفي فوراً عن الزوار ومن Sitemap دون فقدان بياناتها، ويمكنك استعادتها أو حذفها نهائياً لاحقاً.'
                : 'This page will be converted to draft and moved to Trash—immediately hiding it from public visitors and sitemap while allowing full recovery later.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPageTrashConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = pageTrashConfirm;
                  setPageTrashConfirm(null);
                  await upsertRecord('pages', {
                    ...target,
                    published: false,
                    archived: true,
                    archivedAt: new Date().toISOString(),
                  });
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer"
              >
                {locale === 'ar' ? 'نقل للأرشيف كمسودة' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: MOVE ARTICLE TO TRASH / ARCHIVE (SOFT DELETE) */}
      {/* ===================================================================== */}
      {articleTrashConfirm && (
        <div
          onClick={() => setArticleTrashConfirm(null)}
          className="fixed inset-0 z-[9997] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-amber-500/40 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'نقل المقال إلى سلة المحذوفات'
                  : 'Move Article to Trash / Archive'}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                {articleTrashConfirm.title.ar} — {articleTrashConfirm.title.en}
              </div>
              <div className="font-mono-tabular text-[#00C2CB]">
                /{locale}/blog/{articleTrashConfirm.slug}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {locale === 'ar'
                ? 'سيتم تحويل هذا المقال إلى حالة مسودة ونقله إلى الأرشيف، فيختفي فوراً من المدونة العامة وملف Sitemap دون فقدان محتواه، ويمكنك استعادته أو حذفه نهائياً لاحقاً.'
                : 'This article will be converted to draft and moved to Trash—immediately hiding it from the public blog and sitemap while allowing full recovery later.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setArticleTrashConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = articleTrashConfirm;
                  setArticleTrashConfirm(null);
                  await upsertRecord('articles', {
                    ...target,
                    published: false,
                    archived: true,
                    archivedAt: new Date().toISOString(),
                  });
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer"
              >
                {locale === 'ar' ? 'نقل للأرشيف كمسودة' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELETE CONFIRMATION (WITH LITERAL NAME GUARD WHEN REQUIRED) */}
      {/* ===================================================================== */}
      {deleteConfirm && (
        <div
          onClick={() => {
            setDeleteConfirm(null);
            setDeleteConfirmLiteralInput('');
          }}
          className="fixed inset-0 z-[9997] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-red-500/40 p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Permanent Deletion'}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {locale === 'ar'
                ? `هل أنت متأكد من رغبتك في حذف "${deleteConfirm.title}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to permanently delete "${deleteConfirm.title}"? This action cannot be undone.`}
            </p>

            {deleteConfirm.requireLiteralConfirm && deleteConfirm.expectedLiteralName && (
              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-700 dark:text-slate-200">
                  {locale === 'ar'
                    ? 'لتأكيد الحذف النهائي، اكتب الاسم المطابق حرفياً:'
                    : 'Type the exact name below to confirm permanent deletion:'}
                </label>
                <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#070E1A] font-bold text-[#00C2CB] select-all">
                  {deleteConfirm.expectedLiteralName}
                </div>
                <input
                  type="text"
                  value={deleteConfirmLiteralInput}
                  onChange={(e) => setDeleteConfirmLiteralInput(e.target.value)}
                  placeholder={deleteConfirm.expectedLiteralName}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-red-500/40 text-xs focus:outline-none focus:border-red-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteConfirmLiteralInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                disabled={
                  Boolean(deleteConfirm.requireLiteralConfirm) &&
                  deleteConfirmLiteralInput.trim() !==
                    (deleteConfirm.expectedLiteralName || '').trim()
                }
                onClick={async () => {
                  const target = deleteConfirm;
                  setDeleteConfirm(null);
                  setDeleteConfirmLiteralInput('');
                  await deleteRecord(target.collection, target.id);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {locale === 'ar' ? 'نعم، احذف نهائياً' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===================================================================== */}
      {/* MODAL: CONFIRM BASELINE SYNC (SENSITIVE OPERATION PROTECTION) */}
      {/* ===================================================================== */}
      {confirmSeedOpen && (
        <div
          onClick={() => setConfirmSeedOpen(false)}
          className="fixed inset-0 z-[9997] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-[#00C2CB]">
              <Database className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'تأكيد مزامنة البيانات الأساسية'
                  : 'Confirm Baseline Synchronization'}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {locale === 'ar'
                ? 'سيتم مزامنة العناصر الافتراضية المفقودة فقط دون حذف مقالاتك أو صفحاتك المخصصة. هل تريد المتابعة؟'
                : 'This will synchronize missing default baseline records without deleting your custom articles or pages. Proceed?'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSeedOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmSeedOpen(false);
                  await seedBaselineDatabase();
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] cursor-pointer"
              >
                {locale === 'ar' ? 'تأكيد المزامنة' : 'Confirm Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutResolver>
  );
};
