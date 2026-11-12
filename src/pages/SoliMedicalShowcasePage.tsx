import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import { LayoutResolver } from '../components/layouts/LayoutResolver';
import { SEOHead } from '../components/common/SEOHead';
import { validateConsultationForm } from '../lib/validationSchemas';
import {
  ArrowUpRight,
  Check,
  MessageCircle,
  Send,
  Play,
  Maximize2,
  X,
  Search,
  Bell,
  UserPlus,
  Stethoscope,
  FileText,
  CreditCard,
  Activity,
  Calendar,
} from 'lucide-react';

export const SoliMedicalShowcasePage: React.FC = () => {
  const { locale, db } = usePlatform();
  const settings = db.siteSettings;

  const soliProject =
    db.projects.find(
      (p) => p.id === 'soli-medical-single-clinic' || p.slug.includes('soli-medical')
    ) || db.projects[0];

  const [activePreviewMode, setActivePreviewMode] = useState<
    'live-ui' | 'dashboard' | 'booking' | 'emr'
  >('live-ui');
  const [activeSimSidebar, setActiveSimSidebar] = useState<
    'dashboard' | 'queue' | 'exam' | 'emr' | 'finance'
  >('dashboard');
  const [highlightedPillar, setHighlightedPillar] = useState<string>('02');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // WhatsApp Consultation Form State
  const [reqName, setReqName] = useState('');
  const [reqRole, setReqRole] = useState('');
  const [reqFacility, setReqFacility] = useState('');
  const [reqNeed, setReqNeed] = useState('');
  const [reqHoneypot, setReqHoneypot] = useState('');
  const [reqError, setReqError] = useState<string | null>(null);
  const [reqSent, setReqSent] = useState(false);

  const numberedPillars = [
    {
      num: '01',
      title: locale === 'ar' ? 'ملف ورحلة علاجية' : 'Patient File & Care Journey',
      desc:
        locale === 'ar'
          ? 'معلومات المريض والزيارات والملاحظات والوصفات في سياق عملي واحد.'
          : 'Patient demographics, visit history, clinical notes, and prescriptions in one unified context.',
    },
    {
      num: '02',
      title: locale === 'ar' ? 'تشغيل يومي مرتب' : 'Structured Daily Operations',
      desc:
        locale === 'ar'
          ? 'مسار واضح بين الاستقبال والطبيب، أو بين الأقسام والإدارة حسب الحل.'
          : 'Clear operational flow between reception and physician, or across polyclinic departments.',
    },
    {
      num: '03',
      title: locale === 'ar' ? 'مالية يمكن مراجعتها' : 'Auditable Financial Ledger',
      desc:
        locale === 'ar'
          ? 'متابعة التحصيل والمصروفات والتقارير وفق احتياج وحجم المنشأة.'
          : 'Track daily collections, expenses, doctor revenue shares, and financial reports accurately.',
    },
    {
      num: '04',
      title: locale === 'ar' ? 'عربي من البداية' : 'Arabic-First RTL by Design',
      desc:
        locale === 'ar'
          ? 'واجهة RTL ومفاهيم قريبة من طريقة عمل العيادات والمنشآت الطبية في المنطقة.'
          : 'Native RTL interface and terminology built around real Egyptian and Arab clinic workflows.',
    },
  ];

  const screenShots = {
    dashboard: {
      label: locale === 'ar' ? 'صورة لوحة التحكم' : 'Dashboard Screen',
      image: 'https://solimedical.vercel.app/assets/images/dashboard.webp',
    },
    booking: {
      label: locale === 'ar' ? 'صورة الحجوزات والطابور' : 'Queue & Booking Screen',
      image: 'https://solimedical.vercel.app/assets/images/booking.webp',
    },
    emr: {
      label: locale === 'ar' ? 'صورة الملف الطبي EMR' : 'Cloud EMR Screen',
      image: 'https://solimedical.vercel.app/assets/images/emr.webp',
    },
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);

    const validation = validateConsultationForm({
      name: reqName,
      role: reqRole,
      facilityType: reqFacility,
      message: reqNeed,
      websiteHoneypot: reqHoneypot,
    });

    if (!validation.valid) {
      setReqError(validation.errors[0]);
      return;
    }

    try {
      await fetch('/api/contact/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reqName,
          role: reqRole,
          facilityType: reqFacility,
          message: reqNeed,
          websiteHoneypot: reqHoneypot,
        }),
      });
    } catch {
      // continue to WhatsApp
    }

    const { name, role, facilityType, message } = validation.sanitized;
    const lines = [
      locale === 'ar' ? 'مرحباً، أريد طلب عرض لنظام Soli Medical:' : 'Hello, Soli Medical inquiry:',
      name ? `${locale === 'ar' ? 'الاسم' : 'Name'}: ${name}` : '',
      role ? `${locale === 'ar' ? 'الوظيفة' : 'Role'}: ${role}` : '',
      facilityType ? `${locale === 'ar' ? 'نوع المنشأة' : 'Facility'}: ${facilityType}` : '',
      `${locale === 'ar' ? 'الاحتياج' : 'Need'}: ${message}`,
    ].filter(Boolean);

    const waUrl = `https://wa.me/Ahmed0soliman?text=${encodeURIComponent(lines.join('\n'))}`;
    setReqSent(true);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <LayoutResolver pageWorld="soli-showcase" adminQuickEditPath="/admin/projects">
      <SEOHead
        locale={locale}
        seo={soliProject?.seo}
        fallbackTitle={
          locale === 'ar'
            ? 'سولي ميديكال | Soli Medical — نظامان عربيان لرعاية تتحرك معك'
            : 'Soli Medical — Two Arabic Clinical Systems Built Around Daily Care'
        }
        fallbackDescription={
          locale === 'ar'
            ? 'اختر ما يناسب حجم منشأتك: نظام واضح لإدارة عيادة الطبيب الواحد، أو منظومة تشغيل مترابطة لمجمع العيادات والمستشفيات الصغيرة.'
            : 'Choose what fits your facility: a clear system for solo clinics or an interconnected operations platform for polyclinics.'
        }
        pathname={`/${locale}/solimedical`}
      />

      {/* =================================================================== */}
      {/* EXACT SOLIMEDICAL.VERCEL.APP/SOLIMEDICAL OBSIDIAN-TEAL & CYAN WORLD  */}
      {/* =================================================================== */}
      <div className="bg-[#060a12] text-[#F0F9FF] relative overflow-hidden">
        <div className="soli-glow" aria-hidden="true" />
        <div className="soli-grain" aria-hidden="true" />

        {/* ================================================================= */}
        {/* 1. CENTERED HERO SECTION + ECG PULSE LINE + LIVE DASHBOARD FRAME  */}
        {/* ================================================================= */}
        <section className="relative pt-14 pb-20 lg:pt-20 lg:pb-28 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto text-center space-y-7">
            {/* Top Teal Kicker */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-xs sm:text-sm font-bold text-[#14B8A6] tracking-wide"
            >
              {locale === 'ar'
                ? 'من يوميات العيادة إلى قرار إداري أوضح'
                : 'From Daily Clinic Workflows to Clearer Executive Decisions'}
            </motion.div>

            {/* Giant 3-Line White-to-Aqua-Cyan Gradient Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-4xl sm:text-6xl lg:text-[4.4rem] font-black tracking-tight leading-[1.15]"
            >
              {locale === 'ar' ? (
                <>
                  <span className="block text-white">نظامان عربيان</span>
                  <span className="block bg-gradient-to-l from-[#E0F2FE] via-[#38BDF8] to-[#00D4FF] bg-clip-text text-transparent">
                    لرعاية تتحرك
                  </span>
                  <span className="block bg-gradient-to-l from-[#38BDF8] to-[#22D3EE] bg-clip-text text-transparent">
                    معك.
                  </span>
                </>
              ) : (
                <>
                  <span className="block text-white">Two Clinical Systems</span>
                  <span className="block bg-gradient-to-r from-[#E0F2FE] via-[#38BDF8] to-[#00D4FF] bg-clip-text text-transparent">
                    Engineered Around
                  </span>
                  <span className="block bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] bg-clip-text text-transparent">
                    Your Care.
                  </span>
                </>
              )}
            </motion.h1>

            {/* Centered Subtitle */}
            <p className="text-sm sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-[1.85]">
              {locale === 'ar'
                ? 'اختر ما يناسب حجم منشأتك: نظام واضح لإدارة عيادة الطبيب الواحد، أو منظومة تشغيل مترابطة لمجمع العيادات والمستشفيات الصغيرة. كلاهما يبدأ من واقع العمل الطبي اليومي، لا من قوائم معقدة.'
                : 'Choose what fits your healthcare facility: a streamlined system for single-doctor clinics, or an interconnected operations platform for polyclinics and small hospitals.'}
            </p>

            {/* Dual Pill CTA Buttons (Exact Cyan Glow Pill + Dark Glass Pill) */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a
                href="#request"
                className="px-8 py-3.5 rounded-full text-sm font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 shadow-[0_0_30px_rgba(0,212,255,0.45)] hover:shadow-[0_0_40px_rgba(0,212,255,0.7)] transition-all"
              >
                {locale === 'ar' ? 'اطلب العرض المناسب' : 'Request Tailored Demo'}
              </a>

              <a
                href="#solutions"
                className="px-8 py-3.5 rounded-full text-sm font-bold bg-[#09151E]/90 border border-slate-700/80 text-white hover:border-[#00D4FF]/60 transition-colors"
              >
                {locale === 'ar' ? 'استكشف الحلول' : 'Explore Solutions'}
              </a>
            </div>

            {/* 3 Trust Checkmarks Row */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs sm:text-sm text-slate-300 font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0D9488]/25 border border-[#14B8A6]/50 text-[#2DD4BF] flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
                <span>{locale === 'ar' ? 'واجهة عربية RTL' : 'Native Arabic RTL'}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0D9488]/25 border border-[#14B8A6]/50 text-[#2DD4BF] flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
                <span>
                  {locale === 'ar'
                    ? 'مصمم للسوق المصري والعربي'
                    : 'Built for Egyptian & Arab Clinics'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0D9488]/25 border border-[#14B8A6]/50 text-[#2DD4BF] flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
                <span>
                  {locale === 'ar' ? 'يبدأ من احتياج المنشأة' : 'Scales With Your Facility'}
                </span>
              </div>
            </div>

            {/* ============================================================= */}
            {/* ANIMATED GLOWING ECG HEARTBEAT PULSE DIVIDER                  */}
            {/* ============================================================= */}
            <div className="pt-6 pb-4 max-w-3xl mx-auto">
              <svg
                className="w-full h-14 overflow-visible"
                viewBox="0 0 900 70"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M0,35 L260,35 L278,35 L290,10 L304,60 L318,16 L332,48 L344,35 L550,35 L568,35 L580,10 L594,60 L608,16 L622,48 L634,35 L900,35"
                  stroke="rgba(0, 212, 255, 0.22)"
                  strokeWidth="2"
                />
                <path
                  className="soli-ecg-path drop-shadow-[0_0_10px_#00D4FF]"
                  d="M0,35 L260,35 L278,35 L290,10 L304,60 L318,16 L332,48 L344,35 L550,35 L568,35 L580,10 L594,60 L608,16 L622,48 L634,35 L900,35"
                  stroke="#00D4FF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* =============================================================== */}
          {/* INTERACTIVE SOLI MEDICAL CLINIC DASHBOARD MONITOR FRAME          */}
          {/* =============================================================== */}
          <div className="max-w-5xl mx-auto mt-4 space-y-4">
            {/* Switch between Live Interactive RTL Clinic UI & Real Screenshots */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActivePreviewMode('live-ui')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activePreviewMode === 'live-ui'
                    ? 'bg-[#00D4FF] text-slate-950 shadow-[0_0_16px_rgba(0,212,255,0.45)]'
                    : 'bg-[#0B1922] text-slate-300 border border-slate-800 hover:border-[#00D4FF]/50'
                }`}
              >
                {locale === 'ar'
                  ? 'محاكاة حية لواجهة Soli Medical CLINIC'
                  : 'Live Interactive Soli Medical UI'}
              </button>
              {(['dashboard', 'booking', 'emr'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setActivePreviewMode(k)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activePreviewMode === k
                      ? 'bg-[#00D4FF] text-slate-950 shadow-[0_0_16px_rgba(0,212,255,0.45)]'
                      : 'bg-[#0B1922] text-slate-300 border border-slate-800 hover:border-[#00D4FF]/50'
                  }`}
                >
                  {screenShots[k].label}
                </button>
              ))}
            </div>

            {/* Rounded Dark Monitor Bezel with Outer Cyan Glow */}
            <div className="rounded-[28px] p-2.5 sm:p-4 bg-[#07131B] border-2 border-[#122B3A] shadow-[0_0_60px_rgba(0,212,255,0.14)]">
              {activePreviewMode === 'live-ui' ? (
                /* Interactive RTL Soli Medical Clinic Interface matching Attachment 3 */
                <div
                  dir="rtl"
                  className="rounded-[20px] overflow-hidden bg-[#F8FAFC] text-slate-900 grid grid-cols-1 lg:grid-cols-12 min-h-[470px] border border-slate-200"
                >
                  {/* Right Dark Navy Sidebar (3 Cols in RTL) */}
                  <div className="lg:col-span-3 bg-[#0B1320] text-white p-4 flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      {/* Brand Header inside Sidebar */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <img
                            src="/assets/aistudio/logo_ae3842b8.png"
                            alt="Soli Medical"
                            className="w-7 h-7 rounded-lg object-contain bg-slate-900 p-0.5"
                          />
                          <div className="text-start">
                            <div className="text-xs font-black tracking-tight text-white">
                              Soli Medical
                            </div>
                            <div className="text-[10px] font-bold text-[#00D4FF]">CLINIC</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                          متصل
                        </span>
                      </div>

                      {/* Sidebar Navigation Links */}
                      <div className="space-y-1 text-xs">
                        {[
                          { id: 'dashboard', label: 'لوحة التحكم', icon: Activity },
                          { id: 'queue', label: 'تسجيل زيارة جديدة', icon: UserPlus },
                          {
                            id: 'exam',
                            label: 'الكشف الطبي للغرفة',
                            icon: Stethoscope,
                            badge: 'نشط',
                          },
                          { id: 'emr', label: 'ملفات المرضى (EMR)', icon: FileText },
                          { id: 'finance', label: 'الفواتير والمدفوعات', icon: CreditCard },
                        ].map((nav) => {
                          const Icon = nav.icon;
                          const active = activeSimSidebar === nav.id;
                          return (
                            <button
                              key={nav.id}
                              type="button"
                              onClick={() => setActiveSimSidebar(nav.id as any)}
                              className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-start font-bold transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#16243A] text-[#00D4FF] border border-[#00D4FF]/30'
                                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5" />
                                <span>{nav.label}</span>
                              </div>
                              {nav.badge && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-purple-500/25 text-purple-300">
                                  {nav.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Doctor Status Footer in Sidebar */}
                    <div className="p-3 rounded-xl bg-[#111C2D] border border-slate-800 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold">● الطبيب متاح</span>
                        <span className="text-slate-400">عيادة الباطنة والقلب</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-slate-300">
                        <span>مدير النظام (Admin)</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px]">
                          خروج
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Left Clinical Workspace (9 Cols in RTL) */}
                  <div className="lg:col-span-9 p-4 sm:p-6 flex flex-col justify-between gap-5 bg-[#F8FAFC]">
                    {/* Top Search & Date Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5" />
                        <span>بحث شامل (اسم، هاتف، ملف، خدمة...)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>الثلاثاء · جدول عيادة اليوم</span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ● مباشر
                        </span>
                      </div>
                    </div>

                    {/* 4-Step Patient Journey Pipeline Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-teal-50/90 border border-teal-200 space-y-1.5 text-start">
                        <div className="flex items-center justify-between text-[10px] font-bold text-teal-700">
                          <span>01 · الاستقبال</span>
                          <span className="px-1.5 py-0.5 rounded bg-teal-500 text-white">نشط</span>
                        </div>
                        <div className="text-xs font-black text-slate-900">تسجيل زيارة ومريض</div>
                        <p className="text-[10px] text-slate-600">
                          إضافة مريض جديد أو فتح ملف سابق وإصدار إيصال الكشف
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 text-start">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-600">
                          <span>02 · الانتظار</span>
                          <span>3 حالات</span>
                        </div>
                        <div className="text-xs font-black text-slate-900">طابور الانتظار الذكي</div>
                        <p className="text-[10px] text-slate-600">
                          ترتيب تلقائي للحالات مع تنبيه الطبيب بالحالة التالية
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 text-start">
                        <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600">
                          <span>03 · غرفة الكشف</span>
                          <span>جاري الكشف</span>
                        </div>
                        <div className="text-xs font-black text-slate-900">الكشف والروشتة EMR</div>
                        <p className="text-[10px] text-slate-600">
                          تسجيل التشخيص والأدوية والتحاليل وطباعة الروشتة
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 text-start">
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600">
                          <span>04 · الخزينة</span>
                          <span>مكتمل</span>
                        </div>
                        <div className="text-xs font-black text-slate-900">التحصيل والمغادرة</div>
                        <p className="text-[10px] text-slate-600">
                          حساب صافي الخزينة اليومية وتحديد موعد الإعادة
                        </p>
                      </div>
                    </div>

                    {/* Daily Live Modules Strip (No Fake Numbers) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>وحدات التشغيل المباشرة داخل النظام</span>
                        <div className="flex gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-teal-600 text-white">متزامن</span>
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            سحابي (Cloud)
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-start">
                          <div className="text-[10px] text-slate-500">إدارة الحجوزات</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">
                            الاستقبال والبوت
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold">
                            ● متزامن لحظياً
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-teal-400 shadow-xs text-start">
                          <div className="text-[10px] text-teal-700 font-bold">طابور الانتظار</div>
                          <div className="text-sm font-black text-teal-700 mt-0.5">
                            نداء آلي للغرفة
                          </div>
                          <div className="text-[10px] text-teal-600 font-bold">● متاح للدخول</div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-start">
                          <div className="text-[10px] text-slate-500">الملف الطبي EMR</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">
                            روشتة إلكترونية
                          </div>
                          <div className="text-[10px] text-purple-600 font-bold">
                            ● أرشيف زيارات كامل
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-start">
                          <div className="text-[10px] text-slate-500">الإدارة المالية</div>
                          <div className="text-sm font-black text-emerald-700 mt-0.5">
                            دفتر خزينة يومي
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold">● تقارير دقيقة</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Clinical Notification Bar */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <Bell className="w-4 h-4 text-amber-500" />
                        <span>مركز التنبيهات والإشعارات السريرية</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          — متابعة فورية لنداء الطبيب، الحالات الحرجة، وتأكيدات بوت تليجرام
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                        ● الطبيب متاح للكشف
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Real High-Res Screenshot Preview */
                <div
                  onClick={() => setLightboxImg(screenShots[activePreviewMode].image)}
                  className="cursor-pointer rounded-[20px] overflow-hidden bg-[#040D12] relative group"
                >
                  <img
                    src={screenShots[activePreviewMode].image}
                    alt={screenShots[activePreviewMode].label}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover"
                  />
                  <button
                    type="button"
                    className="absolute bottom-4 end-4 px-3.5 py-2 rounded-xl bg-slate-950/90 text-[#00D4FF] border border-[#00D4FF]/40 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'تكبير الصورة' : 'Expand'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. SECTION 01: حلول تحت اسم واحد (Exact 01–04 Vertical Cards)     */}
        {/* ================================================================= */}
        <section id="solutions" className="py-16 lg:py-24 px-4 sm:px-8 border-t border-[#00D4FF]/10">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Section 01 Header (Right-aligned in RTL matching Attachment 3) */}
            <div className="space-y-3 text-start">
              <div className="flex items-center gap-2.5 text-sm font-bold text-slate-400">
                <span className="text-2xl sm:text-3xl font-black font-mono-tabular text-[#00D4FF]">
                  01
                </span>
                <span>
                  {locale === 'ar' ? 'حلول تحت اسم واحد' : 'Unified Healthcare Solutions'}
                </span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                {locale === 'ar' ? (
                  <>
                    ابدأ بالحجم الذي لديك اليوم،
                    <br />
                    واترك مساحة للنمو.
                  </>
                ) : (
                  <>
                    Start With the Scale You Have Today,
                    <br />
                    And Leave Room to Grow.
                  </>
                )}
              </h2>

              <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl leading-relaxed">
                {locale === 'ar'
                  ? 'لا نعالج العيادة الفردية بمنطق مجمع كبير، ولا نختصر تشغيل مجمع متكامل في شاشة مواعيد. الرسالة والرحلة والطلب تبدأ من نوع منشأتك.'
                  : 'We never burden a solo clinic with complex hospital menus, nor reduce a multi-clinic complex to a simple calendar. Your system starts from your facility type.'}
              </p>
            </div>

            {/* 4 Vertical Numbered Cards (01, 02 with tilted glowing Cyan Badge, 03, 04) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {numberedPillars.map((pillar) => {
                const isActive = highlightedPillar === pillar.num;
                return (
                  <div
                    key={pillar.num}
                    onMouseEnter={() => setHighlightedPillar(pillar.num)}
                    onClick={() => setHighlightedPillar(pillar.num)}
                    className={`rounded-[26px] p-5 sm:p-7 flex flex-col items-start text-start gap-5 transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-b from-[#0A222E] to-[#07151E] border-2 border-[#00D4FF]/60 shadow-[0_0_35px_rgba(0,212,255,0.18)]'
                        : 'bg-[#07131B]/90 border border-slate-800/90 hover:border-[#00D4FF]/35'
                    }`}
                  >
                    {/* Number Badge (Tilted Glowing Cyan Square when active, matching '02' in Attachment 3) */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono-tabular text-base font-black transition-transform duration-300 ${
                        isActive
                          ? 'bg-[#00D4FF] text-slate-950 -rotate-12 shadow-[0_0_24px_#00D4FF]'
                          : 'bg-[#0C1E28] text-[#00D4FF] border border-[#00D4FF]/25'
                      }`}
                    >
                      {pillar.num}
                    </div>

                    <h3
                      className={`text-lg sm:text-2xl font-black leading-snug ${
                        isActive ? 'text-[#22D3EE]' : 'text-[#38BDF8]'
                      }`}
                    >
                      {pillar.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300/90 leading-[1.9]">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. SECTION 02 & 03: SINGLE CLINIC vs MEDICAL COMPLEX TRACKS       */}
        {/* ================================================================= */}
        <section className="py-16 lg:py-24 px-4 sm:px-8 border-t border-[#00D4FF]/10 bg-[#061118]">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Track A: Single Doctor Clinic */}
              <div className="rounded-[28px] p-7 sm:p-8 bg-[#081721] border border-[#00D4FF]/25 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-[#00D4FF]/15 text-[#00D4FF]">
                    <span>02 · عيادة الطبيب الواحد</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {locale === 'ar'
                      ? 'نظام يدير يوم العيادة من أول مريض لآخر تقرير'
                      : 'Complete Solo-Clinic Workflow From First Patient to Daily Cash'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {locale === 'ar'
                      ? 'مصمم للطبيب وموظف الاستقبال مباشرة: حجز المواعيد، طابور الانتظار، الكشف والروشتة الإلكترونية، والخزينة اليومية بدون قوائم معقدة.'
                      : 'Built for the physician and receptionist: appointments, live waiting queue, EMR & prescription printing, and daily cash reconciliation.'}
                  </p>
                  <ul className="space-y-2.5 pt-2">
                    {[
                      locale === 'ar'
                        ? 'طابور انتظار لحظي بين الاستقبال وغرفة الطبيب'
                        : 'Live queue sync between reception and exam room',
                      locale === 'ar'
                        ? 'ملف طبي إلكتروني (EMR) وطباعة روشتة احترافية'
                        : 'Electronic Medical Records & 1-click prescription printing',
                      locale === 'ar'
                        ? 'متابعة الخزينة اليومية والإيرادات والمصروفات'
                        : 'Daily cash ledger, revenue, and expense tracking',
                      locale === 'ar'
                        ? 'ربط مع بوت تليجرام @SoliMedicalproBot للحجز الذاتي'
                        : 'Integrated with @SoliMedicalproBot for patient self-booking',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                        <Check className="w-4 h-4 text-[#00D4FF] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={`https://wa.me/Ahmed0soliman?text=${encodeURIComponent(
                    'مرحباً، أريد طلب نظام Soli Medical لعيادة الطبيب الواحد.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 text-center shadow-[0_0_24px_rgba(0,212,255,0.35)]"
                >
                  {locale === 'ar'
                    ? 'اطلب نسخة عيادة الطبيب الواحد'
                    : 'Request Single-Clinic Edition'}
                </a>
              </div>

              {/* Track B: Medical Complex & Small Hospital */}
              <div className="rounded-[28px] p-7 sm:p-8 bg-[#081721] border border-[#14B8A6]/30 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-[#14B8A6]/15 text-[#2DD4BF]">
                    <span>03 · المجمعات الطبية والمراكز المتعددة</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {locale === 'ar'
                      ? 'منظومة تشغيل مترابطة للعيادات المتعددة والأقسام'
                      : 'Interconnected Polyclinic & Multi-Department Suite'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {locale === 'ar'
                      ? 'عندما تتعدد العيادات والتخصصات داخل المركز الطبي، تمنحك المنظومة إدارة موحدة للاستقبال، نسب الأطباء، التعاقدات، وصلاحيات الموظفين.'
                      : 'For multi-specialty centers: unified reception routing, doctor commission shares, insurance contracts, and role-based permissions.'}
                  </p>
                  <ul className="space-y-2.5 pt-2">
                    {[
                      locale === 'ar'
                        ? 'تعدد العيادات والتخصصات وجداول الأطباء المستقلة'
                        : 'Multiple clinics, specialties, and independent doctor schedules',
                      locale === 'ar'
                        ? 'حساب نسب الأطباء والتعاقدات والتقارير المالية التفصيلية'
                        : 'Automated doctor revenue shares and departmental financial reports',
                      locale === 'ar'
                        ? 'صلاحيات دقيقة للمدير، الاستقبال، الأطباء، والمحاسبين'
                        : 'Granular RBAC for admin, reception, doctors, and accountants',
                      locale === 'ar'
                        ? 'لوحة قيادة إدارية شاملة لمتابعة أداء جميع الوحدات'
                        : 'Executive cockpit monitoring all clinical units in real time',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                        <Check className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={`https://wa.me/Ahmed0soliman?text=${encodeURIComponent(
                    'مرحباً، أريد طلب نظام Soli Medical لمجمع عيادات أو مركز طبي.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-black border border-[#00D4FF] text-[#00D4FF] hover:bg-[#00D4FF] hover:text-slate-950 transition-colors text-center"
                >
                  {locale === 'ar'
                    ? 'اطلب نسخة المجمعات والمراكز الطبية'
                    : 'Request Medical Complex Edition'}
                </a>
              </div>
            </div>

            {/* Embedded YouTube Walkthrough */}
            <div className="rounded-[28px] p-6 sm:p-8 bg-[#081721] border border-[#00D4FF]/20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#00D4FF]">
                  <Play className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'جولة مرئية حية' : 'Video Walkthrough'}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {locale === 'ar'
                    ? 'شاهد دورة العمل داخل Soli Medical'
                    : 'Watch Soli Medical in Action'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {locale === 'ar'
                    ? 'شرح عملي لكيفية إدارة المواعيد، استقبال المرضى، كتابة الروشتة الإلكترونية، ومتابعة تقارير العيادة.'
                    : 'Practical demonstration of appointment scheduling, patient check-in, e-prescriptions, and clinic analytics.'}
                </p>
              </div>
              <div className="lg:col-span-7">
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[#00D4FF]/30 bg-black">
                  <iframe
                    src="https://www.youtube.com/embed/l90OUlLJT-I"
                    title="شرح نظام سولي ميديكال لإدارة العيادات"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. DIRECT CONSULTATION & DEMO REQUEST FORM                        */}
        {/* ================================================================= */}
        <section id="request" className="py-16 lg:py-24 px-4 sm:px-8 border-t border-[#00D4FF]/15">
          <div className="max-w-4xl mx-auto rounded-[32px] p-6 sm:p-10 bg-[#081721] border border-[#00D4FF]/30 shadow-[0_0_50px_rgba(0,212,255,0.1)] space-y-8">
            <div className="space-y-2 text-center">
              <div className="text-xs font-bold text-[#00D4FF]">
                {locale === 'ar' ? 'تواصل مباشر مع م. أحمد سليمان' : 'Direct Consultation'}
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                {locale === 'ar'
                  ? 'اطلب العرض المناسب لمنشأتك الطبية'
                  : 'Request the Right Edition for Your Facility'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {locale === 'ar'
                  ? 'حدد نوع منشأتك وسيتم فتح محادثة واتساب مباشرة لتفعيل النسخة التجريبية أو تحديد موعد العرض.'
                  : 'Specify your facility details to start a direct WhatsApp consultation and demo.'}
              </p>
            </div>

            {reqError && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-700 text-xs text-red-200">
                {reqError}
              </div>
            )}

            {reqSent && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200">
                {locale === 'ar'
                  ? 'تم تجهيز رسالتك وفتح واتساب بنجاح.'
                  : 'Your inquiry has been prepared on WhatsApp.'}
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <input
                type="text"
                name="websiteHoneypot"
                value={reqHoneypot}
                onChange={(e) => setReqHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {locale === 'ar' ? 'الاسم' : 'Your Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    placeholder={locale === 'ar' ? 'د. محمد أحمد' : 'Dr. Mohamed'}
                    className="w-full px-4 py-3 rounded-xl bg-[#040D12] border border-slate-700 text-xs text-white focus:border-[#00D4FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {locale === 'ar' ? 'الصفة / الدور' : 'Role'}
                  </label>
                  <input
                    type="text"
                    value={reqRole}
                    onChange={(e) => setReqRole(e.target.value)}
                    placeholder={locale === 'ar' ? 'طبيب / مدير مركز طبي' : 'Physician / Director'}
                    className="w-full px-4 py-3 rounded-xl bg-[#040D12] border border-slate-700 text-xs text-white focus:border-[#00D4FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {locale === 'ar' ? 'نوع المنشأة' : 'Facility Type'}
                  </label>
                  <input
                    type="text"
                    value={reqFacility}
                    onChange={(e) => setReqFacility(e.target.value)}
                    placeholder={
                      locale === 'ar' ? 'عيادة فردية / مجمع عيادات' : 'Solo Clinic / Polyclinic'
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#040D12] border border-slate-700 text-xs text-white focus:border-[#00D4FF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {locale === 'ar'
                    ? 'ما الذي تحتاج لتنظيمه في عيادتك أو مركزك؟'
                    : 'What workflows would you like to streamline?'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={reqNeed}
                  onChange={(e) => setReqNeed(e.target.value)}
                  placeholder={
                    locale === 'ar'
                      ? 'مثال: تنظيم المواعيد وطابور الانتظار والروشتة الإلكترونية ومتابعة الإيراد اليومي...'
                      : 'e.g. Appointments, waiting queue, Cloud EMR, and daily revenue tracking...'
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#040D12] border border-slate-700 text-xs text-white focus:border-[#00D4FF] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-full text-xs sm:text-sm font-black bg-gradient-to-r from-[#00D4FF] to-[#38BDF8] text-slate-950 shadow-[0_0_28px_rgba(0,212,255,0.45)] inline-flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {locale === 'ar'
                      ? 'إرسال الطلب عبر واتساب الآن'
                      : 'Send Request via WhatsApp'}
                  </span>
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://t.me/SoliMedicalproBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3.5 rounded-full text-xs font-bold border border-slate-700 text-slate-200 hover:border-[#00D4FF] inline-flex items-center gap-2"
                  >
                    <Send className="w-4 h-4 text-[#00D4FF]" />
                    <span>@SoliMedicalproBot</span>
                  </a>

                  <a
                    href="https://www.facebook.com/SoliMedical/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3.5 rounded-full text-xs font-bold border border-slate-700 text-slate-200 hover:border-[#00D4FF] inline-flex items-center gap-2"
                  >
                    <span>Facebook</span>
                  </a>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Floating WhatsApp Button from index.html */}
        <a
          href="https://wa.me/Ahmed0soliman"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="fixed bottom-6 end-6 z-40 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-xs font-black shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-105 transition-transform"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{locale === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp'}</span>
        </a>

        {/* Fullscreen Lightbox */}
        {lightboxImg && (
          <div
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 z-[9995] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              className="absolute top-6 end-6 p-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 hover:text-[#00D4FF]"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImg}
              alt="Soli Medical Screen"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        )}
      </div>
    </LayoutResolver>
  );
};
