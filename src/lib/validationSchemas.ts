import {
  PlatformDatabase,
  ProjectItem,
  ClinicItem,
  DoctorItem,
  ServiceItem,
  ArticleItem,
  PageConfig,
  MediaAsset,
  SiteSettings,
} from '../types/cms';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit for free-tier friendliness
const SAFE_FOLDER_REGEX = /^[a-zA-Z0-9/_-]{1,64}$/;

/**
 * Strips XSS vectors (<script>, <iframe>, <object>, inline event handlers, javascript:/data:text/html URIs)
 * from any user-provided or admin-provided string.
 */
export function sanitizeText(input: string, maxLength = 25000): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*(iframe|object|embed|applet|meta|link|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|applet|meta|link)[^>]*\/?>/gi, '')
    .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '');
}

/**
 * Ensures URLs only use safe protocols (https://, http://, mailto:, tel:, or relative paths /).
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  const rawTrimmed = url.trim();
  if (!rawTrimmed) return '';
  if (/^(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i.test(rawTrimmed)) {
    return '';
  }
  return sanitizeText(rawTrimmed, 2048);
}

/**
 * Recursively sanitizes all string fields in an arbitrary payload object or array
 * to prevent stored XSS across both Firestore and Express persistence.
 */
export function sanitizePayload<T>(input: T): T {
  if (typeof input === 'string') {
    return sanitizeText(input) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizePayload(item)) as unknown as T;
  }
  if (input && typeof input === 'object') {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(input as Record<string, any>)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      if (
        typeof val === 'string' &&
        (key.toLowerCase().includes('url') ||
          key.toLowerCase().includes('href') ||
          key.toLowerCase().includes('image') ||
          key === 'whatsapp')
      ) {
        out[key] = sanitizeUrl(val);
      } else {
        out[key] = sanitizePayload(val);
      }
    }
    return out as T;
  }
  return input;
}

export function validateCloudinaryFolder(folder: string): boolean {
  return (
    typeof folder === 'string' &&
    SAFE_FOLDER_REGEX.test(folder) &&
    !folder.includes('..') &&
    !folder.startsWith('/')
  );
}

export function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validateSlug(slug: string): boolean {
  return (
    typeof slug === 'string' &&
    slug.length >= 2 &&
    slug.length <= 120 &&
    SLUG_REGEX.test(slug)
  );
}

