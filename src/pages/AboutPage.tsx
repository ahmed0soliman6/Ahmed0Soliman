import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  MessageCircle,
  Send,
  ArrowUpRight,
  GraduationCap,
  Award,
  Briefcase,
  Check,
  Mail,
  FileText,
  MapPin,
} from 'lucide-react';

const EditorialReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.45, delay: Math.min(delay, 0.25), ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AboutPage: React.FC = () => {
  const { locale, navigate, db, adminSession } = usePlatform();

  const aboutPage =
    db.pages.find((p) => p.slug === 'about' || p.id === 'page-about') || db.pages[1] || db.pages[0];
  const settings = db.siteSettings;

  const [activeTab, setActiveTab] = useState<
    'biography' | 'timeline' | 'qualifications' | 'skills' | 'achievements' | 'contact'
  >('biography');

  const timeline = aboutPage?.experienceTimeline || [];
  const skillGroups = aboutPage?.skills || [];
  const qualifications = aboutPage?.qualifications || [];
  const achievements = aboutPage?.achievements || [];
  const highlights = aboutPage?.highlights?.[locale] || [];
  const metrics = aboutPage?.metrics || [];
  const interests = aboutPage?.interests?.[locale] || [];

  const biographyRaw = aboutPage?.biography?.[locale] || '';
  const biographyParagraphs = biographyRaw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Only render CV link if an actual file URL exists in CMS/settings
  const cvFileUrl =
    ((aboutPage as unknown as { cvUrl?: string })?.cvUrl ||
      (settings as unknown as { cvUrl?: string })?.cvUrl ||
      '')
      .trim() || null;

  const scrollToSection = (id: string, tab: typeof activeTab) => {
    setActiveTab(tab);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const chapters: { id: string; key: typeof activeTab; label: string }[] = [
    {
      id: 'chapter-biography',
      key: 'biography',
      label: locale === 'ar' ? 'النبذة المهنية' : 'Biography',
    },
    {
      id: 'chapter-timeline',
      key: 'timeline',
      label: locale === 'ar' ? 'الخط الزمني' : 'Timeline',
    },
    {
      id: 'chapter-qualifications',
      key: 'qualifications',
      label: locale === 'ar' ? 'المؤهلات' : 'Qualifications',
    },
    {
      id: 'chapter-skills',
      key: 'skills',
      label: locale === 'ar' ? 'المهارات' : 'Skills',
    },
    {
      id: 'chapter-achievements',
      key: 'achievements',
      label: locale === 'ar' ? 'الإنجازات' : 'Achievements',
    },
    {
      id: 'chapter-contact',
      key: 'contact',
      label: locale === 'ar' ? 'التواصل' : 'Contact',
    },
  ];

  return (
    <LayoutResolver pageWorld="about-editorial" adminQuickEditPath="/admin/pages">
      <SEOHead
        locale={locale}
        seo={aboutPage?.seo}
        fallbackTitle={
          locale === 'ar'
            ? 'من أنا والسيرة المهنية | أحمد سليمان'
            : 'Editorial Profile & Curriculum Vitae | Ahmed Soliman'
        }
        fallbackDescription={aboutPage?.subheadline?.[locale] || settings.seo.description[locale]}
        pathname={`/${locale}/about`}
      />

      {/* =================================================================== */}
      {/* EDITORIAL MONOGRAPH WHITE CANVAS                                    */}
      {/* =================================================================== */}
      <article className="bg-[#FFFFFF] text-[#111111] min-h-screen">
        {/* ================================================================= */}
        {/* 1. PERSONAL INTRODUCTION (LARGE PORTRAIT + CONCISE INTRO)         */}
        {/* ================================================================= */}
        <section className="pt-16 pb-12 sm:py-20 lg:py-24 px-5 sm:px-10 lg:px-16 max-w-6xl mx-auto border-b border-zinc-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Large Monochrome Portrait (transitions to color on hover) */}
            <EditorialReveal className="lg:col-span-5 space-y-3">
              <div className="w-full aspect-[4/4.8] rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden shadow-xs">
                <OptimizedImage
                  src={aboutPage?.heroImage || settings.avatarUrl}
                  alt={settings.ownerName[locale]}
                  priority
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover object-top grayscale contrast-115 hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 leading-relaxed">
                {settings.ownerName[locale]} · {settings.ownerRole[locale]}
              </p>
            </EditorialReveal>

            {/* Professional Title & Concise Introduction */}
            <EditorialReveal delay={0.08} className="lg:col-span-7 space-y-6 lg:pt-2">
              {aboutPage?.kicker?.[locale] && (
                <div className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                  {aboutPage.kicker[locale]}
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold tracking-tight text-zinc-950 leading-[1.24]">
                {aboutPage?.headline?.[locale] || settings.ownerName[locale]}
              </h1>

              {(aboutPage?.subheadline?.[locale] || settings.tagline[locale]) && (
                <p className="text-base sm:text-lg text-zinc-700 leading-[1.8] max-w-2xl">
                  {aboutPage?.subheadline?.[locale] || settings.tagline[locale]}
                </p>
              )}

              {settings.location?.[locale] && (
                <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-500 font-medium">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>{settings.location[locale]}</span>
                </div>
              )}

              {/* Subtle Editorial Chapter Navigation */}
              <nav
                aria-label={locale === 'ar' ? 'أقسام السيرة المهنية' : 'Monograph Chapters'}
                className="pt-6 border-t border-zinc-200 flex flex-wrap items-center gap-2"
              >
                {chapters.map((ch) => {
                  const isActive = activeTab === ch.key;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => scrollToSection(ch.id, ch.key)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-[0.97] whitespace-nowrap ${
                        isActive
                          ? 'bg-zinc-950 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
                      }`}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </nav>
            </EditorialReveal>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. PROFESSIONAL BIOGRAPHY (FROM CMS) + SPECIALIZATION PILLARS     */}
        {/* ================================================================= */}
        <section
          id="chapter-biography"
          className="py-14 sm:py-20 px-5 sm:px-10 lg:px-16 max-w-6xl mx-auto border-b border-zinc-200"
        >
          <EditorialReveal className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Main CMS Biography Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                  01 / BIOGRAPHY
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 leading-tight">
                  {locale === 'ar' ? 'النبذة المهنية والمنهجية العملية' : 'Professional Biography & Philosophy'}
                </h2>
              </div>

              <div className="space-y-5 text-[15px] sm:text-base leading-[1.9] text-zinc-800 max-w-prose">
                {biographyParagraphs.length > 0 ? (
                  biographyParagraphs.map((paragraph, pIdx) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))
                ) : (
                  <p>{settings.tagline[locale]}</p>
                )}
              </div>
            </div>

            {/* Editorial Highlights & Core Focus Tracks from CMS */}
            <div className="lg:col-span-5 space-y-6">
              {highlights.length > 0 && (
                <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {locale === 'ar' ? 'مرتكزات الخبرة' : 'Core Practice Pillars'}
                  </div>
                  <ul className="space-y-3">
                    {highlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                        <Check className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {metrics.length > 0 && (
                <div className="space-y-3 pt-1">
                  {metrics.map((metric, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-4 rounded-xl border border-zinc-200 hover:border-zinc-400 transition-colors flex items-start gap-3.5 bg-white"
                    >
                      <span className="font-mono-tabular text-xs font-black text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-1 rounded-md shrink-0">
                        {metric.value}
                      </span>
                      <span className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
                        {metric.label[locale]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </EditorialReveal>
        </section>

        {/* ================================================================= */}
        {/* 3. CAREER TIMELINE (CHRONOLOGICAL VISUAL TRACK)                   */}
        {/* ================================================================= */}
        <section
          id="chapter-timeline"
          className="py-14 sm:py-20 px-5 sm:px-10 lg:px-16 max-w-6xl mx-auto border-b border-zinc-200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <EditorialReveal className="lg:col-span-4 lg:sticky lg:top-24 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                02 / CHRONOLOGY
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 leading-tight">
                {locale === 'ar'
                  ? 'الخط الزمني للخبرات المهنية والعملية'
                  : 'Professional & Clinical Career Timeline'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                {locale === 'ar'
                  ? 'تدرّج الخبرة العملية بين الممارسة السريرية وإدارة الجودة وتطوير الأنظمة الطبية.'
                  : 'Chronological progression across clinical practice, healthcare quality, and medical software engineering.'}
              </p>
            </EditorialReveal>

            <div className="lg:col-span-8 relative ps-6 sm:ps-8 border-s border-zinc-300 space-y-6 sm:space-y-8">
              {timeline.map((item, idx) => (
                <EditorialReveal key={idx} delay={idx * 0.05}>
                  <div className="relative p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-400 hover:bg-zinc-50/70 transition-all duration-200 space-y-2.5">
                    <span
                      aria-hidden="true"
                      className="absolute -start-6 sm:-start-8 -translate-x-1/2 rtl:translate-x-1/2 top-7 w-3 h-3 rounded-full bg-zinc-950 ring-4 ring-white"
                    />
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 font-mono-tabular">
                      <span className="font-bold text-[#2563EB]">{item.period[locale]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-zinc-800">{item.organization[locale]}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-950 leading-snug">
                      {item.role[locale]}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-[1.8]">
                      {item.description[locale]}
                    </p>
                  </div>
                </EditorialReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. QUALIFICATIONS                                                 */}
        {/* ================================================================= */}
        <section
          id="chapter-qualifications"
          className="py-14 sm:py-20 px-5 sm:px-10 lg:px-16 max-w-6xl mx-auto border-b border-zinc-200"
        >
          <EditorialReveal className="space-y-8">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                03 / QUALIFICATIONS
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 flex items-center gap-2.5">
                <GraduationCap className="w-6 h-6 text-zinc-900 shrink-0" />
                <span>
                  {locale === 'ar'
                    ? 'المؤهلات والدورات والاعتمادات'
                    : 'Qualifications, Courses & Certifications'}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {qualifications.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-6 rounded-2xl bg-zinc-50/80 border border-zinc-200 hover:border-zinc-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular">
                      <span className="font-bold text-[#2563EB]">{q.year}</span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-950 leading-snug">
                      {q.degree[locale]}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-[1.75]">
                      {q.details[locale]}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-200/80 text-[11px] font-semibold text-zinc-500">
                    {q.institution[locale]}
                  </div>
                </div>
              ))}
            </div>
          </EditorialReveal>
        </section>

        {/* ================================================================= */}
        {/* 5. SKILLS                                                         */}
        {/* ================================================================= */}
        <section
          id="chapter-skills"
          className="py-14 sm:py-20 px-5 sm:px-10 lg:px-16 max-w-6xl mx-auto border-b border-zinc-200"
        >
          <EditorialReveal className="space-y-8">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                04 / COMPETENCIES
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
                {locale === 'ar'
                  ? 'المهارات الطبية والتقنية والإدارية'
                  : 'Clinical, Engineering & Management Skills'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {skillGroups.map((grp, grpIdx) => (
                <div
                  key={grpIdx}
                  className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-zinc-400 transition-colors space-y-4"
                >
                  <div className="flex items-center gap-2.5 text-zinc-950 font-bold text-base border-b border-zinc-200 pb-3">
                    <Briefcase className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <h3>{grp.category[locale]}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {(grp.items || []).map((skill, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                        <Check className="w-4 h-4 text-zinc-950 shrink-0 mt-0.5" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </EditorialReveal>
        </section>

        {/* ================================================================= */}
        {/* 6. ACHIEVEMENTS & FOCUS AREAS                                     */}
        {/* ================================================================= */}
        <section
          id="chapter-achievements"
          className="py-14 sm:py-20 px-5 sm:px-10 lg:px-16 max-w-6xl mx-auto border-b border-zinc-200"
        >
          <EditorialReveal className="space-y-10">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                05 / ACHIEVEMENTS & FOCUS
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 flex items-center gap-2.5">
                <Award className="w-6 h-6 text-zinc-900 shrink-0" />
                <span>
                  {locale === 'ar'
                    ? 'الإنجازات والمشروعات والاهتمامات المهنية'
                    : 'Key Achievements, Systems & Focus Areas'}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {achievements.map((ach, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 hover:shadow-xs transition-all duration-200 space-y-3"
                >
                  <div className="text-xs font-mono-tabular font-bold text-[#2563EB]">
                    {ach.metric || `0${idx + 1}.`}
                  </div>
                  <h3 className="text-base font-bold text-zinc-950 leading-snug">
                    {ach.title[locale]}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-[1.75]">
                    {ach.description[locale]}
                  </p>
                </div>
              ))}
            </div>

            {interests.length > 0 && (
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {locale === 'ar' ? 'مجالات التركيز والاهتمامات البحثية' : 'Focus Areas & Research Interests'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((intr, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-800"
                    >
                      {intr}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </EditorialReveal>
        </section>

        {/* ================================================================= */}
        {/* 7 & 8. CV (IF FILE AVAILABLE) & DIRECT CONTACT STRIP              */}
        {/* Fixed 12-col grid prevents headline squishing & button overflow.  */}
        {/* ================================================================= */}
        <section
          id="chapter-contact"
          className="py-14 sm:py-20 px-5 sm:px-10 lg:px-16 max-w-6xl mx-auto"
        >
          <EditorialReveal>
            <div className="w-full rounded-3xl bg-zinc-950 text-white p-6 sm:p-10 lg:p-12 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                {/* Text Column (constrained safely, never collapses vertically) */}
                <div className="lg:col-span-6 space-y-3 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-widest text-sky-400">
                    {locale === 'ar' ? 'التواصل المباشر' : 'DIRECT CONTACT & INQUIRIES'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                    {locale === 'ar'
                      ? 'التواصل المهني والاستشارات للأنظمة الطبية'
                      : 'Direct Professional Contact & Consultation'}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
                    {locale === 'ar'
                      ? 'يمكنك التواصل مباشرة للاستشارات المتعلقة بتطوير أنظمة العيادات والمجمعات الطبية وجودة الرعاية الصحية عبر القنوات الرسمية.'
                      : 'Reach out directly via official channels for clinic software engineering, hospital ERP architecture, and healthcare quality consulting.'}
                  </p>
                </div>

                {/* Action Buttons Column (cleanly wrapped inside container padding) */}
                <div className="lg:col-span-6 flex flex-wrap items-center gap-3 lg:justify-end min-w-0">
                  {cvFileUrl && (
                    <a
                      href={cvFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.97] transition-all whitespace-nowrap"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{locale === 'ar' ? 'عرض / تحميل السيرة الذاتية' : 'View / Download CV'}</span>
                    </a>
                  )}

                  {settings.whatsappUrl && (
                    <a
                      href={settings.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.97] transition-all whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{locale === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp'}</span>
                    </a>
                  )}

                  {settings.contactEmail && (
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-100 hover:border-white active:scale-[0.97] transition-all whitespace-nowrap"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                    </a>
                  )}

                  {settings.facebookUrl && (
                    <a
                      href={settings.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border border-zinc-700 text-zinc-200 hover:border-white active:scale-[0.97] transition-all whitespace-nowrap"
                    >
                      <span>Facebook</span>
                    </a>
                  )}

                  {settings.telegramBotUrl && (
                    <a
                      href={settings.telegramBotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border border-zinc-700 text-zinc-200 hover:border-white active:scale-[0.97] transition-all whitespace-nowrap"
                    >
                      <Send className="w-4 h-4" />
                      <span>@SoliMedicalproBot</span>
                    </a>
                  )}

                  {adminSession && (
                    <button
                      type="button"
                      onClick={() => navigate(`/${locale}/projects`)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold border border-zinc-700 text-zinc-200 hover:border-white active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>{locale === 'ar' ? 'معرض المشروعات' : 'Projects'}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </EditorialReveal>
        </section>
      </article>
    </LayoutResolver>
  );
};
