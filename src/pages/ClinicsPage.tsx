import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
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
  Users,
  X,
} from 'lucide-react';

export const ClinicsPage: React.FC = () => {
  const { locale, navigate, db, showToast } = usePlatform();
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const publishedClinics = useMemo(
    () =>
      db.clinics
        .filter((c) => c.published)
        .sort((a, b) => a.order - b.order),
    [db.clinics]
  );

  const publishedDoctors = useMemo(
    () => db.doctors.filter((d) => d.published),
    [db.doctors]
  );

  const publishedServices = useMemo(
    () => db.services.filter((s) => s.published),
    [db.services]
  );

  const uniqueCities = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>();
    publishedClinics.forEach((c) => {
      const key = c.city.en.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { key, label: c.city[locale] });
      }
    });
    return Array.from(map.values());
  }, [publishedClinics, locale]);

  const filteredClinics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedClinics.filter((clinic) => {
      const cityKey = clinic.city.en.trim().toLowerCase();
      if (selectedCity !== 'all' && cityKey !== selectedCity) return false;
      if (!q) return true;

      const clinicDoctors = publishedDoctors.filter((d) => d.clinicId === clinic.id);
      const clinicServices = publishedServices.filter((s) => s.clinicId === clinic.id);

      return (
        clinic.name.ar.toLowerCase().includes(q) ||
        clinic.name.en.toLowerCase().includes(q) ||
        clinic.specialtyBadge.ar.toLowerCase().includes(q) ||
        clinic.specialtyBadge.en.toLowerCase().includes(q) ||
        clinic.city.ar.toLowerCase().includes(q) ||
        clinic.city.en.toLowerCase().includes(q) ||
        clinicDoctors.some(
          (d) =>
            d.name.ar.toLowerCase().includes(q) ||
            d.name.en.toLowerCase().includes(q) ||
            d.specialty.ar.toLowerCase().includes(q) ||
            d.specialty.en.toLowerCase().includes(q)
        ) ||
        clinicServices.some(
          (s) =>
            s.name.ar.toLowerCase().includes(q) ||
            s.name.en.toLowerCase().includes(q)
        )
      );
    });
  }, [publishedClinics, publishedDoctors, publishedServices, searchQuery, selectedCity]);

  const handleCopyStandaloneLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/${locale}/clinics/${slug}?standalone=1`;
    navigator.clipboard?.writeText(url);
    showToast(
      locale === 'ar'
        ? 'تم نسخ رابط صفحة العيادة المستقل للمرضى (Standalone)'
        : 'Copied Standalone Clinic Link to clipboard',
      'success'
    );
  };

  return (
    <LayoutResolver pageWorld="clinics-teal" adminQuickEditPath="/admin/clinics">
      <SEOHead
        locale={locale}
        fallbackTitle={
          locale === 'ar'
            ? 'دليل العيادات والمراكز الطبية | الأطباء والخدمات والأسعار'
            : 'Medical Clinics Directory | Doctors, Services, Pricing & Booking'
        }
        fallbackDescription={
          locale === 'ar'
            ? 'تصفح دليل العيادات والمجمعات الطبية: استعرض الأطباء، التخصصات، أسعار الخدمات المعلنة، مواعيد العمل، واحجز موعدك مباشرة.'
            : 'Browse verified clinics and medical complexes: explore physicians, specialties, published fee schedules, working hours, and book online.'
        }
        pathname={`/${locale}/clinics`}
      />

      <div className="min-h-screen bg-gradient-to-b from-[#E3F7F4] via-[#F2FBF9] to-[#FFFFFF] text-slate-900">
        {/* ================================================================= */}
        {/* 1. CLEAN CLINICAL DIRECTORY HERO & QUICK DB STATS                 */}
        {/* ================================================================= */}
        <section className="pt-16 pb-10 sm:py-16 px-4 sm:px-8 border-b border-teal-600/15">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-3xl bg-white border border-teal-600/15 p-6 sm:p-10 lg:p-12 shadow-lg shadow-teal-950/5 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left 7 Cols: Directory Title, Subtitle & Real Stats */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0FDFA] border border-teal-500/30 text-[#0F766E] text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>
                    {locale === 'ar'
                      ? 'دليل العيادات والمراكز الطبية المعتمدة'
                      : 'Verified Medical Clinics Directory'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.18]">
                  {locale === 'ar' ? (
                    <>
                      ابحث عن العيادة المناسبة،{' '}
                      <span className="text-[#0D9488]">واحجز موعدك مباشرة</span>
                    </>
                  ) : (
                    <>
                      Explore Accredited Clinics &{' '}
                      <span className="text-[#0D9488]">Book With Clarity</span>
                    </>
                  )}
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  {locale === 'ar'
                    ? 'دليل طبي موحّد يتيح لك استعراض العيادات والمراكز المتخصصة، التعرف على الأطباء والتخصصات، مراجعة الأسعار ومواعيد العمل المعلنة، والوصول السريع لصفحة كل عيادة.'
                    : 'A curated healthcare directory connecting patients with specialized clinics—featuring verified physicians, transparent service fees, clinic hours, and direct appointment booking.'}
                </p>

                {/* Live Database Counts Row */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 sm:gap-6 max-w-xl">
                  <div className="p-3.5 rounded-2xl bg-[#F0FDFA] border border-teal-500/20">
                    <div className="text-2xl sm:text-3xl font-black font-mono-tabular text-[#0D9488]">
                      {publishedClinics.length}
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">
                      {locale === 'ar' ? 'عيادات ومراكز' : 'Active Clinics'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="text-2xl sm:text-3xl font-black font-mono-tabular text-slate-900">
                      {publishedDoctors.length}
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">
                      {locale === 'ar' ? 'أطباء واستشاريون' : 'Physicians'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F0FDFA] border border-teal-500/20">
                    <div className="text-2xl sm:text-3xl font-black font-mono-tabular text-[#0D9488]">
                      {publishedServices.length}
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">
                      {locale === 'ar' ? 'خدمات طبية معلنة' : 'Listed Services'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Clinical Reception Visual Highlight */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border border-teal-600/20 bg-slate-900 h-64 sm:h-72 relative shadow-md">
                  <OptimizedImage
                    src={
                      publishedClinics[0]?.coverImage ||
                      '/src/assets/images/clinic_interior_reception_1794472515936.jpg'
                    }
                    alt={
                      publishedClinics[0]?.name[locale] ||
                      (locale === 'ar' ? 'استقبال العيادة الطبية' : 'Medical Clinic Reception')
                    }
                    priority
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

                  {publishedClinics[0] && (
                    <div className="absolute bottom-4 start-4 end-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white shadow-lg flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {publishedClinics[0].logoUrl && (
                          <img
                            src={publishedClinics[0].logoUrl}
                            alt={publishedClinics[0].name[locale]}
                            className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-1 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-slate-900 truncate">
                            {publishedClinics[0].name[locale]}
                          </div>
                          <div className="text-[11px] text-[#0D9488] font-semibold truncate">
                            {publishedClinics[0].city[locale]} · {publishedClinics[0].specialtyBadge[locale]}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/${locale}/clinics/${publishedClinics[0].slug}`)}
                        className="px-3 py-2 rounded-xl text-[11px] font-bold bg-[#0D9488] text-white hover:bg-[#0F766E] transition-colors shrink-0 cursor-pointer"
                      >
                        {locale === 'ar' ? 'فتح' : 'View'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. DIRECTORY SEARCH, CITY CHIPS & CLINIC CARDS GRID               */}
        {/* ================================================================= */}
        <section className="py-10 lg:py-14 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Simple Quick Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {locale === 'ar'
                    ? 'العيادات والمجمعات الطبية المتاحة'
                    : 'Available Clinics & Medical Centers'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  {locale === 'ar'
                    ? 'اختر العيادة لاستعراض تفاصيل الأطباء والأسعار والمواعيد، أو افتحها بالوضع المستقل.'
                    : 'Select a clinic to inspect doctors, published fees, hours, or launch Standalone Patient View.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {uniqueCities.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCity('all')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        selectedCity === 'all'
                          ? 'bg-[#0D9488] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-[#0D9488]'
                      }`}
                    >
                      {locale === 'ar' ? 'كل المدن' : 'All Cities'}
                    </button>
                    {uniqueCities.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setSelectedCity(c.key)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          selectedCity === c.key
                            ? 'bg-[#0D9488] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-[#0D9488]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#0D9488] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      locale === 'ar'
                        ? 'ابحث بالعيادة أو التخصص أو الطبيب...'
                        : 'Search clinic, specialty, or doctor...'
                    }
                    className="w-full ps-10 pe-9 py-2.5 rounded-xl text-xs sm:text-sm bg-white border border-teal-600/25 text-slate-900 placeholder:text-slate-400 focus:border-[#0D9488] focus:outline-none shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label={locale === 'ar' ? 'مسح البحث' : 'Clear search'}
                      className="absolute top-1/2 -translate-y-1/2 end-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {filteredClinics.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-teal-600/15 text-center space-y-3 shadow-xs">
                <p className="text-sm text-slate-600">
                  {locale === 'ar'
                    ? 'لا توجد عيادات مطابقة لبحثك الحالي.'
                    : 'No clinics match your current search.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCity('all');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0D9488] text-white cursor-pointer"
                >
                  {locale === 'ar' ? 'عرض جميع العيادات' : 'Show All Clinics'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
                {filteredClinics.map((clinic, idx) => {
                  const clinicDoctors = publishedDoctors.filter((d) => d.clinicId === clinic.id);
                  const clinicServices = publishedServices.filter((s) => s.clinicId === clinic.id);
                  const accent = clinic.themeColor || '#0D9488';

                  return (
                    <motion.article
                      key={clinic.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.08 }}
                      transition={{ duration: 0.4, delay: Math.min(idx * 0.06, 0.2) }}
                      onClick={() => navigate(`/${locale}/clinics/${clinic.slug}`)}
                      className="cursor-pointer rounded-3xl bg-white border border-teal-600/15 hover:border-[#0D9488]/65 hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-md shadow-teal-950/5 group"
                    >
                      <div>
                        {/* Cover Banner + Logo */}
                        <div className="relative h-56 bg-slate-900 overflow-hidden border-b border-slate-100">
                          <OptimizedImage
                            src={clinic.coverImage}
                            alt={clinic.name[locale]}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                              <MapPin className="w-3 h-3" style={{ color: accent }} />
                              <span>{clinic.city[locale]}</span>
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
                            <div className="min-w-0">
                              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug truncate">
                                {clinic.name[locale]}
                              </h3>
                              <p className="text-xs text-slate-200/90 line-clamp-1">
                                {clinic.tagline[locale]}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Card Details Body */}
                        <div className="p-6 sm:p-8 space-y-5">
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                            {clinic.description[locale]}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 shrink-0" style={{ color: accent }} />
                              <span className="truncate">{clinic.address[locale]}</span>
                            </div>
                            {clinic.workingHours?.[0] && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 shrink-0" style={{ color: accent }} />
                                <span className="truncate">
                                  {clinic.workingHours[0].days[locale]}:{' '}
                                  {clinic.workingHours[0].hours[locale]}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Doctors Preview Chips (when doctors exist in DB) */}
                          {clinicDoctors.length > 0 && (
                            <div className="pt-3 border-t border-slate-100 space-y-2">
                              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" style={{ color: accent }} />
                                <span>
                                  {locale === 'ar'
                                    ? 'أطباء العيادة المتاحون:'
                                    : 'Available Clinic Physicians:'}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {clinicDoctors.slice(0, 2).map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5"
                                  >
                                    <img
                                      src={doc.photoUrl}
                                      alt={doc.name[locale]}
                                      className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-slate-900 truncate">
                                        {doc.name[locale]}
                                      </div>
                                      <div className="text-[11px] text-slate-500 truncate">
                                        {doc.specialty[locale]}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Services & Stats Summary */}
                          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                            <div className="px-3 py-1.5 rounded-xl bg-[#F0FDFA] border border-teal-500/20 text-slate-800">
                              <span className="font-mono-tabular font-bold" style={{ color: accent }}>
                                {clinicDoctors.length}
                              </span>{' '}
                              <span>{locale === 'ar' ? 'أطباء' : 'Doctors'}</span>
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-[#F0FDFA] border border-teal-500/20 text-slate-800">
                              <span className="font-mono-tabular font-bold" style={{ color: accent }}>
                                {clinicServices.length}
                              </span>{' '}
                              <span>{locale === 'ar' ? 'خدمات طبية' : 'Services'}</span>
                            </div>
                            {clinicServices[0] && (
                              <div className="text-[11px] text-slate-500 font-medium truncate">
                                · {clinicServices[0].name[locale]} (
                                <span className="font-mono-tabular font-bold text-slate-700">
                                  {clinicServices[0].price} {clinicServices[0].currency}
                                </span>
                                )
                              </div>
                            )}
                            {clinic.phone && (
                              <div className="inline-flex items-center gap-1.5 font-mono-tabular font-bold text-slate-700">
                                <Phone className="w-3.5 h-3.5" style={{ color: accent }} />
                                <span>{clinic.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="px-6 sm:px-8 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/${locale}/clinics/${clinic.slug}`);
                            }}
                            style={{ backgroundColor: accent }}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-95 active:scale-[0.97] transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>
                              {locale === 'ar' ? 'تفاصيل العيادة والحجز' : 'View Clinic & Book'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/${locale}/clinics/${clinic.slug}?standalone=1`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-teal-600/30 bg-white text-slate-800 hover:border-[#0D9488] hover:text-[#0D9488] active:scale-[0.97] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <span>
                              {locale === 'ar' ? 'الصفحة المستقلة' : 'Standalone Page'}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleCopyStandaloneLink(clinic.slug, e)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#0D9488] transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'نسخ الرابط المستقل' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </LayoutResolver>
  );
};
