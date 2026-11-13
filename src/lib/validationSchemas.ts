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
 * Strips XSS vectors (<script>, <iframe>, <object>, inline event handlers, javascript:/data: URIs & base64 blobs)
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
    .replace(/(?:javascript|vbscript)\s*:/gi, '')
    .replace(/data\s*:\s*(?:text\/html|image\/svg\+xml|image\/[a-z0-9.+-]+\s*;\s*base64)[^\s"')>]*/gi, '');
}

/**
 * Ensures URLs only use safe protocols (https://, http://, mailto:, tel:, or relative paths /).
 * Blocks javascript:, vbscript:, and all data: URIs (including Base64 data:image/).
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  const rawTrimmed = url.trim();
  if (!rawTrimmed) return '';
  if (/^(?:javascript|vbscript|data)\s*:/i.test(rawTrimmed)) {
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
          key.toLowerCase() === 'src' ||
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

export function isBase64DataUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return (
    /^data\s*:/i.test(trimmed) ||
    /data\s*:\s*image\/[a-z0-9.+-]+\s*;\s*base64/i.test(trimmed)
  );
}

export function containsBase64ImagePayload(input: unknown): boolean {
  if (typeof input === 'string') {
    return isBase64DataUrl(input);
  }
  if (Array.isArray(input)) {
    return input.some((item) => containsBase64ImagePayload(item));
  }
  if (input && typeof input === 'object') {
    return Object.values(input as Record<string, unknown>).some((val) =>
      containsBase64ImagePayload(val)
    );
  }
  return false;
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
  if (containsBase64ImagePayload(project)) {
    errors.push('Base64 Data URL images are not allowed in project records. Upload to Cloudinary first.');
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
  if (containsBase64ImagePayload(clinic)) {
    errors.push('Base64 Data URL images are not allowed in clinic records. Upload to Cloudinary first.');
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
  if (containsBase64ImagePayload(doctor)) {
    errors.push('Base64 Data URL images are not allowed in doctor records. Upload to Cloudinary first.');
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

export function extractArticlePlainText(rawOrJson: unknown): string {
  if (!rawOrJson) return '';
  if (typeof rawOrJson === 'object') {
    const chunks: string[] = [];
    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (typeof node.text === 'string') {
        chunks.push(node.text);
      }
      if (Array.isArray(node.content)) {
        node.content.forEach(walk);
        chunks.push(' ');
      }
    };
    walk(rawOrJson);
    return chunks.join(' ').replace(/\s+/g, ' ').trim();
  }
  if (typeof rawOrJson !== 'string') return '';
  const trimmed = rawOrJson.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && (parsed.type === 'doc' || Array.isArray(parsed.content))) {
        return extractArticlePlainText(parsed);
      }
    } catch {
      // treat as regular string
    }
  }
  return trimmed
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countArticleWords(rawContent?: string, jsonDoc?: Record<string, any>): number {
  const plain = jsonDoc
    ? extractArticlePlainText(jsonDoc) || extractArticlePlainText(rawContent)
    : extractArticlePlainText(rawContent);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

export function estimateArticleReadingTime(arWords: number, enWords: number): number {
  const maxWords = Math.max(arWords || 0, enWords || 0);
  if (maxWords <= 0) return 1;
  return Math.max(1, Math.ceil(maxWords / 180));
}

export function validateArticleSlug(
  rawSlug: string,
  options?: {
    editingId?: string;
    existingArticles?: ArticleItem[];
  }
): ValidationResult {
  const errors: string[] = [];
  const slug = String(rawSlug || '').trim().toLowerCase();

  if (!slug || !validateSlug(slug)) {
    errors.push(
      'Article slug must be 2–120 lowercase alphanumeric characters with hyphens (e.g. icu-telemetry-guide).'
    );
    return { valid: false, errors };
  }

  if (options?.existingArticles && Array.isArray(options.existingArticles)) {
    const duplicate = options.existingArticles.find(
      (a) => a.slug?.toLowerCase() === slug && a.id !== options.editingId
    );
    if (duplicate) {
      errors.push(
        `Article slug "${slug}" is already used by another article ("${duplicate.title?.en || duplicate.title?.ar || duplicate.id}").`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export function checkArticleInSiteReferences(
  article: Partial<ArticleItem>,
  db: PlatformDatabase
): { inUse: boolean; usedIn: string[] } {
  const usedIn: string[] = [];
  const slug = String(article.slug || '').trim().toLowerCase();
  if (!slug) return { inUse: false, usedIn };

  const pattern = `/blog/${slug}`;
  const containsRef = (text?: string) => {
    if (!text || typeof text !== 'string') return false;
    return text.toLowerCase().includes(pattern);
  };

  for (const page of db.pages || []) {
    if (page.archived) continue;
    const inBlocks = (page.blocks || []).some(
      (b) => containsRef(b.ctaHref) || containsRef(b.body?.ar) || containsRef(b.body?.en)
    );
    if (
      containsRef(page.ctaHref) ||
      containsRef(page.biography?.ar) ||
      containsRef(page.biography?.en) ||
      inBlocks
    ) {
      usedIn.push(`Page: ${page.title?.en || page.title?.ar || page.slug}`);
    }
  }

  for (const proj of db.projects || []) {
    if (
      containsRef(proj.liveUrl) ||
      containsRef(proj.showcaseRoute) ||
      containsRef(proj.description?.ar) ||
      containsRef(proj.description?.en)
    ) {
      usedIn.push(`Project: ${proj.title?.en || proj.title?.ar || proj.slug}`);
    }
  }

  for (const other of db.articles || []) {
    if (other.id === article.id || other.archived) continue;
    if (containsRef(other.content?.ar) || containsRef(other.content?.en)) {
      usedIn.push(`Article: ${other.title?.en || other.title?.ar || other.slug}`);
    }
  }

  return { inUse: usedIn.length > 0, usedIn };
}

export function validateArticlePayload(
  article: Partial<ArticleItem>,
  options?: { existingArticles?: ArticleItem[] }
): ValidationResult {
  const errors: string[] = [];
  if (!article.title?.ar?.trim() || !article.title?.en?.trim()) {
    errors.push('Article title is required in both Arabic and English.');
  }
  const slugCheck = validateArticleSlug(article.slug || '', {
    editingId: article.id,
    existingArticles: options?.existingArticles,
  });
  if (!slugCheck.valid) {
    errors.push(...slugCheck.errors);
  }
  const arText =
    extractArticlePlainText(article.contentJson?.ar) ||
    extractArticlePlainText(article.content?.ar);
  const enText =
    extractArticlePlainText(article.contentJson?.en) ||
    extractArticlePlainText(article.content?.en);
  if (!arText || !enText) {
    errors.push('Article content is required in both Arabic and English.');
  }
  if (containsBase64ImagePayload(article)) {
    errors.push('Base64 Data URL images are not allowed in articles. Upload to Cloudinary first.');
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
  if (containsBase64ImagePayload(page)) {
    errors.push('Base64 Data URL images are not allowed in pages. Upload to Cloudinary first.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateSiteSettingsPayload(settings: Partial<SiteSettings>): ValidationResult {
  const errors: string[] = [];
  if (!settings.brandName?.ar?.trim() || !settings.brandName?.en?.trim()) {
    errors.push('Brand name is required in both Arabic and English.');
  }
  if (containsBase64ImagePayload(settings)) {
    errors.push('Base64 Data URL images are not allowed in site settings. Upload to Cloudinary first.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateMediaAssetPayload(media: Partial<MediaAsset>): ValidationResult {
  const errors: string[] = [];
  const publicId = typeof media.publicId === 'string' ? media.publicId.trim() : '';
  const secureUrl = typeof media.secureUrl === 'string' ? media.secureUrl.trim() : '';

  if (!publicId || !secureUrl) {
    errors.push('Media publicId and secureUrl are required.');
    return { valid: false, errors };
  }

  if (isBase64DataUrl(secureUrl) || isBase64DataUrl(publicId)) {
    errors.push(
      'Base64 Data URLs are forbidden in media records. Media must be uploaded to Cloudinary CDN.'
    );
  }

  if (publicId.startsWith('local/')) {
    errors.push(
      'Local fallback publicIds (local/*) are forbidden for new media uploads. Configure Cloudinary CDN.'
    );
  }

  if (!/^https?:\/\//i.test(secureUrl) && !secureUrl.startsWith('/assets/')) {
    errors.push('Media secureUrl must be a valid HTTPS Cloudinary URL or static /assets/ path.');
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
 * Canonicalizes a media URL so that Cloudinary URLs with transformation parameters
 * (e.g. /image/upload/f_auto,q_auto,w_1200/v171000/folder/asset.webp) normalize to the
 * same base identity as the raw secureUrl (/image/upload/folder/asset).
 */
export function normalizeMediaComparisonUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const cleaned = rawUrl.trim().split('?')[0].split('#')[0].trim();
  if (!cleaned) return '';

  // Handle Cloudinary delivery URLs with optional transformations and version numbers
  const cloudinaryMatch = cleaned.match(
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i
  );
  if (cloudinaryMatch) {
    const [, prefix, rest] = cloudinaryMatch;
    const segments = rest.split('/').filter(Boolean);
    // Strip leading transformation segments (contain commas or start with transformation keys like f_, q_, w_, h_, c_, dpr_, g_, e_, ar_, fl_)
    // and version segments (v12345678)
    while (segments.length > 1) {
      const head = segments[0];
      const isVersion = /^v\d+$/i.test(head);
      const isTransform =
        head.includes(',') ||
        /^(?:f|q|w|h|c|dpr|g|e|ar|fl|bo|r|o|a|b|co|l|u|t)_[a-z0-9._-]+$/i.test(head);
      if (isVersion || isTransform) {
        segments.shift();
      } else {
        break;
      }
    }
    const tail = segments.join('/');
    // Strip file extension on Cloudinary publicId tail so .webp / .jpg / .png delivery variants match
    const tailWithoutExt = tail.replace(/\.[a-z0-9]{2,5}$/i, '');
    return `${prefix.toLowerCase()}${tailWithoutExt}`;
  }

  return cleaned;
}

