import { PlatformDatabase } from '../types/cms';

const NOW = '2026-11-11T12:00:00.000Z';

export const INITIAL_PLATFORM_DATA: PlatformDatabase = {
  admins: [
    {
      id: 'owner-ahmed-soliman',
      uid: 'owner-ahmed-soliman',
      email: 'ahmed0soliman6@gmail.com',
      name: 'Ahmed Soliman',
      role: 'owner',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ],
  siteSettings: {
    id: 'global',
    brandName: {
      ar: 'أحمد سليمان',
      en: 'Ahmed Soliman',
    },
    tagline: {
      ar: 'مطوّر أنظمة العيادات الطبية والبرمجيات الصحية',
      en: 'Healthcare Systems Architect & Full-Stack Engineer',
    },
    ownerName: {
      ar: 'أحمد سليمان',
      en: 'Ahmed Soliman',
    },
    ownerRole: {
      ar: 'مطوّر ومشغّل أنظمة العيادات والمجمعات الطبية',
      en: 'Medical Clinic & Healthcare Complex Systems Developer',
    },
    avatarUrl: '/assets/aistudio/1770146906397_16665dd0.png',
    primaryColor: '#00C2CB',
    navyColor: '#070E1A',
    defaultLocale: 'ar',
    defaultTheme: 'dark',
    whatsappNumber: 'Ahmed0soliman',
    whatsappUrl: 'https://wa.me/Ahmed0soliman',
    telegramBotUrl: 'https://t.me/SoliMedicalproBot',
    facebookUrl: 'https://www.facebook.com/SoliMedical/',
    githubUrl: 'https://github.com/Ahmed0soliman',
    linkedinUrl: 'https://www.linkedin.com/in/ahmed-soliman',
    contactEmail: 'ahmed0soliman6@gmail.com',
    location: {
      ar: 'مصر — تطوير وتشغيل الأنظمة الطبية الرقمية',
      en: 'Egypt — Healthcare Software Engineering & Operations',
    },
    published: true,
    seo: {
      title: {
        ar: 'أحمد سليمان | مطوّر أنظمة العيادات والبرمجيات الصحية – Ahmed Soliman',
        en: 'Ahmed Soliman | Healthcare Systems Architect & Digital Platform',
      },
      description: {
        ar: 'المنصة الرقمية الرسمية للمهندس أحمد سليمان: تطوير وإدارة أنظمة العيادات والمجمعات الطبية الخيرية والخاصة في مصر، صفحات الهبوط الطبية، والمقالات التقنية.',
        en: 'Official digital platform of Ahmed Soliman: developing and operating clinic management systems, charitable medical complex software, and custom healthcare landing pages.',
      },
      ogImage: '/assets/aistudio/1770146906397_16665dd0.png',
      canonicalSlug: '/',
      structuredDataType: 'Person',
    },
    updatedAt: NOW,
  },
  pages: [
    {
      id: 'home',
      slug: 'home',
      title: {
        ar: 'الرئيسية',
        en: 'Home',
      },
      kicker: {
        ar: 'من يوميات العيادة إلى قرار إداري أوضح',
        en: 'From Daily Clinic Workflows to Clearer Executive Decisions',
      },
      headline: {
        ar: 'أبني وأشغّل البنية الرقمية للعيادات والمجمعات الطبية العربية',
        en: 'Engineering Practical Digital Systems for Clinics & Medical Complexes',
      },
      subheadline: {
        ar: 'أطوّر وأدير أنظمة إدارة العيادات، وأبني وأشغّل برمجيات للمجمعات الطبية الخيرية والخاصة في مصر، من التطوير الهندسي حتى التشغيل الفعلي على أرض الواقع.',
        en: 'I architect, build, and operate clinic management software and integrated operational platforms for charitable and private medical complexes across Egypt—from code to real-world daily operations.',
      },
      biography: {
        ar: 'مهتم بالبرمجيات العربية الأصيلة (RTL) وبالبنية الرقمية للرعاية الصحية المجتمعية التي تبدأ من واقع العمل الطبي اليومي، لا من قوائم معقدة.',
        en: 'Focused on native Arabic-first (RTL) healthcare software and community medical infrastructure designed around real clinical workflows rather than bloated menus.',
      },
      highlights: {
        ar: [
          'أنظمة عربية RTL أصيلة مصممة للسوق المصري والعربي',
          'بناء وتشغيل برمجيات المجمعات الطبية الخيرية والخاصة',
          'تطوير متكامل من هندسة النظام حتى التدريب والتشغيل الفعلي',
          'صفحات هبوط طبية مستقلة للعيادات والأطباء مع حجز مباشر',
        ],
        en: [
          'Native Arabic RTL systems engineered for Egyptian & Arab healthcare',
          'End-to-end software for single clinics & charitable medical complexes',
          'Hands-on lifecycle from system architecture to live on-site operation',
          'Standalone high-conversion medical landing pages for clinics & doctors',
        ],
      },
      metrics: [
        {
          value: '100%',
          label: {
            ar: 'توافق عربي وإنجليزي RTL / LTR من البداية',
            en: 'Native Bilingual RTL / LTR Architecture',
          },
        },
        {
          value: '2+',
          label: {
            ar: 'مسارات تشغيلية متكاملة (عيادة فردية ومجمع طبي)',
            en: 'Specialized Clinical & Complex Tracks',
          },
        },
        {
          value: '24/7',
          label: {
            ar: 'استعلام وحجز آلي عبر بوت تليجرام وواتساب',
            en: 'Automated Patient Inquiry via Telegram & WhatsApp',
          },
        },
        {
          value: 'Zero',
          label: {
            ar: 'تعقيد غير ضروري في رحلة الطبيب والاستقبال',
            en: 'Unnecessary Friction in Doctor & Reception Workflows',
          },
        },
      ],
      experienceTimeline: [],
      skills: [],
      heroImage: '/assets/aistudio/1770146906397_16665dd0.png',
      standaloneByDefault: false,
      published: true,
      order: 1,
      seo: {
        title: {
          ar: 'أحمد سليمان | المنصة الرقمية الرسمية ومطوّر الأنظمة الطبية',
          en: 'Ahmed Soliman | Official Digital Platform & Healthcare Systems Developer',
        },
        description: {
          ar: 'استكشف مشروعات وأنظمة أحمد سليمان لإدارة العيادات والمجمعات الطبية، صفحات الهبوط الطبية المستقلة، والمقالات التقنية.',
          en: 'Explore Ahmed Soliman’s healthcare software systems, medical clinic landing pages, and technical insights.',
        },
        ogImage: '/assets/aistudio/1770146906397_16665dd0.png',
        canonicalSlug: '/',
        structuredDataType: 'Person',
      },
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'about',
      slug: 'about',
      title: {
        ar: 'من أنا — السيرة المهنية',
        en: 'About — Editorial Profile',
      },
      kicker: {
        ar: 'الملف التعريفي المهني · Ahmed Soliman',
        en: 'Editorial Profile & Engineering Philosophy · Ahmed Soliman',
      },
      headline: {
        ar: 'أحمد سليمان — مطوّر أنظمة العيادات الطبية والبرمجيات الصحية',
        en: 'Ahmed Soliman — Architect of Practical Healthcare Software',
      },
      subheadline: {
        ar: 'أطوّر وأدير أنظمة إدارة العيادات، وأبني وأشغّل برمجيات للمجمعات الطبية الخيرية في مصر، من التطوير حتى التشغيل الفعلي.',
        en: 'Developing and managing clinic systems, and building and operating software for charitable medical complexes in Egypt from inception to live daily operation.',
      },
      biography: {
        ar: 'تنطلق فلسفتي الهندسية من حقيقة بسيطة: لا نعالج العيادة الفردية بمنطق مجمع كبير، ولا نختصر تشغيل مجمع طبي متكامل في مجرد شاشة مواعيد. لذلك أعمل عن قرب مع الأطباء ومديري المجمعات الطبية الخيرية والخاصة لتحويل يوميات الاستقبال، الكشف، الروشتة، الخزينة، والمخزون إلى مسار رقمي واضح وسريع يستوعبه الفريق الطبي من اليوم الأول.',
        en: 'My engineering philosophy starts from a ground truth: you never burden a solo physician’s clinic with enterprise bloat, nor do you reduce a multi-department medical complex to a basic calendar screen. I work closely with physicians and directors of charitable and private healthcare facilities in Egypt to translate reception, clinical consultations, e-prescriptions, treasury, and department coordination into clear, dependable digital workflows.',
      },
      highlights: {
        ar: [
          'أنظمة عربية RTL مصممة خصيصاً لطريقة عمل العيادات والمنشآت الطبية في مصر والمنطقة',
          'بناء وتشغيل برمجيات المجمعات الطبية الخيرية متعددة العيادات والأقسام',
          'مرافقة المنشأة الطبية من تحليل الاحتياج والتطوير حتى التدريب والتشغيل الفعلي',
          'تصميم صفحات هبوط طبية مستقلة عالية التحويل للعيادات والمراكز التخصصية',
        ],
        en: [
          'Arabic-first RTL software tailored to real clinical workflows in Egypt and the MENA region',
          'Multi-department systems for charitable medical complexes, labs, and pharmacies',
          'Full operational ownership from requirements analysis to staff training and live deployment',
          'High-conversion standalone medical landing pages for specialized clinics and centers',
        ],
      },
      metrics: [
        {
          value: '01',
          label: {
            ar: 'عيادة الطبيب الواحد — تنظيم الاستقبال والكشف والروشتة والفاتورة',
            en: 'Solo Physician Clinic — Reception, EMR, Prescription & Billing',
          },
        },
        {
          value: '02',
          label: {
            ar: 'المجمعات والمستشفيات الصغيرة — ربط العيادات والأقسام والمالية',
            en: 'Medical Complexes — Unified Departments, Permissions & Finance',
          },
        },
        {
          value: '03',
          label: {
            ar: 'أتمتة التواصل — بوت تليجرام وربط واتساب المباشر للمرضى',
            en: 'Patient Automation — Telegram Booking Bot & WhatsApp Workflows',
          },
        },
      ],
      experienceTimeline: [
        {
          period: {
            ar: 'الحاضر — مستمر',
            en: 'Present — Ongoing',
          },
          role: {
            ar: 'مؤسس ومطوّر رئيسي لأنظمة الإدارة الطبية',
            en: 'Founder & Lead Healthcare Systems Architect',
          },
          organization: {
            ar: 'منصة أحمد سليمان / أنظمة Soli Medical',
            en: 'Ahmed Soliman Platform / Soli Medical Systems',
          },
          description: {
            ar: 'تطوير وتشغيل نظامين متكاملين: نظام عيادة الطبيب الواحد، ومنظومة تشغيل المجمعات الطبية والمستشفيات الصغيرة مع التكامل الآلي عبر تليجرام وواتساب.',
            en: 'Architecting and operating dual healthcare systems: Single-Doctor Clinic Suite and Multi-Department Medical Complex ERP with Telegram & WhatsApp automation.',
          },
        },
        {
          period: {
            ar: 'تطوير وتشغيل ميداني',
            en: 'Field Engineering & Operations',
          },
          role: {
            ar: 'مطوّر ومشغّل برمجيات المجمعات الطبية الخيرية',
            en: 'Charitable Medical Complexes Software Engineer',
          },
          organization: {
            ar: 'مجمعات ومراكز طبية مجتمعية في مصر',
            en: 'Community & Charitable Medical Complexes in Egypt',
          },
          description: {
            ar: 'بناء البنية التحتية الرقمية للمجمعات الطبية الخيرية لتنظيم حركة المراجعين، تعدد العيادات التخصصية، التقارير المالية، وصلاحيات الفرق التشغيلية.',
            en: 'Building digital infrastructure for high-volume charitable medical complexes, managing patient queues, multi-specialty clinics, financial accountability, and RBAC.',
          },
        },
        {
          period: {
            ar: 'هندسة الواجهات والمنصات',
            en: 'Web Platforms & Digital Identity',
          },
          role: {
            ar: 'مهندس برمجيات متكامل (Full-Stack Web Developer)',
            en: 'Full-Stack Web Engineer (React / Next.js / TypeScript)',
          },
          organization: {
            ar: 'استشارات وتطوير منصات رقمية مستقلة',
            en: 'Independent Digital Platforms & Medical Web Portals',
          },
          description: {
            ar: 'تصميم وتنفيذ منصات ويب ثنائية اللغة، صفحات هبوط تسويقية للعيادات والمراكز الطبية، ولوحات تحكم سحابية سريعة وآمنة.',
            en: 'Designing and building bilingual web platforms, standalone medical clinic landing pages, and secure cloud CMS dashboards.',
          },
        },
      ],
      skills: [
        {
          category: {
            ar: 'هندسة الواجهات والتجربة البصرية',
            en: 'Frontend Architecture & UX',
          },
          items: ['React 19', 'Next.js App Router', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'RTL/LTR Bilingual Systems'],
        },
        {
          category: {
            ar: 'قواعد البيانات والخدمات السحابية',
            en: 'Cloud Backend & Security',
          },
          items: ['Firebase Authentication', 'Cloud Firestore', 'Zero-Trust Security Rules', 'Cloudinary Signed CDN', 'Node.js / Express', 'REST APIs'],
        },
        {
          category: {
            ar: 'الأنظمة الطبية والتشغيلية',
            en: 'Healthcare Domain & Automation',
          },
          items: ['Clinic Reception & Queue Flow', 'E-Prescription & Patient Files', 'Medical Complex Treasury & Accounting', 'Telegram Bot API (@SoliMedicalproBot)', 'WhatsApp Business Workflows', 'Technical SEO & Schema.org'],
        },
      ],
      heroImage: '/assets/aistudio/1770146906397_16665dd0.png',
      standaloneByDefault: false,
      published: true,
      order: 2,
      seo: {
        title: {
          ar: 'من أنا | أحمد سليمان — مطوّر أنظمة العيادات الطبية والبرمجيات الصحية',
          en: 'About Ahmed Soliman — Healthcare Systems Architect & Developer',
        },
        description: {
          ar: 'تعرف على المسيرة المهنية للمهندس أحمد سليمان في تطوير وتشغيل أنظمة إدارة العيادات وبرمجيات المجمعات الطبية الخيرية في مصر.',
          en: 'Learn about Ahmed Soliman’s background in developing and operating clinic management systems and charitable medical complex software in Egypt.',
        },
        ogImage: '/assets/aistudio/1770146906397_16665dd0.png',
        canonicalSlug: '/about',
        structuredDataType: 'Person',
      },
      createdAt: NOW,
      updatedAt: NOW,
    },
  ],
  projects: [
    {
      id: 'soli-medical-single-clinic',
      slug: 'soli-medical-clinic-system',
      title: {
        ar: 'نظام Soli Medical — إدارة عيادة الطبيب الواحد',
        en: 'Soli Medical — Single Physician Clinic Management System',
      },
      kicker: {
        ar: '01 · للطبيب الفرد والعيادات التخصصية',
        en: '01 · For Solo Physicians & Specialized Clinics',
      },
      summary: {
        ar: 'يبدأ يوم العيادة من تسجيل المريض إلى الكشف والروشتة والفاتورة والمتابعة. النظام مبني ليكون واضحاً للطبيب والاستقبال بدون تعقيدات لا تحتاجها.',
        en: 'Covers the entire clinic day from patient check-in to examination, prescription, billing, and follow-up—engineered for clarity across reception and doctor screens.',
      },
      description: {
        ar: 'صُمم نظام Soli Medical لعيادة الطبيب الواحد ليعالج التحدي اليومي الأهم في العيادات الخاصة: تنظيم حركة المرضى بين الاستقبال وغرفة الكشف بسرعة ودقة دون إرباك الطبيب بقوائم معقدة. يجمع النظام ملف المريض، التاريخ العلاجي، الزيارات السابقة، طباعة الروشتة، وحسابات الخزينة اليومية في سياق عملي واحد يعمل بالعربية والإنجليزية من المتصفح أو الموبايل.',
        en: 'Soli Medical for Single-Doctor Clinics solves the core operational challenge of private practices: synchronizing patient flow between reception and the consultation room without overwhelming the physician. It unifies patient medical history, visit notes, prescription printing, and daily treasury accounting in a responsive Arabic/English web application.',
      },
      category: 'medical-systems',
      categoryLabel: {
        ar: 'أنظمة إدارة العيادات',
        en: 'Clinic Management Systems',
      },
      coverImage: '/assets/aistudio/logo_ae3842b8.png',
      logoImage: '/assets/aistudio/logo_ae3842b8.png',
      videoUrl: 'https://www.youtube.com/watch?v=l90OUlLJT-I',
      youtubeId: 'l90OUlLJT-I',
      liveUrl: 'https://solimedical.vercel.app/clinics',
      whatsappInquireText: {
        ar: 'مرحباً، أريد نظام Soli Medical لعيادة الطبيب الواحد.',
        en: 'Hello Ahmed, I would like to inquire about the Soli Medical Single-Doctor Clinic system.',
      },
      features: {
        ar: [
          'إدارة المواعيد والزيارات وقائمة الانتظار اللحظية بين الاستقبال والطبيب',
          'الملف الطبي والرحلة العلاجية والروشتة الإلكترونية في شاشة واحدة',
          'الفواتير والخزينة اليومية ومتابعة التحصيل والمصروفات بدقة',
          'التقارير والإحصائيات اليومية والشهرية لنشاط العيادة',
          'يعمل من المتصفح والموبايل مع دعم كامل للغتين العربية (RTL) والإنجليزية',
        ],
        en: [
          'Real-time appointments, visits, and live waiting queue between reception and doctor',
          'Unified patient medical dossier, treatment journey, and e-prescription workspace',
          'Daily billing, treasury ledger, revenue collection, and expense tracking',
          'Clear operational reports and daily/monthly performance analytics',
          'Runs seamlessly on desktop and mobile browsers with native RTL Arabic & English support',
        ],
      },
      techStack: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Cloud Database', 'PWA Ready'],
      screens: [
        {
          id: 'screen-dashboard',
          title: {
            ar: 'لوحة التحكم اليومية',
            en: 'Daily Clinic Dashboard',
          },
          caption: {
            ar: 'نظرة سريعة على نشاط اليوم: الكشوفات، قائمة الانتظار، المواعيد المؤكدة، والإيراد اليومي.',
            en: 'Instant overview of today’s clinical activity: consultations, waiting queue, confirmed bookings, and daily revenue.',
          },
          imageUrl: '/assets/aistudio/logo_ae3842b8.png',
        },
        {
          id: 'screen-appointments',
          title: {
            ar: 'حجز المواعيد والاستقبال',
            en: 'Appointments & Reception Flow',
          },
          caption: {
            ar: 'مسار واضح لموظف الاستقبال لتسجيل الحضور وتحديث حالة المريض لحظياً أمام الطبيب.',
            en: 'Streamlined reception workflow for patient check-in and real-time status synchronization with the doctor.',
          },
          imageUrl: '/assets/aistudio/logo_ae3842b8.png',
        },
        {
          id: 'screen-patients',
          title: {
            ar: 'ملفات المرضى والروشتة',
            en: 'Patient Records & E-Prescription',
          },
          caption: {
            ar: 'معلومات المريض والزيارات السابقة والملاحظات والوصفات الطبية في سياق عملي واحد.',
            en: 'Complete patient history, clinical notes, and printable prescriptions organized in one view.',
          },
          imageUrl: '/assets/aistudio/logo_ae3842b8.png',
        },
      ],
      comparisonTable: [
        {
          axis: { ar: 'صاحب القرار', en: 'Decision Maker' },
          singleClinic: { ar: 'الطبيب أو صاحب العيادة', en: 'Solo Physician or Clinic Owner' },
          medicalComplex: { ar: 'مدير المجمع أو مجلس الإدارة', en: 'Complex Director or Management Board' },
        },
        {
          axis: { ar: 'نقطة البداية', en: 'Starting Point' },
          singleClinic: { ar: 'تنظيم الاستقبال والكشف والروشتة والفاتورة', en: 'Streamlining reception, consultation, prescription & billing' },
          medicalComplex: { ar: 'ربط العيادات والأقسام والمالية والإدارة', en: 'Connecting multiple clinics, departments, finance & administration' },
        },
        {
          axis: { ar: 'الوحدات التشغيلية', en: 'Operational Units' },
          singleClinic: { ar: 'عيادة واحدة وفريق عمل صغير', en: 'Single clinic with a lean reception team' },
          medicalComplex: { ar: 'عيادات متعددة وأقسام ومعامل وصيدليات', en: 'Multi-specialty clinics, labs, pharmacies & cashier desks' },
        },
        {
          axis: { ar: 'أول أسئلة العرض', en: 'First Discovery Question' },
          singleClinic: { ar: 'كم طبيباً وكم موظف استقبال؟', en: 'How many doctors and receptionists operate daily?' },
          medicalComplex: { ar: 'ما الوحدات التشغيلية وكيف ترتبط ببعضها؟', en: 'Which departments exist and how do their workflows connect?' },
        },
        {
          axis: { ar: 'نموذج التنفيذ', en: 'Deployment Model' },
          singleClinic: { ar: 'تفعيل مباشر وتدريب سريع خلال أيام', en: 'Direct activation and rapid onboarding' },
          medicalComplex: { ar: 'تنفيذ مرحلي مخصص حسب الوحدات والأقسام', en: 'Phased rollout tailored to each operational unit' },
        },
      ],
      featured: true,
      published: true,
      order: 1,
      seo: {
        title: {
          ar: 'نظام Soli Medical لإدارة عيادة الطبيب الواحد | مشروعات أحمد سليمان',
          en: 'Soli Medical Single-Doctor Clinic System | Ahmed Soliman Projects',
        },
        description: {
          ar: 'تعرف على نظام Soli Medical لإدارة عيادة الطبيب الواحد: المواعيد، الملف الطبي، الروشتة، والخزينة اليومية بواجهة عربية RTL واضحة.',
          en: 'Explore the Soli Medical Single-Doctor Clinic System by Ahmed Soliman: appointments, EMR, prescriptions, and billing.',
        },
        ogImage: '/assets/aistudio/logo_ae3842b8.png',
        canonicalSlug: '/projects/soli-medical-clinic-system',
        structuredDataType: 'SoftwareApplication',
      },
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'soli-medical-complex-erp',
      slug: 'medical-complex-management-system',
      title: {
        ar: 'منظومة تشغيل المجمعات الطبية والمستشفيات الصغيرة',
        en: 'Integrated Medical Complex & Polyclinic Operations Platform',
      },
      kicker: {
        ar: '02 · للمجمعات الطبية الخيرية والخاصة والمستشفيات الصغيرة',
        en: '02 · For Charitable & Private Medical Complexes',
      },
      summary: {
        ar: 'عندما تتعدد العيادات والوحدات، يحتاج مدير المجمع إلى رؤية واحدة تجمع التشغيل والمالية والأقسام والصلاحيات في مكان واحد.',
        en: 'When multiple clinics and diagnostic units operate under one roof, management needs a single unified platform connecting operations, permissions, and finance.',
      },
      description: {
        ar: 'منظومة تشغيلية مترابطة طُوّرت خصيصاً من واقع العمل الميداني داخل المجمعات الطبية الخيرية والخاصة في مصر. تتيح للإدارة ربط عشرات العيادات التخصصية، شباك التذاكر والحجز المركزي، المعامل، والأقسام المالية مع نظام صلاحيات دقيق لكل موظف وطبيب ومدير قسم، وتقارير مالية وتشغيلية لحظية.',
        en: 'Built from hands-on field experience operating charitable and private medical complexes in Egypt, this platform links central ticketing, multi-specialty clinics, laboratory/radiology referrals, and central treasury with strict role-based access control and executive reporting.',
      },
      category: 'charitable-healthcare',
      categoryLabel: {
        ar: 'منظومات المجمعات الطبية',
        en: 'Medical Complex ERP',
      },
      coverImage: '/assets/aistudio/logo_ae3842b8.png',
      logoImage: '/assets/aistudio/logo_ae3842b8.png',
      videoUrl: 'https://www.youtube.com/watch?v=l90OUlLJT-I',
      youtubeId: 'l90OUlLJT-I',
      liveUrl: 'https://solimedical.vercel.app/clinics',
      whatsappInquireText: {
        ar: 'مرحباً، أريد مناقشة نظام لمجمع طبي أو مستشفى صغير.',
        en: 'Hello Ahmed, I would like to discuss an operational system for our medical complex.',
      },
      features: {
        ar: [
          'إدارة المستخدمين وتوزيع الصلاحيات الدقيقة للأطباء والاستقبال والمحاسبين',
          'إدارة تعدد العيادات والأقسام والتخصصات الطبية تحت سقف واحد',
          'الرقابة المالية الكاملة: التحصيل المركزي، نسب الأطباء، المصروفات، وتقفيل الورديات',
          'لوحة قيادة إدارية لمتابعة مؤشرات التشغيل والانتظار والإيراد لكل قسم',
        ],
        en: [
          'Granular Role-Based Access Control (RBAC) for doctors, receptionists, cashiers, and managers',
          'Multi-clinic and multi-department routing under a single unified facility architecture',
          'Comprehensive financial governance: shift closing, doctor revenue shares, and expense ledgers',
          'Executive operations cockpit monitoring queue load and revenue across every clinic unit',
        ],
      },
      techStack: ['React', 'TypeScript', 'Multi-Tenant RBAC', 'Financial Ledger Engine', 'Arabic RTL UI', 'Cloud Sync'],
      screens: [
        {
          id: 'complex-screen-1',
          title: {
            ar: 'رؤية تشغيلية موحدة للأقسام',
            en: 'Unified Multi-Department Cockpit',
          },
          caption: {
            ar: 'متابعة لحظية لجميع العيادات والوحدات العاملة داخل المجمع الطبي من شاشة إدارة واحدة.',
            en: 'Real-time operational visibility across all active specialty clinics and service units.',
          },
          imageUrl: '/assets/aistudio/logo_ae3842b8.png',
        },
      ],
      featured: true,
      published: true,
      order: 2,
      seo: {
        title: {
          ar: 'منظومة إدارة المجمعات الطبية والمستشفيات الصغيرة | أحمد سليمان',
          en: 'Medical Complex & Polyclinic Management Platform | Ahmed Soliman',
        },
        description: {
          ar: 'منظومة تشغيل مترابطة للمجمعات الطبية الخيرية والخاصة في مصر: إدارة المستخدمين والصلاحيات، العيادات والأقسام، والمالية والتقارير.',
          en: 'Integrated operations software for medical complexes and small hospitals in Egypt by Ahmed Soliman.',
        },
        ogImage: '/assets/aistudio/logo_ae3842b8.png',
        canonicalSlug: '/projects/medical-complex-management-system',
        structuredDataType: 'SoftwareApplication',
      },
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'soli-medical-telegram-bot',
      slug: 'clinic-telegram-booking-bot',
      title: {
        ar: 'بوت تليجرام الذكي للعيادات (@SoliMedicalproBot)',
        en: 'Automated Clinic Telegram Booking Bot (@SoliMedicalproBot)',
      },
      kicker: {
        ar: '03 · أتمتة حجز المواعيد واستعلام المرضى',
        en: '03 · Patient Self-Service & Booking Automation',
      },
      summary: {
        ar: 'يتيح للمريض السؤال عن مواعيد العمل والأطباء والأسعار والحجز المباشر من تليجرام بدون الحاجة لتحميل أي تطبيق إضافي.',
        en: 'Enables patients to check clinic schedules, doctor availability, service prices, and book appointments directly via Telegram without installing extra apps.',
      },
      description: {
        ar: 'لتخفيف ضغط المكالمات الهاتفية المتكررة على موظفي الاستقبال في العيادات والمجمعات الطبية، قمت بتطوير وتشغيل بوت تليجرام تفاعلي (@SoliMedicalproBot) مرتبط بنظام العيادة. يستطيع المريض من خلاله استعراض التخصصات، معرفة مواعيد الأطباء، وتأكيد حجز موعده في ثوانٍ.',
        en: 'To reduce repetitive phone call load on clinic reception desks, I engineered @SoliMedicalproBot—an interactive Telegram assistant connected to the clinic schedule. Patients can browse specialties, check doctor hours, and book appointments in seconds.',
      },
      category: 'automation-bots',
      categoryLabel: {
        ar: 'أتمتة التواصل والحجز',
        en: 'Patient Booking Automation',
      },
      coverImage: '/assets/aistudio/logo_ae3842b8.png',
      logoImage: '/assets/aistudio/logo_ae3842b8.png',
      liveUrl: 'https://t.me/SoliMedicalproBot',
      whatsappInquireText: {
        ar: 'مرحباً، أريد ربط بوت تليجرام لحجز المواعيد بعيادتي.',
        en: 'Hello Ahmed, I want to integrate the Telegram appointment booking bot with my clinic.',
      },
      features: {
        ar: [
          'حجز مواعيد فوري من تليجرام بدون تحميل تطبيق خاص',
          'الرد التلقائي على استفسارات المواعيد والتخصصات والأسعار على مدار الساعة',
          'تقليل ضغط المكالمات على مكتب الاستقبال وتنظيم بيانات الحجز',
          'واجهة محادثة عربية سهلة وواضحة لجميع فئات المرضى',
        ],
        en: [
          'Instant appointment booking inside Telegram with zero app installation required',
          '24/7 automated responses for clinic working hours, specialties, and consultation fees',
          'Reduces reception phone bottlenecks and structures patient booking data cleanly',
          'Intuitive Arabic conversational interface accessible to all patient demographics',
        ],
      },
      techStack: ['Telegram Bot API', 'Node.js', 'Webhook Automation', 'Clinic Schedule Sync'],
      screens: [],
      featured: true,
      published: true,
      order: 3,
      seo: {
        title: {
          ar: 'بوت تليجرام لحجز مواعيد العيادات @SoliMedicalproBot | أحمد سليمان',
          en: 'Clinic Telegram Booking Bot @SoliMedicalproBot | Ahmed Soliman',
        },
        description: {
          ar: 'احجز موعدك واستعلم عن خدمات العيادة مباشرة عبر بوت تليجرام @SoliMedicalproBot من تطوير أحمد سليمان.',
          en: 'Automated patient inquiry and appointment booking via Telegram bot @SoliMedicalproBot developed by Ahmed Soliman.',
        },
        ogImage: '/assets/aistudio/logo_ae3842b8.png',
        canonicalSlug: '/projects/clinic-telegram-booking-bot',
        structuredDataType: 'SoftwareApplication',
      },
      createdAt: NOW,
      updatedAt: NOW,
    },
  ],
  clinics: [
    {
      id: 'al-noor-charity-medical-complex',
      slug: 'al-noor-medical-complex',
      name: {
        ar: 'مجمع النور الطبي التخصصي',
        en: 'Al-Noor Specialized Medical Complex',
      },
      specialtyBadge: {
        ar: 'مجمع عيادات تخصصية متكامل · نموذج صفحة هبوط طبية',
        en: 'Multi-Specialty Polyclinic · Standalone Medical Landing Page',
      },
      tagline: {
        ar: 'رعاية طبية متكاملة بإشراف نخبة من الأطباء الاستشاريين وأحدث أنظمة الحجز والمتابعة الرقمية.',
        en: 'Comprehensive multi-specialty healthcare led by consultant physicians with seamless digital booking and follow-up.',
      },
      description: {
        ar: 'يقدم مجمع النور الطبي التخصصي خدمات الكشف والتشخيص والمتابعة في تخصصات الباطنة والقلب، طب الأطفال، الأسنان، والعيون، مع نظام حجز إلكتروني مسبق يضمن عدم الانتظار الطويل وتجربة علاجية مريحة للمريض والأسرة.',
        en: 'Al-Noor Specialized Medical Complex delivers outpatient consultations and diagnostic care across Internal Medicine, Cardiology, Pediatrics, Dentistry, and Ophthalmology—powered by structured digital appointment scheduling.',
      },
      coverImage: '/assets/aistudio/logo_ae3842b8.png',
      logoUrl: '/assets/aistudio/logo_ae3842b8.png',
      phone: '+201000000000',
      whatsapp: 'https://wa.me/Ahmed0soliman?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%AD%D8%AC%D8%B2%20%D9%85%D9%88%D8%B9%D8%AF%20%D9%81%D9%8A%20%D9%85%D8%AC%D9%85%D8%B9%20%D8%A7%D9%84%D9%86%D9%88%D8%B1%20%D8%A7%D9%84%D8%B7%D8%A8%D9%8A.',
      telegramUrl: 'https://t.me/SoliMedicalproBot',
      address: {
        ar: 'شارع التحرير الرئيسي، بجوار محطة المترو، القاهرة، مصر',
        en: 'Main Tahrir Street, Next to Metro Station, Cairo, Egypt',
      },
      city: {
        ar: 'القاهرة',
        en: 'Cairo',
      },
      workingHours: [
        {
          days: { ar: 'السبت – الأربعاء', en: 'Saturday – Wednesday' },
          hours: { ar: '10:00 صباحاً – 10:00 مساءً', en: '10:00 AM – 10:00 PM' },
          isOpen: true,
        },
        {
          days: { ar: 'الخميس', en: 'Thursday' },
          hours: { ar: '11:00 صباحاً – 08:00 مساءً', en: '11:00 AM – 08:00 PM' },
          isOpen: true,
        },
        {
          days: { ar: 'الجمعة', en: 'Friday' },
          hours: { ar: 'طوارئ وعيادات مسائية (04:00 م – 09:00 م)', en: 'Evening Clinics Only (04:00 PM – 09:00 PM)' },
          isOpen: true,
        },
      ],
      highlights: {
        ar: [
          'حجز مسبق عبر واتساب أو بوت تليجرام لتقليل وقت الانتظار',
          'ملف طبي إلكتروني موحد لكل مريض يحفظ التاريخ العلاجي والروشتات',
          'أسعار كشف وخدمات واضحة ومعلنة مسبقاً دون رسوم خفية',
          'نخبة من الاستشاريين والأخصائيين في أهم التخصصات الطبية',
        ],
        en: [
          'Pre-booking via WhatsApp or Telegram Bot to eliminate long waiting times',
          'Unified electronic medical record preserving patient prescriptions and history',
          'Transparent, published consultation and procedure pricing',
          'Board-certified consultants across primary medical specialties',
        ],
      },
      standaloneByDefault: false,
      published: true,
      order: 1,
      seo: {
        title: {
          ar: 'مجمع النور الطبي التخصصي | الأطباء والخدمات والأسعار والحجز المباشر',
          en: 'Al-Noor Specialized Medical Complex | Doctors, Services, Prices & Booking',
        },
        description: {
          ar: 'احجز موعدك في مجمع النور الطبي التخصصي: تعرف على جدول الأطباء، أسعار الكشف والخدمات الطبية، ومواعيد العمل اليومية.',
          en: 'Book your appointment at Al-Noor Specialized Medical Complex: view consultant doctors, transparent service pricing, and working hours.',
        },
        ogImage: '/assets/aistudio/logo_ae3842b8.png',
        canonicalSlug: '/clinics/al-noor-medical-complex',
        structuredDataType: 'MedicalClinic',
      },
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'soli-dental-and-care-center',
      slug: 'soli-specialized-clinic',
      name: {
        ar: 'عيادة دار الشفاء التخصصية',
        en: 'Dar Al-Shifa Specialized Clinic',
      },
      specialtyBadge: {
        ar: 'عيادة تخصصية · تدعم نمط العرض المستقل (Standalone Mode)',
        en: 'Specialized Clinic · Supports Standalone Campaign Mode',
      },
      tagline: {
        ar: 'تشخيص دقيق، متابعة طبية منظمة، وحجز فوري للمواعيد عبر الإنترنت.',
        en: 'Precision diagnostics, structured clinical follow-up, and instant online appointment booking.',
      },
      description: {
        ar: 'تمثل عيادة دار الشفاء نموذجاً عملياً لصفحات الهبوط الطبية المستقلة (Standalone Medical Landing Page) التي يصممها ويربطها المهندس أحمد سليمان للعيادات الفردية والمراكز الطبية لعرض الأطباء والخدمات والأسعار واستقبال الحجوزات مباشرة بدون أي تشتيت.',
        en: 'Dar Al-Shifa Clinic exemplifies a high-conversion Standalone Medical Landing Page engineered by Ahmed Soliman for individual clinics—displaying physician credentials, transparent service fees, working hours, and direct booking.',
      },
      coverImage: '/assets/aistudio/logo_ae3842b8.png',
      logoUrl: '/assets/aistudio/logo_ae3842b8.png',
      phone: '+201000000000',
      whatsapp: 'https://wa.me/Ahmed0soliman?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%AD%D8%AC%D8%B2%20%D9%81%D9%8A%20%D8%B9%D9%8A%D8%A7%D8%AF%D8%A9%20%D8%AF%D8%A7%D8%B1%20%D8%A7%D9%84%D8%B4%D9%81%D8%A7%D8%A1.',
      telegramUrl: 'https://t.me/SoliMedicalproBot',
      address: {
        ar: 'المهندسين، الجيزة، مصر',
        en: 'Mohandessin, Giza, Egypt',
      },
      city: {
        ar: 'الجيزة',
        en: 'Giza',
      },
      workingHours: [
        {
          days: { ar: 'السبت – الخميس', en: 'Saturday – Thursday' },
          hours: { ar: '12:00 ظهراً – 09:00 مساءً', en: '12:00 PM – 09:00 PM' },
          isOpen: true,
        },
        {
          days: { ar: 'الجمعة', en: 'Friday' },
          hours: { ar: 'عطلة أسبوعية', en: 'Weekly Holiday' },
          isOpen: false,
        },
      ],
      highlights: {
        ar: [
          'إمكانية مشاركة الرابط كصفحة هبوط مستقلة تماماً للعيادة',
          'عرض واضح لتخصص الطبيب ومؤهلاته ومواعيد تواجده',
          'قائمة خدمات وأسعار محدثة لحظياً من لوحة التحكم',
        ],
        en: [
          'Shareable as a 100% standalone clinic campaign landing page',
          'Clear presentation of physician qualifications and clinic hours',
          'Real-time service and fee catalog managed via the Admin CMS',
        ],
      },
      standaloneByDefault: false,
      published: true,
      order: 2,
      seo: {
        title: {
          ar: 'عيادة دار الشفاء التخصصية | المواعيد والأسعار والحجز',
          en: 'Dar Al-Shifa Specialized Clinic | Schedule, Prices & Booking',
        },
        description: {
          ar: 'صفحة الهبوط الرسمية لعيادة دار الشفاء التخصصية: استعرض الأطباء، الخدمات الطبية، الأسعار، واحجز موعدك مباشرة.',
          en: 'Official landing page for Dar Al-Shifa Specialized Clinic: view doctors, medical services, pricing, and book online.',
        },
        ogImage: '/assets/aistudio/logo_ae3842b8.png',
        canonicalSlug: '/clinics/soli-specialized-clinic',
        structuredDataType: 'MedicalClinic',
      },
      createdAt: NOW,
      updatedAt: NOW,
    },
  ],
  doctors: [
    {
      id: 'doc-1',
      clinicId: 'al-noor-charity-medical-complex',
      name: {
        ar: 'د. محمد عبد الرحمن',
        en: 'Dr. Mohamed Abdelrahman',
      },
      title: {
        ar: 'استشاري الباطنة العامة والقلب',
        en: 'Consultant of Internal Medicine & Cardiology',
      },
      specialty: {
        ar: 'الباطنة والقلب والأوعية الدموية',
        en: 'Internal Medicine & Cardiology',
      },
      bio: {
        ar: 'خبرة أكثر من 15 عاماً في تشخيص وعلاج أمراض الباطنة وارتفاع ضغط الدم والسكري ومتابعة حالات القلب المزمنة.',
        en: 'Over 15 years of clinical experience in internal medicine, hypertension, diabetes management, and preventive cardiology.',
      },
      photoUrl: '/assets/aistudio/logo_ae3842b8.png',
      qualifications: {
        ar: ['دكتوراه أمراض الباطنة والقلب', 'عضو الجمعية المصرية لأمراض القلب'],
        en: ['MD in Internal Medicine & Cardiology', 'Member of the Egyptian Society of Cardiology'],
      },
      scheduleSummary: {
        ar: 'السبت، الإثنين، الأربعاء (05:00 م – 09:00 م)',
        en: 'Sat, Mon, Wed (05:00 PM – 09:00 PM)',
      },
      consultationFee: 300,
      currency: 'EGP',
      published: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'doc-2',
      clinicId: 'al-noor-charity-medical-complex',
      name: {
        ar: 'د. سارة محمود الكيلاني',
        en: 'Dr. Sara Mahmoud El-Kilany',
      },
      title: {
        ar: 'أخصائي طب الأطفال وحديثي الولادة',
        en: 'Specialist of Pediatrics & Neonatology',
      },
      specialty: {
        ar: 'طب الأطفال وحديثي الولادة',
        en: 'Pediatrics & Neonatology',
      },
      bio: {
        ar: 'متخصصة في متابعة نمو وتغذية الأطفال، التطعيمات، وعلاج أمراض الجهاز التنفسي والحساسية لدى الأطفال.',
        en: 'Specialized in pediatric growth monitoring, clinical nutrition, immunizations, and pediatric respiratory care.',
      },
      photoUrl: '/assets/aistudio/logo_ae3842b8.png',
      qualifications: {
        ar: ['ماجستير طب الأطفال وحديثي الولادة', 'استشاري تغذية علاجية للأطفال'],
        en: ['M.Sc. in Pediatrics & Neonatology', 'Pediatric Clinical Nutrition Specialist'],
      },
      scheduleSummary: {
        ar: 'الأحد، الثلاثاء، الخميس (01:00 ظ – 06:00 م)',
        en: 'Sun, Tue, Thu (01:00 PM – 06:00 PM)',
      },
      consultationFee: 250,
      currency: 'EGP',
      published: true,
      order: 2,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'doc-3',
      clinicId: 'soli-dental-and-care-center',
      name: {
        ar: 'د. كريم حسن المنشاوي',
        en: 'Dr. Karim Hassan El-Menshawy',
      },
      title: {
        ar: 'استشاري طب وجراحة الفم والأسنان',
        en: 'Consultant of Oral & Dental Surgery',
      },
      specialty: {
        ar: 'طب وجراحة وتجميل الأسنان',
        en: 'Restorative & Cosmetic Dentistry',
      },
      bio: {
        ar: 'متخصص في علاج الجذور الرقمي، التركيبات الثابتة، وزراعة الأسنان بدون ألم بأحدث تقنيات التعقيم والتشخيص.',
        en: 'Specialized in digital endodontics, fixed prosthodontics, and guided dental implants with strict sterilization protocols.',
      },
      photoUrl: '/assets/aistudio/logo_ae3842b8.png',
      qualifications: {
        ar: ['ماجستير التركيبات وعلاج الجذور', 'زمالة زراعة الأسنان التجميلية'],
        en: ['M.Sc. in Prosthodontics & Endodontics', 'Fellowship in Implant Dentistry'],
      },
      scheduleSummary: {
        ar: 'يومياً عدا الجمعة (02:00 ظ – 09:00 م)',
        en: 'Daily except Friday (02:00 PM – 09:00 PM)',
      },
      consultationFee: 250,
      currency: 'EGP',
      published: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ],
  services: [
    {
      id: 'srv-1',
      clinicId: 'al-noor-charity-medical-complex',
      name: {
        ar: 'كشف باطنة وقلب شامل + رسم قلب (ECG)',
        en: 'Comprehensive Internal Medicine Exam + ECG',
      },
      category: {
        ar: 'عيادة الباطنة والقلب',
        en: 'Internal Medicine & Cardiology',
      },
      description: {
        ar: 'فحص سريري كامل مع تخطيط القلب الكهربائي ومراجعة الأدوية وخطة العلاج.',
        en: 'Full clinical examination with 12-lead resting ECG and medication review.',
      },
      price: 350,
      currency: 'EGP',
      durationMinutes: 30,
      popular: true,
      published: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'srv-2',
      clinicId: 'al-noor-charity-medical-complex',
      name: {
        ar: 'كشف أطفال ومتابعة نمو وتغذية',
        en: 'Pediatric Consultation & Growth Assessment',
      },
      category: {
        ar: 'عيادة الأطفال',
        en: 'Pediatrics Clinic',
      },
      description: {
        ar: 'فحص شامل للطفل مع قياس مؤشرات النمو والوزن والطول وتحديث جدول التطعيمات.',
        en: 'Complete pediatric checkup including growth chart percentiles and nutrition plan.',
      },
      price: 250,
      currency: 'EGP',
      durationMinutes: 25,
      popular: true,
      published: true,
      order: 2,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'srv-3',
      clinicId: 'al-noor-charity-medical-complex',
      name: {
        ar: 'موجات صوتية على البطن والحوض (سونار)',
        en: 'Abdominal & Pelvic Ultrasound Scan',
      },
      category: {
        ar: 'الأشعة التشخيصية',
        en: 'Diagnostic Imaging',
      },
      description: {
        ar: 'فحص بالموجات فوق الصوتية عالي الدقة مع تقرير طبي فوري مطبوع ورقمي.',
        en: 'High-resolution diagnostic ultrasound with immediate printed and digital report.',
      },
      price: 300,
      currency: 'EGP',
      durationMinutes: 20,
      popular: false,
      published: true,
      order: 3,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'srv-4',
      clinicId: 'soli-dental-and-care-center',
      name: {
        ar: 'كشف وتشخيص رقمي شامل للأسنان + خطة علاجية',
        en: 'Digital Dental Examination & Treatment Plan',
      },
      category: {
        ar: 'التشخيص والفحص',
        en: 'Diagnostics',
      },
      description: {
        ar: 'فحص كامل للفم والأسنان بالكاميرا الفموية ووضع خطة علاجية مفصلة بالتكلفة.',
        en: 'Intraoral camera inspection with a transparent step-by-step treatment plan.',
      },
      price: 250,
      currency: 'EGP',
      durationMinutes: 25,
      popular: true,
      published: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'srv-5',
      clinicId: 'soli-dental-and-care-center',
      name: {
        ar: 'تنظيف الجير وتلميع الأسنان بالموجات فوق الصوتية',
        en: 'Ultrasonic Scaling & Polishing',
      },
      category: {
        ar: 'الوقاية واللثة',
        en: 'Preventive Care',
      },
      description: {
        ar: 'إزالة التكلسات الجيرية والتصبغات السطحية مع جلسة وقاية للثة.',
        en: 'Complete ultrasonic calculus removal, stain polishing, and gum care.',
      },
      price: 600,
      currency: 'EGP',
      durationMinutes: 40,
      popular: true,
      published: true,
      order: 2,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ],
  articles: [
    {
      id: 'article-single-clinic-vs-complex',
      slug: 'single-clinic-vs-medical-complex-software',
      title: {
        ar: 'لماذا لا يصلح نظام واحد بنفس الشكل لعيادة الطبيب الواحد والمجمع الطبي؟',
        en: 'Why Single-Doctor Clinics and Medical Complexes Need Distinct Software Architectures',
      },
      excerpt: {
        ar: 'قراءة عملية من واقع تشغيل العيادات والمجمعات الطبية في مصر: كيف تختلف نقطة البداية بين الطبيب الفرد وبين إدارة مجمع متعدد الأقسام.',
        en: 'Field insights from operating clinics and medical complexes in Egypt: how operational priorities differ between solo physicians and multi-department directors.',
      },
      content: {
        ar: `## البداية من واقع المنشأة لا من قوائم المزايا العامة

عندما يتحدث مطورو البرمجيات عن "نظام إدارة طبي"، غالباً ما يقعون في خطأ شائع: تقديم شاشة واحدة مزدحمة بعشرات القوائم لكل من العيادة الفردية الصغيرة والمجمع الطبي الكبير.

في الواقع العملي اليومي، تختلف رحلة العمل جذرياً بين النموذجين:

### 1. عيادة الطبيب الواحد: السرعة والوضوح أولاً
في عيادة الطبيب الواحد، صاحب القرار هو الطبيب نفسه، والفريق يتكون غالباً من الطبيب وموظف أو اثنين في الاستقبال. ما يحتاجه الطبيب هنا ليس نظام محاسبة معقداً، بل:
- معرفة من في قائمة الانتظار بالخارج بلمحة واحدة.
- فتح ملف المريض، الاطلاع على زياراته السابقة، وكتابة الروشتة في أقل من دقيقتين.
- ضبط الفاتورة والخزينة اليومية في الاستقبال دون أخطاء.

### 2. المجمع الطبي أو المستشفى الصغير: الرؤية التشغيلية والرقابة
عندما تتعدد العيادات التخصصية والوحدات (باطنة، أطفال، أسنان، معمل، أشعة)، ينتقل التحدي من "غرفة الكشف" إلى "الإدارة والربط":
- كيف نوزع صلاحيات المستخدمين بحيث يرى كل موظف قسمه فقط؟
- كيف نربط شباك الحجز المركزي بجميع العيادات؟
- كيف نراجع إيراد كل عيادة، ونسب الأطباء، والمصروفات اليومية في تقرير موحد؟

### الخلاصة الهندسية
النجاح في البرمجيات الصحية العربية لا يقاس بكثرة الأزرار، بل بمدى احترام النظام لوقت الطبيب وموظف الاستقبال ومدير المنشأة.`,
        en: `## Starting From Clinical Reality Rather Than Feature Checklists

When software vendors pitch a generic "Medical ERP", they frequently make a critical architectural mistake: forcing the exact same bloated interface onto a solo physician's clinic and a 15-department polyclinic.

From real-world deployment inside Egyptian healthcare facilities, the operational priorities of these two environments are fundamentally different:

### 1. The Solo Physician Clinic: Speed and Zero Friction
In a single-doctor clinic, the physician is the primary decision-maker, supported by one or two receptionists. The core workflow requires:
- Instant visibility of the live waiting room queue.
- Opening a patient's medical dossier, reviewing past visits, and printing a clean e-prescription in under two minutes.
- Accurate daily cash desk balancing at reception.

### 2. The Multi-Department Medical Complex: Governance & Unified Visibility
Once multiple specialty clinics, diagnostic units, and cashier desks operate together, the challenge shifts from a single consultation room to facility-wide orchestration:
- Granular role-based access control (RBAC) across receptionists, doctors, and accountants.
- Centralized ticketing and patient routing across specialties.
- Shift closing, physician revenue share calculation, and departmental P&L reporting.

### Engineering Takeaway
Great Arabic healthcare software is measured not by how many menus it hides behind a sidebar, but by how naturally it supports the daily rhythm of doctors, receptionists, and facility directors.`,
      },
      category: {
        ar: 'هندسة الأنظمة الطبية',
        en: 'Healthcare Systems Engineering',
      },
      tags: ['Soli Medical', 'RTL Software', 'Clinic Management', 'Medical Complex'],
      coverImage: '/assets/aistudio/logo_ae3842b8.png',
      readingTimeMinutes: 4,
      authorName: {
        ar: 'أحمد سليمان',
        en: 'Ahmed Soliman',
      },
      featured: true,
      published: true,
      order: 1,
      seo: {
        title: {
          ar: 'الفرق بين نظام عيادة الطبيب الواحد ونظام المجمع الطبي | مدونة أحمد سليمان',
          en: 'Single-Doctor Clinic vs Medical Complex Software | Ahmed Soliman Blog',
        },
        description: {
          ar: 'مقال تحليلي بقلم المهندس أحمد سليمان حول الفروق الجوهرية في تصميم وتشغيل أنظمة العيادات الفردية والمجمعات الطبية.',
          en: 'Analytical article by Ahmed Soliman on architectural differences between single-doctor clinics and medical complexes.',
        },
        ogImage: '/assets/aistudio/logo_ae3842b8.png',
        canonicalSlug: '/blog/single-clinic-vs-medical-complex-software',
        structuredDataType: 'BlogPosting',
      },
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'article-standalone-clinic-landing-pages',
      slug: 'why-clinics-need-standalone-landing-pages',
      title: {
        ar: 'كيف ترفع صفحات الهبوط الطبية المستقلة ومحادثات تليجرام/واتساب معدل الحجز في العيادات؟',
        en: 'How Standalone Medical Landing Pages & Telegram/WhatsApp Bots Boost Clinic Bookings',
      },
      excerpt: {
        ar: 'لماذا يغادر المريض صفحات التواصل الاجتماعي دون حجز؟ وكيف تساعد صفحة الهبوط المستقلة للعيادة في تحويل الزائر إلى موعد مؤكد.',
        en: 'Why patients drop off on crowded social media pages, and how a focused standalone clinic landing page converts visitors into confirmed appointments.',
      },
      content: {
        ar: `## رحلة المريض الرقمية تبدأ بالسؤال عن 3 أشياء

عندما يبحث المريض عن طبيب أو مركز طبي، فإنه يبحث عن إجابات فورية وواضحة لثلاثة أسئلة:
1. من هو الطبيب وما تخصصه ومؤهلاته؟
2. ما هي الخدمات المتاحة وكم تبلغ تكلفة الكشف؟
3. متى تعمل العيادة وكيف أحجز موعدي الآن دون انتظار على الهاتف؟

### أهمية نمط العرض المستقل (Standalone Landing Layout)
بدلاً من إرسال المريض إلى موقع مزدحم بالروابط الخارجية، توفر صفحة الهبوط المستقلة للعيادة مساراً صافياً يعرض بيانات العيادة فقط مع زر تواصل وحجز فوري عبر واتساب أو بوت تليجرام \`@SoliMedicalproBot\`، مما يضاعف معدل تحويل الزوار من الحملات الإعلانية إلى حجوزات فعلية.`,
        en: `## The Patient's Digital Journey Starts With Three Questions

When a patient looks up a clinic or specialist online, they want immediate, trustworthy answers to three questions:
1. Who is the physician and what are their credentials?
2. What services are offered and what is the consultation fee?
3. What are the working hours and how can I book right now without waiting on hold?

### The Power of a Standalone Landing Layout
Instead of sending patients to a cluttered directory or social feed, a dedicated Standalone Medical Landing Page presents only the clinic's doctors, transparent pricing, schedule, and one-tap WhatsApp or Telegram Bot (\`@SoliMedicalproBot\`) booking—dramatically increasing conversion rates from digital campaigns.`,
      },
      category: {
        ar: 'التحول الرقمي للعيادات',
        en: 'Clinic Digital Growth',
      },
      tags: ['Medical Landing Pages', 'Telegram Bot', 'Patient Conversion', 'Healthcare UX'],
      coverImage: '/assets/aistudio/1770146906397_16665dd0.png',
      readingTimeMinutes: 3,
      authorName: {
        ar: 'أحمد سليمان',
        en: 'Ahmed Soliman',
      },
      featured: false,
      published: true,
      order: 2,
      seo: {
        title: {
          ar: 'أهمية صفحات الهبوط الطبية المستقلة وبوت الحجز للعيادات | أحمد سليمان',
          en: 'Standalone Medical Landing Pages & Booking Automation | Ahmed Soliman',
        },
        description: {
          ar: 'كيف تساعد صفحات الهبوط المستقلة وبوتات الحجز عبر تليجرام وواتساب في زيادة حجوزات العيادات والمراكز الطبية.',
          en: 'How standalone clinic landing pages and automated Telegram/WhatsApp flows increase patient bookings.',
        },
        ogImage: '/assets/aistudio/1770146906397_16665dd0.png',
        canonicalSlug: '/blog/why-clinics-need-standalone-landing-pages',
        structuredDataType: 'BlogPosting',
      },
      createdAt: NOW,
      updatedAt: NOW,
    },
  ],
  media: [
    {
      id: 'media-ahmed-portrait',
      publicId: 'local/ahmed-soliman-portrait',
      secureUrl: '/assets/aistudio/1770146906397_16665dd0.png',
      format: 'png',
      width: 900,
      height: 1200,
      alt: {
        ar: 'المهندس أحمد سليمان — مطوّر أنظمة العيادات والبرمجيات الصحية',
        en: 'Ahmed Soliman — Healthcare Systems Architect & Full-Stack Developer',
      },
      category: 'profile',
      createdAt: NOW,
    },
    {
      id: 'media-soli-medical-logo',
      publicId: 'local/soli-medical-logo',
      secureUrl: '/assets/aistudio/logo_ae3842b8.png',
      format: 'png',
      width: 512,
      height: 512,
      alt: {
        ar: 'شعار نظام Soli Medical لإدارة العيادات والمجمعات الطبية',
        en: 'Soli Medical Clinic & Healthcare Complex System Logo',
      },
      category: 'project',
      createdAt: NOW,
    },
  ],
};
