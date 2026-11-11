import React from 'react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  Check,
  MessageCircle,
  Send,
  ArrowUpRight,
  Briefcase,
  Layers,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { locale, navigate, db } = usePlatform();

  const aboutPage =
    db.pages.find((p) => p.id === 'about' || p.slug === 'about') || db.pages[1] || db.pages[0];
  const settings = db.siteSettings;

  return (
    <LayoutResolver
      forceStandalone={aboutPage?.standaloneByDefault}
      standaloneContext={{
        title: settings.ownerName[locale],
        whatsappUrl: settings.whatsappUrl,
        ctaLabel: locale === 'ar' ? 'تواصل مع أحمد سليمان' : 'Contact Ahmed Soliman',
      }}
      adminQuickEditPath="/admin/pages"
    >
      <SEOHead
        locale={locale}
        seo={aboutPage?.seo}
        fallbackTitle={
          locale === 'ar'
            ? 'من أنا | أحمد سليمان — مطوّر أنظمة العيادات والبرمجيات الصحية'
            : 'About Ahmed Soliman — Healthcare Systems Architect'
        }
        fallbackDescription={aboutPage?.subheadline?.[locale] || ''}
        pathname={`/${locale}/about`}
      />

      {/* EDITORIAL MONOGRAPH HEADER & BIOGRAPHY */}
      <article className="py-14 lg:py-22 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Editorial Portrait Column */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="lg:col-span-5 space-y-6"
            >
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-[3/4]">
                <OptimizedImage
                  src={aboutPage?.heroImage || settings.avatarUrl}
                  alt={settings.ownerName[locale]}
                  priority={true}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {settings.ownerName[locale]}
                  </div>
                  <div className="text-xs text-[#00C2CB] font-medium mt-0.5">
                    {settings.ownerRole[locale]}
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {settings.location[locale]}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
                  <a
                    href={settings.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp Direct'}</span>
                  </a>

                  <a
                    href={settings.telegramBotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#00C2CB] transition-colors whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5 text-[#00C2CB]" />
                    <span>Telegram Bot</span>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Editorial Narrative Column */}
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-5">
                <div className="text-xs font-semibold text-[#00C2CB]">
                  {aboutPage?.kicker?.[locale]}
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {aboutPage?.headline?.[locale]}
                </h1>

                <p className="text-lg sm:text-xl font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                  {aboutPage?.subheadline?.[locale]}
                </p>

                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {aboutPage?.biography?.[locale]}
                </p>
              </div>

              {/* Core Engineering Focus Areas */}
              <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {locale === 'ar'
                    ? 'مرتكزات العمل والتطوير الميداني'
                    : 'Core Engineering & Operational Pillars'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(aboutPage?.highlights?.[locale] || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/90 flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <Check className="w-4 h-4 text-[#00C2CB] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career & Field Operations Timeline */}
              {aboutPage?.experienceTimeline && aboutPage.experienceTimeline.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#00C2CB]" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'الخبرة العملية والتشغيلية'
                        : 'Professional & Operational Experience'}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {aboutPage.experienceTimeline.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-[#00C2CB]">
                            {exp.organization[locale]}
                          </span>
                          <span className="font-mono-tabular">{exp.period[locale]}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {exp.role[locale]}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {exp.description[locale]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Capabilities Matrix */}
              {aboutPage?.skills && aboutPage.skills.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00C2CB]" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {locale === 'ar'
                        ? 'المنظومة التقنية والمهارات الهندسية'
                        : 'Technical Architecture & Domain Expertise'}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aboutPage.skills.map((skillGroup, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3"
                      >
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {skillGroup.category[locale]}
                        </h3>
                        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {skillGroup.items.join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom CTA to Projects */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {locale === 'ar'
                    ? 'شاهد كيف تتحول هذه الخبرات إلى أنظمة فعلية تعمل داخل العيادات والمجمعات الطبية.'
                    : 'See how this philosophy translates into production systems running inside clinics and medical complexes.'}
                </p>
                <button
                  onClick={() => navigate(`/${locale}/projects`)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{locale === 'ar' ? 'استعراض معرض المشروعات' : 'Browse Projects Gallery'}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </LayoutResolver>
  );
};
