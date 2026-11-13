import React, { useMemo, useState } from 'react';
import {
  CmsPageType,
  Locale,
  PageConfig,
  PageContentBlock,
  PageLayoutVariant,
} from '../../types/cms';
import {
  getPageCanonicalPath,
  isCoreProtectedPage,
  slugifyText,
  validatePagePayload,
  validatePageSlug,
} from '../../lib/validationSchemas';
import { CustomCmsPage } from '../../pages/CustomCmsPage';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Columns2,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  Layout,
  Lock,
  Monitor,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

interface PageEditorProps {
  initialPage: Partial<PageConfig>;
  isNew: boolean;
  existingPages: PageConfig[];
  locale: Locale;
  onClose: () => void;
  onSave: (page: Partial<PageConfig>, options?: { keepOpen?: boolean }) => Promise<void>;
  onOpenImagePicker: (callback: (url: string) => void) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

type EditorTab = 'content' | 'design' | 'seo' | 'preview' | 'publish';

function normalizePageDraft(raw: Partial<PageConfig>, isNew: boolean): Partial<PageConfig> {
  const isCore = isCoreProtectedPage(raw);
  const pageType: CmsPageType = isCore
    ? 'core'
    : raw.pageType === 'landing' || raw.pageType === 'general'
    ? raw.pageType
    : 'landing';

  return {
    ...raw,
    id: raw.id || `page-${Date.now()}`,
    slug: raw.slug || '',
    pageType,
    isCore,
    layoutVariant:
      raw.layoutVariant ||
      (isCore
        ? raw.slug === 'home'
          ? 'home'
          : 'editorial'
        : pageType === 'landing'
        ? 'landing-hero'
        : 'editorial'),
    title: { ar: raw.title?.ar || '', en: raw.title?.en || '' },
    kicker: { ar: raw.kicker?.ar || '', en: raw.kicker?.en || '' },
    headline: { ar: raw.headline?.ar || '', en: raw.headline?.en || '' },
    subheadline: { ar: raw.subheadline?.ar || '', en: raw.subheadline?.en || '' },
    biography: { ar: raw.biography?.ar || '', en: raw.biography?.en || '' },
    highlights: {
      ar: Array.isArray(raw.highlights?.ar) ? [...raw.highlights!.ar] : [],
      en: Array.isArray(raw.highlights?.en) ? [...raw.highlights!.en] : [],
    },
    metrics: Array.isArray(raw.metrics) ? raw.metrics.map((m) => ({ ...m })) : [],
    experienceTimeline: Array.isArray(raw.experienceTimeline) ? [...raw.experienceTimeline] : [],
    skills: Array.isArray(raw.skills) ? [...raw.skills] : [],
    blocks: Array.isArray(raw.blocks)
      ? raw.blocks.map((b) => ({
          ...b,
          title: { ar: b.title?.ar || '', en: b.title?.en || '' },
          body: { ar: b.body?.ar || '', en: b.body?.en || '' },
          ctaLabel: b.ctaLabel ? { ar: b.ctaLabel.ar || '', en: b.ctaLabel.en || '' } : undefined,
        }))
      : [],
    additionalImages: Array.isArray(raw.additionalImages) ? [...raw.additionalImages] : [],
    ctaLabel: {
      ar: raw.ctaLabel?.ar || (pageType === 'landing' ? 'احجز استشارة مباشرة' : ''),
      en: raw.ctaLabel?.en || (pageType === 'landing' ? 'Book Direct Consultation' : ''),
    },
    ctaHref: raw.ctaHref || '',
    accentColor: raw.accentColor || (pageType === 'landing' ? '#00C2CB' : '#0D9488'),
    heroImage: raw.heroImage || '/assets/aistudio/logo_ae3842b8.png',
    standaloneByDefault: Boolean(raw.standaloneByDefault),
    published: isNew ? false : raw.published !== false,
    archived: Boolean(raw.archived),
    sectionVisibility: {
      heroImage: raw.sectionVisibility?.heroImage !== false,
      body: raw.sectionVisibility?.body !== false,
      highlights: raw.sectionVisibility?.highlights !== false,
      metrics: raw.sectionVisibility?.metrics !== false,
      timeline: raw.sectionVisibility?.timeline !== false,
      blocks: raw.sectionVisibility?.blocks !== false,
      cta: raw.sectionVisibility?.cta !== false,
    },
    seo: {
      title: { ar: raw.seo?.title?.ar || '', en: raw.seo?.title?.en || '' },
      description: { ar: raw.seo?.description?.ar || '', en: raw.seo?.description?.en || '' },
      ogImage: raw.seo?.ogImage || '',
      canonicalSlug: raw.seo?.canonicalSlug || '',
      noindex: Boolean(raw.seo?.noindex),
      structuredDataType: raw.seo?.structuredDataType || 'WebSite',
    },
  };
}

export const PageEditor: React.FC<PageEditorProps> = ({
  initialPage,
  isNew,
  existingPages,
  locale,
  onClose,
  onSave,
  onOpenImagePicker,
  onShowToast,
}) => {
  const [draft, setDraft] = useState<Partial<PageConfig>>(() =>
    normalizePageDraft(initialPage, isNew)
  );
  const [activeTab, setActiveTab] = useState<EditorTab>('content');
  const [splitPreview, setSplitPreview] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<Locale>(locale);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [previewStandalone, setPreviewStandalone] = useState<boolean>(
    Boolean(initialPage.standaloneByDefault)
  );
  const [seoPreviewLocale, setSeoPreviewLocale] = useState<Locale>(locale);
  const [saving, setSaving] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const initialSnapshot = useMemo(
    () => JSON.stringify(normalizePageDraft(initialPage, isNew)),
    [initialPage, isNew]
  );
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== initialSnapshot,
    [draft, initialSnapshot]
  );

