export type Locale = 'ar' | 'en';
export type ThemeMode = 'dark' | 'light';
export type LayoutMode = 'public' | 'standalone' | 'admin';

export interface BilingualText {
  ar: string;
  en: string;
}

export interface SEOConfig {
  title: BilingualText;
  description: BilingualText;
  ogImage?: string;
  canonicalSlug?: string;
  noindex?: boolean;
  structuredDataType?: 'Person' | 'SoftwareApplication' | 'MedicalClinic' | 'BlogPosting' | 'WebSite';
}

export interface AdminRecord {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: 'owner' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  id: string;
  brandName: BilingualText;
  tagline: BilingualText;
  ownerName: BilingualText;
  ownerRole: BilingualText;
  avatarUrl: string;
  primaryColor: string;
  navyColor: string;
  defaultLocale: Locale;
  defaultTheme: ThemeMode;
  whatsappNumber: string;
  whatsappUrl: string;
  telegramBotUrl: string;
  facebookUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  contactEmail: string;
  location: BilingualText;
  published: boolean;
  seo: SEOConfig;
  updatedAt: string;
}

export type CmsPageType = 'core' | 'landing' | 'general';
export type PageLayoutVariant = 'editorial' | 'landing-hero' | 'campaign' | 'article-page' | 'home';

export interface PageContentBlock {
  id: string;
  title: BilingualText;
  body: BilingualText;
  imageUrl?: string;
  ctaLabel?: BilingualText;
  ctaHref?: string;
}

export interface PageSectionVisibility {
  heroImage?: boolean;
  body?: boolean;
  highlights?: boolean;
  metrics?: boolean;
  timeline?: boolean;
  blocks?: boolean;
  cta?: boolean;
}

export interface PageConfig {
  id: string;
  slug: string;
  title: BilingualText;
  kicker: BilingualText;
  headline: BilingualText;
  subheadline: BilingualText;
  biography: BilingualText;
  highlights: {
    ar: string[];
    en: string[];
  };
  metrics: {
    value: string;
    label: BilingualText;
  }[];
  experienceTimeline: {
    period: BilingualText;
    role: BilingualText;
    organization: BilingualText;
    description: BilingualText;
  }[];
  skills: {
    category: BilingualText;
    items: string[];
  }[];
  qualifications?: {
    degree: BilingualText;
    institution: BilingualText;
    year: string;
    details: BilingualText;
  }[];
  achievements?: {
    title: BilingualText;
    metric: string;
    description: BilingualText;
  }[];
  interests?: {
    ar: string[];
    en: string[];
  };
  heroImage: string;
  standaloneByDefault: boolean;
  published: boolean;
  order: number;
  seo: SEOConfig;
  createdAt: string;
  updatedAt: string;
  // Phase 8 Task C: Extended optional fields for custom CMS pages, blocks, archive/trash & core protection
  pageType?: CmsPageType;
  layoutVariant?: PageLayoutVariant;
  isCore?: boolean;
  archived?: boolean;
  archivedAt?: string;
  accentColor?: string;
  ctaLabel?: BilingualText;
  ctaHref?: string;
  additionalImages?: string[];
  blocks?: PageContentBlock[];
  sectionVisibility?: PageSectionVisibility;
}

export interface ProjectComparisonRow {
  axis: BilingualText;
  singleClinic: BilingualText;
  medicalComplex: BilingualText;
}

export interface ProjectScreenItem {
  id: string;
  title: BilingualText;
  caption: BilingualText;
  imageUrl: string;
}

export interface ProjectItem {
  id: string;
  slug: string;
  title: BilingualText;
  kicker: BilingualText;
  summary: BilingualText;
  description: BilingualText;
  problem?: BilingualText;
  solution?: BilingualText;
  category:
    | 'medical-systems'
    | 'charitable-healthcare'
    | 'automation-bots'
    | 'web-platforms'
    | 'quality-systems'
    | 'inventory-erp';
  categoryLabel: BilingualText;
  coverImage: string;
  logoImage?: string;
  videoUrl?: string;
  youtubeId?: string;
  liveUrl?: string;
  showcaseRoute?: string;
  whatsappInquireText: BilingualText;
  features: {
    ar: string[];
    en: string[];
  };
  techStack: string[];
  screens: ProjectScreenItem[];
  comparisonTable?: ProjectComparisonRow[];
  featured: boolean;
  published: boolean;
  order: number;
  seo: SEOConfig;
  createdAt: string;
  updatedAt: string;
}

export interface WorkingHourSlot {
  days: BilingualText;
  hours: BilingualText;
  isOpen: boolean;
}

export interface ClinicItem {
  id: string;
  slug: string;
  name: BilingualText;
  specialtyBadge: BilingualText;
  tagline: BilingualText;
  description: BilingualText;
  coverImage: string;
  logoUrl?: string;
  themeColor?: string;
  galleryImages?: string[];
  phone: string;
  whatsapp: string;
  telegramUrl?: string;
  address: BilingualText;
  city: BilingualText;
  mapEmbedUrl?: string;
  workingHours: WorkingHourSlot[];
  highlights: {
    ar: string[];
    en: string[];
  };
  standaloneByDefault: boolean;
  published: boolean;
  order: number;
  seo: SEOConfig;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorItem {
  id: string;
  clinicId: string;
  name: BilingualText;
  title: BilingualText;
  specialty: BilingualText;
  bio: BilingualText;
  photoUrl: string;
  qualifications: {
    ar: string[];
    en: string[];
  };
  scheduleSummary: BilingualText;
  consultationFee: number;
  currency: string;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceItem {
  id: string;
  clinicId: string;
  name: BilingualText;
  category: BilingualText;
  description: BilingualText;
  price: number;
  currency: string;
  durationMinutes: number;
  popular?: boolean;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleItem {
  id: string;
  slug: string;
  title: BilingualText;
  excerpt: BilingualText;
  content: BilingualText;
  category: BilingualText;
  tags: string[];
  coverImage: string;
  readingTimeMinutes: number;
  authorName: BilingualText;
  featured: boolean;
  published: boolean;
  order: number;
  seo: SEOConfig;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  publicId: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes?: number;
  alt: BilingualText;
  category: 'profile' | 'project' | 'clinic' | 'blog' | 'general';
  createdAt: string;
}

export interface PlatformDatabase {
  admins: AdminRecord[];
  siteSettings: SiteSettings;
  pages: PageConfig[];
  projects: ProjectItem[];
  clinics: ClinicItem[];
  doctors: DoctorItem[];
  services: ServiceItem[];
  articles: ArticleItem[];
  media: MediaAsset[];
}
