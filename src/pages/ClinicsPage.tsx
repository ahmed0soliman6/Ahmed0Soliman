import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  Stethoscope,
  ArrowUpRight,
  Clock,
  MapPin,
  Share2,
  Search,
  ShieldCheck,
  Phone,
  Calendar,
} from 'lucide-react';

export const ClinicsPage: React.FC = () => {
  const { locale, navigate, db, showToast } = usePlatform();
  const [searchQuery, setSearchQuery] = useState('');

  const publishedClinics = db.clinics
    .filter((c) => c.published)
    .sort((a, b) => a.order - b.order);

  const filteredClinics = publishedClinics.filter((clinic) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      clinic.name.ar.toLowerCase().includes(q) ||
      clinic.name.en.toLowerCase().includes(q) ||
      clinic.specialtyBadge.ar.toLowerCase().includes(q) ||
      clinic.specialtyBadge.en.toLowerCase().includes(q) ||
      clinic.city.ar.toLowerCase().includes(q) ||
      clinic.city.en.toLowerCase().includes(q)
    );
  });

  const handleCopyStandaloneLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/${locale}/clinics/${slug}?standalone=1`;
    navigator.clipboard?.writeText(url);
    showToast(
      locale === 'ar'
        ? 'تم نسخ رابط صفحة الهبوط المستقلة للعيادة (بدون قوائم الموقع العام)'
        : 'Copied Standalone Clinic Landing Page link',
      'success'
    );
  };

  return (
    <LayoutResolver pageWorld="clinics-teal" adminQuickEditPath="/admin/clinics">
      <SEOHead
        locale={locale}
        fallbackTitle={
          locale === 'ar'
            ? 'صفحات العيادات والمراكز الطبية المستقلة | أحمد سليمان'
            : 'Medical Clinic Landing Pages & Directory | Ahmed Soliman'
        }
        fallbackDescription={
          locale === 'ar'
            ? 'استعرض صفحات الهبوط المستقلة للعيادات والمجمعات الطبية شاملة الأطباء والخدمات والأسعار ومواعيد العمل والحجز المباشر.'
            : 'Browse independent medical clinic landing pages including doctors, services, transparent pricing, and working hours.'
        }
        pathname={`/${locale}/clinics`}
      />

      {/* =================================================================== */}
      {/* 1. SCREENSHOT 2.3 CLINICAL MINT & TEAL HEALTHCARE PORTAL HERO       */}
      {/* =================================================================== */}
      <section className="py-12 lg:py-18 px-4 sm:px-8 bg-gradient-to-b from-[#BCECE3] via-[#DFF7F3] to-[#F2FBF9] border-b border-teal-600/15">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Framed Medical Showcase Card matching Screenshot 2.3 ("Compassionate care, exceptional results") */}
          <div className="rounded-3xl bg-[#0D212C] text-white p-6 sm:p-10 lg:p-12 shadow-2xl border-4 border-white/80 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
            <div className="lg:col-span-6 space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {locale === 'ar'
                    ? 'بوابات العيادات والمراكز الطبية المستقلة'
                    : 'Verified Standalone Clinic Portals'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">
                {locale === 'ar' ? (
                  <>
                    رعاية طبية متكاملة، ونتائج{' '}
                    <span className="text-[#2DD4BF]">استثنائية</span> لكل مراجع.
                  </>
                ) : (
                  <>
                    Compassionate care,{' '}
                    <span className="text-[#2DD4BF]">exceptional</span> results.
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {locale === 'ar'
                  ? 'لكل عيادة أو مركز طبي صفحة هبوط مستقلة تماماً تعرض اسم العيادة والشعار، الأطباء والتخصصات، جدول الخدمات والأسعار، مواعيد العمل، الخريطة التفاعلية، والحجز الفوري عبر واتساب.'
                  : 'Each clinic features a dedicated standalone landing page showcasing doctors, specialties, transparent service pricing, working hours, map location, and direct WhatsApp booking.'}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {publishedClinics[0] && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/${locale}/clinics/${publishedClinics[0].slug}?standalone=1`)
                    }
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0D9488] text-white hover:bg-[#0F766E] transition-colors shadow-lg cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>
                      {locale === 'ar'
                        ? 'جرب صفحة العيادة المستقلة الآن'
                        : 'Try Live Standalone Clinic Portal'}
                    </span>
                  </button>
                )}
              </div>

              {/* Real Database Counts (Clinics, Doctors, Services) */}
              <div className="pt-4 border-t border-white/15 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-black font-mono-tabular text-[#2DD4BF]">
                    {publishedClinics.length}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {locale === 'ar' ? 'عيادات ومراكز نشطة' : 'Active Clinics'}
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black font-mono-tabular text-white">
                    {db.doctors.filter((d) => d.published).length}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {locale === 'ar' ? 'أطباء واستشاريون' : 'Physicians'}
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black font-mono-tabular text-[#2DD4BF]">
                    {db.services.filter((s) => s.published).length}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {locale === 'ar' ? 'خدمات طبية مسعّرة' : 'Medical Services'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Multi-Device Medical Clinic Preview matching Screenshot 2.3 */}
            <div className="lg:col-span-6 relative">
              <div className="rounded-2xl overflow-hidden border-2 border-teal-400/30 bg-slate-900 h-72 sm:h-80 relative shadow-2xl">
                <OptimizedImage
                  src={
                    publishedClinics[0]?.coverImage ||
                    '/src/assets/images/clinic_interior_reception_1794472515936.jpg'
                  }
                  alt="Medical Clinic Reception"
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D212C] via-transparent to-transparent" />

                {/* Floating Doctor & Booking Card Overlay (matching the mobile/tablet overlays in Screenshot 2.3) */}
                <div className="absolute bottom-4 start-4 end-4 sm:end-auto sm:w-72 p-4 rounded-2xl bg-white text-slate-900 shadow-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0D9488]">
                      {locale === 'ar' ? 'حجز موعد فوري' : 'Instant Booking'}
                    </span>
                    <span className="font-mono-tabular text-slate-500">Standalone Mode</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {publishedClinics[0]?.name[locale]}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {publishedClinics[0]?.address[locale]}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Directory Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {locale === 'ar'
                  ? 'دليل العيادات والمجمعات الطبية المتاحة'
                  : 'Available Clinics & Medical Centers'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {locale === 'ar'
                  ? 'اضغط على أي عيادة لاستعراض الأطباء والخدمات والأسعار، أو افتحها بالوضع المستقل للمرضى.'
                  : 'Select any clinic to inspect doctors, transparent fees, or launch Standalone Patient Mode.'}
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-teal-600 absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === 'ar'
                    ? 'ابحث باسم العيادة أو التخصص أو المدينة...'
                    : 'Search by clinic, specialty, or city...'
                }
                className="w-full ps-10 pe-4 py-3 rounded-xl text-xs sm:text-sm bg-white border border-teal-600/25 text-slate-900 focus:border-[#0D9488] focus:outline-none shadow-xs"
              />
            </div>
          </div>

          {/* =============================================================== */}
          {/* 2. BRIGHT CLINICAL WHITE & TEAL CLINIC CARDS                    */}
          {/* =============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
            {filteredClinics.map((clinic) => {
              const clinicDoctors = db.doctors.filter(
                (d) => d.clinicId === clinic.id && d.published
              );
              const clinicServices = db.services.filter(
                (s) => s.clinicId === clinic.id && s.published
              );
              const accent = clinic.themeColor || '#0D9488';

              return (
                <motion.article
                  key={clinic.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => navigate(`/${locale}/clinics/${clinic.slug}`)}
                  className="cursor-pointer rounded-3xl bg-white border-2 border-teal-600/15 hover:border-[#0D9488] transition-all overflow-hidden flex flex-col justify-between shadow-lg shadow-teal-950/5"
                >
                  {/* Top Visual Cover Banner */}
                  <div className="relative h-56 bg-slate-900 overflow-hidden border-b border-slate-100">
                    <OptimizedImage
                      src={clinic.coverImage}
                      alt={clinic.name[locale]}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />

                    <div className="absolute top-4 start-4 end-4 flex items-center justify-between gap-2">
                      <span
                        style={{ backgroundColor: accent }}
                        className="px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm"
                      >
                        {clinic.specialtyBadge[locale]}
                      </span>

                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-900 inline-flex items-center gap-1 shadow-xs">
                        <MapPin className="w-3 h-3 text-[#0D9488]" />
                        {clinic.city[locale]}
                      </span>
                    </div>

                    <div className="absolute bottom-4 start-5 end-5 flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white bg-white p-1.5 shrink-0 shadow-md">
                        <OptimizedImage
                          src={clinic.logoUrl || clinic.coverImage}
                          alt={clinic.name[locale]}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                          {clinic.name[locale]}
                        </h3>
                        <p className="text-xs text-teal-200 line-clamp-1">
                          {clinic.tagline[locale]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {clinic.description[locale]}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#0D9488] shrink-0" />
                          <span className="truncate">{clinic.address[locale]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#0D9488] shrink-0" />
                          <span className="truncate">
                            {clinic.workingHours?.[0]?.days?.[locale]}:{' '}
                            {clinic.workingHours?.[0]?.hours?.[locale]}
                          </span>
                        </div>
                      </div>

                      {/* Stats Bar */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                        <div className="px-3.5 py-1.5 rounded-xl bg-[#F0FDFA] border border-teal-500/25 text-teal-950">
                          <span className="font-mono-tabular font-bold">
                            {clinicDoctors.length}
                          </span>{' '}
                          <span>{locale === 'ar' ? 'أطباء استشاريون' : 'Physicians'}</span>
                        </div>
                        <div className="px-3.5 py-1.5 rounded-xl bg-[#F0FDFA] border border-teal-500/25 text-teal-950">
                          <span className="font-mono-tabular font-bold">
                            {clinicServices.length}
                          </span>{' '}
                          <span>{locale === 'ar' ? 'خدمات طبية معلنة' : 'Medical Services'}</span>
                        </div>
                        {clinic.phone && (
                          <div className="inline-flex items-center gap-1.5 font-mono-tabular font-bold text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-[#0D9488]" />
                            <span>{clinic.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/${locale}/clinics/${clinic.slug}`);
                          }}
                          style={{ backgroundColor: accent }}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-teal-600/30 bg-[#F0FDFA] text-teal-900 hover:bg-teal-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <span>
                            {locale === 'ar'
                              ? 'فتح كصفحة هبوط مستقلة'
                              : 'Open Standalone Mode'}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleCopyStandaloneLink(clinic.slug, e)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#0D9488] transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{locale === 'ar' ? 'نسخ رابط المريض' : 'Copy Patient Link'}</span>
                      </button>
                    </div>
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
