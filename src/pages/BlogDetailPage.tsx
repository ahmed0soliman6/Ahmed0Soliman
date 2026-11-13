import React from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { ArticleContentRenderer } from '../components/blog/ArticleContentRenderer';
import { ArticleItem, Locale } from '../types/cms';
import {
  countArticleWords,
  estimateArticleReadingTime,
} from '../lib/validationSchemas';
import {
  ArrowLeft,
  ArrowRight,
  Share2,
  MessageCircle,
  Clock,
  BookOpen,
  ArrowUpRight,
  Calendar,
  Sun,
  Moon,
  Send,
  Linkedin,
  Check,
} from 'lucide-react';

interface BlogDetailPageProps {
  slug?: string;
  previewArticle?: Partial<ArticleItem>;
  previewLocale?: Locale;
  embeddedPreview?: boolean;
}

function formatEditorialDate(isoDate: string | undefined, locale: 'ar' | 'en'): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({
  slug,
  previewArticle,
  previewLocale,
  embeddedPreview = false,
}) => {
  const { locale: ctxLocale, theme, toggleTheme, navigate, db, showToast, adminSession } = usePlatform();
  const [copied, setCopied] = React.useState(false);

  const locale = previewLocale || ctxLocale;
  const isAr = locale === 'ar';
  const matched = slug
    ? db.articles.find((a) => a.slug === slug || a.id === slug)
    : undefined;
  const article = (previewArticle || matched) as ArticleItem | undefined;
  const settings = db.siteSettings;

  const isHiddenForVisitor =
    !embeddedPreview &&
    (!article || Boolean(article.archived) || (!article.published && !adminSession));

  if (!article || (isHiddenForVisitor && !adminSession)) {
    return (
      <LayoutResolver pageWorld="blog-magazine">
        <div className="min-h-screen bg-[#F5F4EF] dark:bg-[#111413] text-[#18181B] dark:text-[#EDEAE2] flex flex-col items-center justify-center py-24 px-4 text-center space-y-5">
          <h1 className="text-2xl font-black text-stone-950 dark:text-white">
            {isAr ? 'المقال غير متاح حالياً' : 'Article Unavailable'}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md">
            {isAr
              ? 'قد يكون هذا المقال في وضع المسودة أو الأرشيف أو تم نقل رابطه.'
              : 'This article may be an unpublished draft, archived, or no longer available at this URL.'}
          </p>
          <button
            type="button"
            onClick={() => navigate(`/${locale}/blog`)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#16382E] text-white dark:bg-[#6EE7B7] dark:text-[#0F1715] cursor-pointer"
          >
            {isAr ? 'العودة إلى المدونة' : 'Back to Blog'}
          </button>
        </div>
      </LayoutResolver>
    );
  }

  const computedReadingTime =
    article.readingTimeMinutes && article.readingTimeMinutes > 0
      ? article.readingTimeMinutes
      : estimateArticleReadingTime(
          countArticleWords(article.content?.ar, article.contentJson?.ar),
          countArticleWords(article.content?.en, article.contentJson?.en)
        );

  const relatedArticles = db.articles
    .filter((a) => a.published && !a.archived && a.id !== article.id)
    .sort((a, b) => a.order - b.order)
    .slice(0, 2);

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `/${locale}/blog/${article.slug}`;
  const shareTitle = article.title[locale];

  const handleCopyShareUrl = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
    showToast(
      isAr ? 'تم نسخ رابط المقال للمشاركة' : 'Article link copied to clipboard',
      'success'
    );
  };

  const articleContent = (
    <article
      dir={isAr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#F5F4EF] dark:bg-[#111413] text-[#18181B] dark:text-[#EDEAE2] transition-colors duration-300 ${
        embeddedPreview ? 'py-8' : 'pt-16 sm:pt-14 pb-20'
      } px-4 sm:px-8`}
    >
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Top Reader Navigation & Theme Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300/70 dark:border-stone-800 pb-4">
          <button
            type="button"
            onClick={() => !embeddedPreview && navigate(`/${locale}/blog`)}
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-[#16382E] dark:hover:text-[#6EE7B7] transition-colors cursor-pointer min-h-[38px]"
          >
            {isAr ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span>{isAr ? 'العودة إلى المدونة' : 'All Essays'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark'
                ? isAr
                  ? 'التبديل إلى الوضع النهاري'
                  : 'Switch to Daylight Mode'
                : isAr
                ? 'التبديل إلى الوضع الليلي'
                : 'Switch to Night Mode'
            }
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#191E1C] border border-stone-300/90 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:border-[#16382E] dark:hover:border-[#6EE7B7] transition-colors cursor-pointer min-h-[38px]"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{isAr ? 'الوضع النهاري' : 'Daylight'}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#16382E] shrink-0" />
                <span>{isAr ? 'الوضع الليلي' : 'Night'}</span>
              </>
            )}
          </button>
        </div>

        {/* Monograph Editorial Header */}
        <header className="space-y-6 border-b border-stone-300/80 dark:border-stone-800 pb-8">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-600 dark:text-stone-400">
            <span className="font-extrabold text-[#16382E] dark:text-[#6EE7B7]">
              {article.category?.[locale] || article.category?.ar || article.category?.en || ''}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#16382E] dark:text-[#6EE7B7]" />
              <span>{formatEditorialDate(article.createdAt || new Date().toISOString(), locale)}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5 font-mono-tabular">
              <Clock className="w-3.5 h-3.5 text-[#16382E] dark:text-[#6EE7B7]" />
              <span>
                {computedReadingTime}{' '}
                {isAr ? 'دقائق قراءة' : 'min read'}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {article.authorName?.[locale] || settings.ownerName[locale]}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-[2.65rem] font-black tracking-tight text-stone-950 dark:text-[#F5F3EE] leading-[1.2]">
            {article.title?.[locale] || (isAr ? 'عنوان المقال' : 'Untitled Article')}
          </h1>

          {(article.excerpt?.[locale] || '').trim() && (
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed">
              {article.excerpt?.[locale]}
            </p>
          )}

          {article.coverImage && (
            <figure className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-900 h-64 sm:h-80 lg:h-[420px]">
              <OptimizedImage
                src={article.coverImage}
                alt={article.title?.[locale] || article.slug || 'Article cover'}
                priority={!embeddedPreview}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
            </figure>
          )}
        </header>

        {/* Editorial Prose Reader (Tiptap JSON + Legacy Markdown Backward Compatible) */}
        <div className="max-w-[68ch] mx-auto text-base sm:text-[1.0625rem] text-stone-800 dark:text-[#DDD9D0] dark:tracking-[0.005em]">
          <ArticleContentRenderer
            contentJson={article.contentJson?.[locale]}
            fallbackMarkdown={article.content?.[locale]}
            locale={locale}
            titleFallback={article.title?.[locale]}
          />
        </div>

        {/* Tags Strip (unboxed clean typographic hashtags) */}
        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <div className="max-w-[68ch] mx-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-xs font-mono-tabular text-stone-500 dark:text-stone-400">
            {article.tags.map((tag, idx) => (
              <span key={idx}>#{tag}</span>
            ))}
          </div>
        )}

          {/* Direct Social Share Bar */}
          <section
            aria-label={isAr ? 'مشاركة المقال' : 'Share this article'}
            className="max-w-[68ch] mx-auto p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#171B1A] border border-stone-200/90 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-0.5">
              <h2 className="text-sm font-extrabold text-stone-950 dark:text-[#F5F3EE]">
                {isAr ? 'شارك المقال مع زملائك' : 'Share this essay'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isAr
                  ? 'انشر الرابط مباشرة عبر الشبكات الاجتماعية أو انسخه.'
                  : 'Share directly on your preferred network or copy the link.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareTitle} — ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#16382E] text-white dark:bg-[#6EE7B7] dark:text-[#0F1715] hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F5F4EF] dark:bg-[#202624] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
              >
                <span>X</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F5F4EF] dark:bg-[#202624] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span>LinkedIn</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F5F4EF] dark:bg-[#202624] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'تليجرام' : 'Telegram'}</span>
              </a>

              <button
                type="button"
                onClick={handleCopyShareUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F5F4EF] dark:bg-[#202624] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-[#16382E] dark:hover:border-[#6EE7B7] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#6EE7B7]" />
                    <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Author Bio & Related Articles Footer */}
          <footer className="pt-8 border-t border-stone-300/80 dark:border-stone-800 space-y-10">
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#171B1A] border border-stone-200/90 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-stone-300 dark:border-stone-700 shrink-0">
                  <OptimizedImage
                    src={settings.avatarUrl}
                    alt={settings.ownerName[locale]}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <div className="text-base font-extrabold text-stone-950 dark:text-[#F5F3EE]">
                    {settings.ownerName[locale]}
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    {settings.ownerRole[locale]}
                  </div>
                </div>
              </div>

              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#16382E] text-white dark:bg-[#6EE7B7] dark:text-[#0F1715] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'ناقش الموضوع عبر واتساب' : 'Discuss on WhatsApp'}</span>
              </a>
            </div>

            {relatedArticles.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-stone-950 dark:text-[#F5F3EE] inline-flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#16382E] dark:text-[#6EE7B7]" />
                    <span>{isAr ? 'مقالات ذات صلة' : 'Related Essays'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate(`/${locale}/blog`)}
                    className="text-xs font-bold text-[#16382E] dark:text-[#6EE7B7] hover:underline cursor-pointer"
                  >
                    {isAr ? 'عرض جميع المقالات' : 'View All'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {relatedArticles.map((rel) => (
                    <article
                      key={rel.id}
                      onClick={() => navigate(`/${locale}/blog/${rel.slug}`)}
                      className="cursor-pointer group rounded-2xl overflow-hidden bg-white dark:bg-[#171B1A] border border-stone-200/90 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-colors flex flex-col justify-between"
                    >
                      {rel.coverImage && (
                        <div className="h-36 bg-stone-900 overflow-hidden border-b border-stone-100 dark:border-stone-800">
                          <OptimizedImage
                            src={rel.coverImage}
                            alt={rel.title[locale]}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}

                      <div className="p-5 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                            <span className="font-bold text-[#16382E] dark:text-[#6EE7B7]">
                              {rel.category[locale]}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{formatEditorialDate(rel.createdAt, locale)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">
                              {rel.readingTimeMinutes} {isAr ? 'د' : 'min'}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-stone-950 dark:text-[#F5F3EE] group-hover:text-[#16382E] dark:group-hover:text-[#6EE7B7] transition-colors line-clamp-2 leading-snug">
                            {rel.title[locale]}
                          </h4>
                        </div>

                        <div className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 dark:text-stone-300 group-hover:text-[#16382E] dark:group-hover:text-[#6EE7B7] pt-2">
                          <span>{isAr ? 'اقرأ المقال' : 'Read Essay'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </footer>
        </div>
      </article>
  );

  if (embeddedPreview) {
    return articleContent;
  }

  return (
    <LayoutResolver pageWorld="blog-magazine" adminQuickEditPath="/admin/blog">
      <SEOHead
        locale={locale}
        seo={article.seo}
        fallbackTitle={`${article.title?.[locale] || ''} | ${settings.brandName[locale]}`}
        fallbackDescription={article.excerpt?.[locale] || ''}
        pathname={`/${locale}/blog/${article.slug}`}
        structuredDataPayload={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title?.[locale] || '',
          description: article.excerpt?.[locale] || '',
          image: article.coverImage,
          author: {
            '@type': 'Person',
            name: article.authorName?.[locale] || settings.ownerName[locale],
          },
          datePublished: article.createdAt,
          dateModified: article.updatedAt,
        }}
      />
      {articleContent}
    </LayoutResolver>
  );
};
