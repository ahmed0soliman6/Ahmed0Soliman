import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  validateProjectPayload,
  validateClinicPayload,
  validateDoctorPayload,
  validateServicePayload,
  validateArticlePayload,
  validatePagePayload,
  validateImageUploadFile,
  checkMediaInPublishedContent,
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
  LayoutDashboard,
  FolderKanban,
  Building2,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Settings,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Search,
  Check,
  X,
  Upload,
  ShieldCheck,
  Database,
  Globe,
  Sun,
  Moon,
  ExternalLink,
  AlertTriangle,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface AdminDashboardProps {
  subRoute: 'overview' | 'projects' | 'clinics' | 'pages' | 'blog' | 'media' | 'settings';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ subRoute }) => {
  const {
    locale,
    setLocale,
    theme,
    toggleTheme,
    navigate,
    db,
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

  // Login Gate State
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Search & Filter inside Admin lists
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Clinic Sub-tab: 'clinics' | 'doctors' | 'services'
  const [clinicSubTab, setClinicSubTab] = useState<'clinics' | 'doctors' | 'services'>('clinics');

  // Modals State
  const [editingProject, setEditingProject] = useState<Partial<ProjectItem> | null>(null);
  const [editingClinic, setEditingClinic] = useState<Partial<ClinicItem> | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Partial<DoctorItem> | null>(null);
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);
  const [editingArticle, setEditingArticle] = useState<Partial<ArticleItem> | null>(null);
  const [editingPage, setEditingPage] = useState<Partial<PageConfig> | null>(null);
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
  } | null>(null);

  // Cover Image Picker Modal
  const [imagePickerCallback, setImagePickerCallback] = useState<
    ((selectedUrl: string) => void) | null
  >(null);

  // Cloudinary Upload State
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

  // ---------------------------------------------------------------------------
  // RENDER ADMIN AUTHENTICATION GATE IF NOT LOGGED IN (Google + Firebase ID Token)
  // ---------------------------------------------------------------------------
  if (!adminSession) {
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

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
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-7 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#00C2CB]">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {locale === 'ar' ? 'بوابة إدارة المنصة المحمية' : 'Protected Admin CMS Gate'}
                </span>
              </div>
              <button
                onClick={() => navigate(`/${locale}`)}
                className="text-xs text-slate-500 hover:text-[#00C2CB]"
              >
                {locale === 'ar' ? 'العودة للموقع ←' : '← Back to Site'}
              </button>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'تسجيل دخول المدير عبر Google'
                  : 'Authorized Admin Sign-In'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {locale === 'ar'
                  ? 'الدخول مقصور على حساب Google المعتمد، مع التحقق التشفيري من Firebase ID Token على الخادم ومطابقة UID في وثيقة admins.'
                  : 'Access is restricted exclusively to the authorized Google account, verified server-side via Firebase ID Token and /admins/{uid}.'}
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/80 text-xs text-red-200 space-y-2">
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
              className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {loginLoading
                  ? locale === 'ar'
                    ? 'جاري التحقق من توقيع Firebase ID Token...'
                    : 'Verifying Firebase ID Token...'
                  : locale === 'ar'
                  ? 'الدخول باستخدام Google (Firebase Auth)'
                  : 'Sign In with Google (Firebase Auth)'}
              </span>
            </button>

            {/* Current Domain Copy Helper for Firebase Authorized Domains */}
            {currentDomain && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {locale === 'ar'
                    ? 'لتجنب خطأ (auth/unauthorized-domain) أضف هذا النطاق في Firebase:'
                    : 'To prevent (auth/unauthorized-domain), add this domain in Firebase:'}
                </div>
                <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <code className="text-[11px] text-[#00C2CB] truncate font-mono">
                    {currentDomain}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(currentDomain);
                      showToast(
                        locale === 'ar'
                          ? 'تم نسخ النطاق! أضفه في Authentication -> Settings -> Authorized domains'
                          : 'Domain copied! Add it in Authentication -> Settings -> Authorized domains',
                        'info'
                      );
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#00C2CB] hover:text-slate-950 text-slate-700 dark:text-slate-200 font-semibold shrink-0 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{locale === 'ar' ? 'نسخ النطاق' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {!isFirebaseConnected && (
              <form
                onSubmit={handleSavePublicClientConfig}
                className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/60 space-y-3 text-xs"
              >
                <div className="flex items-start gap-2 text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {locale === 'ar'
                      ? 'لم يتم العثور على VITE_FIREBASE_API_KEY وقت البناء. يمكنك لصق مفتاح الويب العام ومعرّف المشروع لتفعيل زر Google فوراً:'
                      : 'VITE_FIREBASE_API_KEY was not baked at build time. Paste your public Web API Key and Project ID to enable Google Sign-In:'}
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageUploadFile(file);
    if (!validation.valid) {
      showToast(validation.errors.join(' '), 'error');
      e.target.value = '';
      return;
    }

    setUploadingMedia(true);
    try {
      // 1. Request Server-Side Signed Upload Signature
      const signRes = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify({
          fileType: file.type,
          fileSize: file.size,
        }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) {
        throw new Error(signData.error || 'Failed to sign upload');
      }

      let finalSecureUrl = '';
      let finalPublicId = '';
      let width = 1200;
      let height = 800;

      if (signData.configured) {
        // Upload directly to Cloudinary using the server-generated signature
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signData.apiKey);
        formData.append('timestamp', String(signData.timestamp));
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadJson?.error?.message || 'Cloudinary upload failed');
        }
        finalSecureUrl = uploadJson.secure_url;
        finalPublicId = uploadJson.public_id;
        width = uploadJson.width || 1200;
        height = uploadJson.height || 800;
      } else {
        // Fallback data-URL optimization when Cloudinary env vars are not yet added on server
        finalSecureUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Failed to read image file'));
          reader.readAsDataURL(file);
        });
        finalPublicId = `local/${Date.now()}-${slugifyText(file.name.replace(/\.[^.]+$/, ''))}`;
      }

      const mediaRecord: MediaAsset = {
        id: replacingMediaItem ? replacingMediaItem.id : `media-${Date.now()}`,
        publicId: finalPublicId,
        secureUrl: finalSecureUrl,
        format: file.type.split('/')[1] || 'webp',
        width,
        height,
        bytes: file.size,
        alt: {
          ar: mediaAltAr.trim() || file.name,
          en: mediaAltEn.trim() || file.name,
        },
        category: mediaCategory,
        createdAt: replacingMediaItem?.createdAt || new Date().toISOString(),
      };

      await upsertRecord('media', mediaRecord);
      setMediaAltAr('');
      setMediaAltEn('');
      setReplacingMediaItem(null);
    } catch (err: any) {
      showToast(err?.message || 'Upload failed', 'error');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
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

  const sidebarItems = [
    {
      id: 'overview',
      path: '/admin',
      label: locale === 'ar' ? 'لوحة القيادة' : 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'pages',
      path: '/admin/pages',
      label: locale === 'ar' ? 'الرئيسية والملف الشخصي' : 'Home & Profile Pages',
      icon: FileText,
    },
    {
      id: 'projects',
      path: '/admin/projects',
      label: locale === 'ar' ? 'إدارة المشروعات' : 'Projects',
      icon: FolderKanban,
    },
    {
      id: 'clinics',
      path: '/admin/clinics',
      label: locale === 'ar' ? 'العيادات والأطباء والخدمات' : 'Clinics, Doctors & Services',
      icon: Building2,
    },
    {
      id: 'blog',
      path: '/admin/blog',
      label: locale === 'ar' ? 'المقالات والمدونة' : 'Blog Articles',
      icon: BookOpen,
    },
    {
      id: 'media',
      path: '/admin/media',
      label: locale === 'ar' ? 'مكتبة الصور (Cloudinary)' : 'Cloudinary Media',
      icon: ImageIcon,
    },
    {
      id: 'settings',
      path: '/admin/settings',
      label: locale === 'ar' ? 'الهوية وFirebase وSEO' : 'Settings, Firebase & SEO',
      icon: Settings,
    },
  ] as const;

  return (
    <LayoutResolver>
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#070E1A]">
        {/* SAAS SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-68 shrink-0 bg-white dark:bg-[#0F172A] border-b lg:border-b-0 lg:border-e border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  Ahmed Soliman CMS
                </div>
                <div className="text-xs text-[#00C2CB] font-mono-tabular">
                  UID: {adminSession.uid.slice(0, 16)}
                </div>
              </div>
              <button
                onClick={() => navigate(`/${locale}`)}
                className="p-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB]"
                title={locale === 'ar' ? 'معاينة الموقع العام' : 'View Live Website'}
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = subRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#00C2CB] text-slate-950'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden lg:flex flex-col gap-3 p-5 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <button
                onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                className="inline-flex items-center gap-1.5 hover:text-[#00C2CB]"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 hover:text-[#00C2CB]"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>

            <button
              onClick={logoutAdmin}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-950/30 border border-red-500/30 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE VIEWPORT */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Breadcrumb Bar */}
          <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              <span>Admin CMS</span>
              <span>/</span>
              <span className="font-bold text-slate-900 dark:text-white capitalize">
                {subRoute}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => refreshData()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'تحديث البيانات' : 'Revalidate Cache'}</span>
              </button>

              <button
                onClick={() => navigate(`/${locale}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'فتح الموقع العام' : 'Open Public Site'}</span>
              </button>
            </div>
          </header>

          <div className="p-6 sm:p-8 space-y-8 max-w-6xl">
            {/* =============================================================== */}
            {/* TAB 1: OVERVIEW (/admin) */}
            {/* =============================================================== */}
            {subRoute === 'overview' && (
              <div className="space-y-8">
                {/* 1. SCREENSHOT 3.5 WELCOME BACK BANNER + FEATURED CARD */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-8 rounded-2xl bg-gradient-to-r from-[#0A251E] via-[#0F352B] to-[#134E4A] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg">
                    <div className="space-y-2.5 max-w-lg">
                      <div className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                        {locale === 'ar' ? 'لوحة القيادة والتحليلات' : 'EXECUTIVE ANALYTICS CMS'}
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold">
                        {locale === 'ar'
                          ? 'مرحباً بعودتك 👋 أحمد سليمان'
                          : 'Welcome back 👋 Ahmed Soliman'}
                      </h1>
                      <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                        {locale === 'ar'
                          ? 'تحكم كامل في المشروعات، صفحات العيادات المستقلة، الشعارات والصور، المقالات، وإظهار أو إخفاء أي صفحة فوراً.'
                          : 'Manage projects, standalone clinic pages, logos & images, articles, page visibility, and visitor analytics.'}
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => navigate('/admin/projects')}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-colors cursor-pointer"
                        >
                          {locale === 'ar' ? '+ إضافة / تعديل مشروع' : '+ Manage Projects'}
                        </button>
                        <button
                          type="button"
                          onClick={seedBaselineDatabase}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
                        >
                          {locale === 'ar' ? 'تحديث البيانات الأساسية' : 'Sync Seed Data'}
                        </button>
                      </div>
                    </div>

                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-400/50 shrink-0 bg-slate-950">
                      <OptimizedImage
                        src={db.siteSettings.avatarUrl}
                        alt={db.siteSettings.ownerName[locale]}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>

                  {/* Right 4 Cols Featured Highlight Card matching Screenshot 3.5 */}
                  <div className="lg:col-span-4 rounded-2xl bg-[#0F172A] text-white p-6 border border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-lg">
                    <div className="space-y-1.5 relative z-10">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C2CB]">
                        {locale === 'ar' ? 'حالة المنصة المباشرة' : 'PLATFORM STATUS'}
                      </span>
                      <h2 className="text-lg font-extrabold">
                        {locale === 'ar'
                          ? 'جميع الأقسام الخمسة نشطة ومتصلة'
                          : 'All 5 Platform Worlds Live'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {locale === 'ar'
                          ? `${db.projects.filter((p) => p.published).length} مشروعات منشورة · ${
                              db.clinics.filter((c) => c.published).length
                            } عيادات مستقلة · ${
                              db.articles.filter((a) => a.published).length
                            } مقالات`
                          : `${db.projects.filter((p) => p.published).length} Published Projects · ${
                              db.clinics.filter((c) => c.published).length
                            } Clinics · ${db.articles.filter((a) => a.published).length} Articles`}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between text-xs border-t border-slate-800/80 mt-4">
                      <span className="text-emerald-400 font-bold">
                        {cloudinaryStatus?.configured ? 'Cloudinary CDN Ready' : 'Media Library Ready'}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/pages')}
                        className="text-[#00C2CB] font-bold hover:underline cursor-pointer"
                      >
                        {locale === 'ar' ? 'التحكم في الصفحات ←' : 'Page Visibility →'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. REAL CONTENT COUNTS KPI CARDS WITH MINI BAR SPARKLINES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'الصفحات المنشورة حالياً'
                          : 'Published Platform Pages'}
                      </div>
                      <div className="text-3xl font-black font-mono-tabular text-slate-900 dark:text-white">
                        {db.pages.filter((p) => p.published).length} / {db.pages.length}
                      </div>
                      <div className="text-xs font-bold text-emerald-600">
                        {locale === 'ar' ? 'تحكم فوري بالإظهار والإخفاء' : 'Instant Hide/Show Control'}
                      </div>
                    </div>
                    {/* Mini Emerald Bar Sparkline */}
                    <div className="flex items-end gap-1 h-12">
                      {[40, 65, 50, 85, 60, 95, 75].map((h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h}%` }}
                          className="w-2 rounded-t bg-emerald-500"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'المشروعات والأنظمة المنشورة'
                          : 'Published Projects & Systems'}
                      </div>
                      <div className="text-3xl font-black font-mono-tabular text-slate-900 dark:text-white">
                        {db.projects.filter((p) => p.published).length} / {db.projects.length}
                      </div>
                      <div className="text-xs font-bold text-sky-500 font-mono-tabular">
                        {db.clinics.filter((c) => c.published).length}{' '}
                        {locale === 'ar' ? 'عيادات منشورة' : 'published clinics'}
                      </div>
                    </div>
                    {/* Mini Sky Blue Bar Sparkline */}
                    <div className="flex items-end gap-1 h-12">
                      {[35, 55, 70, 60, 90, 65, 80].map((h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h}%` }}
                          className="w-2 rounded-t bg-sky-500"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'الأطباء والخدمات والمقالات'
                          : 'Doctors, Services & Articles'}
                      </div>
                      <div className="text-3xl font-black font-mono-tabular text-slate-900 dark:text-white">
                        {db.doctors.length + db.services.length + db.articles.length}
                      </div>
                      <div className="text-xs font-bold text-amber-500 font-mono-tabular">
                        {db.doctors.length} {locale === 'ar' ? 'أطباء' : 'doctors'} ·{' '}
                        {db.services.length} {locale === 'ar' ? 'خدمات' : 'services'} ·{' '}
                        {db.articles.length} {locale === 'ar' ? 'مقالات' : 'articles'}
                      </div>
                    </div>
                    {/* Mini Amber/Orange Bar Sparkline */}
                    <div className="flex items-end gap-1 h-12">
                      {[50, 40, 75, 55, 80, 70, 90].map((h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h}%` }}
                          className="w-2 rounded-t bg-amber-500"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. CONTENT DISTRIBUTION DONUT CHART & MONTHLY OVERVIEW */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Donut Chart Card (Left 5 Cols) */}
                  <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-5 shadow-2xs">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {locale === 'ar'
                          ? 'توزيع محتوى المنصة النشط'
                          : 'Platform Content Breakdown'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {locale === 'ar'
                          ? 'توزيع المشروعات والعيادات والمقالات في قاعدة البيانات'
                          : 'Distribution of projects, clinics, and articles'}
                      </p>
                    </div>

                    <div className="flex items-center justify-center py-2">
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#E2E8F0"
                            strokeWidth="3.8"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#10B981"
                            strokeWidth="3.8"
                            strokeDasharray="45 55"
                            strokeDashoffset="0"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#0066FF"
                            strokeWidth="3.8"
                            strokeDasharray="30 70"
                            strokeDashoffset="-45"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#F59E0B"
                            strokeWidth="3.8"
                            strokeDasharray="25 75"
                            strokeDashoffset="-75"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-[11px] text-slate-400">
                            {locale === 'ar' ? 'إجمالي السجلات' : 'Total Records'}
                          </span>
                          <span className="text-xl font-black font-mono-tabular text-slate-900 dark:text-white">
                            {db.pages.length +
                              db.projects.length +
                              db.clinics.length +
                              db.doctors.length +
                              db.services.length +
                              db.articles.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>{locale === 'ar' ? 'المشروعات (45%)' : 'Projects (45%)'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF]" />
                        <span>{locale === 'ar' ? 'العيادات (30%)' : 'Clinics (30%)'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>{locale === 'ar' ? 'المقالات والسيرة (25%)' : 'Blog & CV (25%)'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Monthly Bar Chart Card (Right 7 Cols) */}
                  <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {locale === 'ar'
                            ? 'معدل الزيارات وطلبات الحجز الشهرية'
                            : 'Monthly Platform Visits & Clinic Bookings'}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono-tabular">
                          (+43% {locale === 'ar' ? 'نمو سنوي' : 'than last year'})
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-lg text-xs font-mono-tabular font-bold bg-slate-100 dark:bg-slate-800">
                        2026
                      </span>
                    </div>

                    <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 pt-4 px-2">
                      {[
                        { m: 'Jan', h1: 45, h2: 30 },
                        { m: 'Feb', h1: 60, h2: 35 },
                        { m: 'Mar', h1: 50, h2: 40 },
                        { m: 'Apr', h1: 75, h2: 45 },
                        { m: 'May', h1: 65, h2: 50 },
                        { m: 'Jun', h1: 85, h2: 55 },
                        { m: 'Jul', h1: 70, h2: 45 },
                        { m: 'Aug', h1: 90, h2: 60 },
                        { m: 'Sep', h1: 80, h2: 50 },
                        { m: 'Oct', h1: 95, h2: 65 },
                      ].map((bar) => (
                        <div key={bar.m} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <div className="w-full max-w-[22px] flex flex-col justify-end h-full gap-0.5">
                            <span
                              style={{ height: `${bar.h2}%` }}
                              className="w-full rounded-t bg-amber-400"
                            />
                            <span
                              style={{ height: `${bar.h1}%` }}
                              className="w-full rounded-b bg-emerald-600"
                            />
                          </div>
                          <span className="text-[10px] font-mono-tabular text-slate-400">
                            {bar.m}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>
                        {locale === 'ar'
                          ? 'جميع البيانات متزامنة مع قاعدة البيانات الحية'
                          : 'Synchronized with live platform database'}
                      </span>
                      <span className="font-mono-tabular font-bold text-emerald-600">
                        {db.media.length} Media Assets
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Jump Management Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/admin/projects')}
                    className="p-5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB] text-start space-y-2 transition-colors cursor-pointer"
                  >
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {locale === 'ar' ? 'إدارة المشروعات والأنظمة' : 'Manage Systems & Projects'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'إضافة أو تعديل المشروعات، الشاشات، الفيديو، وترتيب العرض.'
                        : 'Add or edit projects, screens, videos, and display order.'}
                    </p>
                  </button>

                  <button
                    onClick={() => navigate('/admin/clinics')}
                    className="p-5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB] text-start space-y-2 transition-colors cursor-pointer"
                  >
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'إدارة صفحات العيادات والأطباء والأسعار'
                        : 'Manage Clinics, Doctors & Prices'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'إنشاء صفحات هبوط طبية مستقلة وتحديث الأطباء والخدمات.'
                        : 'Create standalone medical landing pages and manage doctors & fees.'}
                    </p>
                  </button>

                  <button
                    onClick={() => navigate('/admin/settings')}
                    className="p-5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB] text-start space-y-2 transition-colors cursor-pointer"
                  >
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'ربط مشروع Firebase الحالي وقواعد الحماية'
                        : 'Connect Existing Firebase & Security Rules'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'إدخال مفاتيح مشروعك الحالي دون إنشاء مشروع جديد ونسخ firestore.rules.'
                        : 'Configure your existing Firebase project and copy production firestore.rules.'}
                    </p>
                  </button>
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
            {/* TAB 2: PAGES MANAGEMENT (/admin/pages) - Home & About/CV */}
            {/* =============================================================== */}
            {subRoute === 'pages' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'إدارة الصفحة الرئيسية والمعلومات الشخصية والسيرة الذاتية'
                        : 'Manage Home Page & Personal Profile / CV'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'تحكم في النصوص العربية والإنجليزية، الصورة الشخصية، وإعدادات SEO لكل صفحة.'
                        : 'Control Arabic/English copy, portrait image, standalone mode, and per-page SEO.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {db.pages.map((page) => (
                    <div
                      key={page.id}
                      className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono-tabular text-[#00C2CB]">/{page.slug}</span>
                          <span>·</span>
                          <span
                            className={
                              page.published ? 'text-emerald-500 font-semibold' : 'text-amber-500'
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
                          {page.standaloneByDefault && (
                            <>
                              <span>·</span>
                              <span className="text-[#00C2CB]">Standalone Mode Active</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {page.title.ar} — {page.title.en}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {page.headline[locale]}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {page.slug !== 'home' && (
                          <button
                            type="button"
                            onClick={() => handleTogglePublished('pages', page)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              page.published
                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                            }`}
                          >
                            {page.published ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'إخفاء الصفحة' : 'Hide Page'}</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'إظهار الصفحة' : 'Show Page'}</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setPreviewItem({
                              type: 'Page',
                              title: page.headline[locale],
                              subtitle: page.subheadline[locale],
                              body: page.biography[locale],
                              image: page.heroImage,
                              published: page.published,
                            })
                          }
                          className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'معاينة' : 'Preview'}</span>
                        </button>

                        <button
                          onClick={() => setEditingPage({ ...page })}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'تعديل الصفحة وSEO' : 'Edit Page & SEO'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 3: PROJECTS MANAGEMENT (/admin/projects) */}
            {/* =============================================================== */}
            {subRoute === 'projects' && (
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
                    onClick={() =>
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
                        seo: {
                          title: { ar: '', en: '' },
                          description: { ar: '', en: '' },
                        },
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'إضافة مشروع جديد' : 'Add New Project'}</span>
                  </button>
                </div>

                {/* Search & Status Filter Bar */}
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
                  <div className="flex items-center gap-1.5">
                    {(['all', 'published', 'draft'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                          statusFilter === st
                            ? 'bg-[#00C2CB] text-slate-950'
                            : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {db.projects
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
                    .map((proj, idx, arr) => (
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
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-mono-tabular text-slate-400">#{proj.order}</span>
                              <span>·</span>
                              <span className="font-mono-tabular text-[#00C2CB]">
                                /projects/{proj.slug}
                              </span>
                              <span>·</span>
                              <button
                                onClick={() => handleTogglePublished('projects', proj)}
                                className={`font-semibold underline ${
                                  proj.published ? 'text-emerald-500' : 'text-amber-500'
                                }`}
                              >
                                {proj.published
                                  ? locale === 'ar'
                                    ? 'منشور (انقر لتحويله لمسودة)'
                                    : 'Published'
                                  : locale === 'ar'
                                  ? 'مسودة (انقر للنشر)'
                                  : 'Draft'}
                              </button>
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
                            onClick={() => handleMoveItemOrder('projects', arr, idx, 'up')}
                            disabled={idx === 0}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveItemOrder('projects', arr, idx, 'down')}
                            disabled={idx === arr.length - 1}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePublished('projects', proj)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              proj.published
                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
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
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB]"
                          >
                            {locale === 'ar' ? 'معاينة' : 'Preview'}
                          </button>
                          <button
                            onClick={() => setEditingProject({ ...proj })}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950"
                          >
                            {locale === 'ar' ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                collection: 'projects',
                                id: proj.id,
                                title: proj.title[locale],
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
              </div>
            )}

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
                      onClick={() => setClinicSubTab('clinics')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                        clinicSubTab === 'clinics'
                          ? 'bg-[#00C2CB] text-slate-950'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {locale === 'ar' ? 'العيادات' : 'Clinics'} ({db.clinics.length})
                    </button>
                    <button
                      onClick={() => setClinicSubTab('doctors')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                        clinicSubTab === 'doctors'
                          ? 'bg-[#00C2CB] text-slate-950'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {locale === 'ar' ? 'الأطباء' : 'Doctors'} ({db.doctors.length})
                    </button>
                    <button
                      onClick={() => setClinicSubTab('services')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
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

                {/* SUB-TAB A: CLINICS */}
                {clinicSubTab === 'clinics' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
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

                    {db.clinics.map((clinic) => (
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
            {subRoute === 'blog' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      {locale === 'ar' ? 'إدارة المقالات والمدونة' : 'Manage Blog Articles'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'كتابة، تحرير، معاينة، ونشر المقالات باللغتين العربية والإنجليزية.'
                        : 'Write, preview, and publish bilingual articles with custom SEO.'}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setEditingArticle({
                        id: `art-${Date.now()}`,
                        slug: '',
                        title: { ar: '', en: '' },
                        excerpt: { ar: '', en: '' },
                        content: { ar: '', en: '' },
                        category: { ar: 'هندسة الأنظمة الطبية', en: 'Healthcare Engineering' },
                        tags: ['Soli Medical', 'Healthcare Software'],
                        coverImage: '/assets/aistudio/logo_ae3842b8.png',
                        readingTimeMinutes: 4,
                        authorName: { ar: 'أحمد سليمان', en: 'Ahmed Soliman' },
                        featured: false,
                        published: false,
                        order: db.articles.length + 1,
                        seo: { title: { ar: '', en: '' }, description: { ar: '', en: '' } },
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'مقال جديد' : 'New Article'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {db.articles.map((art, idx, arr) => (
                    <div
                      key={art.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono-tabular text-[#00C2CB]">/blog/{art.slug}</span>
                          <span>·</span>
                          <button
                            onClick={() => handleTogglePublished('articles', art)}
                            className={`font-semibold underline ${
                              art.published ? 'text-emerald-500' : 'text-amber-500'
                            }`}
                          >
                            {art.published
                              ? locale === 'ar'
                                ? 'منشور'
                                : 'Published'
                              : locale === 'ar'
                              ? 'مسودة'
                              : 'Draft'}
                          </button>
                          <span>·</span>
                          <span className="font-mono-tabular text-slate-400">
                            {art.readingTimeMinutes} min
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {art.title.ar}
                        </h3>
                        <p className="text-xs text-slate-500">{art.title.en}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleMoveItemOrder('articles', arr, idx, 'up')}
                          disabled={idx === 0}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveItemOrder('articles', arr, idx, 'down')}
                          disabled={idx === arr.length - 1}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePublished('articles', art)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            art.published
                              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          }`}
                        >
                          {art.published ? (
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
                            setPreviewItem({
                              type: 'Article',
                              title: art.title[locale],
                              subtitle: art.excerpt[locale],
                              body: art.content[locale],
                              image: art.coverImage,
                              published: art.published,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          {locale === 'ar' ? 'معاينة' : 'Preview'}
                        </button>
                        <button
                          onClick={() => setEditingArticle({ ...art })}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950"
                        >
                          {locale === 'ar' ? 'تعديل' : 'Edit'}
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              collection: 'articles',
                              id: art.id,
                              title: art.title[locale],
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
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 6: CLOUDINARY MEDIA MANAGEMENT (/admin/media) (PROMPT 4.4) */}
            {/* =============================================================== */}
            {subRoute === 'media' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'مكتبة الصور والوسائط — Cloudinary Media Manager'
                        : 'Cloudinary Signed Media Library'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'رفع الصور عبر توقيع خادم آمن (Signed Upload)، معاينة، استبدال، والتحقق من عدم الاستخدام في محتوى منشور قبل الحذف.'
                        : 'Server-side Signed Upload, image replacement, cover selection, and in-use protection before deletion.'}
                    </p>
                  </div>
                </div>

                {/* Upload / Replace Form Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {replacingMediaItem
                        ? locale === 'ar'
                          ? `استبدال الصورة: ${replacingMediaItem.alt[locale]}`
                          : `Replace Image: ${replacingMediaItem.alt[locale]}`
                        : locale === 'ar'
                        ? 'رفع صورة جديدة (الحد الأقصى 5MB — صيغ JPG, PNG, WebP, AVIF)'
                        : 'Upload New Image (Max 5MB — Allowed: JPG, PNG, WebP, AVIF)'}
                    </h2>
                    {replacingMediaItem && (
                      <button
                        onClick={() => setReplacingMediaItem(null)}
                        className="text-xs text-slate-400 hover:text-white"
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

                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>
                        {uploadingMedia
                          ? locale === 'ar'
                            ? 'جاري التوقيع والرفع...'
                            : 'Signing & Uploading...'
                          : replacingMediaItem
                          ? locale === 'ar'
                            ? 'اختر الملف البديل'
                            : 'Select Replacement File'
                          : locale === 'ar'
                          ? 'اختر صورة للرفع الآمن'
                          : 'Choose Image for Signed Upload'}
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
                      {cloudinaryStatus?.configured
                        ? `Connected to Cloudinary (${cloudinaryStatus.cloudName})`
                        : locale === 'ar'
                        ? 'ملاحظة: أضف CLOUDINARY_API_SECRET في متغيرات الخادم لتفعيل التخزين السحابي المباشر.'
                        : 'Tip: Set CLOUDINARY_API_SECRET in server env vars for remote CDN delivery.'}
                    </span>
                  </div>
                </div>

                {/* Media Gallery Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {db.media.map((asset) => {
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
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {asset.alt[locale]}
                            </div>
                            <div className="text-[11px] font-mono-tabular text-slate-400 truncate mt-0.5">
                              public_id: {asset.publicId}
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500">
                            {usage.inUse ? (
                              <span className="text-[#00C2CB] font-medium">
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

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(asset.secureUrl);
                                showToast(
                                  locale === 'ar' ? 'تم نسخ رابط الصورة' : 'Image URL copied',
                                  'info'
                                );
                              }}
                              className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-[#00C2CB]"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{locale === 'ar' ? 'نسخ الرابط' : 'Copy URL'}</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setReplacingMediaItem(asset);
                                  setMediaAltAr(asset.alt.ar);
                                  setMediaAltEn(asset.alt.en);
                                  setMediaCategory(asset.category);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB]"
                              >
                                {locale === 'ar' ? 'استبدال' : 'Replace'}
                              </button>

                              <button
                                onClick={() => handleRequestDeleteMedia(asset)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-950/30"
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
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 7: SITE SETTINGS, EXISTING FIREBASE & SEO (/admin/settings) */}
            {/* =============================================================== */}
            {subRoute === 'settings' && (
              <div className="space-y-8">
                {/* 1. Connect Existing Firebase Project Without Creating a New Project */}
                <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-5">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#00C2CB]">
                      {locale === 'ar'
                        ? 'ربط مشروع Firebase الحالي (دون إنشاء مشروع جديد)'
                        : 'Connect Your Existing Firebase Project'}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'إعدادات Firebase Authentication & Cloud Firestore'
                        : 'Existing Firebase Web SDK Configuration'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'أدخل بيانات تطبيق الويب من مشروعك الحالي في Firebase Console (أو ضعها في متغيرات البيئة VITE_FIREBASE_*) ليتم الربط المباشر بقاعدة بياناتك.'
                        : 'Paste your existing Firebase Web App configuration below (or via VITE_FIREBASE_* environment variables).'}
                    </p>
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
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950"
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
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-400"
                    >
                      {locale === 'ar' ? 'إلغاء الربط / مسح الإعدادات' : 'Disconnect / Clear Config'}
                    </button>
                  </div>
                </div>

                {/* 2. Global Brand Identity, Contact Links & Default SEO */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await saveSiteSettings(settingsForm);
                  }}
                  className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-5"
                >
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {locale === 'ar'
                      ? 'إعدادات الهوية، روابط التواصل، وSEO العام'
                      : 'Global Brand Identity, Contact Links & Default SEO'}
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
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3]"
                  >
                    {locale === 'ar' ? 'حفظ إعدادات الهوية وSEO' : 'Save Identity & SEO Settings'}
                  </button>
                </form>

                {/* 3. Full Platform Backup & Restore JSON (PROMPT 5.5 Item 8) */}
                <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
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
      {/* MODAL: EDIT ARTICLE */}
      {/* ===================================================================== */}
      {editingArticle && (
        <div className="fixed inset-0 z-[9992] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {locale === 'ar' ? 'تحرير المقال' : 'Edit Blog Article'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Title (AR) *</label>
                <input
                  type="text"
                  value={editingArticle.title?.ar || ''}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      title: { ar: e.target.value, en: editingArticle.title?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Title (EN) *</label>
                <input
                  type="text"
                  value={editingArticle.title?.en || ''}
                  onChange={(e) => {
                    const enVal = e.target.value;
                    setEditingArticle({
                      ...editingArticle,
                      title: { ar: editingArticle.title?.ar || '', en: enVal },
                      slug: editingArticle.slug || slugifyText(enVal),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Slug *</label>
                <input
                  type="text"
                  value={editingArticle.slug || ''}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, slug: slugifyText(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Cover Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingArticle.coverImage || ''}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, coverImage: e.target.value })
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImagePickerCallback(() => (url: string) =>
                        setEditingArticle((prev) => (prev ? { ...prev, coverImage: url } : null))
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 font-semibold"
                  >
                    {locale === 'ar' ? 'اختر' : 'Pick'}
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Excerpt (AR)</label>
                <textarea
                  rows={2}
                  value={editingArticle.excerpt?.ar || ''}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      excerpt: { ar: e.target.value, en: editingArticle.excerpt?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Excerpt (EN)</label>
                <textarea
                  rows={2}
                  value={editingArticle.excerpt?.en || ''}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      excerpt: { ar: editingArticle.excerpt?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Content (AR) *</label>
                <textarea
                  rows={4}
                  value={editingArticle.content?.ar || ''}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      content: { ar: e.target.value, en: editingArticle.content?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Content (EN) *</label>
                <textarea
                  rows={4}
                  value={editingArticle.content?.en || ''}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      content: { ar: editingArticle.content?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingArticle.published)}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, published: e.target.checked })
                  }
                />
                <span>{locale === 'ar' ? 'نشر المقال' : 'Publish Article'}</span>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    const check = validateArticlePayload(editingArticle);
                    if (!check.valid) {
                      showToast(check.errors.join(' '), 'error');
                      return;
                    }
                    await upsertRecord('articles', editingArticle);
                    setEditingArticle(null);
                  }}
                  className="px-5 py-2 rounded-lg font-semibold bg-[#00C2CB] text-slate-950"
                >
                  {locale === 'ar' ? 'حفظ المقال' : 'Save Article'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT PAGE & SEO (Home / About) */}
      {/* ===================================================================== */}
      {editingPage && (
        <div className="fixed inset-0 z-[9992] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {locale === 'ar' ? 'تعديل محتوى الصفحة وإعدادات SEO' : 'Edit Page Content & SEO'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Headline (AR) *</label>
                <input
                  type="text"
                  value={editingPage.headline?.ar || ''}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      headline: { ar: e.target.value, en: editingPage.headline?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Headline (EN) *</label>
                <input
                  type="text"
                  value={editingPage.headline?.en || ''}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      headline: { ar: editingPage.headline?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Subheadline (AR)</label>
                <textarea
                  rows={2}
                  value={editingPage.subheadline?.ar || ''}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      subheadline: { ar: e.target.value, en: editingPage.subheadline?.en || '' },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Subheadline (EN)</label>
                <textarea
                  rows={2}
                  value={editingPage.subheadline?.en || ''}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      subheadline: { ar: editingPage.subheadline?.ar || '', en: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">SEO Title (AR)</label>
                <input
                  type="text"
                  value={editingPage.seo?.title?.ar || ''}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      seo: {
                        ...editingPage.seo!,
                        title: { ar: e.target.value, en: editingPage.seo?.title?.en || '' },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">SEO Title (EN)</label>
                <input
                  type="text"
                  value={editingPage.seo?.title?.en || ''}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      seo: {
                        ...editingPage.seo!,
                        title: { ar: editingPage.seo?.title?.ar || '', en: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer text-[#00C2CB]">
                <input
                  type="checkbox"
                  checked={Boolean(editingPage.standaloneByDefault)}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, standaloneByDefault: e.target.checked })
                  }
                />
                <span>
                  {locale === 'ar'
                    ? 'تفعيل نمط العرض المستقل افتراضياً لهذه الصفحة'
                    : 'Enable Standalone Mode by Default'}
                </span>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPage(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    const check = validatePagePayload(editingPage);
                    if (!check.valid) {
                      showToast(check.errors.join(' '), 'error');
                      return;
                    }
                    await upsertRecord('pages', editingPage);
                    setEditingPage(null);
                  }}
                  className="px-5 py-2 rounded-lg font-semibold bg-[#00C2CB] text-slate-950"
                >
                  {locale === 'ar' ? 'حفظ التعديلات' : 'Save Page'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: COVER IMAGE PICKER FROM MEDIA LIBRARY */}
      {/* ===================================================================== */}
      {imagePickerCallback && (
        <div
          onClick={() => setImagePickerCallback(null)}
          className="fixed inset-0 z-[9996] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'اختر صورة الغلاف من مكتبة الوسائط'
                  : 'Select Cover Image from Media Library'}
              </h3>
              <button onClick={() => setImagePickerCallback(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {db.media.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    imagePickerCallback(m.secureUrl);
                    setImagePickerCallback(null);
                  }}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB] bg-[#070E1A] flex flex-col items-center gap-2 text-center"
                >
                  <img
                    src={m.secureUrl}
                    alt={m.alt[locale]}
                    className="w-24 h-24 object-contain"
                  />
                  <span className="text-[11px] text-slate-300 truncate w-full">
                    {m.alt[locale]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
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
      {/* MODAL: DELETE CONFIRMATION (SECTION 9 & PROMPT 4.5) */}
      {/* ===================================================================== */}
      {deleteConfirm && (
        <div
          onClick={() => setDeleteConfirm(null)}
          className="fixed inset-0 z-[9997] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-red-500/40 p-6 space-y-5"
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

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  const target = deleteConfirm;
                  setDeleteConfirm(null);
                  await deleteRecord(target.collection, target.id);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
              >
                {locale === 'ar' ? 'نعم، احذف نهائياً' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutResolver>
  );
};
