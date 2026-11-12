import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  Printer,
  MessageCircle,
  Send,
  ArrowUpRight,
  GraduationCap,
  Award,
  Briefcase,
  Check,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { locale, navigate, db } = usePlatform();

  const aboutPage =
    db.pages.find((p) => p.slug === 'about' || p.id === 'page-about') || db.pages[1] || db.pages[0];
  const settings = db.siteSettings;

  const [activeTab, setActiveTab] = useState<'all' | 'timeline' | 'skills' | 'credentials' | 'cv'>(
    'all'
  );

  const timeline = aboutPage?.experienceTimeline || [];
  const skillGroups = aboutPage?.skills || [];
  const qualifications = aboutPage?.qualifications || [];
  const achievements = aboutPage?.achievements || [];
  const interests = aboutPage?.interests || { ar: [], en: [] };

  const scrollToSection = (id: string, tab: typeof activeTab) => {
    setActiveTab(tab);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <LayoutResolver pageWorld="about-editorial" adminQuickEditPath="/admin/pages">
      <SEOHead
        locale={locale}
        seo={aboutPage?.seo}
        fallbackTitle={
          locale === 'ar'
            ? 'من أنا والسيرة الذاتية | أحمد سليمان'
            : 'Editorial Profile & Curriculum Vitae | Ahmed Soliman'
        }
        fallbackDescription={aboutPage?.subheadline?.[locale] || settings.seo.description[locale]}
        pathname={`/${locale}/about`}
      />

      {/* =================================================================== */}
      {/* 1. AKHILAKRISHNAN GALLERY WHITE EDITORIAL SPREAD                     */}
      {/* =================================================================== */}
      <article className="bg-[#FFFFFF] text-[#111111] min-h-screen">
        <section className="py-12 sm:py-20 lg:py-24 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left / Start 5 Cols: Tall Monochrome Portrait + Caption (akhilakrishnan style) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="w-full aspect-[4/4.8] bg-zinc-100 overflow-hidden">
                <OptimizedImage
                  src={aboutPage?.heroImage || settings.avatarUrl}
                  alt={settings.ownerName[locale]}
                  priority
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover object-top grayscale contrast-115 hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="text-[11px] text-zinc-400 tracking-wide">
                {locale === 'ar'
                  ? 'بورتريه شخصي — أحمد سليمان · أخصائي العناية المركزة ومهندس الأنظمة الطبية'
                  : 'Portrait — Ahmed Soliman · ICU Specialist & Healthcare Systems Architect'}
              </div>
            </div>

            {/* Right / End 7 Cols: Multi-Paragraph Editorial Narrative with Sky-Blue Inline Links */}
            <div className="lg:col-span-7 space-y-5 text-[15px] sm:text-[16px] leading-[1.85] text-zinc-800">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 pb-1">
                {aboutPage?.headline?.[locale] || settings.ownerName[locale]}
              </h1>

              {locale === 'ar' ? (
                <>
                  <p>
                    <strong>أحمد سليمان</strong> هو أخصائي تمريض عناية مركزة ومطور أنظمة برمجية طبية
                    يعمل في تقاطع{' '}
                    <span className="text-[#2563EB] font-medium">
                      التشغيل الإكلينيكي للرعاية الحرجة
                    </span>{' '}
                    و{' '}
                    <span className="text-[#2563EB] font-medium">
                      هندسة التحول الرقمي للمنشآت الصحية
                    </span>
                    ، مع خبرة عملية تمتد لأكثر من 9 سنوات داخل وحدات العناية المركزة والمستشفيات
                    والمراكز الطبية.
                  </p>
                  <p>
                    تخرّج في كلية التمريض بجامعة القاهرة بتقدير امتياز، وتدرّج في قيادة وإدارة وحدات
                    الرعاية المركزة والطوارئ والجودة، مما منحه فهماً عميقاً للتحديات اليومية التي
                    يواجهها الأطباء، فرق التمريض، وإدارات المستشفيات في متابعة الحالات الحرجة وتنظيم
                    المواعيد والسجلات الطبية.
                  </p>
                  <p>
                    انطلاقاً من هذه الخبرة الميدانية، قام بتصميم وتطوير حزمة متكاملة من الأنظمة
                    الطبية تشمل منظومة{' '}
                    <button
                      type="button"
                      onClick={() => navigate(`/${locale}/solimedical`)}
                      className="text-[#2563EB] hover:underline font-semibold"
                    >
                      Soli Medical
                    </button>{' '}
                    لإدارة العيادات والمجمعات الطبية، ونظام{' '}
                    <button
                      type="button"
                      onClick={() => navigate(`/${locale}/projects/icu-sync-critical-care-system`)}
                      className="text-[#2563EB] hover:underline font-semibold"
                    >
                      ICU-Sync
                    </button>{' '}
                    لمتابعة وحدات العناية المركزة، ومنظومة{' '}
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/${locale}/projects/mitali-hospital-management-system`)
                      }
                      className="text-[#2563EB] hover:underline font-semibold"
                    >
                      Mitali Hospital
                    </button>{' '}
                    لإدارة المستشفيات، بالإضافة إلى أنظمة إدارة المخازن الطبية{' '}
                    <span className="text-[#2563EB] font-medium">Medi-Logix</span> ومنظومة الجودة
                    السريرية <span className="text-[#2563EB] font-medium">Q-Care</span>.
                  </p>
                  <p>
                    تهدف أعماله إلى تحويل العمليات الورقية المعقدة داخل العيادات والمستشفيات إلى
                    تجارب رقمية عربية وإنجليزية سريعة، آمنة، وواضحة للمريض والطبيب والإدارة، ويمكن
                    الاطلاع على سيرته الذاتية التفصيلية وخبراته الزمنية في الأقسام أدناه.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Ahmed Soliman</strong> is a multidisciplinary{' '}
                    <span className="text-[#2563EB] font-medium">
                      Intensive Care Specialist
                    </span>{' '}
                    and{' '}
                    <span className="text-[#2563EB] font-medium">
                      Healthcare Software Systems Architect
                    </span>{' '}
                    working across critical care clinical operations, hospital quality management,
                    and full-stack medical software engineering.
                  </p>
                  <p>
                    Graduating with honors in Critical Care & Emergency Nursing from Cairo
                    University, he spent over 9 years leading high-acuity ICU shifts, hospital
                    triage workflows, and infection-control governance across major medical centers.
                  </p>
                  <p>
                    His engineering portfolio includes the flagship{' '}
                    <button
                      type="button"
                      onClick={() => navigate(`/${locale}/solimedical`)}
                      className="text-[#2563EB] hover:underline font-semibold"
                    >
                      Soli Medical
                    </button>{' '}
                    platform for single-doctor clinics and multi-department complexes,{' '}
                    <button
                      type="button"
                      onClick={() => navigate(`/${locale}/projects/icu-sync-critical-care-system`)}
                      className="text-[#2563EB] hover:underline font-semibold"
                    >
                      ICU-Sync
                    </button>{' '}
                    for real-time ICU bed and vital telemetry,{' '}
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/${locale}/projects/mitali-hospital-management-system`)
                      }
                      className="text-[#2563EB] hover:underline font-semibold"
                    >
                      Mitali Hospital ERP
                    </button>
                    , <span className="text-[#2563EB] font-medium">Medi-Logix</span> medical
                    inventory management, and the{' '}
                    <span className="text-[#2563EB] font-medium">Q-Care</span> quality & audit
                    suite.
                  </p>
                  <p>
                    He collaborates with clinics, charitable hospitals, and healthcare founders in
                    Egypt and the Arab region. His detailed curriculum vitae, career timeline, and
                    technical competencies can be explored in the chapters below.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* =============================================================== */}
          {/* 2. AKHILAKRISHNAN SIGNATURE BOTTOM BLACK ROUNDED PILL BUTTONS    */}
          {/* =============================================================== */}
          <div className="pt-14 sm:pt-20 flex flex-wrap items-center justify-center sm:justify-between gap-3 border-b border-zinc-200 pb-12">
            <button
              type="button"
              onClick={() => scrollToSection('chapter-timeline', 'timeline')}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'bg-zinc-950 text-white hover:bg-zinc-800'
              }`}
            >
              {locale === 'ar'
                ? 'الخط الزمني للخبرات المهنية'
                : 'Career & ICU Experience Timeline'}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('chapter-skills', 'skills')}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'skills'
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'bg-zinc-950 text-white hover:bg-zinc-800'
              }`}
            >
              {locale === 'ar'
                ? 'المهارات الإكلينيكية والتقنية'
                : 'Clinical & Engineering Skills'}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('chapter-credentials', 'credentials')}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'bg-zinc-950 text-white hover:bg-zinc-800'
              }`}
            >
              {locale === 'ar'
                ? 'المؤهلات الأكاديمية والإنجازات'
                : 'Qualifications & Achievements'}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('chapter-cv', 'cv')}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cv'
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'bg-zinc-950 text-white hover:bg-zinc-800'
              }`}
            >
              {locale === 'ar'
                ? 'ملخص السيرة الذاتية (CV) والتواصل'
                : 'Curriculum Vitae & Direct Contact'}
            </button>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. CHAPTER 01: CONNECTED CAREER TIMELINE                          */}
        {/* ================================================================= */}
        <section
          id="chapter-timeline"
          className="py-16 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto border-b border-zinc-200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                01 / CHRONOLOGY
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
                {locale === 'ar'
                  ? 'الخط الزمني للخبرات المهنية والعملية'
                  : 'Professional & Clinical Career Timeline'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                {locale === 'ar'
                  ? 'تدرّج الخبرة بين قيادة العناية المركزة وهندسة الأنظمة الطبية.'
                  : 'Progression across ICU clinical leadership and healthcare software engineering.'}
              </p>
            </div>

            <div className="lg:col-span-8 relative ps-6 sm:ps-8 border-s-2 border-zinc-200 space-y-10">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative space-y-2">
                  <span className="absolute -start-[31px] sm:-start-[39px] top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-950 ring-4 ring-white" />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 font-mono-tabular">
                    <span className="font-bold text-[#2563EB]">{item.period[locale]}</span>
                    <span>·</span>
                    <span className="font-semibold text-zinc-800">{item.organization[locale]}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-950">
                    {item.role[locale]}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {item.description[locale]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. CHAPTER 02: MULTIDISCIPLINARY SKILLS MATRIX                    */}
        {/* ================================================================= */}
        <section
          id="chapter-skills"
          className="py-16 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto border-b border-zinc-200"
        >
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                02 / COMPETENCIES
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
                {locale === 'ar'
                  ? 'مصفوفة المهارات الإكلينيكية والبرمجية والإدارية'
                  : 'Clinical, Software & Healthcare Management Skills'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {skillGroups.map((grp, grpIdx) => (
                <div
                  key={grpIdx}
                  className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4"
                >
                  <div className="flex items-center gap-2.5 text-zinc-950 font-bold text-base border-b border-zinc-200 pb-3">
                    <Briefcase className="w-4 h-4 text-[#2563EB]" />
                    <h3>{grp.category[locale]}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {(grp.items || []).map((skill, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-700">
                        <Check className="w-4 h-4 text-zinc-950 shrink-0 mt-0.5" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. CHAPTER 03: QUALIFICATIONS, ACHIEVEMENTS & INTERESTS           */}
        {/* ================================================================= */}
        <section
          id="chapter-credentials"
          className="py-16 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto border-b border-zinc-200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Academic & Professional Qualifications */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                  03 / CREDENTIALS
                </div>
                <h2 className="text-2xl font-extrabold text-zinc-950 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>
                    {locale === 'ar'
                      ? 'المؤهلات العلمية والاعتمادات'
                      : 'Academic & Clinical Qualifications'}
                  </span>
                </h2>
              </div>

              <div className="space-y-4">
                {qualifications.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono-tabular text-[#2563EB] font-bold">
                      <span>{q.institution[locale]}</span>
                      <span>{q.year}</span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-950">{q.degree[locale]}</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">{q.details[locale]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements & Professional Interests */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                  04 / IMPACT & INTERESTS
                </div>
                <h2 className="text-2xl font-extrabold text-zinc-950 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>
                    {locale === 'ar'
                      ? 'أبرز الإنجازات والاهتمامات البحثية'
                      : 'Key Achievements & Focus Areas'}
                  </span>
                </h2>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="text-xs font-bold uppercase text-zinc-400">
                  {locale === 'ar' ? 'الإنجازات العملية' : 'Key Milestones'}
                </div>
                {achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-800">
                    <span className="font-mono-tabular font-bold text-[#2563EB]">
                      {ach.metric || `0${idx + 1}.`}
                    </span>
                    <div>
                      <div className="font-bold text-zinc-950">{ach.title[locale]}</div>
                      <div className="text-xs text-zinc-600">{ach.description[locale]}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="text-xs font-bold uppercase text-zinc-400">
                  {locale === 'ar' ? 'الاهتمامات المهنية والتقنية' : 'Professional Interests'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(interests[locale] || []).map((intr, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-zinc-300 text-zinc-800"
                    >
                      {intr}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. CHAPTER 04: PRINTABLE CV SUMMARY & DIRECT CONTACT              */}
        {/* ================================================================= */}
        <section id="chapter-cv" className="py-16 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto">
          <div className="p-8 sm:p-10 rounded-3xl bg-zinc-950 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-sky-400">
                CURRICULUM VITAE & CONTACT
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold">
                {locale === 'ar'
                  ? 'نسخة السيرة الذاتية القابلة للطباعة والتواصل المباشر'
                  : 'Printable Curriculum Vitae & Direct Channels'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {locale === 'ar'
                  ? 'يمكنك طباعة هذه الصفحة كملف PDF منسّق للسيرة الذاتية أو التواصل مباشرة عبر واتساب وتليجرام.'
                  : 'Print this monograph directly as a clean PDF Curriculum Vitae or reach out via WhatsApp.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{locale === 'ar' ? 'طباعة السيرة الذاتية (PDF)' : 'Print CV (PDF)'}</span>
              </button>

              <a
                href="https://wa.me/Ahmed0soliman"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{locale === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp'}</span>
              </a>

              <a
                href="https://www.facebook.com/SoliMedical/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold border border-zinc-700 text-zinc-200 hover:border-white transition-colors"
              >
                <span>Facebook</span>
              </a>

              <a
                href="https://t.me/SoliMedicalproBot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold border border-zinc-700 text-zinc-200 hover:border-white transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>@SoliMedicalproBot</span>
              </a>

              <button
                type="button"
                onClick={() => navigate(`/${locale}/projects`)}
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full text-xs font-bold border border-zinc-700 text-zinc-200 hover:border-white transition-colors cursor-pointer"
              >
                <span>{locale === 'ar' ? 'معرض المشروعات' : 'Projects'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </article>
    </LayoutResolver>
  );
};
