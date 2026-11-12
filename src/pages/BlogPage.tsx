import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { BookOpen, ArrowUpRight, Search, Clock, CheckCircle2 } from 'lucide-react';

export const BlogPage: React.FC = () => {
  const { locale, navigate, db } = usePlatform();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const publishedArticles = db.articles
    .filter((a) => a.published)
    .sort((a, b) => a.order - b.order);

  const uniqueCategories = Array.from(
    new Set(publishedArticles.map((a) => a.category[locale]))
  );

  const filteredArticles = publishedArticles.filter((art) => {
    const matchesCat =
      selectedCategory === 'all' || art.category[locale] === selectedCategory;
    if (!matchesCat) return false;
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

  const leadArticle = filteredArticles[0] || publishedArticles[0];
  const secondaryArticle = filteredArticles[1] || publishedArticles[1] || leadArticle;
  const thirdArticle = filteredArticles[2] || publishedArticles[2] || leadArticle;

  return (
    <LayoutResolver pageWorld="blog-magazine" adminQuickEditPath="/admin/blog">
      <SEOHead
        locale={locale}
        fallbackTitle={
          locale === 'ar'
            ? 'مساحة المقالات والمعرفة | أحمد سليمان'
            : 'Blog Articles & Knowledge Hub | Ahmed Soliman'
        }
        fallbackDescription={
          locale === 'ar'
            ? 'مقالات تقنية وطبية، شروحات ومشروعات جديدة، خبرات وتجارب عملية، وأخبار وتحديثات المشروعات.'
            : 'Technical and medical articles, new project walkthroughs, practical ICU & software experience, and platform updates.'
        }
        pathname={`/${locale}/blog`}
      />

      {/* =================================================================== */}
      {/* 1. SCREENSHOT 3.4 WARM DAYLIGHT MAGAZINE BENTO SPREAD               */}
      {/* =================================================================== */}
      <section className="py-12 lg:py-18 px-4 sm:px-8 bg-[#F5F4EF] text-[#18181B]">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Top Magazine Bento Grid matching Screenshot 3.4 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT 5 COLS: "Blog Articles" White Card + "Browse in lists" Soft Gray Card */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Top Left Card: Blog Articles Intro + Lead Essay Card */}
              <div className="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-xs flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                      {locale === 'ar' ? 'مساحة المقالات والمعرفة' : 'KNOWLEDGE HUB'}
                    </span>
                    <span className="text-xs font-mono-tabular text-stone-400">
                      {publishedArticles.length} {locale === 'ar' ? 'مقالات' : 'Articles'}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-950">
                    {locale === 'ar' ? 'المقالات والمعرفة' : 'Blog Articles'}
                  </h1>

                  {/* 4 Knowledge Pillars from User Screenshot 3.4 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-stone-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{locale === 'ar' ? 'مقالات تقنية وطبية' : 'Medical & Tech Essays'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        {locale === 'ar' ? 'شروحات ومشروعات جديدة' : 'Project Walkthroughs'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{locale === 'ar' ? 'خبرات وتجارب عملية' : 'Field Experiences'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{locale === 'ar' ? 'أخبار وتحديثات مشروعاتك' : 'System Updates'}</span>
                    </div>
                  </div>
                </div>

                {/* Highlighted Sub-Card inside Blog Articles (matching Screenshot 3.4 top-left) */}
                {secondaryArticle && (
                  <div
                    onClick={() => navigate(`/${locale}/blog/${secondaryArticle.slug}`)}
                    className="cursor-pointer group rounded-2xl bg-[#F8F7F3] border border-stone-200 p-4 grid grid-cols-12 gap-4 items-center hover:border-stone-400 transition-colors"
                  >
                    <div className="col-span-5 h-28 rounded-xl overflow-hidden bg-stone-900">
                      <OptimizedImage
                        src={secondaryArticle.coverImage}
                        alt={secondaryArticle.title[locale]}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="col-span-7 space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-800">
                        {secondaryArticle.category[locale]}
                      </div>
                      <h3 className="text-sm font-extrabold text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                        {secondaryArticle.title[locale]}
                      </h3>
                      <div className="text-[11px] text-stone-500 font-mono-tabular">
                        {secondaryArticle.readingTimeMinutes}{' '}
                        {locale === 'ar' ? 'دقائق قراءة' : 'min read'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Left Card: "Browse in lists" Soft Cool-Stone Card (Screenshot 3.4 bottom-left) */}
              <div className="rounded-3xl bg-[#E8ECF2] border border-slate-300/80 p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {locale === 'ar' ? 'تصفح حسب الموضوع' : 'Browse in lists'}
                  </h2>
                  <div className="relative w-44">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute top-1/2 -translate-y-1/2 start-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={locale === 'ar' ? 'بحث سريع...' : 'Search...'}
                      className="w-full ps-8 pe-3 py-1.5 rounded-full text-xs bg-white border border-slate-300 text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {locale === 'ar' ? 'الكل' : 'All'}
                  </button>
                  {uniqueCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Compact Numbered Reading List */}
                <div className="space-y-2.5 pt-1">
                  {publishedArticles.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/${locale}/blog/${item.slug}`)}
                      className="cursor-pointer p-3 rounded-2xl bg-white/90 hover:bg-white border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-mono-tabular font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.title[locale]}
                        </span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT 7 COLS: Deep Forest Green Cover Story Banner + Bottom Editorial Card */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Top Right Card: Deep Forest Green Editorial Feature (Screenshot 3.4 top-right) */}
              {leadArticle && (
                <motion.article
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => navigate(`/${locale}/blog/${leadArticle.slug}`)}
                  className="cursor-pointer group rounded-3xl bg-[#16382E] text-white p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-lg"
                >
                  <div className="md:col-span-6 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-bold">
                      <span>{leadArticle.category[locale]}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug group-hover:text-emerald-300 transition-colors">
                      {leadArticle.title[locale]}
                    </h2>

                    <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed line-clamp-3">
                      {leadArticle.excerpt[locale]}
                    </p>

                    <div className="pt-2 flex items-center gap-3 text-xs font-bold text-emerald-300">
                      <span>{locale === 'ar' ? 'اقرأ المقال الرئيس' : 'Read Cover Story'}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="md:col-span-6 h-56 sm:h-64 rounded-2xl overflow-hidden border-2 border-emerald-400/30 bg-stone-950">
                    <OptimizedImage
                      src={leadArticle.coverImage}
                      alt={leadArticle.title[locale]}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </motion.article>
              )}

              {/* Bottom Right Card: Large White Magazine Feature Card (Screenshot 3.4 bottom-right) */}
              {thirdArticle && (
                <motion.article
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => navigate(`/${locale}/blog/${thirdArticle.slug}`)}
                  className="cursor-pointer group rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="font-bold text-emerald-800">
                        {thirdArticle.category[locale]}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono-tabular">
                        <Clock className="w-3.5 h-3.5" />
                        {thirdArticle.readingTimeMinutes}{' '}
                        {locale === 'ar' ? 'دقائق قراءة' : 'min read'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold text-stone-950 group-hover:text-emerald-800 transition-colors">
                      {thirdArticle.title[locale]}
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {thirdArticle.excerpt[locale]}
                    </p>
                  </div>

                  <div className="h-52 rounded-2xl overflow-hidden bg-stone-900 border border-stone-200">
                    <OptimizedImage
                      src={thirdArticle.coverImage}
                      alt={thirdArticle.title[locale]}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </motion.article>
              )}
            </div>
          </div>

          {/* All Filtered Articles Grid Below Bento */}
          <div className="pt-6 border-t border-stone-300 space-y-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              {locale === 'ar' ? 'جميع المقالات المنشورة' : 'All Published Essays'}
            </h2>

            {filteredArticles.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-stone-200 text-center text-sm text-stone-500">
                {locale === 'ar'
                  ? 'لا توجد مقالات مطابقة لبحثك حالياً.'
                  : 'No articles match your search query.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredArticles.map((art) => (
                  <motion.article
                    key={art.id}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => navigate(`/${locale}/blog/${art.slug}`)}
                    className="cursor-pointer group rounded-3xl bg-white border border-stone-200/90 hover:border-stone-900 transition-colors overflow-hidden flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="h-44 bg-stone-900 overflow-hidden border-b border-stone-100">
                        <OptimizedImage
                          src={art.coverImage}
                          alt={art.title[locale]}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="p-6 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-stone-500">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{art.category[locale]}</span>
                          </span>
                          <span className="font-mono-tabular">
                            {art.readingTimeMinutes} min
                          </span>
                        </div>

                        <h3 className="text-lg font-extrabold text-stone-950 group-hover:text-emerald-800 transition-colors leading-snug">
                          {art.title[locale]}
                        </h3>

                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {art.excerpt[locale]}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-900">
                      <span>{locale === 'ar' ? 'قراءة المقال' : 'Read Article'}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </LayoutResolver>
  );
};