/**
 * Extracts all URL-like tokens or strings from arbitrary content (Tiptap JSON, Markdown, blocks, arrays)
 * and checks whether any of them match the target media asset's secureUrl or publicId.
 */
function doesContentReferenceMedia(
  content: unknown,
  rawTargetUrl: string,
  normalizedTargetUrl: string,
  targetPublicId: string
): boolean {
  if (!content) return false;

  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (!trimmed) return false;

    // 1. Direct string equality or substring match for raw secureUrl
    if (rawTargetUrl && trimmed.includes(rawTargetUrl)) {
      return true;
    }

    // 2. Normalized comparison for single URL string
    if (normalizedTargetUrl && !trimmed.includes(' ') && !trimmed.includes('\n')) {
      if (normalizeMediaComparisonUrl(trimmed) === normalizedTargetUrl) {
        return true;
      }
    }

    // 3. Check if publicId is referenced in URL/Markdown/JSON text
    if (
      targetPublicId &&
      targetPublicId.length >= 3 &&
      !targetPublicId.startsWith('local/') &&
      trimmed.includes(targetPublicId)
    ) {
      return true;
    }

    // 4. Extract URLs embedded inside Markdown or HTML or serialized JSON strings
    const urlMatches = trimmed.match(/https?:\/\/[^\s"')>\]]+|\/assets\/[^\s"')>\]]+/gi);
    if (urlMatches && normalizedTargetUrl) {
      for (const candidateUrl of urlMatches) {
        if (
          candidateUrl === rawTargetUrl ||
          normalizeMediaComparisonUrl(candidateUrl) === normalizedTargetUrl
        ) {
          return true;
        }
      }
    }

    // 5. If serialized JSON string, parse and inspect recursively
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return doesContentReferenceMedia(
          parsed,
          rawTargetUrl,
          normalizedTargetUrl,
          targetPublicId
        );
      } catch {
        // ignore invalid JSON
      }
    }

    return false;
  }

  if (Array.isArray(content)) {
    return content.some((item) =>
      doesContentReferenceMedia(item, rawTargetUrl, normalizedTargetUrl, targetPublicId)
    );
  }

  if (typeof content === 'object') {
    const obj = content as Record<string, unknown>;
    if (
      targetPublicId &&
      typeof obj.publicId === 'string' &&
      obj.publicId.trim() === targetPublicId
    ) {
      return true;
    }
    return Object.values(obj).some((val) =>
      doesContentReferenceMedia(val, rawTargetUrl, normalizedTargetUrl, targetPublicId)
    );
  }

  return false;
}

