import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { ArrowUpRight, Search, Clock, Sun, Moon, Calendar, X } from 'lucide-react';

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

export const BlogPage: React.FC = () => {
  const { locale, theme, toggleTheme, navigate, db } = usePlatform();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');

  const isAr = locale === 'ar';

  const publishedArticles = useMemo(() => {
    return db.articles
      .filter((a) => a.published && !a.archived)
      .sort((a, b) => a.order - b.order);
  }, [db.articles]);

  // Deduplicate categories by canonical key (en) so switching language preserves active filter
  const categories = useMemo(() => {
    const map = new Map<string, { key: string; ar: string; en: string }>();
    publishedArticles.forEach((art) => {
      const key = art.category.en || art.category.ar;
      if (!map.has(key)) {
        map.set(key, { key, ar: art.category.ar, en: art.category.en });
      }
    });
    return Array.from(map.values());
  }, [publishedArticles]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedArticles.filter((art) => {
      const catKey = art.category.en || art.category.ar;
      const matchesCat = selectedCategoryKey === 'all' || catKey === selectedCategoryKey;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        art.title.ar.toLowerCase().includes(q) ||
        art.title.en.toLowerCase().includes(q) ||
        art.excerpt.ar.toLowerCase().includes(q) ||
        art.excerpt.en.toLowerCase().includes(q) ||
        art.category.ar.toLowerCase().includes(q) ||
        art.category.en.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [publishedArticles, selectedCategoryKey, searchQuery]);

  const isFiltering = selectedCategoryKey !== 'all' || searchQuery.trim().length > 0;

  const featuredArticle = useMemo(() => {
    if (isFiltering) return null;
    return publishedArticles.find((a) => a.featured) || publishedArticles[0] || null;
  }, [publishedArticles, isFiltering]);

  const remainingMagazineArticles = useMemo(() => {
    if (isFiltering) return filteredArticles;
    if (!featuredArticle) return publishedArticles;
    return publishedArticles.filter((a) => a.id !== featuredArticle.id);
  }, [isFiltering, filteredArticles, publishedArticles, featuredArticle]);

  const latestSortedArticles = useMemo(() => {
    return [...publishedArticles].sort((a, b) => {
      const tA = new Date(a.createdAt || 0).getTime();
      const tB = new Date(b.createdAt || 0).getTime();
      if (tB !== tA) return tB - tA;
      return a.order - b.order;
    });
  }, [publishedArticles]);

  return (
    <LayoutResolver pageWorld="blog-magazine" adminQuickEditPath="/admin/blog">
      <SEOHead
        locale={locale}
        fallbackTitle={
          isAr
            ? 'المدونة والمقالات التحريرية | أحمد سليمان'
            : 'Editorial Blog & Knowledge Hub | Ahmed Soliman'
        }
        fallbackDescription={
          isAr
            ? 'مقالات تقنية وطبية، هندسة الأنظمة الصحية، تجارب العناية المركزة، وتطوير العيادات والمجمعات الطبية.'
            : 'Technical and clinical essays on healthcare systems engineering, critical care workflows, and medical software design.'
        }
        pathname={`/${locale}/blog`}
      />

      <section className="min-h-screen bg-[#F5F4EF] dark:bg-[#111413] text-[#18181B] dark:text-[#EDEAE2] transition-colors duration-300 pt-16 sm:pt-14 pb-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* ================================================================= */}
          {/* 1. EDITORIAL MASTHEAD & READER CONTROLS                           */}
          {/* ================================================================= */}
          <header className="border-b border-stone-300/80 dark:border-stone-800 pb-8 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-[#16382E] dark:text-[#6EE7B7]">
                  <span>{isAr ? 'المدونة التحريرية والمعرفة' : 'Editorial Essays & Field Notes'}</span>
                  <span aria-hidden="true" className="text-stone-400 dark:text-stone-600">
                    ·
                  </span>
                  <span className="font-mono-tabular text-stone-600 dark:text-stone-400">
                    {publishedArticles.length}{' '}
                    {isAr ? 'مقالات منشورة' : 'Published Articles'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-950 dark:text-[#F5F3EE] leading-[1.15]">
                  {isAr ? 'مساحة المقالات والأفكار' : 'Writing on Care & Systems'}
                </h1>

                <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                  {isAr
                    ? 'قراءات ميدانية وهندسية في تصميم أنظمة العيادات، جودة الرعاية الحرجة، وبناء المنصات الصحية العربية.'
                    : 'Field observations and engineering essays on clinic architecture, critical care workflows, and Arabic healthcare software.'}
                </p>
              </div>

              {/* Reader Theme Switcher (Daylight Ivory <-> Night Reading) */}
              <div className="flex items-center gap-3 self-start lg:self-end shrink-0">
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
                      : 'Switch to Night Reading Mode'
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#191E1C] border border-stone-300/90 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:border-[#16382E] dark:hover:border-[#6EE7B7] transition-colors cursor-pointer min-h-[42px]"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{isAr ? 'الوضع النهاري' : 'Daylight Mode'}</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-[#16382E] shrink-0" />
                      <span>{isAr ? 'الوضع الليلي' : 'Night Mode'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Category Tabs & Live Search Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={isAr ? 'تصنيفات المقالات' : 'Article Categories'}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategoryKey === 'all'}
                  onClick={() => setSelectedCategoryKey('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer min-h-[38px] ${
                    selectedCategoryKey === 'all'
                      ? 'bg-[#16382E] text-white dark:bg-[#6EE7B7] dark:text-[#0F1715]'
                      : 'bg-white/80 dark:bg-[#181C1B] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                  }`}
                >
                  {isAr ? 'جميع الموضوعات' : 'All Topics'}
                </button>

                {categories.map((cat) => {
                  const active = selectedCategoryKey === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedCategoryKey(cat.key)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer min-h-[38px] ${
                        active
                          ? 'bg-[#16382E] text-white dark:bg-[#6EE7B7] dark:text-[#0F1715]'
                          : 'bg-white/80 dark:bg-[#181C1B] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                      }`}
                    >
                      {cat[locale]}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full md:w-72 shrink-0">
                <Search className="w-4 h-4 text-stone-500 dark:text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث في المقالات والوسوم...' : 'Search essays and tags...'}
                  aria-label={isAr ? 'بحث في المقالات' : 'Search articles'}
                  className="w-full ps-10 pe-9 py-2.5 rounded-xl text-xs bg-white dark:bg-[#181C1B] border border-stone-300/90 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-[#16382E] dark:focus:border-[#6EE7B7] min-h-[42px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                    className="absolute top-1/2 -translate-y-1/2 end-2.5 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* ================================================================= */}
          {/* 2. FEATURED COVER STORY (PROMINENT EDITORIAL HERO)                */}
          {/* ================================================================= */}
          {featuredArticle && (
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              onClick={() => navigate(`/${locale}/blog/${featuredArticle.slug}`)}
              className="cursor-pointer group rounded-3xl overflow-hidden bg-[#16382E] dark:bg-[#162722] text-white border border-[#16382E]/20 dark:border-emerald-900/50 grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-sm"
            >
              {/* Cover Visual */}
              <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[340px] lg:min-h-[420px] bg-stone-900 overflow-hidden">
                <OptimizedImage
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title[locale]}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
              </div>

              {/* Editorial Summary */}
              <div className="lg:col-span-5 p-7 sm:p-10 lg:p-12 flex flex-col justify-between gap-8">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-200/95">
                    <span>{isAr ? 'المقال الرئيسي' : 'Featured Essay'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredArticle.category[locale]}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-black leading-snug text-white group-hover:text-emerald-200 transition-colors">
                    {featuredArticle.title[locale]}
                  </h2>

                  <p className="text-sm sm:text-[15px] text-emerald-50/85 leading-relaxed line-clamp-4">
                    {featuredArticle.excerpt[locale]}
                  </p>
                </div>

                <div className="space-y-5 pt-4 border-t border-white/15">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100/80">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{formatEditorialDate(featuredArticle.createdAt, locale)}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5 font-mono-tabular">
                      <Clock className="w-3.5 h-3.5 text-emerald-300" />
                      <span>
                        {featuredArticle.readingTimeMinutes}{' '}
                        {isAr ? 'دقائق قراءة' : 'min read'}
                      </span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredArticle.authorName[locale]}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300 group-hover:text-white transition-colors">
                    <span>{isAr ? 'اقرأ المقال كاملاً' : 'Read Cover Story'}</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>
            </motion.article>
          )}

          {/* ================================================================= */}
          {/* 3. STAGGERED MAGAZINE GRID & LATEST ARTICLES                      */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Primary Staggered Editorial Grid (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-300/70 dark:border-stone-800 pb-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-950 dark:text-[#F5F3EE]">
                  {isFiltering
                    ? isAr
                      ? `نتائج البحث والتصفية (${filteredArticles.length})`
                      : `Filtered Essays (${filteredArticles.length})`
                    : isAr
                    ? 'قراءات ومقالات مختارة'
                    : 'Selected Dispatches'}
                </h2>
                {isFiltering && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryKey('all');
                      setSearchQuery('');
                    }}
                    className="text-xs font-bold text-[#16382E] dark:text-[#6EE7B7] hover:underline cursor-pointer"
                  >
                    {isAr ? 'إعادة ضبط التصفية' : 'Reset filters'}
                  </button>
                )}
              </div>

              {remainingMagazineArticles.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white dark:bg-[#171B1A] border border-stone-200 dark:border-stone-800 text-center space-y-3">
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {isAr
                      ? 'لا توجد مقالات مطابقة لمعايير البحث الحالية.'
                      : 'No published articles match your current filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryKey('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[#16382E] text-white dark:bg-[#6EE7B7] dark:text-[#0F1715] cursor-pointer"
                  >
                    {isAr ? 'عرض جميع المقالات' : 'Show all articles'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {remainingMagazineArticles.map((art, index) => {
                    // Asymmetric editorial rhythm: first secondary card spans full 2 columns on desktop when multiple exist
                    const isWideLead = index === 0 && remainingMagazineArticles.length >= 2;
                    return (
                      <motion.article
                        key={art.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.2) }}
                        onClick={() => navigate(`/${locale}/blog/${art.slug}`)}
                        className={`cursor-pointer group rounded-2xl bg-white dark:bg-[#171B1A] border border-stone-200/90 dark:border-stone-800/90 hover:border-stone-400 dark:hover:border-stone-600 transition-colors overflow-hidden flex ${
                          isWideLead
                            ? 'sm:col-span-2 flex-col md:flex-row'
                            : 'flex-col justify-between'
                        }`}
                      >
                        <div
                          className={`bg-stone-900 overflow-hidden shrink-0 ${
                            isWideLead
                              ? 'md:w-1/2 h-56 md:h-auto md:min-h-[260px]'
                              : 'w-full h-48 border-b border-stone-100 dark:border-stone-800'
                          }`}
                        >
                          <OptimizedImage
                            src={art.coverImage}
                            alt={art.title[locale]}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                          />
                        </div>

                        <div className="p-6 sm:p-7 flex flex-col justify-between gap-5 flex-1">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                              <span className="font-bold text-[#16382E] dark:text-[#6EE7B7]">
                                {art.category[locale]}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{formatEditorialDate(art.createdAt, locale)}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-tabular">
                                {art.readingTimeMinutes}{' '}
                                {isAr ? 'د قراءة' : 'min read'}
                              </span>
                            </div>

                            <h3
                              className={`font-extrabold text-stone-950 dark:text-[#F5F3EE] group-hover:text-[#16382E] dark:group-hover:text-[#6EE7B7] transition-colors leading-snug ${
                                isWideLead ? 'text-xl sm:text-2xl' : 'text-lg'
                              }`}
                            >
                              {art.title[locale]}
                            </h3>

                            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                              {art.excerpt[locale]}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100">
                            <span className="text-stone-500 dark:text-stone-400 font-normal">
                              {art.authorName[locale]}
                            </span>
                            <span className="inline-flex items-center gap-1 group-hover:text-[#16382E] dark:group-hover:text-[#6EE7B7] transition-colors">
                              <span>{isAr ? 'قراءة المقال' : 'Read Essay'}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Latest Articles Chronological Column (4 cols on desktop) */}
            <aside className="lg:col-span-4 rounded-2xl bg-[#ECEAE2] dark:bg-[#171B1A] border border-stone-300/80 dark:border-stone-800 p-6 sm:p-7 space-y-6 lg:sticky lg:top-20">
              <div className="flex items-center justify-between border-b border-stone-300/80 dark:border-stone-800 pb-3">
                <h2 className="text-lg font-extrabold text-stone-950 dark:text-[#F5F3EE]">
                  {isAr ? 'أحدث المقالات' : 'Latest Articles'}
                </h2>
                <span className="text-xs font-mono-tabular text-stone-500 dark:text-stone-400">
                  {latestSortedArticles.length}
                </span>
              </div>

              <div className="divide-y divide-stone-300/70 dark:divide-stone-800">
                {latestSortedArticles.map((item, idx) => (
                  <article
                    key={item.id}
                    onClick={() => navigate(`/${locale}/blog/${item.slug}`)}
                    className="py-4 first:pt-1 last:pb-1 cursor-pointer group space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                      <span className="font-bold text-[#16382E] dark:text-[#6EE7B7] truncate">
                        {String(idx + 1).padStart(2, '0')}. {item.category[locale]}
                      </span>
                      <span className="font-mono-tabular shrink-0">
                        {item.readingTimeMinutes} {isAr ? 'د' : 'min'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#16382E] dark:group-hover:text-[#6EE7B7] transition-colors leading-snug">
                      {item.title[locale]}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                      <span>{formatEditorialDate(item.createdAt, locale)}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#16382E] dark:group-hover:text-[#6EE7B7] transition-colors" />
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </LayoutResolver>
  );
};
