import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { validateConsultationForm } from '../lib/validationSchemas';
import {
  ArrowUpRight,
  Check,
  MessageCircle,
  Send,
  Stethoscope,
  Code2,
  BookOpen,
  Building2,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { locale, navigate, db } = usePlatform();

  const homePage = db.pages.find((p) => p.id === 'home' || p.slug === 'home') || db.pages[0];
  const settings = db.siteSettings;
  const featuredProjects = db.projects.filter((p) => p.published);
  const clinics = db.clinics.filter((c) => c.published);
  const articles = db.articles.filter((a) => a.published).slice(0, 2);

  // Interactive Consultation Request Form (Direct WhatsApp dispatcher inspired by solimedical.vercel.app)
  const [reqName, setReqName] = useState('');
  const [reqRole, setReqRole] = useState('');
  const [reqFacilityType, setReqFacilityType] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [reqHoneypot, setReqHoneypot] = useState('');
  const [reqError, setReqError] = useState<string | null>(null);
  const [reqSubmitted, setReqSubmitted] = useState(false);

  const handleWhatsAppConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);

    const validation = validateConsultationForm({
      name: reqName,
      role: reqRole,
      facilityType: reqFacilityType,
      message: reqMessage,
      websiteHoneypot: reqHoneypot,
    });

    if (!validation.valid) {
      setReqError(validation.errors[0]);
      return;
    }

    try {
      const res = await fetch('/api/contact/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reqName,
          role: reqRole,
          facilityType: reqFacilityType,
          message: reqMessage,
          websiteHoneypot: reqHoneypot,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setReqError(errBody.error || 'Invalid form input');
        return;
      }
    } catch {
      // Fallback to client validation if offline
    }

    const { name, role, facilityType, message } = validation.sanitized;
    const textLines =
      locale === 'ar'
        ? [
            'مرحباً م. أحمد سليمان،',
            name ? `الاسم: ${name}` : '',
            role ? `الصفة/الوظيفة: ${role}` : '',
            facilityType ? `نوع المنشأة أو المشروع: ${facilityType}` : '',
            `التفاصيل: ${message}`,
          ]
        : [
            'Hello Eng. Ahmed Soliman,',
            name ? `Name: ${name}` : '',
            role ? `Role: ${role}` : '',
            facilityType ? `Facility / Project Type: ${facilityType}` : '',
            `Details: ${message}`,
          ];

    const finalMsg = encodeURIComponent(textLines.filter(Boolean).join('\n'));
    const targetUrl = `https://wa.me/${settings.whatsappNumber || 'Ahmed0soliman'}?text=${finalMsg}`;
    setReqSubmitted(true);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <LayoutResolver
      forceStandalone={homePage?.standaloneByDefault}
      adminQuickEditPath="/admin/pages"
    >
      <SEOHead
        locale={locale}
        seo={homePage?.seo || settings.seo}
        fallbackTitle={
          locale === 'ar'
            ? 'أحمد سليمان | مطوّر أنظمة العيادات والبرمجيات الصحية'
            : 'Ahmed Soliman | Healthcare Systems Architect & Developer'
        }
        fallbackDescription={homePage?.subheadline?.[locale] || ''}
        pathname={`/${locale}`}
      />

      {/* 1. ARCHITECTURAL SPLIT-SCREEN HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80 py-14 lg:py-22 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Column: Typographic Hierarchy & Primary Action */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="lg:col-span-7 flex flex-col justify-center space-y-6"
            >
              <div className="text-xs font-semibold tracking-wide text-[#00C2CB]">
                {homePage?.kicker?.[locale]}
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                {homePage?.headline?.[locale]}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {homePage?.subheadline?.[locale]}
              </p>

              {/* Key Pillars Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(homePage?.highlights?.[locale] || []).map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                  >
                    <Check className="w-4 h-4 text-[#00C2CB] shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* Primary CTA & Secondary Navigation */}
              <div className="flex flex-wrap items-center gap-4 pt-3">
                <button
                  onClick={() => navigate(`/${locale}/projects`)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>
                    {locale === 'ar' ? 'استكشف الأنظمة والمشروعات' : 'Explore Systems & Projects'}
                  </span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate(`/${locale}/about`)}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#00C2CB] hover:text-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{locale === 'ar' ? 'السيرة المهنية الكاملة' : 'Editorial Biography'}</span>
                </button>
              </div>
            </motion.div>

            {/* Right Column: Matching-Height Portrait & Architectural Identity Frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-5 flex"
            >
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 flex flex-col justify-end min-h-[420px] lg:h-full">
                <OptimizedImage
                  src={homePage?.heroImage || settings.avatarUrl}
                  alt={settings.ownerName[locale]}
                  priority={true}
                  containerClassName="absolute inset-0 w-full h-full"
                  className="w-full h-full object-cover object-top"
                />
                {/* Measured Contrast Scrim */}
                <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-6 sm:p-8 pt-24 text-white">
                  <div className="text-xs font-medium text-[#00C2CB] mb-1">
                    {settings.ownerRole[locale]}
                  </div>
                  <div className="text-2xl font-bold tracking-tight">
                    {settings.ownerName[locale]}
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {homePage?.biography?.[locale]}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Full-Width 4-Column Metric Strip Below Hero Split */}
          {homePage?.metrics && homePage.metrics.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {homePage.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/90"
                >
                  <div className="text-2xl sm:text-3xl font-bold font-mono-tabular text-[#00C2CB]">
                    {metric.value}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-snug">
                    {metric.label[locale]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. ASYMMETRIC BENTO GRID: FLAGSHIP SYSTEMS & PROJECTS */}
      <section className="py-16 lg:py-24 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#00C2CB]">
                {locale === 'ar'
                  ? '01. معرض الأنظمة والحلول البرمجية'
                  : '01. Flagship Systems & Software Architecture'}
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'أنظمة مصممة من واقع العمل الطبي اليومي'
                  : 'Systems Engineered From Daily Clinical Reality'}
              </h2>
            </div>

            <button
              onClick={() => navigate(`/${locale}/projects`)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00C2CB] hover:underline whitespace-nowrap shrink-0"
            >
              <span>{locale === 'ar' ? 'عرض جميع المشروعات والمقارنة' : 'View All Projects & Comparison'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {featuredProjects.map((project, index) => {
              const isWide = index === 0;
              return (
                <motion.article
                  key={project.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => navigate(`/${locale}/projects/${project.slug}`)}
                  className={`cursor-pointer group rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB]/60 transition-colors overflow-hidden flex flex-col justify-between ${
                    isWide ? 'lg:col-span-7' : 'lg:col-span-5'
                  }`}
                >
                  <div className="p-6 sm:p-8 space-y-4">
                    <div className="flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>{project.kicker[locale]}</span>
                      <span>·</span>
                      <span>{project.categoryLabel[locale]}</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-[#00C2CB] transition-colors">
                      {project.title[locale]}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {project.summary[locale]}
                    </p>

                    <ul className="space-y-2 pt-2">
                      {(project.features[locale] || []).slice(0, 3).map((feat, fIdx) => (
                        <li
                          key={fIdx}
                          className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                        >
                          <Check className="w-3.5 h-3.5 text-[#00C2CB] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#0B1324]/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-950">
                        <OptimizedImage
                          src={project.coverImage}
                          alt={project.title[locale]}
                          width={160}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {project.techStack.slice(0, 3).join(' · ')}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00C2CB] whitespace-nowrap shrink-0">
                      <span>{locale === 'ar' ? 'تفاصيل النظام' : 'Case Study'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. MEDICAL CLINIC LANDING PAGES SHOWCASE */}
      <section className="py-16 lg:py-24 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0B1324]/40">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#00C2CB]">
                {locale === 'ar'
                  ? '02. صفحات الهبوط الطبية المستقلة للعيادات والمراكز'
                  : '02. Independent Medical Clinic Landing Pages'}
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'صفحات عيادات جاهزة للمشاركة والحجز الفوري'
                  : 'Shareable Clinic Portals Built for Patient Conversion'}
              </h2>
            </div>

            <button
              onClick={() => navigate(`/${locale}/clinics`)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00C2CB] hover:underline whitespace-nowrap shrink-0"
            >
              <span>{locale === 'ar' ? 'استعراض دليل العيادات' : 'Explore All Clinics'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clinics.map((clinic) => {
              const clinicDoctors = db.doctors.filter(
                (d) => d.clinicId === clinic.id && d.published
              );
              const clinicServices = db.services.filter(
                (s) => s.clinicId === clinic.id && s.published
              );

              return (
                <div
                  key={clinic.id}
                  className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5 text-[#00C2CB] font-medium">
                        <Building2 className="w-3.5 h-3.5" />
                        {clinic.city[locale]}
                      </span>
                      <span>
                        {clinicDoctors.length}{' '}
                        {locale === 'ar' ? 'أطباء' : 'Doctors'} · {clinicServices.length}{' '}
                        {locale === 'ar' ? 'خدمات معلنة' : 'Listed Services'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {clinic.name[locale]}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {clinic.tagline[locale]}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => navigate(`/${locale}/clinics/${clinic.slug}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>
                        {locale === 'ar'
                          ? 'فتح صفحة العيادة والأطباء'
                          : 'Open Clinic Landing Page'}
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/${locale}/clinics/${clinic.slug}?standalone=1`)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#00C2CB] hover:text-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>
                        {locale === 'ar'
                          ? 'رابط العرض المستقل (Standalone)'
                          : 'Standalone Campaign View'}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. EDITORIAL INSIGHTS & ARTICLES + TELEGRAM BOT BANNER */}
      <section className="py-16 lg:py-24 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left 7 Cols: Recent Articles */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#00C2CB]">
                  {locale === 'ar' ? '03. المقالات والخبرات' : '03. Editorial Insights'}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {locale === 'ar'
                    ? 'قراءات في هندسة الأنظمة الطبية'
                    : 'Articles on Healthcare Software & Digital Operations'}
                </h2>
              </div>
              <button
                onClick={() => navigate(`/${locale}/blog`)}
                className="text-xs font-semibold text-[#00C2CB] hover:underline whitespace-nowrap shrink-0"
              >
                {locale === 'ar' ? 'كل المقالات ←' : 'All Articles →'}
              </button>
            </div>

            <div className="space-y-4">
              {articles.map((article) => (
                <article
                  key={article.id}
                  onClick={() => navigate(`/${locale}/blog/${article.slug}`)}
                  className="cursor-pointer group p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB]/60 transition-colors space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 text-[#00C2CB]" />
                    <span>{article.category[locale]}</span>
                    <span>·</span>
                    <span className="font-mono-tabular">
                      {article.readingTimeMinutes}{' '}
                      {locale === 'ar' ? 'دقائق قراءة' : 'min read'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#00C2CB] transition-colors">
                    {article.title[locale]}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {article.excerpt[locale]}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Telegram Bot Interactive Spotlight */}
          <div className="lg:col-span-5 flex">
            <div className="w-full rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#070E1A] text-white border border-slate-800 p-7 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#00C2CB]">
                  <Code2 className="w-4 h-4" />
                  <span>@SoliMedicalproBot</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight">
                  {locale === 'ar'
                    ? 'بوت تليجرام الذكي للعيادة والحجز المباشر'
                    : 'Automated Telegram Clinic Booking Bot'}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {locale === 'ar'
                    ? 'اسأل عن المواعيد والتخصصات واحجز مباشرة من تليجرام بدون تحميل أي تطبيق إضافي — نموذج حي لأتمتة استعلام المرضى.'
                    : 'Check clinic schedules, specialties, and book directly inside Telegram without installing any app—a live demonstration of patient workflow automation.'}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <a
                  href={settings.telegramBotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {locale === 'ar'
                      ? 'افتح بوت تليجرام الآن (@SoliMedicalproBot)'
                      : 'Launch Telegram Bot (@SoliMedicalproBot)'}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE DIRECT WHATSAPP CONSULTATION BUILDER */}
      <section className="py-16 lg:py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-semibold text-[#00C2CB]">
              {locale === 'ar' ? '04. تواصل مباشر' : '04. Direct Consultation'}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
              {locale === 'ar'
                ? 'ابدأ من واقع منشأتك أو مشروعك، لا من قائمة مزايا عامة.'
                : 'Start From Your Facility’s Real Needs, Not Generic Checklists.'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {locale === 'ar'
                ? 'املأ البيانات باختصار وستنتقل رسالتك مباشرة إلى واتساب لمناقشة النظام المناسب لعيادتك أو مجمعك الطبي أو مشروعك الرقمي.'
                : 'Fill in your brief requirements below to send a structured message directly to WhatsApp.'}
            </p>
            <div className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00C2CB]" />
                <span>
                  {locale === 'ar'
                    ? 'اختر نوع المنشأة أو الحل البرمجي المطلوب'
                    : 'Select your facility or software solution type'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00C2CB]" />
                <span>
                  {locale === 'ar'
                    ? 'اكتب احتياجك باختصار'
                    : 'Describe your operational workflow briefly'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00C2CB]" />
                <span>
                  {locale === 'ar'
                    ? 'نتابع معك مباشرة عبر واتساب'
                    : 'Receive a direct engineering response via WhatsApp'}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form
              onSubmit={handleWhatsAppConsultation}
              className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4"
            >
              {/* Anti-bot Honeypot field (hidden from real users) */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="website_url_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={reqHoneypot}
                  onChange={(e) => setReqHoneypot(e.target.value)}
                />
              </div>

              {reqError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-700/80 text-xs text-red-200">
                  {reqError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {locale === 'ar' ? 'الاسم' : 'Your Name'}
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    placeholder={locale === 'ar' ? 'د. / أ. ...' : 'Dr. / Mr. ...'}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 focus:border-[#00C2CB] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {locale === 'ar' ? 'الوظيفة أو الصفة' : 'Role / Title'}
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={reqRole}
                    onChange={(e) => setReqRole(e.target.value)}
                    placeholder={
                      locale === 'ar' ? 'طبيب / مدير مجمع طبي / مؤسس' : 'Physician / Complex Director'
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 focus:border-[#00C2CB] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {locale === 'ar' ? 'نوع المنشأة أو المشروع' : 'Facility or Project Type'}
                </label>
                <select
                  value={reqFacilityType}
                  onChange={(e) => setReqFacilityType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 focus:border-[#00C2CB] focus:outline-none"
                >
                  <option value="">
                    {locale === 'ar' ? 'اختر نوع المنشأة أو الحل' : 'Select facility or solution'}
                  </option>
                  <option value={locale === 'ar' ? 'عيادة طبيب واحد' : 'Single Doctor Clinic'}>
                    {locale === 'ar' ? 'عيادة طبيب واحد' : 'Single Doctor Clinic'}
                  </option>
                  <option value={locale === 'ar' ? 'مجمع عيادات تخصصي' : 'Medical Complex'}>
                    {locale === 'ar' ? 'مجمع عيادات تخصصي' : 'Medical Complex / Polyclinic'}
                  </option>
                  <option value={locale === 'ar' ? 'مستشفى صغير' : 'Small Hospital'}>
                    {locale === 'ar' ? 'مستشفى صغير' : 'Small Hospital'}
                  </option>
                  <option
                    value={
                      locale === 'ar'
                        ? 'صفحة هبوط طبية مستقلة لعيادة'
                        : 'Standalone Clinic Landing Page'
                    }
                  >
                    {locale === 'ar'
                      ? 'صفحة هبوط طبية مستقلة لعيادة'
                      : 'Standalone Clinic Landing Page'}
                  </option>
                  <option value={locale === 'ar' ? 'تطوير منصة ويب مخصصة' : 'Custom Web Platform'}>
                    {locale === 'ar' ? 'تطوير منصة ويب مخصصة' : 'Custom Web Platform'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {locale === 'ar' ? 'اكتب احتياجك باختصار *' : 'Describe your requirement *'}
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={1500}
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                  placeholder={
                    locale === 'ar'
                      ? 'مثال: نحتاج نظاماً لإدارة 5 عيادات داخل مجمع طبي خيري مع ربط الاستقبال والخزينة...'
                      : 'Example: We need a system for a 5-clinic medical center connecting reception and billing...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 focus:border-[#00C2CB] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {locale === 'ar'
                      ? 'أرسل على واتساب وتابع الطلب'
                      : 'Send via WhatsApp & Start Conversation'}
                  </span>
                </button>

                {reqSubmitted && (
                  <span className="text-xs text-emerald-500 font-medium">
                    {locale === 'ar'
                      ? 'تم التحقق من البيانات وتجهيز الرسالة لفتحها على واتساب.'
                      : 'Input verified and message prepared for WhatsApp.'}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </LayoutResolver>
  );
};