/**
 * Checks whether a media asset (by secureUrl or publicId) is currently referenced
 * in ANY published record across siteSettings, pages (hero, seo, additionalImages, blocks),
 * projects (cover, logo, seo, screens), clinics (cover, logo, seo, galleryImages),
 * doctors (photoUrl), or articles (cover, seo, Tiptap contentJson, Markdown content).
 * Archived pages and archived articles are excluded from active published usage.
 */
export function checkMediaInPublishedContent(
  asset: Pick<MediaAsset, 'secureUrl' | 'publicId'>,
  db: PlatformDatabase
): { inUse: boolean; usedIn: string[] } {
  const usedInSet = new Set<string>();
  const rawUrl = typeof asset?.secureUrl === 'string' ? asset.secureUrl.trim() : '';
  const normalizedUrl = normalizeMediaComparisonUrl(rawUrl);
  const publicId = typeof asset?.publicId === 'string' ? asset.publicId.trim() : '';

  if (!rawUrl && !publicId) {
    return { inUse: false, usedIn: [] };
  }

  const matches = (val: unknown) =>
    doesContentReferenceMedia(val, rawUrl, normalizedUrl, publicId);

  if (db.siteSettings?.published) {
    if (
      matches(db.siteSettings.avatarUrl) ||
      matches(db.siteSettings.seo?.ogImage)
    ) {
      usedInSet.add(
        `Site Settings (${db.siteSettings.brandName?.en || db.siteSettings.brandName?.ar || 'Global'})`
      );
    }
  }

  for (const page of db.pages || []) {
    if (!page.published || page.archived) continue;
    if (
      matches(page.heroImage) ||
      matches(page.seo?.ogImage) ||
      matches(page.additionalImages) ||
      matches(page.blocks) ||
      matches(page.biography)
    ) {
      usedInSet.add(`Page: ${page.title?.en || page.title?.ar || page.slug || page.id}`);
    }
  }

  for (const proj of db.projects || []) {
    if (!proj.published) continue;
    if (
      matches(proj.coverImage) ||
      matches(proj.logoImage) ||
      matches(proj.seo?.ogImage) ||
      matches(proj.screens) ||
      matches(proj.description)
    ) {
      usedInSet.add(`Project: ${proj.title?.en || proj.title?.ar || proj.slug || proj.id}`);
    }
  }

  for (const clinic of db.clinics || []) {
    if (!clinic.published) continue;
    if (
      matches(clinic.coverImage) ||
      matches(clinic.logoUrl) ||
      matches(clinic.seo?.ogImage) ||
      matches(clinic.galleryImages) ||
      matches(clinic.description)
    ) {
      usedInSet.add(`Clinic: ${clinic.name?.en || clinic.name?.ar || clinic.slug || clinic.id}`);
    }
  }

  for (const doc of db.doctors || []) {
    if (!doc.published) continue;
    if (matches(doc.photoUrl)) {
      usedInSet.add(`Doctor: ${doc.name?.en || doc.name?.ar || doc.id}`);
    }
  }

  for (const article of db.articles || []) {
    if (!article.published || article.archived) continue;
    if (
      matches(article.coverImage) ||
      matches(article.seo?.ogImage) ||
      matches(article.contentJson) ||
      matches(article.content)
    ) {
      usedInSet.add(
        `Article: ${article.title?.en || article.title?.ar || article.slug || article.id}`
      );
    }
  }

  const usedIn = Array.from(usedInSet);
  return {
    inUse: usedIn.length > 0,
    usedIn,
  };
}

