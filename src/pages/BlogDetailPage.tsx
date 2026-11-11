import React from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { ArrowLeft, ArrowRight, Share2, MessageCircle } from 'lucide-react';

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
  const blocks = rawContent.split('\n\n').map((b) => b.trim()).filter(Boolean);

  const handleCopyShareUrl = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(
      locale === 'ar' ? 'تم نسخ رابط المقال للمشاركة' : 'Article link copied to clipboard',
      'success'
    );
  };

  return (
    <LayoutResolver adminQuickEditPath="/admin/blog">
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
          {/* Back button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/${locale}/blog`)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00C2CB] transition-colors"
            >
              {locale === 'ar' ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              <span>{locale === 'ar' ? 'كل المقالات' : 'All Articles'}</span>
            </button>

            <button
              onClick={handleCopyShareUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#00C2CB]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'مشاركة المقال' : 'Share Article'}</span>
            </button>
          </div>

          {/* Monograph Header */}
          <header className="space-y-5 border-b border-slate-200 dark:border-slate-800 pb-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#00C2CB]">{article.category[locale]}</span>
              <span>·</span>
              <span className="font-mono-tabular">
                {article.readingTimeMinutes}{' '}
                {locale === 'ar' ? 'دقائق قراءة' : 'min read'}
              </span>
              <span>·</span>
              <span>{article.authorName[locale]}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[2.5rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {article.title[locale]}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {article.excerpt[locale]}
            </p>
          </header>

          {/* Editorial Prose Reader (68ch optimal reading measure) */}
          <div className="space-y-6 text-base sm:text-[1.0625rem] text-slate-700 dark:text-slate-200 leading-[1.8]">
            {blocks.map((block, idx) => {
              if (block.startsWith('## ')) {
                return (
                  <h2
                    key={idx}
                    className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-4"
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

          {/* Author Bio Card */}
          <footer className="pt-8 border-t border-slate-200 dark:border-slate-800">
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
          </footer>
        </div>
      </article>
    </LayoutResolver>
  );
};