  const isCore = isCoreProtectedPage(draft);

  const slugValidation = useMemo(
    () =>
      validatePageSlug(draft.slug || '', {
        editingId: draft.id,
        isCore,
        existingPages,
      }),
    [draft.slug, draft.id, isCore, existingPages]
  );

  const arCanonicalPath = getPageCanonicalPath(draft, 'ar');
  const enCanonicalPath = getPageCanonicalPath(draft, 'en');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ahmedsoliman.dev';

  const updateDraft = (updater: (prev: Partial<PageConfig>) => Partial<PageConfig>) => {
    setDraft((prev) => updater(prev));
  };

  const handlePageTypeChange = (nextType: 'landing' | 'general') => {
    if (isCore) return;
    updateDraft((prev) => ({
      ...prev,
      pageType: nextType,
      layoutVariant:
        nextType === 'landing' ? 'landing-hero' : 'editorial',
      accentColor: nextType === 'landing' ? '#00C2CB' : '#0D9488',
    }));
  };

  const handleSaveAction = async (publishState: boolean) => {
    const candidate: Partial<PageConfig> = {
      ...draft,
      published: draft.archived ? false : publishState,
    };

    const validation = validatePagePayload(candidate);
    if (!validation.valid) {
      onShowToast(validation.errors.join(' '), 'error');
      return;
    }

    if (!slugValidation.valid) {
      onShowToast(slugValidation.errors.join(' '), 'error');
      setActiveTab('seo');
      return;
    }

    setSaving(true);
    try {
      await onSave(candidate, { keepOpen: false });
    } finally {
      setSaving(false);
    }
  };

  const handleAttemptClose = () => {
    if (isDirty) {
      setConfirmDiscardOpen(true);
    } else {
      onClose();
    }
  };

  const handleCopyUrl = (path: string) => {
    const full = `${origin}${path}`;
    navigator.clipboard?.writeText(full);
    onShowToast(
      locale === 'ar' ? `تم نسخ الرابط: ${full}` : `Copied URL: ${full}`,
      'info'
    );
  };

  const tabs: { id: EditorTab; label: { ar: string; en: string }; icon: React.ReactNode }[] = [
    { id: 'content', label: { ar: 'المحتوى', en: 'Content' }, icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'design', label: { ar: 'التصميم', en: 'Design' }, icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'seo', label: { ar: 'SEO والرابط', en: 'SEO & URL' }, icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'preview', label: { ar: 'المعاينة الحية', en: 'Live Preview' }, icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'publish', label: { ar: 'النشر والحالة', en: 'Publish' }, icon: <Send className="w-3.5 h-3.5" /> },
  ];

  const addBlock = () => {
    const nextBlock: PageContentBlock = {
      id: `blk-${Date.now()}`,
      title: { ar: 'عنوان قسم جديد', en: 'New Section Title' },
      body: { ar: '', en: '' },
      imageUrl: '',
    };
    updateDraft((prev) => ({
      ...prev,
      blocks: [...(prev.blocks || []), nextBlock],
    }));
  };

  const moveBlock = (index: number, dir: 'up' | 'down') => {
    const list = [...(draft.blocks || [])];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    updateDraft((prev) => ({ ...prev, blocks: list }));
  };

