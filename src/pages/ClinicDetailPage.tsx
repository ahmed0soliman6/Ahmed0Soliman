import React, { useMemo, useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Send,
  Check,
  Search,
  Share2,
  Calendar,
  ShieldCheck,
  Building2,
  Stethoscope,
  X,
  ExternalLink,
} from 'lucide-react';

interface ClinicDetailPageProps {
  slug: string;
}

export const ClinicDetailPage: React.FC<ClinicDetailPageProps> = ({ slug }) => {
  const { locale, navigate, db, showToast, adminSession } = usePlatform();

  const clinic = db.clinics.find((c) => c.slug === slug || c.id === slug);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedServiceCat, setSelectedServiceCat] = useState<string>('all');
  const [bookingModal, setBookingModal] = useState<{
    open: boolean;
    subject: string;
  }>({ open: false, subject: '' });
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [preferredDay, setPreferredDay] = useState('');
  const [selectedDoctorOrService, setSelectedDoctorOrService] = useState('');
  const [submittedWhatsappUrl, setSubmittedWhatsappUrl] = useState<string | null>(null);

  const doctors = useMemo(
    () =>
      clinic
        ? db.doctors
            .filter((d) => d.clinicId === clinic.id && d.published)
            .sort((a, b) => a.order - b.order)
        : [],
    [clinic, db.doctors]
  );

  const allServices = useMemo(
    () =>
      clinic
        ? db.services
            .filter((s) => s.clinicId === clinic.id && s.published)
            .sort((a, b) => a.order - b.order)
        : [],
    [clinic, db.services]
  );

  const serviceCategories = useMemo(() => {
    const map = new Map<string, string>();
    allServices.forEach((srv) => {
      const key = srv.category.en.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, srv.category[locale]);
      }
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [allServices, locale]);

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    return allServices.filter((srv) => {
      const catKey = srv.category.en.trim().toLowerCase();
      if (selectedServiceCat !== 'all' && catKey !== selectedServiceCat) return false;
      if (!q) return true;
      return (
        srv.name.ar.toLowerCase().includes(q) ||
        srv.name.en.toLowerCase().includes(q) ||
        srv.category.ar.toLowerCase().includes(q) ||
        srv.category.en.toLowerCase().includes(q) ||
        srv.description.ar.toLowerCase().includes(q) ||
        srv.description.en.toLowerCase().includes(q)
      );
    });
  }, [allServices, selectedServiceCat, serviceSearch]);

  if (!clinic) {
    return (
      <LayoutResolver pageWorld="clinics-teal">
        <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {locale === 'ar' ? 'صفحة العيادة غير موجودة' : 'Clinic Landing Page Not Found'}
          </h1>
          <button
            type="button"
            onClick={() => navigate(`/${locale}/clinics`)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#0D9488] text-white cursor-pointer"
          >
            {locale === 'ar' ? 'العودة إلى دليل العيادات' : 'Back to Clinics Directory'}
          </button>
        </div>
      </LayoutResolver>
    );
  }

  const accent = clinic.themeColor || '#0D9488';
  const gallery =
    clinic.galleryImages && clinic.galleryImages.length > 0
      ? clinic.galleryImages
      : [clinic.coverImage];

  const handleCopyStandaloneUrl = () => {
    const url = `${window.location.origin}/${locale}/clinics/${clinic.slug}?standalone=1`;
    navigator.clipboard?.writeText(url);
    showToast(
      locale === 'ar'
        ? 'تم نسخ الرابط المستقل للعيادة (بدون قوائم الموقع العام)'
        : 'Standalone Clinic URL copied to clipboard',
      'success'
    );
  };

  const buildWhatsAppUrl = (subjectText: string) => {
    const lines =
      locale === 'ar'
        ? [
            `مرحباً، أرغب في حجز موعد في ${clinic.name.ar}`,
            subjectText ? `الطبيب / الخدمة المطلوبة: ${subjectText}` : '',
            patientName ? `اسم المريض: ${patientName}` : '',
            patientPhone ? `رقم الهاتف: ${patientPhone}` : '',
            preferredDay ? `الموعد المفضل: ${preferredDay}` : '',
          ]
        : [
            `Hello, I would like to book an appointment at ${clinic.name.en}`,
            subjectText ? `Doctor / Service: ${subjectText}` : '',
            patientName ? `Patient Name: ${patientName}` : '',
            patientPhone ? `Phone: ${patientPhone}` : '',
            preferredDay ? `Preferred Day/Time: ${preferredDay}` : '',
          ];

    const baseWa = clinic.whatsapp.split('?')[0] || 'https://wa.me/Ahmed0soliman';
    return `${baseWa}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`;
  };

  const handleBookingSubmit = (subjectText: string) => {
    const url = buildWhatsAppUrl(subjectText);
    setSubmittedWhatsappUrl(url);
    setBookingModal({ open: false, subject: '' });
    showToast(
      locale === 'ar'
        ? 'تم تجهيز رسالة الحجز، اضغط على زر التأكيد للفتح عبر واتساب.'
        : 'Booking request prepared. Tap below to open WhatsApp.',
      'success'
    );
  };

  return (
    <LayoutResolver
      pageWorld="clinics-teal"
      forceStandalone={clinic.standaloneByDefault}
      standaloneShowVisitorHeader
      standaloneAccentColor={accent}
      standaloneTitle={clinic.name[locale]}
      standaloneSubtitle={clinic.specialtyBadge[locale]}
      standaloneLogoUrl={clinic.logoUrl}
      standaloneCtaLabel={locale === 'ar' ? 'احجز موعدك الآن' : 'Book Appointment'}
      standaloneCtaHref={clinic.whatsapp}
      onStandaloneCtaClick={() =>
        setBookingModal({
          open: true,
          subject: clinic.name[locale],
        })
      }
      adminQuickEditPath="/admin/clinics"
    >
      <SEOHead
        locale={locale}
        seo={clinic.seo}
        fallbackTitle={`${clinic.name[locale]} | ${
          locale === 'ar' ? 'الأطباء والخدمات والأسعار والحجز' : 'Doctors, Services & Booking'
        }`}
        fallbackDescription={clinic.tagline[locale]}
        pathname={`/${locale}/clinics/${clinic.slug}`}
        structuredDataPayload={{
          '@context': 'https://schema.org',
          '@type': 'MedicalClinic',
          name: clinic.name[locale],
          description: clinic.description[locale],
          telephone: clinic.phone || undefined,
          address: {
            '@type': 'PostalAddress',
            streetAddress: clinic.address[locale],
            addressLocality: clinic.city[locale],
            addressCountry: 'EG',
          },
        }}
      />

      <div className="min-h-screen bg-[#F7FBFA] text-slate-900">
        {/* ================================================================= */}
        {/* 1 & 2. CLINIC HERO + BRAND LOGO & IDENTITY                        */}
        {/* ================================================================= */}
        <section
          className="py-12 lg:py-18 px-4 sm:px-8 border-b"
          style={{
            borderColor: `${accent}24`,
            background: `linear-gradient(180deg, ${accent}14 0%, #FFFFFF 100%)`,
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left/Start 7 Cols: Brand Lockup, Name, Tagline & Primary CTAs */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  {clinic.logoUrl && (
                    <div
                      className="w-14 h-14 rounded-2xl bg-white p-1.5 border shadow-sm shrink-0"
                      style={{ borderColor: `${accent}35` }}
                    >
                      <img
                        src={clinic.logoUrl}
                        alt={clinic.name[locale]}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      style={{ backgroundColor: accent }}
                      className="px-3 py-1 rounded-lg font-bold text-white inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{clinic.specialtyBadge[locale]}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold">
                      <MapPin className="w-3.5 h-3.5" style={{ color: accent }} />
                      <span>{clinic.city[locale]}</span>
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.16]">
                  {clinic.name[locale]}
                </h1>

                {clinic.tagline?.[locale] && (
                  <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-medium">
                    {clinic.tagline[locale]}
                  </p>
                )}

                {/* Primary Booking, Call, Telegram & Standalone Share Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBookingModal({
                        open: true,
                        subject: clinic.name[locale],
                      })
                    }
                    style={{ backgroundColor: accent }}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.97] transition-all whitespace-nowrap shrink-0 shadow-md cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>
                      {locale === 'ar'
                        ? 'احجز موعدك الآن عبر واتساب'
                        : 'Book Appointment via WhatsApp'}
                    </span>
                  </button>

                  {clinic.phone && (
                    <a
                      href={`tel:${clinic.phone}`}
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-white border border-slate-300 text-slate-900 hover:border-slate-500 transition-colors whitespace-nowrap shrink-0 font-mono-tabular shadow-2xs"
                    >
                      <Phone className="w-4 h-4" style={{ color: accent }} />
                      <span>{clinic.phone}</span>
                    </a>
                  )}

                  {clinic.telegramUrl && (
                    <a
                      href={clinic.telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-800 hover:border-slate-500 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                    >
                      <Send className="w-4 h-4" style={{ color: accent }} />
                      <span>{locale === 'ar' ? 'بوت الحجز الآلي' : 'Booking Bot'}</span>
                    </a>
                  )}

                  {adminSession && (
                    <button
                      type="button"
                      onClick={handleCopyStandaloneUrl}
                      className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" style={{ color: accent }} />
                      <span>
                        {locale === 'ar' ? 'نسخ رابط العيادة المستقل' : 'Copy Standalone URL'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right/End 5 Cols: Reception Visual Showcase */}
              <div className="lg:col-span-5">
                <div
                  className="rounded-3xl overflow-hidden border bg-white p-2 shadow-lg"
                  style={{ borderColor: `${accent}30` }}
                >
                  <div className="rounded-2xl overflow-hidden bg-slate-900 h-64 sm:h-72 relative">
                    <OptimizedImage
                      src={gallery[0]}
                      alt={clinic.name[locale]}
                      priority
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3.5 start-4 end-4 flex items-center justify-between gap-2 text-xs text-white">
                      <span className="font-bold truncate">{clinic.name[locale]}</span>
                      <span className="font-mono-tabular opacity-90 shrink-0">{clinic.city[locale]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. ABOUT THE MEDICAL CENTER                                       */}
        {/* ================================================================= */}
        <section className="py-12 lg:py-16 px-4 sm:px-8 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                {locale === 'ar' ? '01. نبذة عن المركز' : '01. About the Center'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                {locale === 'ar' ? `عن ${clinic.name.ar}` : `About ${clinic.name.en}`}
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-[1.85]">
                {clinic.description[locale]}
              </p>
            </div>

            {clinic.highlights?.[locale] && clinic.highlights[locale].length > 0 && (
              <div
                className="lg:col-span-5 rounded-2xl p-6 border space-y-3"
                style={{ backgroundColor: `${accent}08`, borderColor: `${accent}25` }}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {locale === 'ar' ? 'مرتكزات الرعاية بالمركز' : 'Care Standards & Highlights'}
                </div>
                <ul className="space-y-2.5">
                  {clinic.highlights[locale].map((hl, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. SPECIALTIES & DEPARTMENTS OVERVIEW                             */}
        {/* ================================================================= */}
        {serviceCategories.length > 0 && (
          <section className="py-10 lg:py-12 px-4 sm:px-8 bg-[#F7FBFA] border-b border-slate-200/80">
            <div className="max-w-7xl mx-auto space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                    {locale === 'ar' ? '02. التخصصات والأقسام' : '02. Medical Specialties'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1">
                    {locale === 'ar'
                      ? 'التخصصات الطبية المتاحة بالمركز'
                      : 'Available Departments & Specialties'}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {serviceCategories.map((cat) => {
                  const countInCat = allServices.filter(
                    (s) => s.category.en.trim().toLowerCase() === cat.key
                  ).length;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setSelectedServiceCat(cat.key);
                        document.getElementById('clinic-pricing')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }}
                      className="text-start p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 transition-all shadow-2xs cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: accent }}
                        >
                          <Stethoscope className="w-4 h-4" />
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {cat.label}
                        </span>
                      </div>
                      <span className="font-mono-tabular text-xs font-bold text-slate-500 shrink-0">
                        {countInCat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* 5. DOCTORS & SPECIALISTS                                          */}
        {/* ================================================================= */}
        <section className="py-12 lg:py-18 px-4 sm:px-8 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                  {locale === 'ar'
                    ? '03. الفريق الطبي والاستشاريون'
                    : '03. Medical Team & Specialists'}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  {locale === 'ar'
                    ? 'الأطباء ومواعيد التواجد'
                    : 'Physicians & Consultation Schedules'}
                </h2>
              </div>
              {doctors.length > 0 && (
                <div className="text-xs text-slate-600 font-mono-tabular font-semibold">
                  {doctors.length} {locale === 'ar' ? 'أطباء متاحون للحجز' : 'Available Physicians'}
                </div>
              )}
            </div>

            {doctors.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-600">
                {locale === 'ar'
                  ? 'سيتم نشر قائمة الأطباء المعتمدين لهذا المركز قريباً.'
                  : 'Confirmed physician schedules for this clinic will be published soon.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl bg-[#FCFEFE] border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-6 flex flex-col justify-between gap-5 shadow-2xs"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-14 h-14 rounded-xl overflow-hidden border bg-white p-1.5 shrink-0"
                          style={{ borderColor: `${accent}35` }}
                        >
                          <OptimizedImage
                            src={doc.photoUrl}
                            alt={doc.name[locale]}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate" style={{ color: accent }}>
                            {doc.specialty[locale]}
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold text-slate-950 truncate">
                            {doc.name[locale]}
                          </h3>
                          <div className="text-xs text-slate-600 truncate">
                            {doc.title[locale]}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {doc.bio[locale]}
                      </p>

                      {doc.qualifications?.[locale]?.length > 0 && (
                        <div className="text-xs text-slate-500 leading-relaxed">
                          {doc.qualifications[locale].join(' · ')}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 inline-flex items-center gap-1.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                          <span className="truncate">{doc.scheduleSummary[locale]}</span>
                        </span>
                        <span className="font-mono-tabular font-extrabold text-slate-950 shrink-0">
                          {doc.consultationFee} {doc.currency}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setBookingModal({
                            open: true,
                            subject: `${doc.name[locale]} (${doc.specialty[locale]})`,
                          })
                        }
                        style={{ backgroundColor: accent }}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        {locale === 'ar'
                          ? `احجز موعداً مع ${doc.name.ar}`
                          : `Book with ${doc.name.en}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. SERVICES & TRANSPARENT PRICING TABLE                           */}
        {/* ================================================================= */}
        <section id="clinic-pricing" className="py-12 lg:py-18 px-4 sm:px-8 bg-[#F7FBFA] border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto space-y-7">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                  {locale === 'ar'
                    ? '04. الأسعار والخدمات الطبية المعلنة'
                    : '04. Published Services & Fee Schedule'}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  {locale === 'ar'
                    ? 'الخدمات الطبية والأسعار'
                    : 'Services & Transparent Pricing'}
                </h2>
              </div>

              {allServices.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {serviceCategories.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedServiceCat('all')}
                        style={
                          selectedServiceCat === 'all' ? { backgroundColor: accent } : undefined
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          selectedServiceCat === 'all'
                            ? 'text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {locale === 'ar' ? 'الكل' : 'All'}
                      </button>
                      {serviceCategories.map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setSelectedServiceCat(cat.key)}
                          style={
                            selectedServiceCat === cat.key
                              ? { backgroundColor: accent }
                              : undefined
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            selectedServiceCat === cat.key
                              ? 'text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder={
                        locale === 'ar' ? 'ابحث في الخدمات...' : 'Search services...'
                      }
                      className="w-full ps-9 pe-3 py-2 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {allServices.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-600">
                {locale === 'ar'
                  ? 'لم يتم إدراج قائمة خدمات مسعّرة لهذه العيادة بعد، يمكنك الاستفسار مباشرة عبر واتساب.'
                  : 'No fee schedule is currently published for this clinic. Please contact us via WhatsApp.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-start border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                      <th className="py-3.5 px-5 text-start font-bold">
                        {locale === 'ar' ? 'الخدمة الطبية' : 'Medical Service'}
                      </th>
                      <th className="py-3.5 px-5 text-start font-bold">
                        {locale === 'ar' ? 'القسم' : 'Department'}
                      </th>
                      <th className="py-3.5 px-5 text-end font-bold">
                        {locale === 'ar' ? 'المدة' : 'Duration'}
                      </th>
                      <th className="py-3.5 px-5 text-end font-bold">
                        {locale === 'ar' ? 'السعر' : 'Fee'}
                      </th>
                      <th className="py-3.5 px-5 text-end font-bold">
                        {locale === 'ar' ? 'الحجز' : 'Book'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredServices.map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-950">{srv.name[locale]}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {srv.description[locale]}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-xs text-slate-700 whitespace-nowrap">
                          {srv.category[locale]}
                        </td>
                        <td className="py-4 px-5 text-end font-mono-tabular text-xs text-slate-600 whitespace-nowrap">
                          {srv.durationMinutes} {locale === 'ar' ? 'دقيقة' : 'min'}
                        </td>
                        <td
                          style={{ color: accent }}
                          className="py-4 px-5 text-end font-mono-tabular font-extrabold whitespace-nowrap"
                        >
                          {srv.price} {srv.currency}
                        </td>
                        <td className="py-4 px-5 text-end whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              setBookingModal({
                                open: true,
                                subject: `${srv.name[locale]} (${srv.price} ${srv.currency})`,
                              })
                            }
                            style={{ backgroundColor: accent }}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer"
                          >
                            {locale === 'ar' ? 'احجز' : 'Book'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 7 & 8. WORKING HOURS + ADDRESS & INTERACTIVE MAP                  */}
        {/* ================================================================= */}
        <section className="py-12 lg:py-18 px-4 sm:px-8 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 7. Official Working Hours Card */}
            <div className="lg:col-span-5 space-y-5">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                  {locale === 'ar' ? '05. مواعيد العمل الرسمية' : '05. Official Working Hours'}
                </div>
                <h2 className="text-2xl font-extrabold text-slate-950">
                  {locale === 'ar' ? 'ساعات استقبال المرضى' : 'Clinic Reception Hours'}
                </h2>
              </div>

              {clinic.workingHours && clinic.workingHours.length > 0 ? (
                <div
                  className="rounded-2xl border p-5 sm:p-6 space-y-3"
                  style={{ backgroundColor: `${accent}08`, borderColor: `${accent}25` }}
                >
                  {clinic.workingHours.map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0 border-slate-200/70 text-xs sm:text-sm"
                    >
                      <span className="font-semibold text-slate-800">{slot.days[locale]}</span>
                      <span
                        style={slot.isOpen ? { color: accent } : undefined}
                        className={`font-mono-tabular ${
                          slot.isOpen ? 'font-bold' : 'text-slate-400'
                        }`}
                      >
                        {slot.hours[locale]}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs sm:text-sm text-slate-600">
                  {locale === 'ar'
                    ? 'يرجى التواصل عبر واتساب لتأكيد مواعيد الكشف المتاحة.'
                    : 'Please contact us via WhatsApp to confirm available consultation times.'}
                </div>
              )}

              {/* Address Card */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <MapPin className="w-4 h-4" style={{ color: accent }} />
                  <span>{locale === 'ar' ? 'العنوان التفصيلي' : 'Clinic Address'}</span>
                </div>
                <div className="text-sm font-bold text-slate-950 leading-relaxed">
                  {clinic.address[locale]}
                </div>
                <div className="text-xs text-slate-600">{clinic.city[locale]}</div>
              </div>
            </div>

            {/* 8. Interactive Map & Center Gallery */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                  {locale === 'ar' ? '06. الموقع الجغرافي وصور المركز' : '06. Location Map & Facility'}
                </div>
                <h2 className="text-2xl font-extrabold text-slate-950">
                  {clinic.city[locale]} — {clinic.name[locale]}
                </h2>
              </div>

              {clinic.mapEmbedUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 h-64 sm:h-72 bg-slate-100 shadow-xs">
                  <iframe
                    src={clinic.mapEmbedUrl}
                    title={clinic.name[locale]}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {gallery.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gallery.slice(0, 2).map((imgUrl, gIdx) => (
                    <div
                      key={gIdx}
                      className="h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900"
                    >
                      <OptimizedImage
                        src={imgUrl}
                        alt={`${clinic.name[locale]} - ${gIdx + 1}`}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 9. DIRECT WHATSAPP, CALL & APPOINTMENT BOOKING FORM               */}
        {/* ================================================================= */}
        <section className="py-12 lg:py-18 px-4 sm:px-8 bg-[#F7FBFA]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Direct Contact Channels Box */}
            <div className="lg:col-span-5 space-y-5">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                  {locale === 'ar' ? '07. التواصل والحجز الفوري' : '07. Direct Booking & Contact'}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  {locale === 'ar'
                    ? 'احجز موعدك أو تواصل مع الاستقبال'
                    : 'Schedule Your Visit Directly'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {locale === 'ar'
                    ? 'استخدم النموذج المقابل لإرسال طلب الحجز عبر واتساب، أو تواصل مباشرة عبر القنوات المعتمدة للعيادة.'
                    : 'Submit the form to send your appointment details directly via WhatsApp, or use our direct clinic channels.'}
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href={clinic.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: accent }}
                  className="w-full p-4 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center justify-between gap-3 hover:opacity-95 transition-opacity shadow-sm"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <MessageCircle className="w-5 h-5" />
                    <span>
                      {locale === 'ar' ? 'حجز واستفسار عبر واتساب' : 'WhatsApp Appointment Desk'}
                    </span>
                  </span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>

                {clinic.phone && (
                  <a
                    href={`tel:${clinic.phone}`}
                    className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-between gap-3 hover:border-slate-400 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Phone className="w-4 h-4" style={{ color: accent }} />
                      <span className="font-mono-tabular">{clinic.phone}</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {locale === 'ar' ? 'اتصال مباشر' : 'Call Now'}
                    </span>
                  </a>
                )}

                {clinic.telegramUrl && (
                  <a
                    href={clinic.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-between gap-3 hover:border-slate-400 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Send className="w-4 h-4" style={{ color: accent }} />
                      <span>{locale === 'ar' ? 'بوت الحجز الآلي على تليجرام' : 'Telegram Booking Bot'}</span>
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                  </a>
                )}
              </div>
            </div>

            {/* Direct Appointment Form */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: accent }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-950">
                      {locale === 'ar'
                        ? 'نموذج حجز موعد مباشر'
                        : 'Direct Appointment Booking Form'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {locale === 'ar'
                        ? 'أدخل بياناتك ليتم تجهيز رسالة الحجز مباشرة إلى استقبال العيادة'
                        : 'Enter your details to prepare an instant booking request for the clinic reception'}
                    </p>
                  </div>
                </div>

                {submittedWhatsappUrl && (
                  <div
                    className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ backgroundColor: `${accent}10`, borderColor: `${accent}40` }}
                  >
                    <div className="text-xs font-bold text-slate-900">
                      {locale === 'ar'
                        ? 'رسالة الحجز جاهزة الإرسال الآن عبر واتساب:'
                        : 'Your WhatsApp booking message is ready:'}
                    </div>
                    <a
                      href={submittedWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: accent }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-95 shrink-0"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{locale === 'ar' ? 'فتح واتساب وتأكيد الحجز' : 'Open WhatsApp Now'}</span>
                    </a>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBookingSubmit(selectedDoctorOrService || clinic.name[locale]);
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      {locale === 'ar' ? 'اسم المريض بالكامل *' : 'Patient Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder={locale === 'ar' ? 'الاسم الثلاثي' : 'Full Name'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      {locale === 'ar' ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp Number *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-mono-tabular focus:border-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      {locale === 'ar' ? 'الطبيب أو الخدمة المطلوبة' : 'Select Doctor or Service'}
                    </label>
                    <select
                      value={selectedDoctorOrService}
                      onChange={(e) => setSelectedDoctorOrService(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:border-slate-500 focus:outline-none"
                    >
                      <option value="">
                        {locale === 'ar' ? 'كشف عام / استشارة' : 'General Consultation'}
                      </option>
                      {doctors.map((d) => (
                        <option key={d.id} value={`${d.name[locale]} - ${d.specialty[locale]}`}>
                          {d.name[locale]} ({d.specialty[locale]})
                        </option>
                      ))}
                      {allServices.map((s) => (
                        <option key={s.id} value={`${s.name[locale]} (${s.price} ${s.currency})`}>
                          {s.name[locale]} — {s.price} {s.currency}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      {locale === 'ar' ? 'اليوم أو الفترة المفضلة' : 'Preferred Day / Time'}
                    </label>
                    <input
                      type="text"
                      value={preferredDay}
                      onChange={(e) => setPreferredDay(e.target.value)}
                      placeholder={locale === 'ar' ? 'مثال: غداً مساءً' : 'e.g. Tomorrow evening'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-1">
                    <button
                      type="submit"
                      style={{ backgroundColor: accent }}
                      className="w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {locale === 'ar'
                          ? 'تجهيز طلب الحجز وإرسال عبر واتساب'
                          : 'Prepare Booking Request via WhatsApp'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 10. DEDICATED CLINIC-OWNED FOOTER (Zero external platform links)  */}
        {/* ================================================================= */}
        <footer className="bg-slate-950 text-white py-10 px-4 sm:px-8 border-t border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3.5">
              {clinic.logoUrl && (
                <img
                  src={clinic.logoUrl}
                  alt={clinic.name[locale]}
                  className="w-11 h-11 rounded-xl object-contain bg-white p-1.5 shrink-0"
                />
              )}
              <div className="space-y-1">
                <div className="text-base font-extrabold text-white">{clinic.name[locale]}</div>
                <div className="text-xs text-slate-400">
                  {clinic.address[locale]} · {clinic.city[locale]}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {clinic.phone && (
                <a
                  href={`tel:${clinic.phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-600 font-mono-tabular"
                >
                  <Phone className="w-3.5 h-3.5" style={{ color: accent }} />
                  <span>{clinic.phone}</span>
                </a>
              )}
              <a
                href={clinic.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: accent }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold hover:opacity-95"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'واتساب العيادة' : 'Clinic WhatsApp'}</span>
              </a>
              {clinic.telegramUrl && (
                <a
                  href={clinic.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-600"
                >
                  <Send className="w-3.5 h-3.5" style={{ color: accent }} />
                  <span>{locale === 'ar' ? 'بوت الحجز' : 'Telegram'}</span>
                </a>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* Interactive WhatsApp Booking Modal */}
      {bookingModal.open && (
        <div
          onClick={() => setBookingModal({ open: false, subject: '' })}
          className="fixed inset-0 z-[9995] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl text-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <div>
                <h3 className="text-base font-extrabold text-slate-950">
                  {locale === 'ar' ? 'طلب حجز موعد سريع' : 'Quick Appointment Booking'}
                </h3>
                <p className="text-xs font-semibold mt-0.5" style={{ color: accent }}>
                  {bookingModal.subject}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingModal({ open: false, subject: '' })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'اسم المريض' : 'Patient Name'}
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={locale === 'ar' ? 'الاسم الثلاثي' : 'Full Name'}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'رقم الهاتف للتأكيد' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'ar' ? 'اليوم أو الفترة المفضلة' : 'Preferred Day / Time'}
                </label>
                <input
                  type="text"
                  value={preferredDay}
                  onChange={(e) => setPreferredDay(e.target.value)}
                  placeholder={locale === 'ar' ? 'مثال: السبت مساءً' : 'e.g. Saturday evening'}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none"
                />
              </div>
              <a
                href={buildWhatsAppUrl(bookingModal.subject || clinic.name[locale])}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setBookingModal({ open: false, subject: '' })}
                style={{ backgroundColor: accent }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-bold text-white hover:opacity-95 transition-opacity shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {locale === 'ar'
                    ? 'إرسال طلب الحجز عبر واتساب'
                    : 'Send Booking via WhatsApp'}
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </LayoutResolver>
  );
};
