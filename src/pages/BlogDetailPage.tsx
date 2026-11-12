import React from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  ArrowLeft,
  ArrowRight,
  Share2,
  MessageCircle,
  Clock,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';

interface BlogDetailPageProps {
  slug: string;
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ slug }) => {
  const { locale, navigate, db, showToast } = usePlatform();

  const article = db.articles.find((a) => a.slug === slug || a.id === slug);
  const settings = db.siteSettings;

  if (!article) {
    return (
      <LayoutResolver>
        <div className="max-w-3xl mx-auto py-24 px-4 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {locale === 'ar' ? 'المقال غير موجود' : 'Article Not Found'}
          </h1>
          <button
            onClick={() => navigate(`/${locale}/blog`)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950"
          >
            {locale === 'ar' ? 'العودة إلى المدونة' : 'Back to Blog'}
          </button>
        </div>
      </LayoutResolver>
    );
  }

  const rawContent = article.content[locale] || '';
  const blocks = rawContent
    .split('\n\n')
    .map((b) => b.trim())
    .filter(Boolean);

  const relatedArticles = db.articles
    .filter((a) => a.published && a.id !== article.id)
    .slice(0, 2);

  const handleCopyShareUrl = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(
      locale === 'ar' ? 'تم نسخ رابط المقال للمشاركة' : 'Article link copied to clipboard',
      'success'
    );
  };

  return (
    <LayoutResolver pageWorld="blog-magazine" adminQuickEditPath="/admin/blog">
      <SEOHead
        locale={locale}
        seo={article.seo}
        fallbackTitle={`${article.title[locale]} | ${settings.brandName[locale]}`}
        fallbackDescription={article.excerpt[locale]}
        pathname={`/${locale}/blog/${article.slug}`}
        structuredDataPayload={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title[locale],
          description: article.excerpt[locale],
          author: {
            '@type': 'Person',
            name: article.authorName[locale],
          },
          datePublished: article.createdAt,
          dateModified: article.updatedAt,
        }}
      />

      <article className="py-12 lg:py-20 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Top Bar: Back + Share Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => navigate(`/${locale}/blog`)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00C2CB] transition-colors"
            >
              {locale === 'ar' ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              <span>{locale === 'ar' ? 'كل المقالات والمعرفة' : 'All Articles'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyShareUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#00C2CB]"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'نسخ رابط المقال' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Monograph Header */}
          <header className="space-y-6 border-b border-slate-200 dark:border-slate-800 pb-8">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="px-3 py-1 rounded-md bg-[#00C2CB]/15 text-[#00C2CB] font-bold">
                {article.category[locale]}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 font-mono-tabular">
                <Clock className="w-3.5 h-3.5 text-[#00C2CB]" />
                {article.readingTimeMinutes}{' '}
                {locale === 'ar' ? 'دقائق قراءة' : 'min read'}
              </span>
              <span>·</span>
              <span>{article.authorName[locale]}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[2.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {article.title[locale]}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {article.excerpt[locale]}
            </p>

            {article.coverImage && (
              <figure className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#070E1A] h-64 sm:h-80">
                <OptimizedImage
                  src={article.coverImage}
                  alt={article.title[locale]}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
              </figure>
            )}
          </header>

          {/* Editorial Prose Reader (68ch optimal reading measure) */}
          <div className="space-y-6 text-base sm:text-[1.0625rem] text-slate-700 dark:text-slate-200 leading-[1.85]">
            {blocks.map((block, idx) => {
              if (block.startsWith('## ')) {
                return (
                  <h2
                    key={idx}
                    className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white pt-4 border-b border-slate-200/70 dark:border-slate-800/70 pb-2"
                  >
                    {block.replace('## ', '')}
                  </h2>
                );
              }
              if (block.startsWith('### ')) {
                return (
                  <h3
                    key={idx}
                    className="text-lg sm:text-xl font-bold text-[#00C2CB] pt-2"
                  >
                    {block.replace('### ', '')}
                  </h3>
                );
              }
              return (
                <p key={idx} className="whitespace-pre-line">
                  {block}
                </p>
              );
            })}
          </div>

          {/* Tags Strip */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-4">
              {article.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-mono-tabular bg-slate-100 dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author Bio Card */}
          <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-10">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-[#00C2CB]/50 shrink-0">
                  <OptimizedImage
                    src={settings.avatarUrl}
                    alt={settings.ownerName[locale]}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {settings.ownerName[locale]}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {settings.ownerRole[locale]}
                  </div>
                </div>
              </div>

              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'ناقش فكرتك عبر واتساب' : 'Discuss on WhatsApp'}</span>
              </a>
            </div>

            {/* Related Articles Section */}
            {relatedArticles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white inline-flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#00C2CB]" />
                    <span>{locale === 'ar' ? 'مقالات ذات صلة' : 'Related Articles'}</span>
                  </h3>
                  <button
                    onClick={() => navigate(`/${locale}/blog`)}
                    className="text-xs font-bold text-[#00C2CB] hover:underline"
                  >
                    {locale === 'ar' ? 'عرض جميع المقالات' : 'View All'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedArticles.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => navigate(`/${locale}/blog/${rel.slug}`)}
                      className="cursor-pointer group p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB]/60 transition-colors space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs text-[#00C2CB] font-bold">
                        <span>{rel.category[locale]}</span>
                        <span className="font-mono-tabular text-slate-400">
                          {rel.readingTimeMinutes} min
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#00C2CB] transition-colors line-clamp-2">
                        {rel.title[locale]}
                      </h4>
                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-[#00C2CB]">
                        <span>{locale === 'ar' ? 'اقرأ المقال' : 'Read Essay'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </footer>
        </div>
      </article>
    </LayoutResolver>
  );
};
