import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { BookOpen, ArrowUpRight, Search } from 'lucide-react';

export const BlogPage: React.FC = () => {
  const { locale, navigate, db } = usePlatform();
  const [searchQuery, setSearchQuery] = useState('');

  const publishedArticles = db.articles.filter((a) => a.published);

  const filteredArticles = publishedArticles.filter((art) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      art.title.ar.toLowerCase().includes(q) ||
      art.title.en.toLowerCase().includes(q) ||
      art.excerpt.ar.toLowerCase().includes(q) ||
      art.excerpt.en.toLowerCase().includes(q) ||
      art.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const leadArticle = filteredArticles[0];
  const restArticles = filteredArticles.slice(1);

  return (
    <LayoutResolver adminQuickEditPath="/admin/blog">
      <SEOHead
        locale={locale}
        fallbackTitle={
          locale === 'ar'
            ? 'المدونة والمقالات التقنية والطبية | أحمد سليمان'
            : 'Editorial Blog & Engineering Insights | Ahmed Soliman'
        }
        fallbackDescription={
          locale === 'ar'
            ? 'مقالات وتجارب عملية حول تطوير وتشغيل أنظمة العيادات والمجمعات الطبية والتحول الرقمي للرعاية الصحية.'
            : 'Articles and field notes on building and operating clinic management systems and healthcare digital infrastructure.'
        }
        pathname={`/${locale}/blog`}
      />

      <section className="py-14 lg:py-22 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Editorial Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
            <div className="space-y-3 max-w-2xl">
              <div className="text-xs font-semibold text-[#00C2CB]">
                {locale === 'ar'
                  ? 'المدونة التحريرية · خبرات وتحديثات'
                  : 'Editorial Monograph · Insights & Field Notes'}
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'مقالات في هندسة الأنظمة الطبية والبرمجيات العربية'
                  : 'Essays on Healthcare Software & Digital Operations'}
              </h1>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'ar' ? 'ابحث في المقالات...' : 'Search articles...'}
                className="w-full ps-9 pe-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 focus:border-[#00C2CB] focus:outline-none"
              />
            </div>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
              {locale === 'ar'
                ? 'لا توجد مقالات مطابقة لبحثك حالياً.'
                : 'No articles match your search query.'}
            </div>
          ) : (
            <>
              {/* Featured Lead Monograph */}
              {leadArticle && (
                <motion.article
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => navigate(`/${locale}/blog/${leadArticle.slug}`)}
                  className="cursor-pointer group rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB]/60 transition-colors overflow-hidden grid grid-cols-1 lg:grid-cols-12"
                >
                  <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-[#00C2CB]">
                          {leadArticle.category[locale]}
                        </span>
                        <span>·</span>
                        <span className="font-mono-tabular">
                          {leadArticle.readingTimeMinutes}{' '}
                          {locale === 'ar' ? 'دقائق قراءة' : 'min read'}
                        </span>
                        <span>·</span>
                        <span>{leadArticle.authorName[locale]}</span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white group-hover:text-[#00C2CB] transition-colors leading-snug">
                        {leadArticle.title[locale]}
                      </h2>

                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                        {leadArticle.excerpt[locale]}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        {leadArticle.tags.join(' · ')}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#00C2CB]">
                        <span>{locale === 'ar' ? 'اقرأ المقال كاملاً' : 'Read Full Essay'}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-[#070E1A] p-8 flex items-center justify-center min-h-[260px] border-t lg:border-t-0 lg:border-s border-slate-200 dark:border-slate-800">
                    <OptimizedImage
                      src={leadArticle.coverImage}
                      alt={leadArticle.title[locale]}
                      containerClassName="w-48 h-48 rounded-xl overflow-hidden"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </motion.article>
              )}

              {/* Secondary Articles List */}
              {restArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {restArticles.map((art) => (
                    <motion.article
                      key={art.id}
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.18 }}
                      onClick={() => navigate(`/${locale}/blog/${art.slug}`)}
                      className="cursor-pointer group rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB]/60 transition-colors p-6 sm:p-8 flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <BookOpen className="w-3.5 h-3.5 text-[#00C2CB]" />
                          <span>{art.category[locale]}</span>
                          <span>·</span>
                          <span className="font-mono-tabular">
                            {art.readingTimeMinutes}{' '}
                            {locale === 'ar' ? 'دقائق قراءة' : 'min read'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#00C2CB] transition-colors">
                          {art.title[locale]}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {art.excerpt[locale]}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          {art.tags.slice(0, 3).join(' · ')}
                        </span>
                        <span className="font-semibold text-[#00C2CB] inline-flex items-center gap-1">
                          <span>{locale === 'ar' ? 'قراءة' : 'Read'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </LayoutResolver>
  );
};
