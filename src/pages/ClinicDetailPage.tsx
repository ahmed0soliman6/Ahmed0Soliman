import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { OptimizedImage } from '../components/common/OptimizedImage';
import {
  Stethoscope,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Send,
  Check,
  Search,
  Share2,
  Calendar,
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

  const doctors = db.doctors.filter((d) => d.clinicId === clinic.id && d.published);
  const allServices = db.services.filter((s) => s.clinicId === clinic.id && s.published);

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

  const handleConfirmBookingWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const lines =
      locale === 'ar'
        ? [
            `مرحباً، أرغب في حجز موعد في ${clinic.name.ar}`,
            bookingModal.subject ? `الطبيب / الخدمة المطلوبة: ${bookingModal.subject}` : '',
            patientName ? `اسم المريض: ${patientName}` : '',
            patientPhone ? `رقم الهاتف: ${patientPhone}` : '',
            preferredDay ? `الموعد المفضل: ${preferredDay}` : '',
          ]
        : [
            `Hello, I would like to book an appointment at ${clinic.name.en}`,
            bookingModal.subject ? `Doctor / Service: ${bookingModal.subject}` : '',
            patientName ? `Patient Name: ${patientName}` : '',
            patientPhone ? `Phone: ${patientPhone}` : '',
            preferredDay ? `Preferred Day/Time: ${preferredDay}` : '',
          ];

    const baseWa = clinic.whatsapp.split('?')[0] || 'https://wa.me/Ahmed0soliman';
    const targetUrl = `${baseWa}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`;
    setBookingModal({ open: false, subject: '' });
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <LayoutResolver
      forceStandalone={clinic.standaloneByDefault}
      standaloneContext={{
        title: clinic.name[locale],
        whatsappUrl: clinic.whatsapp,
        phone: clinic.phone,
        ctaLabel: locale === 'ar' ? 'احجز موعدك الآن' : 'Book Appointment',
      }}
      adminQuickEditPath="/admin/clinics"
    >
      <SEOHead
        locale={locale}
        seo={clinic.seo}
        fallbackTitle={`${clinic.name[locale]} | ${
          locale === 'ar' ? 'الأطباء والخدمات والأسعار' : 'Doctors, Services & Booking'
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

      {/* 1. MEDICAL CLINIC HERO BANNER */}
      <section className="py-12 lg:py-20 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1324]/60">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="text-[#00C2CB] font-semibold">
                  {clinic.specialtyBadge[locale]}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#00C2CB]" />
                  {clinic.city[locale]}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                {clinic.name[locale]}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {clinic.description[locale]}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {(clinic.highlights[locale] || []).map((hl, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                  >
                    <Check className="w-4 h-4 text-[#00C2CB] shrink-0 mt-0.5" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>

              {/* Primary Booking Actions */}
              <div className="flex flex-wrap items-center gap-3.5 pt-4">
                <button
                  onClick={() =>
                    setBookingModal({
                      open: true,
                      subject: clinic.name[locale],
                    })
                  }
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors whitespace-nowrap shrink-0"
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    {locale === 'ar'
                      ? 'احجز موعدك الآن عبر واتساب'
                      : 'Book Appointment via WhatsApp'}
                  </span>
                </button>

                {clinic.telegramUrl && (
                  <a
                    href={clinic.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="w-4 h-4 text-[#00C2CB]" />
                    <span>
                      {locale === 'ar' ? 'الحجز عبر بوت تليجرام' : 'Book via Telegram Bot'}
                    </span>
                  </a>
                )}

                <button
                  onClick={handleCopyStandaloneUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-3.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#00C2CB] transition-colors whitespace-nowrap shrink-0"
                >
                  <Share2 className="w-4 h-4 text-[#00C2CB]" />
                  <span>
                    {locale === 'ar'
                      ? 'نسخ رابط العرض المستقل للعيادة'
                      : 'Copy Standalone Clinic Link'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right 4 Cols: Working Hours & Quick Contact Card */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#070E1A] border border-slate-700 p-1.5 shrink-0">
                    <OptimizedImage
                      src={clinic.logoUrl || clinic.coverImage}
                      alt={clinic.name[locale]}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {locale === 'ar' ? 'مواعيد العمل والتواصل' : 'Working Hours & Contact'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {clinic.address[locale]}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(clinic.workingHours || []).map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between gap-2 text-xs sm:text-sm"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {slot.days[locale]}
                      </span>
                      <span
                        className={`font-mono-tabular ${
                          slot.isOpen
                            ? 'text-[#00C2CB] font-semibold'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {slot.hours[locale]}
                      </span>
                    </div>
                  ))}
                </div>

                {clinic.phone && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {locale === 'ar' ? 'هاتف الاستعلام:' : 'Clinic Phone:'}
                    </span>
                    <a
                      href={`tel:${clinic.phone}`}
                      className="font-mono-tabular font-semibold text-slate-900 dark:text-white hover:text-[#00C2CB] inline-flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#00C2CB]" />
                      <span>{clinic.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DOCTORS & SPECIALISTS SECTION */}
      <section className="py-14 lg:py-20 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#00C2CB]">
              {locale === 'ar' ? '01. الفريق الطبي والاستشاريون' : '01. Medical Team & Specialists'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {locale === 'ar' ? 'الأطباء والتخصصات ومواعيد العيادات' : 'Physicians, Specialties & Schedules'}
            </h2>
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
                  className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-5"
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
                        <div className="text-xs font-semibold text-[#00C2CB]">
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
                        <Clock className="w-3.5 h-3.5 text-[#00C2CB]" />
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
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors"
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
      <section className="py-14 lg:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#00C2CB]">
                {locale === 'ar'
                  ? '02. دليل الخدمات الطبية والأسعار'
                  : '02. Medical Services & Transparent Fee Schedule'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
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
                className="w-full ps-9 pe-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 focus:border-[#00C2CB] focus:outline-none"
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
                    <td className="py-4 px-5 text-end font-mono-tabular font-bold text-[#00C2CB] whitespace-nowrap">
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
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00C2CB]/15 text-[#00C2CB] hover:bg-[#00C2CB] hover:text-slate-950 transition-colors"
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
                <p className="text-xs text-[#00C2CB] mt-0.5">{bookingModal.subject}</p>
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
                  className="w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 focus:border-[#00C2CB] focus:outline-none"
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
                  className="w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 focus:border-[#00C2CB] focus:outline-none font-mono-tabular"
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
                  className="w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 focus:border-[#00C2CB] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-semibold bg-[#00C2CB] text-slate-950 hover:bg-[#0099A3] transition-colors"
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
