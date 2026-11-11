import React from 'react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  Building2,
  Stethoscope,
  ArrowUpRight,
  Clock,
  MapPin,
  Share2,
} from 'lucide-react';

export const ClinicsPage: React.FC = () => {
  const { locale, navigate, db, showToast } = usePlatform();

  const publishedClinics = db.clinics.filter((c) => c.published);

  const handleCopyStandaloneLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/${locale}/clinics/${slug}?standalone=1`;
    navigator.clipboard?.writeText(url);
    showToast(
      locale === 'ar'
        ? 'تم نسخ رابط صفحة الهبوط المستقلة للعيادة'
        : 'Copied Standalone Clinic Landing Page link',
      'success'
    );
  };

  return (
    <LayoutResolver adminQuickEditPath="/admin/clinics">
      <SEOHead
        locale={locale}
        fallbackTitle={
          locale === 'ar'
            ? 'صفحات الهبوط الطبية للعيادات والمراكز | أحمد سليمان'
            : 'Medical Clinic Landing Pages & Directory | Ahmed Soliman'
        }
        fallbackDescription={
          locale === 'ar'
            ? 'استعرض صفحات الهبوط المستقلة للعيادات والمجمعات الطبية شاملة الأطباء والخدمات والأسعار ومواعيد العمل والحجز المباشر.'
            : 'Browse independent medical clinic landing pages including doctors, services, transparent pricing, and working hours.'
        }
        pathname={`/${locale}/clinics`}
      />

      <section className="py-14 lg:py-22 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="space-y-3 max-w-3xl">
            <div className="text-xs font-semibold text-[#00C2CB]">
              {locale === 'ar'
                ? 'صفحات الهبوط الطبية المستقلة · Medical Landing Pages'
                : 'Medical Landing Pages · Clinics & Specialized Centers'}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {locale === 'ar'
                ? 'صفحات عيادات ومراكز طبية متكاملة قابلة للمشاركة المستقلة'
                : 'Independent Medical Clinic Portals Ready for Direct Patient Booking'}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {locale === 'ar'
                ? 'كل صفحة عيادة تعرض الأطباء والتخصصات وقائمة الخدمات والأسعار ومواعيد العمل وأزرار الحجز، مع إمكانية فتحها بنمط العرض المستقل (Standalone Landing Layout) للحملات التسويقية.'
                : 'Each clinic page presents doctors, specialties, transparent service pricing, working hours, and direct booking—with support for Standalone Campaign Mode.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {publishedClinics.map((clinic) => {
              const clinicDoctors = db.doctors.filter(
                (d) => d.clinicId === clinic.id && d.published
              );
              const clinicServices = db.services.filter(
                (s) => s.clinicId === clinic.id && s.published
              );

              return (
                <motion.article
                  key={clinic.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => navigate(`/${locale}/clinics/${clinic.slug}`)}
                  className="cursor-pointer rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#00C2CB]/60 transition-colors p-6 sm:p-8 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-[#070E1A] p-1.5 shrink-0">
                          <OptimizedImage
                            src={clinic.logoUrl || clinic.coverImage}
                            alt={clinic.name[locale]}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-[#00C2CB]">
                            {clinic.specialtyBadge[locale]}
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            {clinic.name[locale]}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                      {clinic.description[locale]}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#00C2CB] shrink-0" />
                        <span className="truncate">{clinic.address[locale]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#00C2CB] shrink-0" />
                        <span className="truncate">
                          {clinic.workingHours?.[0]?.days?.[locale]}:{' '}
                          {clinic.workingHours?.[0]?.hours?.[locale]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
                      <span className="font-mono-tabular text-slate-900 dark:text-white font-semibold">
                        {clinicDoctors.length}
                      </span>
                      <span>{locale === 'ar' ? 'أطباء استشاريون' : 'Physicians'}</span>
                      <span>·</span>
                      <span className="font-mono-tabular text-slate-900 dark:text-white font-semibold">
                        {clinicServices.length}
                      </span>
                      <span>{locale === 'ar' ? 'خدمات طبية معلنة' : 'Medical Services'}</span>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/${locale}/clinics/${clinic.slug}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>
                          {locale === 'ar' ? 'استعراض العيادة والحجز' : 'View Clinic & Book'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/${locale}/clinics/${clinic.slug}?standalone=1`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#00C2CB] hover:text-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>
                          {locale === 'ar' ? 'فتح كصفحة هبوط مستقلة' : 'Open Standalone Mode'}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleCopyStandaloneLink(clinic.slug, e)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-[#00C2CB] transition-colors"
                      title={
                        locale === 'ar'
                          ? 'نسخ رابط الحملة المستقل'
                          : 'Copy Standalone Campaign URL'
                      }
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'نسخ رابط الحملة' : 'Copy Campaign URL'}</span>
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>
    </LayoutResolver>
  );
};
