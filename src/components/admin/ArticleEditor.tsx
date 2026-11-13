import React, { useMemo, useState } from 'react';
import { ArticleItem, Locale, PlatformDatabase } from '../../types/cms';
import {
  checkArticleInSiteReferences,
  countArticleWords,
  estimateArticleReadingTime,
  slugifyText,
  validateArticlePayload,
  validateArticleSlug,
} from '../../lib/validationSchemas';
import {
  resolveArticleTiptapDoc,
  sanitizeTiptapDoc,
  serializeTiptapJsonToMarkdown,
} from '../../lib/tiptapBridge';
import { RichTextEditor } from './RichTextEditor';
import { BlogDetailPage } from '../../pages/BlogDetailPage';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Columns2,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  X,
} from 'lucide-react';

interface ArticleEditorProps {
  initialArticle: Partial<ArticleItem>;
  isNew: boolean;
  existingArticles: ArticleItem[];
  db: PlatformDatabase;
  locale: Locale;
  onClose: () => void;
  onSave: (article: Partial<ArticleItem>) => Promise<void>;
  onOpenImagePicker: (callback: (url: string) => void) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

type ArticleEditorTab = 'content' | 'details' | 'seo' | 'preview' | 'publish';
type WritingPaneMode = 'ar' | 'en' | 'split';

function normalizeArticleDraft(
  raw: Partial<ArticleItem>,
  isNew: boolean
): Partial<ArticleItem> {
  const arDoc = resolveArticleTiptapDoc(raw.contentJson?.ar, raw.content?.ar);
  const enDoc = resolveArticleTiptapDoc(raw.contentJson?.en, raw.content?.en);

  const arMd = raw.content?.ar?.trim()
    ? raw.content.ar
    : serializeTiptapJsonToMarkdown(arDoc);
  const enMd = raw.content?.en?.trim()
    ? raw.content.en
    : serializeTiptapJsonToMarkdown(enDoc);

  return {
    ...raw,
    id: raw.id || `art-${Date.now()}`,
    slug: raw.slug || '',
    title: { ar: raw.title?.ar || '', en: raw.title?.en || '' },
    excerpt: { ar: raw.excerpt?.ar || '', en: raw.excerpt?.en || '' },
    content: { ar: arMd, en: enMd },
    contentFormat: 'tiptap-json',
    contentJson: {
      ar: arDoc,
      en: enDoc,
    },
    category: {
      ar: raw.category?.ar || 'هندسة الأنظمة الطبية',
      en: raw.category?.en || 'Healthcare Engineering',
    },
    tags: Array.isArray(raw.tags) ? [...raw.tags] : [],
    coverImage: raw.coverImage || '',
    authorName: {
      ar: raw.authorName?.ar || 'أحمد سليمان',
      en: raw.authorName?.en || 'Ahmed Soliman',
    },
    featured: Boolean(raw.featured),
    published: isNew ? false : Boolean(raw.published),
    archived: Boolean(raw.archived),
    order: typeof raw.order === 'number' ? raw.order : 1,
    seo: {
      title: { ar: raw.seo?.title?.ar || '', en: raw.seo?.title?.en || '' },
      description: { ar: raw.seo?.description?.ar || '', en: raw.seo?.description?.en || '' },
      ogImage: raw.seo?.ogImage || '',
      canonicalSlug: raw.seo?.canonicalSlug || '',
      noindex: Boolean(raw.seo?.noindex),
      structuredDataType: 'BlogPosting',
    },
  };
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({
  initialArticle,
  isNew,
  existingArticles,
  db,
  locale,
  onClose,
  onSave,
  onOpenImagePicker,
  onShowToast,
}) => {
  const isAr = locale === 'ar';
  const [draft, setDraft] = useState<Partial<ArticleItem>>(() =>
    normalizeArticleDraft(initialArticle, isNew)
  );
  const [slugTouched, setSlugTouched] = useState<boolean>(Boolean(initialArticle.slug));
  const [manualReadTime, setManualReadTime] = useState<boolean>(
    Boolean(!isNew && initialArticle.readingTimeMinutes && initialArticle.readingTimeMinutes > 0)
  );
  const [activeTab, setActiveTab] = useState<ArticleEditorTab>('content');
  const [writingPane, setWritingPane] = useState<WritingPaneMode>(locale === 'ar' ? 'ar' : 'en');
  const [splitPreview, setSplitPreview] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<Locale>(locale);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [seoPreviewLocale, setSeoPreviewLocale] = useState<Locale>(locale);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const initialSnapshot = useMemo(
    () => JSON.stringify(normalizeArticleDraft(initialArticle, isNew)),
    [initialArticle, isNew]
  );
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== initialSnapshot,
    [draft, initialSnapshot]
  );

  const arWords = useMemo(
    () => countArticleWords(draft.content?.ar, draft.contentJson?.ar),
    [draft.content?.ar, draft.contentJson?.ar]
  );
  const enWords = useMemo(
    () => countArticleWords(draft.content?.en, draft.contentJson?.en),
    [draft.content?.en, draft.contentJson?.en]
  );
  const autoReadMin = useMemo(
    () => estimateArticleReadingTime(arWords, enWords),
    [arWords, enWords]
  );

  const slugValidation = useMemo(
    () =>
      validateArticleSlug(draft.slug || '', {
        editingId: draft.id,
        existingArticles,
      }),
    [draft.slug, draft.id, existingArticles]
  );

  const siteReferences = useMemo(
    () => checkArticleInSiteReferences(draft, db),
    [draft, db]
  );

  const categoryPresets = useMemo(() => {
    const map = new Map<string, { ar: string; en: string }>();
    for (const art of existingArticles) {
      const ar = art.category?.ar?.trim();
      const en = art.category?.en?.trim();
      if (ar && en) {
        map.set(`${ar}|${en}`, { ar, en });
      }
    }
    return Array.from(map.values()).slice(0, 8);
  }, [existingArticles]);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://ahmedsoliman.dev';
  const arCanonicalPath = `/ar/blog/${draft.slug || 'untitled-article'}`;
  const enCanonicalPath = `/en/blog/${draft.slug || 'untitled-article'}`;

  const updateDraft = (updater: (prev: Partial<ArticleItem>) => Partial<ArticleItem>) => {
    setDraft((prev) => updater(prev));
  };

  const handleAttemptClose = () => {
    if (isDirty) {
      setConfirmDiscardOpen(true);
    } else {
      onClose();
    }
  };

  const handleSaveAction = async (publishState: boolean) => {
    const safeArDoc = sanitizeTiptapDoc(draft.contentJson?.ar);
    const safeEnDoc = sanitizeTiptapDoc(draft.contentJson?.en);
    const syncedArMd = serializeTiptapJsonToMarkdown(safeArDoc) || draft.content?.ar || '';
    const syncedEnMd = serializeTiptapJsonToMarkdown(safeEnDoc) || draft.content?.en || '';

    const candidate: Partial<ArticleItem> = {
      ...draft,
      contentFormat: 'tiptap-json',
      contentJson: {
        ar: safeArDoc,
        en: safeEnDoc,
      },
      content: {
        ar: syncedArMd,
        en: syncedEnMd,
      },
      readingTimeMinutes: manualReadTime
        ? Math.max(1, Number(draft.readingTimeMinutes) || autoReadMin)
        : autoReadMin,
      published: draft.archived ? false : publishState,
    };

    const validation = validateArticlePayload(candidate, { existingArticles });
    if (!validation.valid) {
      onShowToast(validation.errors.join(' '), 'error');
      if (!slugValidation.valid) {
        setActiveTab('seo');
      } else {
        setActiveTab('content');
      }
      return;
    }

    setSaving(true);
    try {
      await onSave(candidate);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = (path: string) => {
    const full = `${origin}${path}`;
    navigator.clipboard?.writeText(full);
    onShowToast(
      isAr ? `تم نسخ الرابط: ${full}` : `Copied URL: ${full}`,
      'info'
    );
  };

  const handleAddTags = (rawInput: string) => {
    const incoming = rawInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (incoming.length === 0) return;
    updateDraft((prev) => {
      const current = prev.tags || [];
      const merged = [...current];
      for (const tag of incoming) {
        if (!merged.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
          merged.push(tag);
        }
      }
      return { ...prev, tags: merged };
    });
    setTagInput('');
  };

  const tabs: { id: ArticleEditorTab; label: { ar: string; en: string }; icon: React.ReactNode }[] = [
    {
      id: 'content',
      label: { ar: 'المحتوى والكتابة', en: 'Content Studio' },
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: 'details',
      label: { ar: 'التفاصيل والتصنيف', en: 'Details & Tags' },
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: 'seo',
      label: { ar: 'SEO والرابط', en: 'SEO & Slug' },
      icon: <Search className="w-3.5 h-3.5" />,
    },
    {
      id: 'preview',
      label: { ar: 'المعاينة الحية', en: 'Live Preview' },
      icon: <Eye className="w-3.5 h-3.5" />,
    },
    {
      id: 'publish',
      label: { ar: 'النشر والأرشفة', en: 'Publish & Status' },
      icon: <Send className="w-3.5 h-3.5" />,
    },
  ];

  const wasConvertedFromMarkdown =
    !isNew && initialArticle.contentFormat !== 'tiptap-json';

  return (
    <div className="fixed inset-0 z-[9992] bg-black/80 backdrop-blur-sm flex flex-col">
      {/* STICKY HEADER & ACTION BAR */}
      <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00C2CB] cursor-pointer shrink-0"
            aria-label={isAr ? 'إغلاق المحرر' : 'Close Editor'}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-[240px] sm:max-w-md">
                {isNew
                  ? isAr
                    ? 'كتابة مقال جديد'
                    : 'Write New Article'
                  : draft.title?.[locale] || draft.title?.ar || draft.title?.en || draft.slug}
              </h2>

              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                  draft.archived
                    ? 'bg-red-500/15 text-red-500'
                    : draft.published
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-amber-500/15 text-amber-500'
                }`}
              >
                {draft.archived
                  ? isAr
                    ? 'مؤرشف'
                    : 'Archived'
                  : draft.published
                  ? isAr
                    ? 'منشور'
                    : 'Published'
                  : isAr
                  ? 'مسودة'
                  : 'Draft'}
              </span>

              {isDirty && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-bold shrink-0">
                  {isAr ? 'تغييرات غير محفوظة' : 'Unsaved changes'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400 truncate">
              <span className="text-[#0099A3] dark:text-[#00C2CB] truncate">
                {isAr ? arCanonicalPath : enCanonicalPath}
              </span>
              <span>·</span>
              <span>
                {arWords} AR / {enWords} EN {isAr ? 'كلمة' : 'words'}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                <Clock className="w-3 h-3 text-[#00C2CB]" />~
                {manualReadTime ? draft.readingTimeMinutes || autoReadMin : autoReadMin}{' '}
                {isAr ? 'د' : 'min'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab !== 'preview' && (
            <button
              type="button"
              onClick={() => setSplitPreview((v) => !v)}
              className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                splitPreview
                  ? 'bg-[#00C2CB]/15 border-[#00C2CB] text-[#0099A3] dark:text-[#00C2CB]'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300'
              }`}
              title={isAr ? 'معاينة حية بجانب المحرر' : 'Toggle Desktop Split Preview'}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'معاينة جانبية' : 'Split Preview'}</span>
            </button>
          )}
          {!draft.archived && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveAction(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isAr ? 'حفظ كمسودة' : 'Save Draft'}
              </span>
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveAction(draft.archived ? false : true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] hover:text-white transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {saving
                ? isAr
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : draft.archived
                ? isAr
                  ? 'حفظ في الأرشيف'
                  : 'Save Archived'
                : draft.published
                ? isAr
                  ? 'تحديث المنشور'
                  : 'Update Live'
                : isAr
                ? 'نشر المقال'
                : 'Publish'}
            </span>
          </button>
        </div>
      </header>

      {/* TABS BAR */}
      <div className="px-4 sm:px-6 bg-slate-50 dark:bg-[#0B1222] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1 py-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#00C2CB] text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
              }`}
            >
              {t.icon}
              <span>{t.label[locale]}</span>
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] shrink-0">
          {wasConvertedFromMarkdown ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>
                {isAr
                  ? 'مقال Markdown قديم — جاهز للتحويل التلقائي إلى Tiptap JSON عند الحفظ'
                  : 'Legacy Markdown — will upgrade cleanly to Tiptap JSON on save'}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Tiptap JSON Studio</span>
            </span>
          )}
        </div>
      </div>

      {/* MAIN WORKSPACE VIEWPORT (SUPPORTS DESKTOP SPLIT LIVE PREVIEW) */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto bg-slate-100 dark:bg-[#070E1A] p-4 sm:p-6 ${
            splitPreview && activeTab !== 'preview'
              ? 'xl:w-1/2 xl:border-e xl:border-slate-200 dark:xl:border-slate-800'
              : 'w-full'
          }`}
        >
        {/* TAB 1: CONTENT STUDIO */}
        {activeTab === 'content' && (
          <div className="max-w-7xl mx-auto space-y-5 text-xs">
            {/* Bilingual Article Titles + Language Focus Switcher */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#00C2CB]" />
                  <span>{isAr ? 'عناوين المقال باللغتين' : 'Bilingual Article Headlines'}</span>
                </h3>

                {/* Writing Pane Mode Switcher */}
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800">
                  {(
                    [
                      { id: 'ar', label: isAr ? 'العربية (RTL)' : 'Arabic (RTL)' },
                      { id: 'en', label: isAr ? 'الإنجليزية (LTR)' : 'English (LTR)' },
                      {
                        id: 'split',
                        label: isAr ? 'عرض مزدوج' : 'Side-by-Side',
                        icon: <Columns2 className="w-3.5 h-3.5" />,
                      },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setWritingPane(mode.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        writingPane === mode.id
                          ? 'bg-[#00C2CB] text-slate-950'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {'icon' in mode ? mode.icon : null}
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
                    {isAr ? 'عنوان المقال بالعربية *' : 'Arabic Title (AR) *'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={draft.title?.ar || ''}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        title: { ar: e.target.value, en: prev.title?.en || '' },
                      }))
                    }
                    placeholder="اكتب عنوان المقال بالعربية..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
                    {isAr ? 'عنوان المقال بالإنجليزية *' : 'English Title (EN) *'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={draft.title?.en || ''}
                    onChange={(e) => {
                      const enVal = e.target.value;
                      updateDraft((prev) => ({
                        ...prev,
                        title: { ar: prev.title?.ar || '', en: enVal },
                        slug: !slugTouched && isNew ? slugifyText(enVal) : prev.slug,
                      }));
                    }}
                    placeholder="Enter English article title..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            {/* WIDE TIPTAP EDITING CANVASES */}
            <div
              className={`grid grid-cols-1 gap-5 ${
                writingPane === 'split' ? 'xl:grid-cols-2' : ''
              }`}
            >
              {(writingPane === 'ar' || writingPane === 'split') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00C2CB]" />
                      {isAr
                        ? 'محرر المحتوى العربي (RTL) *'
                        : 'Arabic Article Content (RTL) *'}
                    </span>
                    <span className="text-[11px] font-mono-tabular text-slate-500">
                      {arWords} {isAr ? 'كلمة' : 'words'}
                    </span>
                  </div>
                  <RichTextEditor
                    valueJson={draft.contentJson?.ar}
                    fallbackMarkdown={draft.content?.ar}
                    direction="rtl"
                    uiLocale={locale}
                    contentLocale="ar"
                    minHeightClass={
                      writingPane === 'split' ? 'min-h-[460px]' : 'min-h-[520px]'
                    }
                    onChange={(nextJson, syncedMarkdown) => {
                      updateDraft((prev) => ({
                        ...prev,
                        contentFormat: 'tiptap-json',
                        contentJson: {
                          ...prev.contentJson,
                          ar: nextJson,
                        },
                        content: {
                          ar: syncedMarkdown,
                          en: prev.content?.en || '',
                        },
                      }));
                    }}
                    onRequestImagePicker={(insertImage) =>
                      onOpenImagePicker((url) =>
                        insertImage(
                          url,
                          draft.title?.ar || draft.title?.en || 'صورة المقال'
                        )
                      )
                    }
                    onShowToast={onShowToast}
                  />
                </div>
              )}

              {(writingPane === 'en' || writingPane === 'split') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      {isAr
                        ? 'محرر المحتوى الإنجليزي (LTR) *'
                        : 'English Article Content (LTR) *'}
                    </span>
                    <span className="text-[11px] font-mono-tabular text-slate-500">
                      {enWords} {isAr ? 'كلمة' : 'words'}
                    </span>
                  </div>
                  <RichTextEditor
                    valueJson={draft.contentJson?.en}
                    fallbackMarkdown={draft.content?.en}
                    direction="ltr"
                    uiLocale={locale}
                    contentLocale="en"
                    minHeightClass={
                      writingPane === 'split' ? 'min-h-[460px]' : 'min-h-[520px]'
                    }
                    onChange={(nextJson, syncedMarkdown) => {
                      updateDraft((prev) => ({
                        ...prev,
                        contentFormat: 'tiptap-json',
                        contentJson: {
                          ...prev.contentJson,
                          en: nextJson,
                        },
                        content: {
                          ar: prev.content?.ar || '',
                          en: syncedMarkdown,
                        },
                      }));
                    }}
                    onRequestImagePicker={(insertImage) =>
                      onOpenImagePicker((url) =>
                        insertImage(
                          url,
                          draft.title?.en || draft.title?.ar || 'Article figure'
                        )
                      )
                    }
                    onShowToast={onShowToast}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DETAILS & TAXONOMY */}
        {activeTab === 'details' && (
          <div className="max-w-5xl mx-auto space-y-5 text-xs">
            {/* Excerpts */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'الملخص التحريري (Excerpt)' : 'Editorial Excerpts'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5">
                    {isAr ? 'الملخص بالعربية' : 'Excerpt (AR)'}
                  </label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={draft.excerpt?.ar || ''}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        excerpt: { ar: e.target.value, en: prev.excerpt?.en || '' },
                      }))
                    }
                    placeholder="وصف مختصر يظهر في بطاقة المقال على المدونة..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">
                    {isAr ? 'الملخص بالإنجليزية' : 'Excerpt (EN)'}
                  </label>
                  <textarea
                    rows={3}
                    dir="ltr"
                    value={draft.excerpt?.en || ''}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        excerpt: { ar: prev.excerpt?.ar || '', en: e.target.value },
                      }))
                    }
                    placeholder="Short summary displayed on the blog index cards..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Cover Image & Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Cover Image */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#00C2CB]" />
                  <span>{isAr ? 'صورة غلاف المقال' : 'Article Cover Image'}</span>
                </h3>

                <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  {draft.coverImage ? (
                    <img
                      src={draft.coverImage}
                      alt={draft.title?.[locale] || 'Cover'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-slate-400 space-y-1 p-4">
                      <ImageIcon className="w-8 h-8 mx-auto opacity-40" />
                      <p>{isAr ? 'لم يتم اختيار صورة غلاف بعد' : 'No cover image selected'}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={draft.coverImage || ''}
                    onChange={(e) =>
                      updateDraft((prev) => ({ ...prev, coverImage: e.target.value }))
                    }
                    placeholder="https://res.cloudinary.com/..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onOpenImagePicker((url) =>
                        updateDraft((prev) => ({ ...prev, coverImage: url }))
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#00C2CB]/15 text-[#0099A3] dark:text-[#00C2CB] hover:bg-[#00C2CB] hover:text-slate-950 font-bold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {isAr ? 'اختيار من المكتبة' : 'Media Library'}
                  </button>
                </div>
              </div>

              {/* Category + Author + Reading Time + Order */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'التصنيف وبيانات المؤلف' : 'Category & Author Metadata'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Category (AR)</label>
                    <input
                      type="text"
                      dir="rtl"
                      value={draft.category?.ar || ''}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          category: { ar: e.target.value, en: prev.category?.en || '' },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Category (EN)</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={draft.category?.en || ''}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          category: { ar: prev.category?.ar || '', en: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                {categoryPresets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {categoryPresets.map((preset) => (
                      <button
                        key={`${preset.ar}-${preset.en}`}
                        type="button"
                        onClick={() =>
                          updateDraft((prev) => ({ ...prev, category: preset }))
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#00C2CB]/15 hover:text-[#00C2CB] text-[11px] font-medium cursor-pointer"
                      >
                        {preset[locale]}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold mb-1">
                      {isAr ? 'اسم الكاتب (AR)' : 'Author Name (AR)'}
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={draft.authorName?.ar || ''}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          authorName: { ar: e.target.value, en: prev.authorName?.en || '' },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      {isAr ? 'اسم الكاتب (EN)' : 'Author Name (EN)'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={draft.authorName?.en || ''}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          authorName: { ar: prev.authorName?.ar || '', en: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold">
                        {isAr ? 'وقت القراءة (دقائق)' : 'Reading Time (min)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setManualReadTime((v) => !v)}
                        className="text-[11px] font-bold text-[#00C2CB] cursor-pointer"
                      >
                        {manualReadTime
                          ? isAr
                            ? 'تلقائي'
                            : 'Use Auto'
                          : isAr
                          ? 'تعديل يدوي'
                          : 'Override'}
                      </button>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      disabled={!manualReadTime}
                      value={manualReadTime ? draft.readingTimeMinutes || autoReadMin : autoReadMin}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          readingTimeMinutes: Math.max(1, Number(e.target.value) || autoReadMin),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">
                      {isAr ? 'ترتيب العرض' : 'Display Order'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={draft.order ?? 1}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          order: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 pt-2 font-bold text-[#0099A3] dark:text-[#00C2CB] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.featured)}
                    onChange={(e) =>
                      updateDraft((prev) => ({ ...prev, featured: e.target.checked }))
                    }
                  />
                  <Star className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تمييز كمقال رئيسي (Featured Story)' : 'Featured Cover Story'}</span>
                </label>
              </div>
            </div>

            {/* Interactive Tags Chips */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#00C2CB]" />
                <span>{isAr ? 'الوسوم (Tags)' : 'Article Tags'}</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {(draft.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00C2CB]/15 text-[#0099A3] dark:text-[#00C2CB] font-semibold text-xs"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft((prev) => ({
                          ...prev,
                          tags: (prev.tags || []).filter((t) => t !== tag),
                        }))
                      }
                      className="hover:text-red-500 cursor-pointer"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTags(tagInput);
                    }
                  }}
                  placeholder={
                    isAr
                      ? 'اكتب وسماً ثم اضغط Enter (أو افصل بينها بفاصلة)...'
                      : 'Type a tag and press Enter (or comma-separated)...'
                  }
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => handleAddTags(tagInput)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة' : 'Add'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SEO & SLUG */}
        {activeTab === 'seo' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
            <div className="lg:col-span-7 space-y-5">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'رابط المقال وإعدادات SEO' : 'URL Slug & SEO Metadata'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = slugifyText(draft.title?.en || '');
                      if (generated) {
                        setSlugTouched(true);
                        updateDraft((prev) => ({ ...prev, slug: generated }));
                      }
                    }}
                    className="text-[11px] font-bold text-[#00C2CB] cursor-pointer"
                  >
                    {isAr ? 'توليد تلقائي من العنوان EN' : 'Generate from EN Title'}
                  </button>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Slug *</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={draft.slug || ''}
                    onChange={(e) => {
                      setSlugTouched(true);
                      updateDraft((prev) => ({
                        ...prev,
                        slug: slugifyText(e.target.value),
                      }));
                    }}
                    placeholder="e.g. hospital-automation-architecture"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border font-mono-tabular ${
                      draft.slug && !slugValidation.valid
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                  {draft.slug && !slugValidation.valid ? (
                    <p className="mt-1.5 text-[11px] text-red-500 font-semibold">
                      {slugValidation.errors[0]}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] font-mono-tabular text-slate-500">
                      Canonical AR: {arCanonicalPath} · EN: {enCanonicalPath}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold">SEO Title (AR)</label>
                      <span className="font-mono-tabular text-[10px] text-slate-400">
                        {(draft.seo?.title?.ar || '').length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      dir="rtl"
                      value={draft.seo?.title?.ar || ''}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          seo: {
                            ...prev.seo!,
                            title: { ar: e.target.value, en: prev.seo?.title?.en || '' },
                          },
                        }))
                      }
                      placeholder={draft.title?.ar || ''}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold">SEO Title (EN)</label>
                      <span className="font-mono-tabular text-[10px] text-slate-400">
                        {(draft.seo?.title?.en || '').length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={draft.seo?.title?.en || ''}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          seo: {
                            ...prev.seo!,
                            title: { ar: prev.seo?.title?.ar || '', en: e.target.value },
                          },
                        }))
                      }
                      placeholder={draft.title?.en || ''}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold">SEO Description (AR)</label>
                      <span className="font-mono-tabular text-[10px] text-slate-400">
                        {(draft.seo?.description?.ar || '').length}/160
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      dir="rtl"
                      value={draft.seo?.description?.ar || ''}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          seo: {
                            ...prev.seo!,
                            description: {
                              ar: e.target.value,
                              en: prev.seo?.description?.en || '',
                            },
                          },
                        }))
                      }
                      placeholder={draft.excerpt?.ar || ''}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold">SEO Description (EN)</label>
                      <span className="font-mono-tabular text-[10px] text-slate-400">
                        {(draft.seo?.description?.en || '').length}/160
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      dir="ltr"
                      value={draft.seo?.description?.en || ''}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          seo: {
                            ...prev.seo!,
                            description: {
                              ar: prev.seo?.description?.ar || '',
                              en: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder={draft.excerpt?.en || ''}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    {isAr ? 'صورة المشاركة (OG Image)' : 'Open Graph Image URL'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={draft.seo?.ogImage || ''}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          seo: { ...prev.seo!, ogImage: e.target.value },
                        }))
                      }
                      placeholder={draft.coverImage || 'Defaults to Cover Image'}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 font-mono-tabular"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onOpenImagePicker((url) =>
                          updateDraft((prev) => ({
                            ...prev,
                            seo: { ...prev.seo!, ogImage: url },
                          }))
                        )
                      }
                      className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold cursor-pointer whitespace-nowrap"
                    >
                      {isAr ? 'اختر' : 'Pick'}
                    </button>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.seo?.noindex)}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        seo: { ...prev.seo!, noindex: e.target.checked },
                      }))
                    }
                  />
                  <span>
                    {isAr
                      ? 'منع الفهرسة في محركات البحث (noindex)'
                      : 'Exclude from search indexing (noindex)'}
                  </span>
                </label>
              </div>
            </div>

            {/* SERP & Social Preview */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'معاينة نتائج البحث والمشاركة' : 'SERP & Social Card Preview'}
                  </h3>
                  <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
                    {(['ar', 'en'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setSeoPreviewLocale(l)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                          seoPreviewLocale === l ? 'bg-[#00C2CB] text-slate-950' : 'text-slate-400'
                        }`}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Google SERP Preview */}
                <div
                  dir={seoPreviewLocale === 'ar' ? 'rtl' : 'ltr'}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-1"
                >
                  <div className="text-[11px] font-mono-tabular text-emerald-600 dark:text-emerald-400 truncate">
                    {origin}
                    {seoPreviewLocale === 'ar' ? arCanonicalPath : enCanonicalPath}
                  </div>
                  <div className="text-sm font-bold text-blue-600 dark:text-sky-400 line-clamp-1">
                    {draft.seo?.title?.[seoPreviewLocale] ||
                      draft.title?.[seoPreviewLocale] ||
                      'Article Title Preview'}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {draft.seo?.description?.[seoPreviewLocale] ||
                      draft.excerpt?.[seoPreviewLocale] ||
                      'Article meta description snippet appears here.'}
                  </p>
                </div>

                {/* Social OG Card */}
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070E1A]">
                  <div className="aspect-[16/9] bg-slate-900 overflow-hidden">
                    {draft.seo?.ogImage || draft.coverImage ? (
                      <img
                        src={draft.seo?.ogImage || draft.coverImage}
                        alt="OG Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <ImageIcon className="w-8 h-8 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div
                    dir={seoPreviewLocale === 'ar' ? 'rtl' : 'ltr'}
                    className="p-3.5 space-y-1"
                  >
                    <div className="text-[10px] font-mono-tabular uppercase text-slate-400">
                      ahmedsoliman.dev
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                      {draft.seo?.title?.[seoPreviewLocale] ||
                        draft.title?.[seoPreviewLocale] ||
                        'Open Graph Title'}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {draft.seo?.description?.[seoPreviewLocale] ||
                        draft.excerpt?.[seoPreviewLocale] ||
                        'Open Graph social sharing description.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PUBLISH & STATUS */}
        {activeTab === 'publish' && (
          <div className="max-w-4xl mx-auto space-y-5 text-xs">
            {draft.archived && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-amber-500">
                    {isAr
                      ? 'هذا المقال في سلة المحذوفات / الأرشيف'
                      : 'This Article is in Archive / Trash'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {isAr
                      ? 'المقال مخفي عن الزوار ومحذوف من Sitemap. قم باستعادته إلى المسودات أولاً لتتمكن من نشره.'
                      : 'Hidden from visitors and Sitemap. Restore it to Draft first before publishing live.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateDraft((prev) => ({
                      ...prev,
                      archived: false,
                      archivedAt: undefined,
                      published: false,
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'استعادة كمسودة' : 'Restore to Draft'}</span>
                </button>
              </div>
            )}

            {siteReferences.inUse && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-indigo-400">
                    {isAr
                      ? 'هذا المقال مستخدم في روابط الموقع:'
                      : 'Referenced across site content:'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {siteReferences.usedIn.join(' · ')}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'حالة النشر والتواريخ' : 'Publication State & Timestamps'}
                </h3>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isAr ? 'الحالة' : 'Status'}
                    </span>
                    <span
                      className={`font-bold ${
                        draft.archived
                          ? 'text-red-500'
                          : draft.published
                          ? 'text-emerald-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {draft.archived
                        ? isAr
                          ? 'مؤرشف'
                          : 'Archived'
                        : draft.published
                        ? isAr
                          ? 'منشور للجمهور'
                          : 'Published Live'
                        : isAr
                        ? 'مسودة مخفية'
                        : 'Hidden Draft'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isAr ? 'صيغة المحتوى' : 'Storage Format'}
                    </span>
                    <span className="font-mono-tabular font-semibold text-[#00C2CB]">
                      tiptap-json + markdown-sync
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isAr ? 'تاريخ الإنشاء' : 'Created At'}
                    </span>
                    <span className="font-mono-tabular font-semibold">
                      {draft.createdAt
                        ? draft.createdAt.slice(0, 16).replace('T', ' ')
                        : isAr
                        ? 'جديد'
                        : 'New'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isAr ? 'آخر تحديث' : 'Last Updated'}
                    </span>
                    <span className="font-mono-tabular font-semibold">
                      {draft.updatedAt
                        ? draft.updatedAt.slice(0, 16).replace('T', ' ')
                        : isAr
                        ? 'قيد التحرير'
                        : 'Editing'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#00C2CB]" />
                  <span>{isAr ? 'روابط المقال النهائية' : 'Final Article URLs'}</span>
                </h3>

                {[
                  { label: 'العربية (AR)', path: arCanonicalPath },
                  { label: 'English (EN)', path: enCanonicalPath },
                ].map((linkItem) => (
                  <div
                    key={linkItem.label}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{linkItem.label}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(linkItem.path)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:text-[#00C2CB] font-semibold cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{isAr ? 'نسخ' : 'Copy'}</span>
                        </button>
                        <a
                          href={linkItem.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00C2CB]/15 text-[#00C2CB] font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{isAr ? 'فتح' : 'Open'}</span>
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

        {/* TAB 5: FULL LIVE ARTICLE PREVIEW */}
        {activeTab === 'preview' && (
          <div className="max-w-6xl mx-auto space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#00C2CB]" />
                <span className="font-bold text-slate-900 dark:text-white">
                  {isAr
                    ? 'معاينة القراءة الحقيقية للمقال (قبل النشر)'
                    : 'Full Live Reader Preview (Before Publishing)'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5">
                  {(['ar', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setPreviewLocale(l)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        previewLocale === l ? 'bg-[#00C2CB] text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      {l === 'ar' ? 'العربية (AR)' : 'English (EN)'}
                    </button>
                  ))}
                </div>

                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('desktop')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                      previewViewport === 'desktop'
                        ? 'bg-[#00C2CB] text-slate-950'
                        : 'text-slate-400'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>{isAr ? 'كمبيوتر' : 'Desktop'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('mobile')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                      previewViewport === 'mobile'
                        ? 'bg-[#00C2CB] text-slate-950'
                        : 'text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isAr ? 'جوال' : 'Mobile'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div
                className={`rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-2xl transition-all duration-300 bg-[#F5F4EF] dark:bg-[#111413] ${
                  previewViewport === 'mobile' ? 'w-[390px] max-w-full' : 'w-full'
                }`}
              >
                <BlogDetailPage
                  previewArticle={draft}
                  previewLocale={previewLocale}
                  embeddedPreview
                />
              </div>
            </div>
          </div>
        )}
        </div>

        {/* OPTIONAL DESKTOP SPLIT-VIEW LIVE ARTICLE PREVIEW */}
        {splitPreview && activeTab !== 'preview' && (
          <div className="hidden xl:flex flex-col w-1/2 bg-[#F5F4EF] dark:bg-[#111413] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#0B1222] border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
              <span className="font-bold text-[#00C2CB]">
                {isAr ? 'معاينة المقال الحية' : 'Live Article Preview'}
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
              <BlogDetailPage
                previewArticle={draft}
                previewLocale={previewLocale}
                embeddedPreview
              />
            </div>
          </div>
        )}
      </div>

      {/* UNSAVED CHANGES GUARD MODAL */}
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
                {isAr ? 'تجاهل التعديلات غير المحفوظة؟' : 'Discard Unsaved Changes?'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isAr
                ? 'لديك تعديلات داخل المقال لم يتم حفظها بعد. إذا أغلقت المحرر الآن فستفقد هذه التغييرات.'
                : 'You have unsaved edits in this article. Closing now will discard those edits.'}
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDiscardOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {isAr ? 'الاستمرار في التحرير' : 'Keep Editing'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDiscardOpen(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                {isAr ? 'تجاهل وإغلاق' : 'Discard & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