export function validateImageUploadFile(file: { type: string; size: number }): ValidationResult {
  const errors: string[] = [];
  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
    errors.push(
      `Unsupported file format (${file.type || 'unknown'}). Allowed formats: JPG, PNG, WebP, AVIF.`
    );
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    errors.push(`File size (${sizeMb} MB) exceeds the 5.00 MB maximum limit.`);
  }
  if (file.size <= 0) {
    errors.push('Selected file is empty.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateProjectPayload(project: Partial<ProjectItem>): ValidationResult {
  const errors: string[] = [];
  if (!project.title?.ar?.trim() || !project.title?.en?.trim()) {
    errors.push('Project title is required in both Arabic and English.');
  }
  if (!project.slug || !validateSlug(project.slug)) {
    errors.push(
      'Project slug must be lowercase alphanumeric with hyphens (e.g. soli-medical-system).'
    );
  }
  if (!project.summary?.ar?.trim() || !project.summary?.en?.trim()) {
    errors.push('Project summary is required in both Arabic and English.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateClinicPayload(clinic: Partial<ClinicItem>): ValidationResult {
  const errors: string[] = [];
  if (!clinic.name?.ar?.trim() || !clinic.name?.en?.trim()) {
    errors.push('Clinic name is required in both Arabic and English.');
  }
  if (!clinic.slug || !validateSlug(clinic.slug)) {
    errors.push('Clinic slug must be lowercase alphanumeric with hyphens (e.g. al-noor-clinic).');
  }
  if (!clinic.phone?.trim() && !clinic.whatsapp?.trim()) {
    errors.push('At least one contact method (Phone or WhatsApp) is required.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateDoctorPayload(doctor: Partial<DoctorItem>): ValidationResult {
  const errors: string[] = [];
  if (!doctor.name?.ar?.trim() || !doctor.name?.en?.trim()) {
    errors.push('Doctor name is required in both Arabic and English.');
  }
  if (!doctor.clinicId?.trim()) {
    errors.push('Doctor must be linked to a valid clinic.');
  }
  if (!doctor.specialty?.ar?.trim() || !doctor.specialty?.en?.trim()) {
    errors.push('Doctor specialty is required in both Arabic and English.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateServicePayload(service: Partial<ServiceItem>): ValidationResult {
  const errors: string[] = [];
  if (!service.name?.ar?.trim() || !service.name?.en?.trim()) {
    errors.push('Service name is required in both Arabic and English.');
  }
  if (!service.clinicId?.trim()) {
    errors.push('Service must be linked to a valid clinic.');
  }
  if (typeof service.price !== 'number' || Number.isNaN(service.price) || service.price < 0) {
    errors.push('Service price must be a non-negative number.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateArticlePayload(article: Partial<ArticleItem>): ValidationResult {
  const errors: string[] = [];
  if (!article.title?.ar?.trim() || !article.title?.en?.trim()) {
    errors.push('Article title is required in both Arabic and English.');
  }
  if (!article.slug || !validateSlug(article.slug)) {
    errors.push('Article slug must be lowercase alphanumeric with hyphens.');
  }
  if (!article.content?.ar?.trim() || !article.content?.en?.trim()) {
    errors.push('Article content is required in both Arabic and English.');
  }
  return { valid: errors.length === 0, errors };
}

export const CORE_PAGE_IDS = [
  'home',
  'about',
  'projects',
  'clinics',
  'blog',
  'solimedical',
  'page-about',
] as const;

export const RESERVED_PAGE_SLUGS = [
  'home',
  'about',
  'projects',
  'clinics',
  'blog',
  'solimedical',
  'landing',
  'p',
  'admin',
  'api',
  'campaign',
  'ar',
  'en',
  'sitemap',
  'robots',
] as const;

export function isCoreProtectedPage(pageOrId: Partial<PageConfig> | string | undefined | null): boolean {
  if (!pageOrId) return false;
  if (typeof pageOrId === 'string') {
    return (CORE_PAGE_IDS as readonly string[]).includes(pageOrId);
  }
  const id = String(pageOrId.id || '').trim().toLowerCase();
  const slug = String(pageOrId.slug || '').trim().toLowerCase();
  return (
    Boolean(pageOrId.isCore) ||
    pageOrId.pageType === 'core' ||
    (CORE_PAGE_IDS as readonly string[]).includes(id) ||
    (CORE_PAGE_IDS as readonly string[]).includes(slug)
  );
}

export function getPageCanonicalPath(
  page: Partial<PageConfig>,
  locale: 'ar' | 'en' = 'ar'
): string {
  const slug = String(page.slug || '').trim().toLowerCase();
  const isCore = isCoreProtectedPage(page);

  if (isCore || slug === 'home' || page.id === 'home') {
    if (slug === 'home' || page.id === 'home') return `/${locale}`;
    if (slug === 'about' || page.id === 'about' || page.id === 'page-about') {
      return `/${locale}/about`;
    }
    if (slug === 'projects' || page.id === 'projects') return `/${locale}/projects`;
    if (slug === 'clinics' || page.id === 'clinics') return `/${locale}/clinics`;
    if (slug === 'blog' || page.id === 'blog') return `/${locale}/blog`;
    if (slug === 'solimedical' || page.id === 'solimedical') return `/${locale}/solimedical`;
  }

  const cleanSlug = slug || 'page';
  if (page.pageType === 'landing') {
    return `/${locale}/landing/${cleanSlug}`;
  }
  return `/${locale}/p/${cleanSlug}`;
}

export function validatePageSlug(
  rawSlug: string,
  options?: {
    editingId?: string;
    isCore?: boolean;
    existingPages?: PageConfig[];
  }
): ValidationResult {
  const errors: string[] = [];
  const slug = String(rawSlug || '').trim().toLowerCase();

  if (!slug || !validateSlug(slug)) {
    errors.push(
      'Page slug must be 2–120 lowercase alphanumeric characters or hyphens (e.g. clinic-launch-offer).'
    );
    return { valid: false, errors };
  }

  if (!options?.isCore && (RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) {
    errors.push(
      `Slug "${slug}" is reserved for core platform routes and cannot be used for a custom page.`
    );
  }

  if (options?.existingPages && Array.isArray(options.existingPages)) {
    const duplicate = options.existingPages.find(
      (p) => p.slug?.toLowerCase() === slug && p.id !== options.editingId
    );
    if (duplicate) {
      errors.push(
        `Slug "${slug}" is already used by another page ("${duplicate.title?.en || duplicate.title?.ar || duplicate.id}").`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export function checkPageInSiteReferences(
  page: Partial<PageConfig>,
  db: PlatformDatabase
): { inUse: boolean; usedIn: string[] } {
  const usedIn: string[] = [];
  const slug = String(page.slug || '').trim().toLowerCase();
  if (!slug) return { inUse: false, usedIn };

  const patterns = [`/landing/${slug}`, `/p/${slug}`];
  const containsRef = (text?: string) => {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();
    return patterns.some((pat) => lower.includes(pat));
  };

  for (const art of db.articles || []) {
    if (art.id && (containsRef(art.content?.ar) || containsRef(art.content?.en) || containsRef(art.seo?.canonicalSlug))) {
      usedIn.push(`Article: ${art.title?.en || art.title?.ar || art.slug}`);
    }
  }

  for (const proj of db.projects || []) {
    if (
      containsRef(proj.showcaseRoute) ||
      containsRef(proj.liveUrl) ||
      containsRef(proj.description?.ar) ||
      containsRef(proj.description?.en)
    ) {
      usedIn.push(`Project: ${proj.title?.en || proj.title?.ar || proj.slug}`);
    }
  }

  for (const other of db.pages || []) {
    if (other.id === page.id || other.archived) continue;
    const inBlocks = (other.blocks || []).some(
      (b) => containsRef(b.ctaHref) || containsRef(b.body?.ar) || containsRef(b.body?.en)
    );
    if (
      containsRef(other.ctaHref) ||
      containsRef(other.biography?.ar) ||
      containsRef(other.biography?.en) ||
      inBlocks
    ) {
      usedIn.push(`Page: ${other.title?.en || other.title?.ar || other.slug}`);
    }
  }

  return { inUse: usedIn.length > 0, usedIn };
}

export function validatePagePayload(page: Partial<PageConfig>): ValidationResult {
  const errors: string[] = [];
  if (!page.title?.ar?.trim() || !page.title?.en?.trim()) {
    errors.push('Page title is required in both Arabic and English.');
  }
  if (!page.headline?.ar?.trim() || !page.headline?.en?.trim()) {
    errors.push('Page headline is required in both Arabic and English.');
  }
  const isCore = isCoreProtectedPage(page);
  if (page.slug || !isCore) {
    const slugCheck = validatePageSlug(page.slug || '', { isCore });
    if (!slugCheck.valid) {
      errors.push(...slugCheck.errors);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateSiteSettingsPayload(settings: Partial<SiteSettings>): ValidationResult {
  const errors: string[] = [];
  if (!settings.brandName?.ar?.trim() || !settings.brandName?.en?.trim()) {
    errors.push('Brand name is required in both Arabic and English.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateMediaAssetPayload(media: Partial<MediaAsset>): ValidationResult {
  const errors: string[] = [];
  if (!media.publicId?.trim() || !media.secureUrl?.trim()) {
    errors.push('Media publicId and secureUrl are required.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateCollectionRecord(
  collectionName: string,
  payload: Record<string, any>
): ValidationResult {
  switch (collectionName) {
    case 'projects':
      return validateProjectPayload(payload);
    case 'clinics':
      return validateClinicPayload(payload);
    case 'doctors':
      return validateDoctorPayload(payload);
    case 'services':
      return validateServicePayload(payload);
    case 'articles':
      return validateArticlePayload(payload);
    case 'pages':
      return validatePagePayload(payload);
    case 'media':
      return validateMediaAssetPayload(payload);
    case 'siteSettings':
      return validateSiteSettingsPayload(payload);
    default:
      return { valid: false, errors: [`Unknown collection: ${collectionName}`] };
  }
}

/**
 * Validates and sanitizes the public Contact / WhatsApp Consultation Builder form
 * (enforces PROMPT 5.2: input validation, XSS prevention, and honeypot bot protection).
 */
export function validateConsultationForm(input: {
  name?: string;
  role?: string;
  facilityType?: string;
  message?: string;
  websiteHoneypot?: string;
}): ValidationResult & {
  sanitized: {
    name: string;
    role: string;
    facilityType: string;
    message: string;
  };
} {
  const errors: string[] = [];
  if (input.websiteHoneypot && input.websiteHoneypot.trim().length > 0) {
    errors.push('Automated bot submission rejected.');
  }

  const name = sanitizeText(input.name || '', 100).trim();
  const role = sanitizeText(input.role || '', 100).trim();
  const facilityType = sanitizeText(input.facilityType || '', 120).trim();
  const message = sanitizeText(input.message || '', 1500).trim();

  if (!message || message.length < 3) {
    errors.push('Please enter a valid inquiry message (at least 3 characters).');
  }
  if ((input.message || '').length > 1500) {
    errors.push('Inquiry message must not exceed 1500 characters.');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: { name, role, facilityType, message },
  };
}

/**
 * Checks whether a media asset (by secureUrl or publicId) is currently referenced
 * in ANY published record across projects, clinics, doctors, articles, pages, or siteSettings.
 * Enforces PROMPT 4.4: "عند حذف صورة، تحقق من عدم استخدامها في محتوى منشور قبل حذفها نهائياً من Cloudinary."
 */
export function checkMediaInPublishedContent(
  asset: Pick<MediaAsset, 'secureUrl' | 'publicId'>,
  db: PlatformDatabase
): { inUse: boolean; usedIn: string[] } {
  const usedIn: string[] = [];
  const url = asset.secureUrl;

  if (!url) return { inUse: false, usedIn };

  if (db.siteSettings?.published) {
    if (db.siteSettings.avatarUrl === url || db.siteSettings.seo?.ogImage === url) {
      usedIn.push(`Site Settings (${db.siteSettings.brandName.en})`);
    }
  }

  for (const page of db.pages || []) {
    if (page.published && (page.heroImage === url || page.seo?.ogImage === url)) {
      usedIn.push(`Page: ${page.title.en}`);
    }
  }

  for (const proj of db.projects || []) {
    if (!proj.published) continue;
    const inScreens = (proj.screens || []).some((s) => s.imageUrl === url);
    if (
      proj.coverImage === url ||
      proj.logoImage === url ||
      proj.seo?.ogImage === url ||
      inScreens
    ) {
      usedIn.push(`Project: ${proj.title.en}`);
    }
  }

  for (const clinic of db.clinics || []) {
    if (!clinic.published) continue;
    if (
      clinic.coverImage === url ||
      clinic.logoUrl === url ||
      clinic.seo?.ogImage === url
    ) {
      usedIn.push(`Clinic: ${clinic.name.en}`);
    }
  }

  for (const doc of db.doctors || []) {
    if (doc.published && doc.photoUrl === url) {
      usedIn.push(`Doctor: ${doc.name.en}`);
    }
  }

  for (const article of db.articles || []) {
    if (
      article.published &&
      (article.coverImage === url || article.seo?.ogImage === url)
    ) {
      usedIn.push(`Article: ${article.title.en}`);
    }
  }

  return {
    inUse: usedIn.length > 0,
    usedIn,
  };
}
