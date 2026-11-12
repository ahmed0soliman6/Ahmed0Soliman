import React, { useState } from 'react';
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
  X,
} from 'lucide-react';

interface ClinicDetailPageProps {
  slug: string;
}

export const ClinicDetailPage: React.FC<ClinicDetailPageProps> = ({ slug }) => {
  const { locale, navigate, db, showToast } = usePlatform();

  const clinic = db.clinics.find((c) => c.slug === slug || c.id === slug);
  const [serviceSearch, setServiceSearch] = useState('');
  const [bookingModal, setBookingModal] = useState<{
    open: boolean;
    subject: string;
  }>({ open: false, subject: '' });
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [preferredDay, setPreferredDay] = useState('');
  const [selectedDoctorOrService, setSelectedDoctorOrService] = useState('');

  if (!clinic) {
    return (
      <LayoutResolver>
        <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {locale === 'ar' ? 'صفحة العيادة غير موجودة' : 'Clinic Landing Page Not Found'}
          </h1>
          <button
            onClick={() => navigate(`/${locale}/clinics`)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950"
          >
            {locale === 'ar' ? 'العودة إلى دليل العيادات' : 'Back to Clinics'}
          </button>
        </div>
      </LayoutResolver>
    );
  }

  const accent = clinic.themeColor || '#0D9488';
  const doctors = db.doctors.filter((d) => d.clinicId === clinic.id && d.published);
  const allServices = db.services.filter((s) => s.clinicId === clinic.id && s.published);
  const gallery =
    clinic.galleryImages && clinic.galleryImages.length > 0
      ? clinic.galleryImages
      : [clinic.coverImage];

  const filteredServices = allServices.filter((srv) => {
    if (!serviceSearch.trim()) return true;
    const q = serviceSearch.toLowerCase();
    return (
      srv.name.ar.toLowerCase().includes(q) ||
      srv.name.en.toLowerCase().includes(q) ||
      srv.category.ar.toLowerCase().includes(q) ||
      srv.category.en.toLowerCase().includes(q)
    );
  });

  const handleCopyStandaloneUrl = () => {
    const url = `${window.location.origin}/${locale}/clinics/${clinic.slug}?standalone=1`;
    navigator.clipboard?.writeText(url);
    showToast(
      locale === 'ar'
        ? 'تم نسخ رابط العرض المستقل للعيادة (بدون قوائم الموقع العام)'
        : 'Standalone Clinic Landing URL copied to clipboard',
      'success'
    );
  };

  const dispatchWhatsAppBooking = (subjectText: string) => {
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
    const targetUrl = `${baseWa}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`;
    setBookingModal({ open: false, subject: '' });
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmBookingWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchWhatsAppBooking(bookingModal.subject || selectedDoctorOrService || clinic.name[locale]);
  };

  return (
    <LayoutResolver
      pageWorld="clinics-teal"
      forceStandalone={clinic.standaloneByDefault}
      standaloneAccentColor={accent}
      standaloneTitle={clinic.name[locale]}
      standaloneSubtitle={clinic.specialtyBadge[locale]}
      standaloneCtaLabel={locale === 'ar' ? 'احجز موعدك الآن' : 'Book Appointment'}
      standaloneCtaHref={clinic.whatsapp}
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
          telephone: clinic.phone,
          address: {
            '@type': 'PostalAddress',
            streetAddress: clinic.address[locale],
            addressLocality: clinic.city[locale],
            addressCountry: 'EG',
          },
        }}
      />

      {/* 1. DEDICATED MEDICAL CLINIC HERO BANNER */}
      <section className="py-12 lg:py-20 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1324]/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span
                  style={{ backgroundColor: accent }}
                  className="px-3 py-1 rounded-lg font-bold text-white inline-flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{clinic.specialtyBadge[locale]}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  <MapPin className="w-3.5 h-3.5" style={{ color: accent }} />
                  {clinic.city[locale]}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                {clinic.name[locale]}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {clinic.description[locale]}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {(clinic.highlights[locale] || []).map((hl, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                  >
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>

              {/* Primary Booking & Call Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  onClick={() =>
                    setBookingModal({
                      open: true,
                      subject: clinic.name[locale],
                    })
                  }
                  style={{ backgroundColor: accent }}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 shadow-md"
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
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 transition-colors whitespace-nowrap shrink-0 font-mono-tabular"
                  >
                    <Phone className="w-4 h-4" style={{ color: accent }} />
                    <span>
                      {locale === 'ar' ? 'اتصال مباشر: ' : 'Call: '}
                      {clinic.phone}
                    </span>
                  </a>
                )}

                {clinic.telegramUrl && (
                  <a
                    href={clinic.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="w-4 h-4" style={{ color: accent }} />
                    <span>{locale === 'ar' ? 'بوت الحجز الآلي' : 'Telegram Bot'}</span>
                  </a>
                )}

                <button
                  onClick={handleCopyStandaloneUrl}
                  className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-teal-500 transition-colors whitespace-nowrap shrink-0"
                >
                  <Share2 className="w-4 h-4" style={{ color: accent }} />
                  <span>
                    {locale === 'ar' ? 'نسخ رابط العيادة المستقل' : 'Copy Standalone URL'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right 5 Cols: Center Reception Photo + Working Hours Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#070E1A] h-56 sm:h-64 relative">
                <OptimizedImage
                  src={gallery[0]}
                  alt={clinic.name[locale]}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070E1A]/85 via-transparent to-transparent" />
                <div className="absolute bottom-3 start-4 end-4 flex items-center justify-between text-xs text-white">
                  <span className="font-bold">{clinic.name[locale]}</span>
                  <span className="font-mono-tabular opacity-90">{clinic.city[locale]}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4" style={{ color: accent }} />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {locale === 'ar' ? 'مواعيد العمل الرسمية' : 'Official Working Hours'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{clinic.city[locale]}</span>
                </div>

                <div className="space-y-2.5">
                  {(clinic.workingHours || []).map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between gap-2 text-xs sm:text-sm"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {slot.days[locale]}
                      </span>
                      <span
                        style={slot.isOpen ? { color: accent } : undefined}
                        className={`font-mono-tabular ${
                          slot.isOpen
                            ? 'font-bold'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {slot.hours[locale]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DOCTORS & SPECIALISTS SECTION */}
      <section className="py-14 lg:py-20 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                {locale === 'ar'
                  ? '01. الفريق الطبي والاستشاريون'
                  : '01. Medical Team & Specialists'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'الأطباء والتخصصات ومواعيد العيادات'
                  : 'Physicians, Specialties & Schedules'}
              </h2>
            </div>
            <div className="text-xs text-slate-500 font-mono-tabular">
              {doctors.length} {locale === 'ar' ? 'أطباء متاحون للحجز' : 'Available Physicians'}
            </div>
          </div>

          {doctors.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
              {locale === 'ar'
                ? 'سيتم إضافة جدول الأطباء قريباً.'
                : 'Doctor schedules will be listed soon.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-5 shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-[#070E1A] p-1.5 shrink-0">
                        <OptimizedImage
                          src={doc.photoUrl}
                          alt={doc.name[locale]}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold" style={{ color: accent }}>
                          {doc.specialty[locale]}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {doc.name[locale]}
                        </h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {doc.title[locale]}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {doc.bio[locale]}
                    </p>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {(doc.qualifications[locale] || []).join(' · ')}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" style={{ color: accent }} />
                        {doc.scheduleSummary[locale]}
                      </span>
                      <span className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                        {doc.consultationFee} {doc.currency}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setBookingModal({
                          open: true,
                          subject: `${doc.name[locale]} (${doc.specialty[locale]})`,
                        })
                      }
                      style={{ backgroundColor: accent }}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white hover:opacity-95 transition-opacity"
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

      {/* 3. SERVICES & TRANSPARENT PRICING TABLE (Tabular Numerals) */}
      <section className="py-14 lg:py-20 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                {locale === 'ar'
                  ? '02. دليل الخدمات الطبية والأسعار'
                  : '02. Medical Services & Transparent Fee Schedule'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {locale === 'ar'
                  ? 'الخدمات والأسعار المعلنة'
                  : 'Published Services & Consultation Rates'}
              </h2>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder={
                  locale === 'ar' ? 'ابحث عن خدمة أو كشف...' : 'Search services or procedures...'
                }
                className="w-full ps-9 pe-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-[#070E1A]/60 text-xs text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 px-5 text-start font-semibold">
                    {locale === 'ar' ? 'الخدمة الطبية' : 'Medical Service'}
                  </th>
                  <th className="py-3.5 px-5 text-start font-semibold">
                    {locale === 'ar' ? 'القسم / التخصص' : 'Department'}
                  </th>
                  <th className="py-3.5 px-5 text-end font-semibold">
                    {locale === 'ar' ? 'المدة التقريبية' : 'Duration'}
                  </th>
                  <th className="py-3.5 px-5 text-end font-semibold">
                    {locale === 'ar' ? 'السعر' : 'Fee'}
                  </th>
                  <th className="py-3.5 px-5 text-end font-semibold">
                    {locale === 'ar' ? 'الحجز' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {filteredServices.map((srv) => (
                  <tr
                    key={srv.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {srv.name[locale]}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {srv.description[locale]}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {srv.category[locale]}
                    </td>
                    <td className="py-4 px-5 text-end font-mono-tabular text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {srv.durationMinutes} {locale === 'ar' ? 'دقيقة' : 'min'}
                    </td>
                    <td
                      style={{ color: accent }}
                      className="py-4 px-5 text-end font-mono-tabular font-bold whitespace-nowrap"
                    >
                      {srv.price} {srv.currency}
                    </td>
                    <td className="py-4 px-5 text-end whitespace-nowrap">
                      <button
                        onClick={() =>
                          setBookingModal({
                            open: true,
                            subject: `${srv.name[locale]} (${srv.price} ${srv.currency})`,
                          })
                        }
                        style={{ backgroundColor: accent }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
                      >
                        {locale === 'ar' ? 'احجز الخدمة' : 'Book Now'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. LOCATION MAP, CENTER GALLERY & DIRECT BOOKING FORM */}
      <section className="py-14 lg:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left 7 Cols: Location Details, Map & Photo Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                {locale === 'ar'
                  ? '03. الموقع الجغرافي وصور المركز'
                  : '03. Location, Directions & Facility Gallery'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {clinic.address[locale]}
              </h2>
            </div>

            {clinic.mapEmbedUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-64 sm:h-72 bg-slate-100 dark:bg-[#0F172A]">
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
              <div className="grid grid-cols-2 gap-4">
                {gallery.slice(0, 2).map((imgUrl, gIdx) => (
                  <div
                    key={gIdx}
                    className="h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#070E1A]"
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

          {/* Right 5 Cols: Direct Appointment Booking Form */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: accent }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {locale === 'ar'
                      ? 'نموذج حجز موعد مباشر'
                      : 'Direct Appointment Booking Form'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'ar'
                      ? 'أدخل بياناتك ليتم توجيه طلبك مباشرة إلى استقبال العيادة'
                      : 'Submit your details directly to the clinic reception desk'}
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  dispatchWhatsAppBooking(selectedDoctorOrService || clinic.name[locale]);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {locale === 'ar' ? 'اسم المريض بالكامل *' : 'Patient Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={locale === 'ar' ? 'الاسم الثلاثي' : 'Full Name'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {locale === 'ar' ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 text-sm font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {locale === 'ar' ? 'الطبيب أو الخدمة المطلوبة' : 'Select Doctor or Service'}
                  </label>
                  <select
                    value={selectedDoctorOrService}
                    onChange={(e) => setSelectedDoctorOrService(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 text-sm"
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {locale === 'ar' ? 'اليوم أو الفترة المفضلة' : 'Preferred Day / Time'}
                  </label>
                  <input
                    type="text"
                    value={preferredDay}
                    onChange={(e) => setPreferredDay(e.target.value)}
                    placeholder={locale === 'ar' ? 'مثال: غداً مساءً' : 'e.g. Tomorrow evening'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  style={{ backgroundColor: accent }}
                  className="w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-bold text-white hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {locale === 'ar'
                      ? 'إرسال طلب الحجز فوراً عبر واتساب'
                      : 'Send Booking Request via WhatsApp'}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive WhatsApp Booking Modal */}
      {bookingModal.open && (
        <div
          onClick={() => setBookingModal({ open: false, subject: '' })}
          className="fixed inset-0 z-[9995] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {locale === 'ar' ? 'تأكيد طلب الحجز السريع' : 'Quick Appointment Booking'}
                </h3>
                <p className="text-xs font-semibold mt-0.5" style={{ color: accent }}>
                  {bookingModal.subject}
                </p>
              </div>
              <button
                onClick={() => setBookingModal({ open: false, subject: '' })}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBookingWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {locale === 'ar' ? 'اسم المريض *' : 'Patient Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {locale === 'ar' ? 'رقم الهاتف للتأكيد *' : 'Phone Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 focus:outline-none font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {locale === 'ar' ? 'اليوم أو الفترة المفضلة' : 'Preferred Day / Time'}
                </label>
                <input
                  type="text"
                  value={preferredDay}
                  onChange={(e) => setPreferredDay(e.target.value)}
                  placeholder={locale === 'ar' ? 'مثال: السبت مساءً' : 'e.g. Saturday evening'}
                  className="w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: accent }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-bold text-white hover:opacity-95 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {locale === 'ar'
                    ? 'إرسال طلب الحجز عبر واتساب'
                    : 'Send Booking via WhatsApp'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </LayoutResolver>
  );
};