  return (
    <div className="fixed inset-0 z-[9992] bg-black/80 backdrop-blur-sm flex flex-col">
      {/* STICKY HEADER & ACTION BAR */}
      <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] cursor-pointer shrink-0"
            aria-label={locale === 'ar' ? 'إغلاق المحرر' : 'Close Editor'}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {isNew
                  ? locale === 'ar'
                    ? 'إنشاء صفحة جديدة'
                    : 'Create New Page'
                  : draft.title?.[locale] || draft.title?.ar || draft.title?.en || draft.slug}
              </h2>
              {isCore && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 text-[10px] font-bold shrink-0">
                  <Lock className="w-3 h-3" />
                  <span>{locale === 'ar' ? 'أساسية محمية' : 'Core Protected'}</span>
                </span>
              )}
              {isDirty && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-bold shrink-0">
                  <span>{locale === 'ar' ? 'تغييرات غير محفوظة' : 'Unsaved changes'}</span>
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono-tabular text-[#0099A3] dark:text-[#00C2CB] truncate">
              {locale === 'ar' ? arCanonicalPath : enCanonicalPath}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSplitPreview((s) => !s)}
            className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              splitPreview
                ? 'bg-[#00C2CB]/15 border-[#00C2CB] text-[#00C2CB]'
                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-200'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'معاينة جانبية' : 'Split Preview'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{locale === 'ar' ? 'معاينة حية' : 'Preview'}</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveAction(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'حفظ مسودة' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            disabled={saving || Boolean(draft.archived)}
            onClick={() => handleSaveAction(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {draft.published
                ? locale === 'ar'
                  ? 'تحديث المنشور'
                  : 'Update Live'
                : locale === 'ar'
                ? 'نشر الصفحة'
                : 'Publish Page'}
            </span>
          </button>
        </div>
      </header>

      {/* 5 EDITOR TABS BAR */}
      <div className="bg-slate-100 dark:bg-[#0B1222] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#00C2CB] text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/70'
            }`}
          >
            {tab.icon}
            <span>{tab.label[locale]}</span>
          </button>
        ))}
      </div>

      {/* MAIN WORKSPACE (WIDE TABS + OPTIONAL DESKTOP SPLIT LIVE PREVIEW) */}
      <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-[#070E1A] flex">
        {/* LEFT/PRIMARY EDITOR PANE */}
        <div
          className={`overflow-y-auto p-4 sm:p-6 lg:p-8 ${
            splitPreview && activeTab !== 'preview'
              ? 'w-full xl:w-1/2 xl:border-e border-slate-200 dark:border-slate-800'
              : 'w-full'
          }`}
        >
          <div className={activeTab === 'preview' ? 'max-w-7xl mx-auto space-y-4' : 'max-w-5xl mx-auto space-y-6'}>
            {/* ============================================================= */}
            {/* TAB 1: CONTENT */}
            {/* ============================================================= */}
            {activeTab === 'content' && (
              <div className="space-y-6 text-xs">
                {/* Page Type & Slug Selector Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {locale === 'ar' ? 'نوع الصفحة ومسار التوجيه' : 'Page Type & Public Routing'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isCore
                          ? locale === 'ar'
                            ? 'صفحة أساسية بالنظام — مسارها محفوظ ومؤمّن تلقائياً.'
                            : 'Core system page — route path is locked and preserved automatically.'
                          : locale === 'ar'
                          ? 'يتحدد مسار الصفحة تلقائياً حسب نوعها (/landing/slug أو /p/slug).'
                          : 'Public route prefix derives automatically from page type (/landing/slug or /p/slug).'}
                      </p>
                    </div>
                  </div>

                  {!isCore && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handlePageTypeChange('landing')}
                        className={`p-4 rounded-xl border text-start space-y-1 cursor-pointer transition-colors ${
                          draft.pageType === 'landing'
                            ? 'bg-[#00C2CB]/10 border-[#00C2CB]'
                            : 'bg-slate-50 dark:bg-[#070E1A] border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {locale === 'ar' ? 'صفحة هبوط تسويقية (Landing)' : 'Marketing Landing Page'}
                          </span>
                          <span className="font-mono-tabular text-[11px] text-[#00C2CB]">
                            /landing/slug
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {locale === 'ar'
                            ? 'مصممة للحملات والخدمات الطبية مع أزرار تواصل مباشرة ودعم الوضع المستقل.'
                            : 'Built for campaigns and offers with strong conversion CTAs and standalone support.'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePageTypeChange('general')}
                        className={`p-4 rounded-xl border text-start space-y-1 cursor-pointer transition-colors ${
                          draft.pageType === 'general'
                            ? 'bg-[#00C2CB]/10 border-[#00C2CB]'
                            : 'bg-slate-50 dark:bg-[#070E1A] border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {locale === 'ar' ? 'صفحة محتوى عامة (General)' : 'General Content Page'}
                          </span>
                          <span className="font-mono-tabular text-[11px] text-[#00C2CB]">
                            /p/slug
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {locale === 'ar'
                            ? 'للصفحات التعريفية والسياسات والأدلة العامة بتصميم تحريري منظم.'
                            : 'Ideal for informational guides, policies, and structured editorial pages.'}
                        </p>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Title (AR) *
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={draft.title?.ar || ''}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            title: { ar: e.target.value, en: p.title?.en || '' },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Title (EN) *
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={draft.title?.en || ''}
                        onChange={(e) => {
                          const enVal = e.target.value;
                          updateDraft((p) => ({
                            ...p,
                            title: { ar: p.title?.ar || '', en: enVal },
                            slug:
                              isNew && !p.slug && !isCore
                                ? slugifyText(enVal)
                                : p.slug || '',
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Bilingual Hero & Body Copy */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                    {locale === 'ar'
                      ? 'العناوين والمحتوى الرئيسي (عربي / إنجليزي)'
                      : 'Headlines & Main Body Copy (AR / EN)'}
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* ARABIC COLUMN (RTL) */}
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200/80 dark:border-slate-800" dir="rtl">
                      <div className="text-xs font-bold text-[#00C2CB]">المحتوى العربي (RTL)</div>
                      <div>
                        <label className="block font-semibold mb-1">الشريط العلوي (Kicker AR)</label>
                        <input
                          type="text"
                          value={draft.kicker?.ar || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              kicker: { ar: e.target.value, en: p.kicker?.en || '' },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">العنوان الرئيسي (Headline AR) *</label>
                        <input
                          type="text"
                          value={draft.headline?.ar || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              headline: { ar: e.target.value, en: p.headline?.en || '' },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">العنوان الفرعي / الوصف (Subheadline AR)</label>
                        <textarea
                          rows={2}
                          value={draft.subheadline?.ar || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              subheadline: { ar: e.target.value, en: p.subheadline?.en || '' },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">المحتوى الرئيسي (Body / Bio AR)</label>
                        <textarea
                          rows={5}
                          value={draft.biography?.ar || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              biography: { ar: e.target.value, en: p.biography?.en || '' },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    {/* ENGLISH COLUMN (LTR) */}
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200/80 dark:border-slate-800" dir="ltr">
                      <div className="text-xs font-bold text-[#00C2CB]">English Content (LTR)</div>
                      <div>
                        <label className="block font-semibold mb-1">Kicker (EN)</label>
                        <input
                          type="text"
                          value={draft.kicker?.en || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              kicker: { ar: p.kicker?.ar || '', en: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Headline (EN) *</label>
                        <input
                          type="text"
                          value={draft.headline?.en || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              headline: { ar: p.headline?.ar || '', en: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Subheadline (EN)</label>
                        <textarea
                          rows={2}
                          value={draft.subheadline?.en || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              subheadline: { ar: p.subheadline?.ar || '', en: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Main Body / Bio (EN)</label>
                        <textarea
                          rows={5}
                          value={draft.biography?.en || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              biography: { ar: p.biography?.ar || '', en: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {locale === 'ar' ? 'زر الدعوة للإجراء الأساسي (Primary CTA)' : 'Primary Call-to-Action Button'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">CTA Label (AR)</label>
                      <input
                        type="text"
                        dir="rtl"
                        value={draft.ctaLabel?.ar || ''}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            ctaLabel: { ar: e.target.value, en: p.ctaLabel?.en || '' },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">CTA Label (EN)</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={draft.ctaLabel?.en || ''}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            ctaLabel: { ar: p.ctaLabel?.ar || '', en: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">CTA Link / WhatsApp URL</label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="https://wa.me/Ahmed0soliman"
                        value={draft.ctaHref || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, ctaHref: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                      />
                    </div>
                  </div>
                </div>

                {/* Sortable Content Blocks */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#00C2CB]" />
                        <span>
                          {locale === 'ar'
                            ? 'أقسام ومحتويات الصفحة القابلة للترتيب'
                            : 'Sortable Content Sections & Blocks'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'أضف أقساماً متعددة مع صور وروابط ورتب ظهورها لأعلى ولأسفل.'
                          : 'Add modular bilingual blocks with optional images and move them up or down.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addBlock}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'إضافة قسم' : 'Add Section'}</span>
                    </button>
                  </div>

                  {(draft.blocks || []).length === 0 ? (
                    <div className="py-6 text-center text-slate-500 dark:text-slate-400">
                      {locale === 'ar'
                        ? 'لا توجد أقسام إضافية حالياً. اضغط «إضافة قسم» لإنشاء أول قسم.'
                        : 'No custom blocks added yet. Click "Add Section" to build modular blocks.'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(draft.blocks || []).map((block, idx) => (
                        <div
                          key={block.id || idx}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono-tabular font-bold text-[#00C2CB]">
                              #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveBlock(idx, 'up')}
                                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (draft.blocks || []).length - 1}
                                onClick={() => moveBlock(idx, 'down')}
                                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateDraft((p) => ({
                                    ...p,
                                    blocks: (p.blocks || []).filter((_, i) => i !== idx),
                                  }))
                                }
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                                title="Delete Block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold mb-1">Block Title (AR)</label>
                              <input
                                type="text"
                                dir="rtl"
                                value={block.title?.ar || ''}
                                onChange={(e) =>
                                  updateDraft((p) => ({
                                    ...p,
                                    blocks: (p.blocks || []).map((b, i) =>
                                      i === idx
                                        ? { ...b, title: { ar: e.target.value, en: b.title?.en || '' } }
                                        : b
                                    ),
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1">Block Title (EN)</label>
                              <input
                                type="text"
                                dir="ltr"
                                value={block.title?.en || ''}
                                onChange={(e) =>
                                  updateDraft((p) => ({
                                    ...p,
                                    blocks: (p.blocks || []).map((b, i) =>
                                      i === idx
                                        ? { ...b, title: { ar: b.title?.ar || '', en: e.target.value } }
                                        : b
                                    ),
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1">Body (AR)</label>
                              <textarea
                                rows={3}
                                dir="rtl"
                                value={block.body?.ar || ''}
                                onChange={(e) =>
                                  updateDraft((p) => ({
                                    ...p,
                                    blocks: (p.blocks || []).map((b, i) =>
                                      i === idx
                                        ? { ...b, body: { ar: e.target.value, en: b.body?.en || '' } }
                                        : b
                                    ),
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1">Body (EN)</label>
                              <textarea
                                rows={3}
                                dir="ltr"
                                value={block.body?.en || ''}
                                onChange={(e) =>
                                  updateDraft((p) => ({
                                    ...p,
                                    blocks: (p.blocks || []).map((b, i) =>
                                      i === idx
                                        ? { ...b, body: { ar: b.body?.ar || '', en: e.target.value } }
                                        : b
                                    ),
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block font-semibold mb-1">Block Image URL</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  dir="ltr"
                                  value={block.imageUrl || ''}
                                  onChange={(e) =>
                                    updateDraft((p) => ({
                                      ...p,
                                      blocks: (p.blocks || []).map((b, i) =>
                                        i === idx ? { ...b, imageUrl: e.target.value } : b
                                      ),
                                    }))
                                  }
                                  className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenImagePicker((url) =>
                                      updateDraft((p) => ({
                                        ...p,
                                        blocks: (p.blocks || []).map((b, i) =>
                                          i === idx ? { ...b, imageUrl: url } : b
                                        ),
                                      }))
                                    )
                                  }
                                  className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 font-semibold cursor-pointer"
                                >
                                  {locale === 'ar' ? 'اختر صورة' : 'Pick Image'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Key Highlights & Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Highlights */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {locale === 'ar' ? 'النقاط المميزة (Highlights)' : 'Key Highlights'}
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft((p) => ({
                            ...p,
                            highlights: {
                              ar: [...(p.highlights?.ar || []), 'ميزة جديدة'],
                              en: [...(p.highlights?.en || []), 'New highlight'],
                            },
                          }))
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{locale === 'ar' ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>
                    {Array.from({
                      length: Math.max(
                        (draft.highlights?.ar || []).length,
                        (draft.highlights?.en || []).length
                      ),
                    }).map((_, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="AR"
                          value={draft.highlights?.ar?.[idx] || ''}
                          onChange={(e) =>
                            updateDraft((p) => {
                              const nextAr = [...(p.highlights?.ar || [])];
                              nextAr[idx] = e.target.value;
                              return {
                                ...p,
                                highlights: { ar: nextAr, en: p.highlights?.en || [] },
                              };
                            })
                          }
                          className="col-span-5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="EN"
                          value={draft.highlights?.en?.[idx] || ''}
                          onChange={(e) =>
                            updateDraft((p) => {
                              const nextEn = [...(p.highlights?.en || [])];
                              nextEn[idx] = e.target.value;
                              return {
                                ...p,
                                highlights: { ar: p.highlights?.ar || [], en: nextEn },
                              };
                            })
                          }
                          className="col-span-6 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({
                              ...p,
                              highlights: {
                                ar: (p.highlights?.ar || []).filter((_, i) => i !== idx),
                                en: (p.highlights?.en || []).filter((_, i) => i !== idx),
                              },
                            }))
                          }
                          className="col-span-1 p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {locale === 'ar' ? 'شريط الأرقام والمؤشرات (Metrics)' : 'Key Metrics Strip'}
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft((p) => ({
                            ...p,
                            metrics: [
                              ...(p.metrics || []),
                              { value: '100%', label: { ar: 'مؤشر جودة', en: 'Quality Score' } },
                            ],
                          }))
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{locale === 'ar' ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>
                    {(draft.metrics || []).map((m, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="+10"
                          value={m.value || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              metrics: (p.metrics || []).map((item, i) =>
                                i === idx ? { ...item, value: e.target.value } : item
                              ),
                            }))
                          }
                          className="col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular font-bold"
                        />
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="AR"
                          value={m.label?.ar || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              metrics: (p.metrics || []).map((item, i) =>
                                i === idx
                                  ? { ...item, label: { ar: e.target.value, en: item.label?.en || '' } }
                                  : item
                              ),
                            }))
                          }
                          className="col-span-4 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="EN"
                          value={m.label?.en || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              metrics: (p.metrics || []).map((item, i) =>
                                i === idx
                                  ? { ...item, label: { ar: item.label?.ar || '', en: e.target.value } }
                                  : item
                              ),
                            }))
                          }
                          className="col-span-4 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({
                              ...p,
                              metrics: (p.metrics || []).filter((_, i) => i !== idx),
                            }))
                          }
                          className="col-span-1 p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: DESIGN & STANDALONE */}
            {/* ============================================================= */}
            {activeTab === 'design' && (
              <div className="space-y-6 text-xs">
                {/* Layout Variant Picker */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layout className="w-4 h-4 text-[#00C2CB]" />
                      <span>{locale === 'ar' ? 'النمط البصري والتخطيط (Layout Variant)' : 'Page Layout & Visual World'}</span>
                    </h3>
                    {isCore && (
                      <span className="text-[11px] text-indigo-400 font-semibold">
                        {locale === 'ar' ? 'الصفحات الأساسية تستخدم تصميمها المخصص' : 'Core pages keep bespoke layouts'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(
                      [
                        {
                          id: 'landing-hero',
                          title: { ar: 'هبوط تقني داكن', en: 'Dark Tech Landing' },
                          desc: { ar: 'تباين عالٍ وخلفية عميقة مع تركيز تحويلي', en: 'High-contrast dark canvas built for conversion' },
                        },
                        {
                          id: 'campaign',
                          title: { ar: 'حملة تسويقية', en: 'Campaign Spotlight' },
                          desc: { ar: 'إبراز العروض الطبية والأرقام الرئيسية', en: 'Focused campaign showcase with KPI strip' },
                        },
                        {
                          id: 'editorial',
                          title: { ar: 'تحريري فاتح', en: 'Clean Editorial' },
                          desc: { ar: 'خلفية بيضاء نظيفة وتنسيق قرائي رصين', en: 'Crisp pure white canvas with strong typography' },
                        },
                        {
                          id: 'article-page',
                          title: { ar: 'صفحة محتوى منظمة', en: 'Structured Reader' },
                          desc: { ar: 'تخطيط منظم للأدلة والسياسات والتوثيق', en: 'Structured reader view for guides & docs' },
                        },
                      ] as { id: PageLayoutVariant; title: { ar: string; en: string }; desc: { ar: string; en: string } }[]
                    ).map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={isCore}
                        onClick={() =>
                          updateDraft((p) => ({ ...p, layoutVariant: variant.id }))
                        }
                        className={`p-3.5 rounded-xl border text-start space-y-1 transition-colors cursor-pointer disabled:opacity-60 ${
                          draft.layoutVariant === variant.id
                            ? 'bg-[#00C2CB]/10 border-[#00C2CB]'
                            : 'bg-slate-50 dark:bg-[#070E1A] border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="font-bold text-slate-900 dark:text-white">
                          {variant.title[locale]}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {variant.desc[locale]}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Standalone Toggle & Cover Image & Accent */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {locale === 'ar' ? 'الوضع المستقل والهوية اللونية' : 'Standalone Mode & Accent Color'}
                    </h3>

                    <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.standaloneByDefault)}
                        onChange={(e) => {
                          setPreviewStandalone(e.target.checked);
                          updateDraft((p) => ({ ...p, standaloneByDefault: e.target.checked }));
                        }}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <div className="font-bold text-[#00C2CB]">
                          {locale === 'ar'
                            ? 'تفعيل الوضع المستقل افتراضياً (Standalone Mode)'
                            : 'Enable Standalone Mode by Default'}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {locale === 'ar'
                            ? 'عند التفعيل يرى الزائر هذه الصفحة وحدها مع زر اللغة والتواصل المباشر دون روابط تنقل أقسام الموقع الأخرى (مع إمكانية استخدام ?standalone=1 في أي رابط).'
                            : 'Visitors see this page isolated with only language toggle and direct contact CTA without main site navigation links (also triggered via ?standalone=1).'}
                        </p>
                      </div>
                    </label>

                    <div>
                      <label className="block font-semibold mb-2">
                        {locale === 'ar' ? 'لون التمييز المخصص (Accent Color)' : 'Custom Accent Color'}
                      </label>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <input
                          type="color"
                          value={draft.accentColor || '#00C2CB'}
                          onChange={(e) =>
                            updateDraft((p) => ({ ...p, accentColor: e.target.value }))
                          }
                          className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={draft.accentColor || '#00C2CB'}
                          onChange={(e) =>
                            updateDraft((p) => ({ ...p, accentColor: e.target.value }))
                          }
                          className="w-28 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                        />
                        {['#00C2CB', '#0D9488', '#6366F1', '#10B981', '#F59E0B'].map((sw) => (
                          <button
                            key={sw}
                            type="button"
                            onClick={() => updateDraft((p) => ({ ...p, accentColor: sw }))}
                            style={{ backgroundColor: sw }}
                            className="w-7 h-7 rounded-full border-2 border-white/20 cursor-pointer"
                            aria-label={`Color ${sw}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hero Image & Gallery */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#00C2CB]" />
                      <span>{locale === 'ar' ? 'صورة الغلاف والصور الإضافية' : 'Hero Cover & Additional Images'}</span>
                    </h3>

                    <div>
                      <label className="block font-semibold mb-1">Hero / Cover Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          dir="ltr"
                          value={draft.heroImage || ''}
                          onChange={(e) => updateDraft((p) => ({ ...p, heroImage: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onOpenImagePicker((url) =>
                              updateDraft((p) => ({ ...p, heroImage: url }))
                            )
                          }
                          className="px-3.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 font-semibold cursor-pointer"
                        >
                          {locale === 'ar' ? 'اختر' : 'Pick'}
                        </button>
                      </div>
                    </div>

                    {draft.heroImage && (
                      <div className="h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                        <img
                          src={draft.heroImage}
                          alt="Hero Preview"
                          className="max-h-full object-contain"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {locale === 'ar' ? 'صور المعرض الإضافية' : 'Additional Gallery Images'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenImagePicker((url) =>
                              updateDraft((p) => ({
                                ...p,
                                additionalImages: [...(p.additionalImages || []), url],
                              }))
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{locale === 'ar' ? 'إضافة صورة' : 'Add Image'}</span>
                        </button>
                      </div>
                      {(draft.additionalImages || []).map((imgUrl, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            dir="ltr"
                            value={imgUrl}
                            onChange={(e) =>
                              updateDraft((p) => ({
                                ...p,
                                additionalImages: (p.additionalImages || []).map((u, i) =>
                                  i === idx ? e.target.value : u
                                ),
                              }))
                            }
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft((p) => ({
                                ...p,
                                additionalImages: (p.additionalImages || []).filter(
                                  (_, i) => i !== idx
                                ),
                              }))
                            }
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section Visibility Toggles */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {locale === 'ar' ? 'إظهار وإخفاء عناصر الصفحة (Section Visibility)' : 'Section Visibility Controls'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        { key: 'heroImage', label: { ar: 'صورة الغلاف', en: 'Hero Image' } },
                        { key: 'metrics', label: { ar: 'شريط الأرقام', en: 'Metrics Strip' } },
                        { key: 'body', label: { ar: 'النص الرئيسي', en: 'Main Body' } },
                        { key: 'highlights', label: { ar: 'النقاط المميزة', en: 'Highlights' } },
                        { key: 'blocks', label: { ar: 'الأقسام المرتبة', en: 'Content Blocks' } },
                        { key: 'timeline', label: { ar: 'الخط الزمني', en: 'Timeline' } },
                        { key: 'cta', label: { ar: 'أزرار التواصل CTA', en: 'CTA Buttons' } },
                      ] as const
                    ).map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={draft.sectionVisibility?.[item.key] !== false}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              sectionVisibility: {
                                ...p.sectionVisibility,
                                [item.key]: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className="font-semibold">{item.label[locale]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 3: SEO & CANONICAL URL + GOOGLE/OG PREVIEW */}
            {/* ============================================================= */}
            {activeTab === 'seo' && (
              <div className="space-y-6 text-xs">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {locale === 'ar' ? 'إعدادات الرابط الأساسي (Slug & Canonical URL)' : 'Slug & Canonical URL Settings'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">
                        Page Slug * {isCore && '(Core Protected)'}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        disabled={isCore}
                        value={draft.slug || ''}
                        onChange={(e) =>
                          updateDraft((p) => ({ ...p, slug: slugifyText(e.target.value) }))
                        }
                        placeholder="ramadan-clinic-offer"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular disabled:opacity-60"
                      />
                      {!slugValidation.valid ? (
                        <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{slugValidation.errors[0]}</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-emerald-500 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {locale === 'ar' ? 'الرابط متاح وسليم:' : 'Valid unique route:'}{' '}
                            <code className="font-mono-tabular">{arCanonicalPath}</code>
                          </span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Canonical Slug / URL Override
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={draft.seo?.canonicalSlug || ''}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            seo: { ...p.seo!, canonicalSlug: e.target.value },
                          }))
                        }
                        placeholder={arCanonicalPath.replace(/^\/(ar|en)/, '') || '/'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                      />
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {locale === 'ar'
                          ? 'اتركه افتراضياً لمنع تكرار الروابط، أو أدخل المسار الأساسي الموحد.'
                          : 'Leave blank to use the clean computed URL without search duplicate content.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold">SEO Title (AR)</label>
                        <span className="font-mono-tabular text-[11px] text-slate-400">
                          {(draft.seo?.title?.ar || '').length}/60
                        </span>
                      </div>
                      <input
                        type="text"
                        dir="rtl"
                        value={draft.seo?.title?.ar || ''}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            seo: {
                              ...p.seo!,
                              title: { ar: e.target.value, en: p.seo?.title?.en || '' },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold">SEO Title (EN)</label>
                        <span className="font-mono-tabular text-[11px] text-slate-400">
                          {(draft.seo?.title?.en || '').length}/60
                        </span>
                      </div>
                      <input
                        type="text"
                        dir="ltr"
                        value={draft.seo?.title?.en || ''}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            seo: {
                              ...p.seo!,
                              title: { ar: p.seo?.title?.ar || '', en: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold">SEO Description (AR)</label>
                        <span className="font-mono-tabular text-[11px] text-slate-400">
                          {(draft.seo?.description?.ar || '').length}/160
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={draft.seo?.description?.ar || ''}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            seo: {
                              ...p.seo!,
                              description: {
                                ar: e.target.value,
                                en: p.seo?.description?.en || '',
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold">SEO Description (EN)</label>
                        <span className="font-mono-tabular text-[11px] text-slate-400">
                          {(draft.seo?.description?.en || '').length}/160
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        dir="ltr"
                        value={draft.seo?.description?.en || ''}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            seo: {
                              ...p.seo!,
                              description: {
                                ar: p.seo?.description?.ar || '',
                                en: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block font-semibold mb-1">Open Graph Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          dir="ltr"
                          value={draft.seo?.ogImage || ''}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              seo: { ...p.seo!, ogImage: e.target.value },
                            }))
                          }
                          placeholder={draft.heroImage || '/assets/aistudio/...'}
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onOpenImagePicker((url) =>
                              updateDraft((p) => ({
                                ...p,
                                seo: { ...p.seo!, ogImage: url },
                              }))
                            )
                          }
                          className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 font-semibold cursor-pointer"
                        >
                          {locale === 'ar' ? 'اختر' : 'Pick'}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 cursor-pointer mt-4 sm:mt-0">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.seo?.noindex)}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            seo: { ...p.seo!, noindex: e.target.checked },
                          }))
                        }
                      />
                      <span>
                        {locale === 'ar'
                          ? 'تفعيل noindex (استبعاد الصفحة من الأرشفة ومن Sitemap)'
                          : 'Enable noindex (Exclude from Search Engines & Sitemap)'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* GOOGLE SERP & OPENGRAPH CARD PREVIEW */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'معاينة نتائج Google وبطاقة المشاركة (SERP & OpenGraph Preview)'
                        : 'Google SERP & Social OpenGraph Preview'}
                    </h3>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {(['ar', 'en'] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setSeoPreviewLocale(l)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                            seoPreviewLocale === l
                              ? 'bg-[#00C2CB] text-slate-950'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Google SERP Mock */}
                    <div
                      dir={seoPreviewLocale === 'ar' ? 'rtl' : 'ltr'}
                      className="p-4 rounded-xl bg-white text-slate-900 border border-slate-200 space-y-1.5"
                    >
                      <div className="text-[11px] text-slate-500 font-mono-tabular truncate">
                        {origin}
                        {seoPreviewLocale === 'ar' ? arCanonicalPath : enCanonicalPath}
                      </div>
                      <div className="text-base font-semibold text-[#1a0dab] leading-snug line-clamp-1">
                        {draft.seo?.title?.[seoPreviewLocale] ||
                          draft.title?.[seoPreviewLocale] ||
                          draft.headline?.[seoPreviewLocale] ||
                          'Page Title'}
                      </div>
                      <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                        {draft.seo?.description?.[seoPreviewLocale] ||
                          draft.subheadline?.[seoPreviewLocale] ||
                          'Meta description preview will appear here.'}
                      </p>
                    </div>

                    {/* Social OpenGraph Card Mock */}
                    <div
                      dir={seoPreviewLocale === 'ar' ? 'rtl' : 'ltr'}
                      className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070E1A]"
                    >
                      {(draft.seo?.ogImage || draft.heroImage) && (
                        <div className="h-32 bg-slate-900 overflow-hidden">
                          <img
                            src={draft.seo?.ogImage || draft.heroImage}
                            alt="OG Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3.5 space-y-1">
                        <div className="text-[10px] uppercase font-mono-tabular text-slate-400">
                          {origin.replace(/^https?:\/\//, '')}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {draft.seo?.title?.[seoPreviewLocale] ||
                            draft.title?.[seoPreviewLocale] ||
                            'Open Graph Title'}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {draft.seo?.description?.[seoPreviewLocale] ||
                            draft.subheadline?.[seoPreviewLocale]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: LIVE PAGE PREVIEW (REAL RENDERER + AR/EN + DESKTOP/MOBILE) */}
            {/* ============================================================= */}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00C2CB]">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {locale === 'ar'
                        ? 'معاينة حية حقيقية تعكس تعديلاتك غير المنشورة فوراً'
                        : 'Real Page Preview reflecting live unsaved draft changes'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* AR / EN Toggle */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {(['ar', 'en'] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setPreviewLocale(l)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                            previewLocale === l
                              ? 'bg-[#00C2CB] text-slate-950'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {l === 'ar' ? 'العربية (RTL)' : 'English (LTR)'}
                        </button>
                      ))}
                    </div>

                    {/* Desktop / Mobile Toggle */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => setPreviewViewport('desktop')}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          previewViewport === 'desktop'
                            ? 'bg-[#00C2CB] text-slate-950'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewport('mobile')}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          previewViewport === 'mobile'
                            ? 'bg-[#00C2CB] text-slate-950'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Mobile</span>
                      </button>
                    </div>

                    {/* Standalone Preview Switch */}
                    <button
                      type="button"
                      onClick={() => setPreviewStandalone((s) => !s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        previewStandalone
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
                          : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {previewStandalone
                        ? locale === 'ar'
                          ? 'وضع مستقل: مفعّل'
                          : 'Standalone: ON'
                        : locale === 'ar'
                        ? 'وضع مستقل: متوقف'
                        : 'Standalone: OFF'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div
                    className={`rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-2xl transition-all ${
                      previewViewport === 'mobile' ? 'w-[390px] max-w-full' : 'w-full'
                    }`}
                  >
                    <CustomCmsPage
                      previewPage={draft}
                      previewLocale={previewLocale}
                      embeddedPreview
                      previewStandalone={previewStandalone}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 5: PUBLISH STATUS, TIMESTAMPS & FINAL LINKS */}
            {/* ============================================================= */}
            {activeTab === 'publish' && (
              <div className="space-y-6 text-xs">
                {draft.archived && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-amber-500">
                        {locale === 'ar'
                          ? 'هذه الصفحة في الأرشيف / سلة المحذوفات'
                          : 'This Page is Archived in Trash'}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {locale === 'ar'
                          ? 'تم إخفاؤها عن الزوار وإزالتها من Sitemap. يمكنك استعادتها كمسودة أولاً قبل إعادة النشر.'
                          : 'Hidden from visitors and excluded from Sitemap. Restore it to draft before publishing.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft((p) => ({
                          ...p,
                          archived: false,
                          archivedAt: undefined,
                          published: false,
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'استعادة كمسودة' : 'Restore to Draft'}</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {locale === 'ar' ? 'حالة النشر والتوقيتات' : 'Publication State & Timestamps'}
                    </h3>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">
                          {locale === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                        </span>
                        <span
                          className={`font-bold ${
                            draft.archived
                              ? 'text-amber-500'
                              : draft.published
                              ? 'text-emerald-500'
                              : 'text-amber-500'
                          }`}
                        >
                          {draft.archived
                            ? locale === 'ar'
                              ? 'مؤرشف (سلة المحذوفات)'
                              : 'Archived (Trash)'
                            : draft.published
                            ? locale === 'ar'
                              ? 'منشورة للجمهور'
                              : 'Published Live'
                            : locale === 'ar'
                            ? 'مسودة مخفية'
                            : 'Hidden Draft'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">
                          {locale === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                        </span>
                        <span className="font-mono-tabular font-semibold">
                          {draft.createdAt ? draft.createdAt.slice(0, 16).replace('T', ' ') : locale === 'ar' ? 'جديد' : 'New'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <span className="text-slate-500 dark:text-slate-400">
                          {locale === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                        </span>
                        <span className="font-mono-tabular font-semibold">
                          {draft.updatedAt ? draft.updatedAt.slice(0, 16).replace('T', ' ') : locale === 'ar' ? 'الآن' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Final Computed URLs */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#00C2CB]" />
                      <span>{locale === 'ar' ? 'الروابط النهائية باللغتين' : 'Final Localized URLs'}</span>
                    </h3>

                    {[
                      { lang: 'العربية (AR)', path: arCanonicalPath },
                      { lang: 'English (EN)', path: enCanonicalPath },
                    ].map((linkItem) => (
                      <div
                        key={linkItem.lang}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{linkItem.lang}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(linkItem.path)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:text-[#00C2CB] font-semibold cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{locale === 'ar' ? 'نسخ' : 'Copy'}</span>
                            </button>
                            <a
                              href={linkItem.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00C2CB]/15 text-[#00C2CB] font-semibold"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{locale === 'ar' ? 'فتح' : 'Open'}</span>
                            </a>
                          </div>
                        </div>
                        <div className="font-mono-tabular text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {linkItem.path}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* OPTIONAL DESKTOP SPLIT-VIEW LIVE PREVIEW PANE */}
        {splitPreview && activeTab !== 'preview' && (
          <div className="hidden xl:flex flex-col w-1/2 bg-[#040D12] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#0B1222] border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
              <span className="font-bold text-[#00C2CB]">
                {locale === 'ar' ? 'المعاينة الحية المباشرة' : 'Split Live Preview'}
              </span>
              <div className="flex items-center gap-1.5">
                {(['ar', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setPreviewLocale(l)}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      previewLocale === l ? 'bg-[#00C2CB] text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CustomCmsPage
                previewPage={draft}
                previewLocale={previewLocale}
                embeddedPreview
                previewStandalone={previewStandalone}
              />
            </div>
          </div>
        )}
      </div>

      {/* UNSAVED CHANGES GUARD DIALOG */}
      {confirmDiscardOpen && (
        <div
          onClick={() => setConfirmDiscardOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-amber-500/40 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-2.5 text-amber-500">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'تجاهل التغييرات غير المحفوظة؟' : 'Discard Unsaved Changes?'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {locale === 'ar'
                ? 'لديك تعديلات لم يتم حفظها بعد. إذا أغلقت المحرر الآن فستفقد هذه التعديلات.'
                : 'You have unsaved edits in this page. Closing now will discard those edits.'}
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDiscardOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {locale === 'ar' ? 'الاستمرار في التحرير' : 'Keep Editing'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDiscardOpen(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                {locale === 'ar' ? 'تجاهل وإغلاق' : 'Discard & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
