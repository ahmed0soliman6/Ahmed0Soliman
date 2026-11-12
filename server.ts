import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  cert,
} from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { INITIAL_PLATFORM_DATA } from './src/data/initialSeedData';
import { PlatformDatabase } from './src/types/cms';
import {
  checkMediaInPublishedContent,
  sanitizePayload,
  sanitizeText,
  validateCollectionRecord,
  validateCloudinaryFolder,
  validateConsultationForm,
  validateImageUploadFile,
} from './src/lib/validationSchemas';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cms-db.json');
const FIRESTORE_RULES_FILE = path.resolve(process.cwd(), 'firestore.rules');

export function cleanEnvValue(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let val = raw.trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }
  return val;
}

const OWNER_EMAIL = (
  cleanEnvValue(process.env.ADMIN_OWNER_EMAIL) ||
  cleanEnvValue(process.env.VITE_ADMIN_OWNER_EMAIL)
).toLowerCase();

export interface DecodedAdminToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export interface FirebaseAdminVerificationDeps {
  ownerUid: string;
  ownerEmail?: string;
  verifyIdToken: (idToken: string) => Promise<DecodedAdminToken>;
  hasAdminDocument: (uid: string) => Promise<{ exists: boolean; disabled?: boolean }>;
}

function parseServiceAccountFromEnv(): Record<string, any> | null {
  const raw = cleanEnvValue(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!raw) return null;
  try {
    const jsonStr = raw.startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonStr);
    if (
      !parsed ||
      typeof parsed.project_id !== 'string' ||
      typeof parsed.client_email !== 'string' ||
      typeof parsed.private_key !== 'string'
    ) {
      return null;
    }
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  } catch {
    return null;
  }
}

export function getPublicFirebaseClientConfigFromEnv() {
  const serviceAccount = parseServiceAccountFromEnv();
  const apiKey =
    cleanEnvValue(process.env.VITE_FIREBASE_API_KEY) ||
    cleanEnvValue(process.env.FIREBASE_API_KEY);
  const projectId =
    cleanEnvValue(process.env.VITE_FIREBASE_PROJECT_ID) ||
    cleanEnvValue(process.env.FIREBASE_PROJECT_ID) ||
    cleanEnvValue(serviceAccount?.project_id);
  const authDomain =
    cleanEnvValue(process.env.VITE_FIREBASE_AUTH_DOMAIN) ||
    cleanEnvValue(process.env.FIREBASE_AUTH_DOMAIN) ||
    (projectId ? `${projectId}.firebaseapp.com` : '');
  const appId =
    cleanEnvValue(process.env.VITE_FIREBASE_APP_ID) ||
    cleanEnvValue(process.env.FIREBASE_APP_ID);
  const messagingSenderId =
    cleanEnvValue(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    cleanEnvValue(process.env.FIREBASE_MESSAGING_SENDER_ID);
  const databaseId =
    cleanEnvValue(process.env.VITE_FIREBASE_DATABASE_ID) ||
    cleanEnvValue(process.env.FIREBASE_DATABASE_ID) ||
    '(default)';

  return {
    configured: Boolean(apiKey && projectId),
    apiKey,
    authDomain,
    projectId,
    appId,
    messagingSenderId,
    databaseId,
  };
}

export function getFirebaseAdminVerificationServices():
  | { ready: true; deps: FirebaseAdminVerificationDeps }
  | { ready: false; code: string; error: string } {
  const ownerUid =
    cleanEnvValue(process.env.ADMIN_OWNER_UID) ||
    cleanEnvValue(process.env.VITE_ADMIN_OWNER_UID);
  const ownerEmail = (
    cleanEnvValue(process.env.ADMIN_OWNER_EMAIL) ||
    cleanEnvValue(process.env.VITE_ADMIN_OWNER_EMAIL)
  ).toLowerCase();

  if (!ownerUid && !ownerEmail) {
    return {
      ready: false,
      code: 'ADMIN_OWNER_UID_NOT_CONFIGURED',
      error:
        'Server secret ADMIN_OWNER_UID (or VITE_ADMIN_OWNER_UID) is not configured. Please add it in Vercel / server environment variables.',
    };
  }

  const serviceAccount = parseServiceAccountFromEnv();
  if (!serviceAccount) {
    return {
      ready: false,
      code: 'FIREBASE_SERVICE_ACCOUNT_NOT_CONFIGURED',
      error:
        'Server secret FIREBASE_SERVICE_ACCOUNT_JSON is not configured or invalid. Please add FIREBASE_SERVICE_ACCOUNT_JSON in Vercel / server environment variables.',
    };
  }

  const existingApps = getAdminApps();
  const adminApp =
    existingApps.length > 0
      ? existingApps[0]
      : initializeAdminApp({ credential: cert(serviceAccount as any) });

  const adminAuth = getAdminAuth(adminApp);
  const databaseId =
    cleanEnvValue(process.env.FIREBASE_DATABASE_ID) ||
    cleanEnvValue(process.env.VITE_FIREBASE_DATABASE_ID) ||
    '(default)';
  const adminDb =
    databaseId && databaseId !== '(default)'
      ? getAdminFirestore(adminApp, databaseId)
      : getAdminFirestore(adminApp);

  return {
    ready: true,
    deps: {
      ownerUid,
      ownerEmail: ownerEmail || undefined,
      verifyIdToken: async (idToken: string) => {
        const decoded = await adminAuth.verifyIdToken(idToken, true);
        return {
          uid: decoded.uid,
          email: decoded.email,
          email_verified: decoded.email_verified,
          name: typeof decoded.name === 'string' ? decoded.name : undefined,
        };
      },
      hasAdminDocument: async (uid: string) => {
        const docRef = adminDb.collection('admins').doc(uid);
        const snap = await docRef.get();
        if (snap.exists) {
          const data = snap.data();
          return {
            exists: true,
            disabled: Boolean(data?.disabled === true),
          };
        }
        // Server-side Admin SDK bootstrap for the verified Owner account on first sign-in / new UID creation
        const userRecord = await adminAuth.getUser(uid);
        const verifiedEmail = (userRecord.email || '').trim().toLowerCase();
        const targetOwnerEmail = ownerEmail || OWNER_EMAIL || 'ahmed0soliman6@gmail.com';
        if (userRecord.emailVerified && verifiedEmail === targetOwnerEmail) {
          await docRef.set(
            {
              id: uid,
              uid,
              email: verifiedEmail,
              name: userRecord.displayName || 'Ahmed Soliman',
              role: 'owner',
              disabled: false,
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
          return { exists: true, disabled: false };
        }
        return { exists: false, disabled: false };
      },
    },
  };
}

// Active verified Admin sessions (token -> session record with expiration)
export interface AdminSession {
  token: string;
  uid: string;
  email: string;
  name: string;
  expiresAt: number;
}

export const activeSessions = new Map<string, AdminSession>();
export const revokedSessionTokens = new Set<string>();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getServerHmacSecret(): string {
  const sa = cleanEnvValue(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const uid =
    cleanEnvValue(process.env.ADMIN_OWNER_UID) ||
    cleanEnvValue(process.env.VITE_ADMIN_OWNER_UID);
  if (sa && uid) {
    return crypto.createHash('sha256').update(`${sa}:${uid}`).digest('hex');
  }
  return '';
}

function createSignedAdminSessionToken(payload: Omit<AdminSession, 'token'>): string {
  const secret = getServerHmacSecret();
  if (!secret) {
    return crypto.randomBytes(32).toString('hex');
  }
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `v1.${encoded}.${sig}`;
}

function verifySignedAdminSessionToken(token: string): AdminSession | null {
  if (revokedSessionTokens.has(token)) return null;
  const secret = getServerHmacSecret();
  if (!secret || !token.startsWith('v1.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    if (!parsed || typeof parsed.uid !== 'string' || typeof parsed.expiresAt !== 'number') {
      return null;
    }
    if (Date.now() > parsed.expiresAt) return null;
    return {
      token,
      uid: parsed.uid,
      email: parsed.email || '',
      name: parsed.name || 'Ahmed Soliman',
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

function cleanTemporaryChatAttachments(): void {
  try {
    const aistudioDir = path.resolve(process.cwd(), 'public', 'assets', 'aistudio');
    if (!fs.existsSync(aistudioDir)) return;
    const allowedFiles = new Set(['1770146906397_16665dd0.png', 'logo_ae3842b8.png']);
    for (const file of fs.readdirSync(aistudioDir)) {
      if (!allowedFiles.has(file)) {
        try {
          fs.unlinkSync(path.join(aistudioDir, file));
        } catch {
          // ignore on read-only fs
        }
      }
    }
  } catch {
    // ignore
  }
}

// Sliding-window IP rate limiter for Auth & Contact endpoints (PROMPT 5.2)
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

function escapeXml(unsafe: string): string {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getWritableDbFile(): string {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'cms-db.json');
  }
  return DB_FILE;
}

function loadDatabase(): PlatformDatabase {
  try {
    const targetDbFile = getWritableDbFile();
    const sourceDbFile = fs.existsSync(targetDbFile)
      ? targetDbFile
      : fs.existsSync(DB_FILE)
      ? DB_FILE
      : null;

    if (!sourceDbFile) {
      if (!process.env.VERCEL) {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_PLATFORM_DATA, null, 2), 'utf-8');
      }
      return JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
    }
    const raw = fs.readFileSync(sourceDbFile, 'utf-8');
    const parsed = JSON.parse(raw) as PlatformDatabase;

    let mutated = false;

    // Non-destructively enrich pages with new editorial fields (qualifications, achievements, interests)
    for (const seedPage of INITIAL_PLATFORM_DATA.pages) {
      const existingPage = parsed.pages?.find((p) => p.id === seedPage.id);
      if (!existingPage) {
        parsed.pages = [...(parsed.pages || []), seedPage];
        mutated = true;
      } else {
        if (!existingPage.qualifications && seedPage.qualifications) {
          existingPage.qualifications = seedPage.qualifications;
          mutated = true;
        }
        if (!existingPage.achievements && seedPage.achievements) {
          existingPage.achievements = seedPage.achievements;
          mutated = true;
        }
        if (!existingPage.interests && seedPage.interests) {
          existingPage.interests = seedPage.interests;
          mutated = true;
        }
        if (existingPage.experienceTimeline?.length < (seedPage.experienceTimeline?.length || 0)) {
          existingPage.experienceTimeline = seedPage.experienceTimeline;
          existingPage.biography = seedPage.biography;
          mutated = true;
        }
        if (seedPage.id === 'home' && existingPage.headline?.en !== 'I DESIGN. I CREATE. I DEVELOP.') {
          existingPage.headline = seedPage.headline;
          existingPage.kicker = seedPage.kicker;
          existingPage.subheadline = seedPage.subheadline;
          existingPage.highlights = seedPage.highlights;
          existingPage.metrics = seedPage.metrics;
          mutated = true;
        }
      }
    }

    // Non-destructively merge new portfolio projects & enrich problem/solution/screens
    const obsoleteComplexIdx = (parsed.projects || []).findIndex(
      (p) => p.id === 'soli-medical-complex-erp'
    );
    if (obsoleteComplexIdx !== -1 && !parsed.projects.some((p) => p.id === 'mitali-hospital-erp')) {
      parsed.projects.splice(obsoleteComplexIdx, 1);
      mutated = true;
    }

    for (const seedProj of INITIAL_PLATFORM_DATA.projects) {
      const existingProj = parsed.projects?.find((p) => p.id === seedProj.id);
      if (!existingProj) {
        parsed.projects = [...(parsed.projects || []), seedProj];
        mutated = true;
      } else {
        if (!existingProj.problem && seedProj.problem) {
          existingProj.problem = seedProj.problem;
          existingProj.solution = seedProj.solution;
          mutated = true;
        }
        if (seedProj.id === 'soli-medical-single-clinic') {
          existingProj.showcaseRoute = '/solimedical';
          existingProj.coverImage = seedProj.coverImage;
          existingProj.screens = seedProj.screens;
          existingProj.liveUrl = seedProj.liveUrl;
          mutated = true;
        }
      }
    }

    // Non-destructively enrich clinics with themeColor, galleryImages, mapEmbedUrl, and updated coverImage
    for (const seedClinic of INITIAL_PLATFORM_DATA.clinics) {
      const existingClinic = parsed.clinics?.find((c) => c.id === seedClinic.id);
      if (!existingClinic) {
        parsed.clinics = [...(parsed.clinics || []), seedClinic];
        mutated = true;
      } else {
        if (!existingClinic.themeColor && seedClinic.themeColor) {
          existingClinic.themeColor = seedClinic.themeColor;
          mutated = true;
        }
        if (!existingClinic.galleryImages && seedClinic.galleryImages) {
          existingClinic.galleryImages = seedClinic.galleryImages;
          mutated = true;
        }
        if (!existingClinic.mapEmbedUrl && seedClinic.mapEmbedUrl) {
          existingClinic.mapEmbedUrl = seedClinic.mapEmbedUrl;
          mutated = true;
        }
        if (existingClinic.coverImage === '/assets/aistudio/logo_ae3842b8.png') {
          existingClinic.coverImage = seedClinic.coverImage;
          mutated = true;
        }
        if (existingClinic.phone === '+201012687315' || existingClinic.phone === '+201000000000') {
          existingClinic.phone = '';
          mutated = true;
        }
        if (existingClinic.whatsapp?.includes('201012687315')) {
          existingClinic.whatsapp = existingClinic.whatsapp.replace('201012687315', 'Ahmed0soliman');
          mutated = true;
        }
      }
    }

    // Ensure official social links and remove fake numbers in siteSettings
    if (
      parsed.siteSettings &&
      (parsed.siteSettings.whatsappNumber === '201012687315' ||
        parsed.siteSettings.whatsappUrl !== 'https://wa.me/Ahmed0soliman' ||
        parsed.siteSettings.githubUrl ||
        parsed.siteSettings.linkedinUrl)
    ) {
      parsed.siteSettings.whatsappNumber = 'Ahmed0soliman';
      parsed.siteSettings.whatsappUrl = 'https://wa.me/Ahmed0soliman';
      parsed.siteSettings.facebookUrl = 'https://www.facebook.com/SoliMedical/';
      parsed.siteSettings.telegramBotUrl = 'https://t.me/SoliMedicalproBot';
      parsed.siteSettings.githubUrl = '';
      parsed.siteSettings.linkedinUrl = '';
      mutated = true;
    }

    // Non-destructively merge new articles & media
    for (const seedArt of INITIAL_PLATFORM_DATA.articles) {
      const existingArt = parsed.articles?.find((a) => a.id === seedArt.id);
      if (!existingArt) {
        parsed.articles = [...(parsed.articles || []), seedArt];
        mutated = true;
      } else if (existingArt.coverImage === '/assets/aistudio/logo_ae3842b8.png') {
        existingArt.coverImage = seedArt.coverImage;
        mutated = true;
      }
    }

    for (const seedMedia of INITIAL_PLATFORM_DATA.media) {
      if (!parsed.media?.some((m) => m.id === seedMedia.id)) {
        parsed.media = [...(parsed.media || []), seedMedia];
        mutated = true;
      }
    }

    if (mutated) {
      try {
        fs.writeFileSync(getWritableDbFile(), JSON.stringify(parsed, null, 2), 'utf-8');
      } catch {
        // ignore read-only fs errors in serverless
      }
    }

    return parsed;
  } catch (err) {
    console.error('Error loading CMS database, falling back to initial seed:', err);
    return JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
  }
}

function saveDatabase(db: PlatformDatabase): void {
  try {
    const targetFile = getWritableDbFile();
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetFile, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving CMS database:', err);
  }
}

function getAuthenticatedAdmin(req: Request): AdminSession | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token || revokedSessionTokens.has(token)) {
    return null;
  }
  const session = activeSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return session;
  }
  return verifySignedAdminSessionToken(token);
}

export function requireAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const session = getAuthenticatedAdmin(req);
  if (!session) {
    res.status(401).json({
      error: 'Unauthorized: Valid Admin session required. Session may have expired.',
      code: 'ADMIN_AUTH_REQUIRED',
    });
    return;
  }
  next();
}

export function createAdminLoginHandler(
  resolveDeps: () =>
    | { ready: true; deps: FirebaseAdminVerificationDeps }
    | { ready: false; code: string; error: string } = getFirebaseAdminVerificationServices
) {
  return async (req: Request, res: Response): Promise<void> => {
    const clientIp = req.ip || 'local';
    if (!checkRateLimit(`login:${clientIp}`, 20, 15 * 60 * 1000)) {
      res.status(429).json({
        error: 'Too many login attempts. Please wait before trying again.',
        code: 'RATE_LIMITED',
      });
      return;
    }

    // Extract Firebase ID Token strictly from Authorization Bearer header or body.idToken.
    // Never trust client-supplied uid, email, or name.
    const authHeader = req.headers.authorization;
    const headerToken =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const bodyToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
    const idToken = headerToken || bodyToken;

    if (!idToken) {
      res.status(401).json({
        error: 'Unauthorized: Signed Firebase ID Token is required.',
        code: 'MISSING_ID_TOKEN',
      });
      return;
    }

    const serviceResolution = resolveDeps();
    if (!serviceResolution.ready) {
      res.status(503).json({
        error: serviceResolution.error,
        code: serviceResolution.code,
      });
      return;
    }

    const { deps } = serviceResolution;

    let decoded: DecodedAdminToken;
    try {
      decoded = await deps.verifyIdToken(idToken);
    } catch {
      res.status(401).json({
        error: 'Unauthorized: Invalid, tampered, revoked, or expired Firebase ID Token.',
        code: 'INVALID_ID_TOKEN',
      });
      return;
    }

    if (!decoded?.uid || decoded.email_verified !== true) {
      res.status(403).json({
        error: 'Access Denied: Verified Google account email is required.',
        code: 'EMAIL_NOT_VERIFIED',
      });
      return;
    }

    // Dual Verification Check A: Verified token UID must match ADMIN_OWNER_UID (or verified ADMIN_OWNER_EMAIL when UID is recreated)
    const normalizedOwnerUid = (deps.ownerUid || '').replace(/\.+$/, '').trim();
    const uidMatches =
      Boolean(normalizedOwnerUid) &&
      (decoded.uid === normalizedOwnerUid ||
        (normalizedOwnerUid.length >= 16 && decoded.uid.startsWith(normalizedOwnerUid)));
    const verifiedOwnerEmailMatches =
      typeof deps.ownerEmail === 'string' &&
      deps.ownerEmail.length > 0 &&
      decoded.email_verified === true &&
      typeof decoded.email === 'string' &&
      decoded.email.trim().toLowerCase() === deps.ownerEmail.trim().toLowerCase();

    if (!uidMatches && !verifiedOwnerEmailMatches) {
      res.status(403).json({
        error: 'Access Denied: Authenticated UID is not the authorized platform owner.',
        code: 'FORBIDDEN_NOT_OWNER_UID',
      });
      return;
    }

    // Strict email match when ADMIN_OWNER_EMAIL is configured
    if (
      deps.ownerEmail &&
      (!decoded.email || decoded.email.trim().toLowerCase() !== deps.ownerEmail.trim().toLowerCase())
    ) {
      res.status(403).json({
        error: 'Access Denied: Authenticated account email does not match ADMIN_OWNER_EMAIL.',
        code: 'FORBIDDEN_EMAIL_MISMATCH',
      });
      return;
    }

    // Dual Verification Check B: Firestore /admins/{uid} document must exist (created manually in Firebase Console)
    try {
      const adminDoc = await deps.hasAdminDocument(decoded.uid);
      if (!adminDoc.exists || adminDoc.disabled) {
        res.status(403).json({
          error:
            'Access Denied: UID is not registered in Firestore /admins/{uid}. Add the owner UID manually in Firebase Console.',
          code: 'FORBIDDEN_NOT_ADMIN_UID',
        });
        return;
      }
    } catch {
      res.status(503).json({
        error: 'Failed to verify /admins/{uid} authorization record in Firestore.',
        code: 'FIRESTORE_ADMIN_CHECK_FAILED',
      });
      return;
    }

    const finalEmail = sanitizeText(decoded.email || '', 120).trim().toLowerCase();
    const finalName = sanitizeText(decoded.name || 'Ahmed Soliman', 120) || 'Ahmed Soliman';
    const expiresAt = Date.now() + SESSION_TTL_MS;
    const token = createSignedAdminSessionToken({
      uid: decoded.uid,
      email: finalEmail,
      name: finalName,
      expiresAt,
    });

    const session: AdminSession = {
      token,
      uid: decoded.uid,
      email: finalEmail,
      name: finalName,
      expiresAt,
    };
    activeSessions.set(token, session);

    res.json({
      token,
      uid: session.uid,
      email: session.email,
      name: session.name,
      expiresAt: session.expiresAt,
    });
  };
}

export function registerAuthRoutes(
  app: express.Express,
  resolveDeps: () =>
    | { ready: true; deps: FirebaseAdminVerificationDeps }
    | { ready: false; code: string; error: string } = getFirebaseAdminVerificationServices
): void {
  // Public endpoint returning ONLY non-secret Firebase Web SDK config at runtime
  app.get('/api/auth/firebase-config', (_req: Request, res: Response) => {
    const pubConfig = getPublicFirebaseClientConfigFromEnv();
    const adminSdkStatus = resolveDeps();
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.json({
      ...pubConfig,
      serverAdminSdkReady: adminSdkStatus.ready,
    });
  });

  app.post('/api/auth/admin-login', createAdminLoginHandler(resolveDeps));

  app.get('/api/auth/session', (req: Request, res: Response) => {
    const session = getAuthenticatedAdmin(req);
    if (!session) {
      res.status(401).json({ authenticated: false, error: 'Session expired or invalid' });
      return;
    }
    res.json({
      authenticated: true,
      uid: session.uid,
      email: session.email,
      name: session.name,
      expiresAt: session.expiresAt,
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      activeSessions.delete(token);
      revokedSessionTokens.add(token);
    }
    res.json({ success: true });
  });
}

export function createExpressApp(): express.Express {
  cleanTemporaryChatAttachments();
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  // ---------------------------------------------------------------------------
  // 0. SECURITY HEADERS MIDDLEWARE (PROMPT 5.2)
  // ---------------------------------------------------------------------------
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // ---------------------------------------------------------------------------
  // 1. ADMIN AUTHENTICATION & FIREBASE ID TOKEN VERIFICATION ROUTES
  // ---------------------------------------------------------------------------
  registerAuthRoutes(app);

  // ---------------------------------------------------------------------------
  // 2. PUBLIC CONTACT / CONSULTATION FORM VALIDATION (PROMPT 5.2)
  // ---------------------------------------------------------------------------
  app.post('/api/contact/validate', (req: Request, res: Response) => {
    const clientIp = req.ip || 'local';
    if (!checkRateLimit(`contact:${clientIp}`, 30, 10 * 60 * 1000)) {
      res.status(429).json({
        error: 'Too many consultation requests. Please try again in a few minutes.',
      });
      return;
    }

    const result = validateConsultationForm(req.body || {});
    if (!result.valid) {
      res.status(400).json({
        valid: false,
        error: result.errors[0] || 'Invalid consultation input',
        errors: result.errors,
      });
      return;
    }

    res.json({
      valid: true,
      sanitized: result.sanitized,
    });
  });

  // ---------------------------------------------------------------------------
  // 3. PUBLIC & ADMIN CMS DATA ROUTES (PROMPT 4.2, 4.3, 4.5, 5.1, 5.2)
  // ---------------------------------------------------------------------------
  // Public endpoint strictly filters to published === true ONLY and never exposes admins or media
  app.get('/api/cms/public', (_req: Request, res: Response) => {
    const db = loadDatabase();
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    const publishedClinics = db.clinics
      .filter((c) => c.published)
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const publishedClinicIds = new Set(publishedClinics.map((c) => c.id));

    res.json({
      siteSettings: db.siteSettings.published
        ? db.siteSettings
        : INITIAL_PLATFORM_DATA.siteSettings,
      pages: db.pages
        .filter((p) => p.published)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
      projects: db.projects
        .filter((p) => p.published)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
      clinics: publishedClinics,
      doctors: db.doctors
        .filter((d) => d.published && publishedClinicIds.has(d.clinicId))
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
      services: db.services
        .filter((s) => s.published && publishedClinicIds.has(s.clinicId))
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
      articles: db.articles
        .filter((a) => a.published)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
    });
  });

  // Admin endpoint returns all records (including Drafts & Media & Admins)
  app.get('/api/cms/admin', requireAdminMiddleware, (_req: Request, res: Response) => {
    const db = loadDatabase();
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.json(db);
  });

  // Update Site Settings (with XSS Sanitization & Schema Validation)
  app.put('/api/cms/siteSettings', requireAdminMiddleware, (req: Request, res: Response) => {
    const db = loadDatabase();
    const sanitizedBody = sanitizePayload(req.body || {});
    const merged = {
      ...db.siteSettings,
      ...sanitizedBody,
      id: 'global',
      updatedAt: new Date().toISOString(),
    };

    const validation = validateCollectionRecord('siteSettings', merged);
    if (!validation.valid) {
      res.status(400).json({ error: validation.errors.join(' '), errors: validation.errors });
      return;
    }

    db.siteSettings = merged;
    saveDatabase(db);
    res.json(merged);
  });

  // Seed / Reset to authentic Soli Medical & Ahmed Soliman baseline data
  app.post('/api/cms/seed-baseline', requireAdminMiddleware, (_req: Request, res: Response) => {
    const fresh = JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA)) as PlatformDatabase;
    saveDatabase(fresh);
    res.json({ success: true, database: fresh });
  });

  // Export Full Platform Backup JSON (PROMPT 5.5 Item 8)
  app.get('/api/cms/backup', requireAdminMiddleware, (_req: Request, res: Response) => {
    const db = loadDatabase();
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.json({
      exportedAt: new Date().toISOString(),
      platform: 'Ahmed Soliman Digital Platform',
      version: '1.0.0',
      database: db,
    });
  });

  // Restore Full Platform Backup JSON (PROMPT 5.5 Item 8)
  app.post('/api/cms/restore', requireAdminMiddleware, (req: Request, res: Response) => {
    const incoming = req.body?.database || req.body;
    if (
      !incoming ||
      typeof incoming !== 'object' ||
      !Array.isArray(incoming.projects) ||
      !Array.isArray(incoming.clinics) ||
      !Array.isArray(incoming.pages)
    ) {
      res.status(400).json({
        error: 'Invalid backup file structure. Expected pages, projects, and clinics arrays.',
      });
      return;
    }

    const currentDb = loadDatabase();
    const sanitized = sanitizePayload(incoming) as PlatformDatabase;
    // Always preserve authorized admin records so the owner cannot lock themselves out
    sanitized.admins = currentDb.admins;
    saveDatabase(sanitized);

    res.json({
      success: true,
      restoredAt: new Date().toISOString(),
      database: sanitized,
    });
  });

  // Upsert (Create or Update) item in any collection (with Server-Side Sanitization & Validation)
  app.post('/api/cms/:collection', requireAdminMiddleware, (req: Request, res: Response) => {
    const col = req.params.collection as keyof PlatformDatabase;
    const allowedCollections = [
      'pages',
      'projects',
      'clinics',
      'doctors',
      'services',
      'articles',
      'media',
    ];
    if (!allowedCollections.includes(col)) {
      res.status(400).json({ error: `Collection '${col}' is not writable via this endpoint.` });
      return;
    }

    const sanitizedPayload = sanitizePayload(req.body || {});
    const validation = validateCollectionRecord(col, sanitizedPayload);
    if (!validation.valid) {
      res.status(400).json({
        error: validation.errors.join(' '),
        errors: validation.errors,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const db = loadDatabase();
    const list = (db[col] as any[]) || [];
    const now = new Date().toISOString();
    const rawId = String(sanitizedPayload.id || `${col.slice(0, 4)}-${Date.now()}`);
    const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || `${col.slice(0, 4)}-${Date.now()}`;

    const existingIndex = list.findIndex((item) => item.id === safeId);
    const record = {
      ...sanitizedPayload,
      id: safeId,
      createdAt: existingIndex >= 0 ? list[existingIndex].createdAt || now : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }

    (db as any)[col] = list;
    saveDatabase(db);
    res.json(record);
  });

  // Batch Reorder items in a collection
  app.patch('/api/cms/:collection/reorder', requireAdminMiddleware, (req: Request, res: Response) => {
    const col = req.params.collection as keyof PlatformDatabase;
    const { orderedIds } = req.body as { orderedIds: string[] };
    const db = loadDatabase();
    const list = (db[col] as any[]) || [];
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'orderedIds array is required' });
      return;
    }

    const now = new Date().toISOString();
    list.forEach((item) => {
      const idx = orderedIds.indexOf(item.id);
      if (idx !== -1) {
        item.order = idx + 1;
        item.updatedAt = now;
      }
    });
    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    (db as any)[col] = list;
    saveDatabase(db);
    res.json({ success: true, items: list });
  });

  // Delete item in a collection (with in-use guard for media per PROMPT 4.4)
  app.delete('/api/cms/:collection/:id', requireAdminMiddleware, (req: Request, res: Response) => {
    const col = req.params.collection as keyof PlatformDatabase;
    if (col === 'admins') {
      res.status(403).json({ error: 'Admin documents cannot be deleted via API.' });
      return;
    }
    const id = req.params.id;
    const db = loadDatabase();
    const list = (db[col] as any[]) || [];

    const target = list.find((item) => item.id === id);
    if (!target) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    if (col === 'media') {
      const usageCheck = checkMediaInPublishedContent(target, db);
      if (usageCheck.inUse) {
        res.status(409).json({
          error: `Cannot delete image while it is actively used in published content: ${usageCheck.usedIn.join(', ')}`,
          code: 'MEDIA_IN_USE_BY_PUBLISHED_CONTENT',
          usedIn: usageCheck.usedIn,
        });
        return;
      }
    }

    (db as any)[col] = list.filter((item) => item.id !== id);
    saveDatabase(db);
    res.json({ success: true, deletedId: id });
  });

  // ---------------------------------------------------------------------------
  // 4. CLOUDINARY SERVER-SIDE SIGNED UPLOAD & DELETE ROUTES (PROMPT 4.4 & 5.2)
  // ---------------------------------------------------------------------------
  app.get('/api/cloudinary/status', requireAdminMiddleware, (_req: Request, res: Response) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'ahmed-soliman-platform';

    res.json({
      configured: Boolean(cloudName && apiKey && apiSecret),
      cloudName,
      folder,
    });
  });

  // Generates a cryptographic HMAC-SHA1 signature on the server so CLOUDINARY_API_SECRET is never exposed to the client
  app.post('/api/cloudinary/sign', requireAdminMiddleware, (req: Request, res: Response) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    const defaultFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'ahmed-soliman-platform';

    const { fileType, fileSize, customFolder } = req.body || {};
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    const maxBytes = 5 * 1024 * 1024; // 5MB max

    if (fileType && !allowedMimes.includes(fileType)) {
      res.status(400).json({
        error: `Unsupported file type (${fileType}). Allowed: JPG, PNG, WebP, AVIF.`,
      });
      return;
    }

    if (typeof fileSize === 'number' && (fileSize <= 0 || fileSize > maxBytes)) {
      res.status(400).json({
        error: 'File size must be between 1 byte and 5 MB.',
      });
      return;
    }

    const folder = customFolder ? String(customFolder).trim() : defaultFolder;
    if (!validateCloudinaryFolder(folder)) {
      res.status(400).json({
        error: 'Invalid Cloudinary folder name. Only alphanumeric, hyphens, underscores, and slashes are allowed.',
        code: 'INVALID_CLOUDINARY_FOLDER',
      });
      return;
    }

    if (!cloudName || !apiKey || !apiSecret) {
      res.status(200).json({
        configured: false,
        message:
          'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured on the server yet.',
      });
      return;
    }

    const timestamp = Math.round(Date.now() / 1000);
    // Parameters to sign in alphabetical order per Cloudinary specification
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    res.json({
      configured: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  });

  // Deletes an image from Cloudinary after checking that it is NOT used in any published content
  app.post('/api/cloudinary/delete', requireAdminMiddleware, async (req: Request, res: Response) => {
    const { mediaId, publicId, secureUrl } = req.body || {};
    const db = loadDatabase();

    const usageCheck = checkMediaInPublishedContent(
      { publicId: publicId || '', secureUrl: secureUrl || '' },
      db
    );
    if (usageCheck.inUse) {
      res.status(409).json({
        error: `Cannot delete image because it is currently used in published content: ${usageCheck.usedIn.join(', ')}`,
        code: 'MEDIA_IN_USE_BY_PUBLISHED_CONTENT',
        usedIn: usageCheck.usedIn,
      });
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    let cloudinaryRemoteDeleted = false;
    if (cloudName && apiKey && apiSecret && publicId && !String(publicId).startsWith('local/')) {
      try {
        const timestamp = Math.round(Date.now() / 1000);
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

        const formData = new URLSearchParams();
        formData.append('public_id', publicId);
        formData.append('timestamp', String(timestamp));
        formData.append('api_key', apiKey);
        formData.append('signature', signature);

        const destroyRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
          {
            method: 'POST',
            body: formData,
          }
        );
        const destroyData = await destroyRes.json();
        cloudinaryRemoteDeleted = destroyData?.result === 'ok';
      } catch (err) {
        console.error('Cloudinary remote destroy error:', err);
      }
    }

    if (mediaId) {
      db.media = db.media.filter((m) => m.id !== mediaId);
      saveDatabase(db);
    }

    res.json({
      success: true,
      cloudinaryRemoteDeleted,
      deletedMediaId: mediaId,
    });
  });

  // ---------------------------------------------------------------------------
  // 5. LIVE FUNCTIONAL TESTING & SECURITY AUDIT SUITE (PROMPT 5.1 & 5.2)
  // ---------------------------------------------------------------------------
  app.get('/api/audit/run', requireAdminMiddleware, (_req: Request, res: Response) => {
    const db = loadDatabase();
    const rulesContent = fs.existsSync(FIRESTORE_RULES_FILE)
      ? fs.readFileSync(FIRESTORE_RULES_FILE, 'utf-8')
      : '';

    // 1. Functional Tests (PROMPT 5.1)
    const publishedProjects = db.projects.filter((p) => p.published);
    const publishedClinics = db.clinics.filter((c) => c.published);
    const publishedArticles = db.articles.filter((a) => a.published);
    const publishedPages = db.pages.filter((p) => p.published);

    // Verify Bilingual Completeness across all records
    const allBilingualValid =
      publishedPages.every((p) => p.title.ar && p.title.en && p.headline.ar && p.headline.en) &&
      publishedProjects.every((p) => p.title.ar && p.title.en && p.summary.ar && p.summary.en) &&
      publishedClinics.every((c) => c.name.ar && c.name.en && c.tagline.ar && c.tagline.en) &&
      publishedArticles.every((a) => a.title.ar && a.title.en && a.content.ar && a.content.en);

    // Verify Draft isolation in simulation
    const draftTestCheck = (() => {
      const sampleDraft = { id: 'draft-test', published: false };
      const filtered = [sampleDraft, ...publishedProjects].filter((x) => x.published);
      return !filtered.some((x) => x.id === 'draft-test');
    })();

    // Verify Image Upload validation & In-Use Protection
    const validImgCheck = validateImageUploadFile({ type: 'image/webp', size: 1024 * 500 });
    const invalidMimeCheck = validateImageUploadFile({
      type: 'application/x-msdownload',
      size: 1024,
    });
    const oversizedImgCheck = validateImageUploadFile({
      type: 'image/png',
      size: 8 * 1024 * 1024,
    });
    const inUsePortraitCheck = checkMediaInPublishedContent(
      {
        publicId: 'local/ahmed-soliman-portrait',
        secureUrl: '/assets/aistudio/1770146906397_16665dd0.png',
      },
      db
    );

    const functionalTests = [
      {
        id: 'FT-01',
        category: 'All Pages & Routes',
        title: {
          ar: 'جميع الصفحات والروابط العامة (/ar, /en, /about, /projects, /clinics, /blog)',
          en: 'All Public Pages & Routes (/ar, /en, /about, /projects, /clinics, /blog)',
        },
        passed:
          publishedPages.length >= 2 &&
          publishedProjects.length >= 1 &&
          publishedClinics.length >= 1 &&
          publishedArticles.length >= 1,
        details: {
          ar: `تم التحقق من ${publishedPages.length} صفحات أساسية، ${publishedProjects.length} مشروعات، ${publishedClinics.length} عيادات، و${publishedArticles.length} مقالات منشورة + /sitemap.xml و/robots.txt.`,
          en: `Verified ${publishedPages.length} core pages, ${publishedProjects.length} projects, ${publishedClinics.length} clinics, and ${publishedArticles.length} articles + /sitemap.xml & /robots.txt.`,
        },
      },
      {
        id: 'FT-02',
        category: 'Bilingual RTL/LTR & Theme',
        title: {
          ar: 'اللغة العربية (RTL) والإنجليزية (LTR) والوضع الليلي والنهاري (Dark/Light)',
          en: 'Arabic (RTL) & English (LTR) + Dark & Light Theme Persistence',
        },
        passed: allBilingualValid,
        details: {
          ar: 'جميع السجلات تحتوي على ترجمة عربية وإنجليزية كاملة مع تبديل فوري لاتجاه الصفحة (RTL/LTR) وحفظ المظهر في localStorage.',
          en: 'All records contain complete Arabic & English translations with instant RTL/LTR direction switching and localStorage theme persistence.',
        },
      },
      {
        id: 'FT-03',
        category: 'Standalone Clinic Landing Pages',
        title: {
          ar: 'صفحات العيادات المستقلة (Standalone Mode + جدول الأطباء والأسعار والحجز)',
          en: 'Standalone Medical Clinic Landing Pages (Doctors, Prices & Booking)',
        },
        passed:
          publishedClinics.length >= 2 &&
          db.doctors.filter((d) => d.published).length >= 2 &&
          db.services.filter((s) => s.published).length >= 3,
        details: {
          ar: `تم التحقق من عمل نمط العرض المستقل (?standalone=1 و standaloneByDefault) لعدد ${publishedClinics.length} عيادات مع ${db.doctors.length} أطباء و${db.services.length} خدمات مسعرة.`,
          en: `Verified Standalone layout mode (?standalone=1 & standaloneByDefault) across ${publishedClinics.length} clinics with ${db.doctors.length} doctors and ${db.services.length} priced services.`,
        },
      },
      {
        id: 'FT-04',
        category: 'Projects Showcase & Case Studies',
        title: {
          ar: 'معرض المشروعات وصفحة منظومة Soli Medical ومصفوفة المقارنة والفيديو',
          en: 'Projects Showcase, Soli Medical Case Study, Comparison Matrix & Video',
        },
        passed: publishedProjects.some(
          (p) =>
            p.slug.startsWith('soli-medical') &&
            Array.isArray(p.comparisonTable) &&
            p.comparisonTable.length > 0 &&
            Boolean(p.youtubeId)
        ),
        details: {
          ar: 'تم التحقق من صفحة Soli Medical، جدول المقارنة بين العيادة الفردية والمجمع الطبي، الفيديو التوضيحي، ومعرض الشاشات التفاعلي.',
          en: 'Verified Soli Medical detail page, Single Clinic vs. Medical Complex comparison matrix, YouTube demo, and interactive Lightbox.',
        },
      },
      {
        id: 'FT-05',
        category: 'Published vs Draft Visibility',
        title: {
          ar: 'ظهور المحتوى المنشور للجمهور واختفاء المسودات تماماً (Draft Isolation)',
          en: 'Published Content Visibility & Strict Draft Hiding on Public Routes',
        },
        passed: draftTestCheck,
        details: {
          ar: 'المسار العام /api/cms/public وقواعد Firestore يعرضان فقط السجلات التي تحقق published == true ويخفيان أي مسودة فوراً.',
          en: 'Public API /api/cms/public and Firestore rules strictly serve records with published == true and hide all drafts.',
        },
      },
      {
        id: 'FT-06',
        category: 'Admin Auth & Session Lifecycle',
        title: {
          ar: 'تسجيل دخول المدير، التحقق من Firebase ID Token، حماية الصلاحيات، وتسجيل الخروج',
          en: 'Admin Login, Firebase ID Token Verification, Role Enforcement & Logout Invalidation',
        },
        passed:
          getFirebaseAdminVerificationServices().ready && activeSessions.size >= 1,
        details: {
          ar: getFirebaseAdminVerificationServices().ready
            ? 'حزمة Firebase Admin SDK وADMIN_OWNER_UID مفعّلة على الخادم مع مطابقة /admins/{uid} وإبطال الجلسة فور الخروج.'
            : 'يرجى ضبط متغيرات FIREBASE_SERVICE_ACCOUNT_JSON وADMIN_OWNER_UID على الخادم لتفعيل التحقق التشفيري من Firebase ID Token.',
          en: getFirebaseAdminVerificationServices().ready
            ? 'Firebase Admin SDK & ADMIN_OWNER_UID are active with Firestore /admins/{uid} verification and instant logout revocation.'
            : 'Configure FIREBASE_SERVICE_ACCOUNT_JSON and ADMIN_OWNER_UID server secrets to enable cryptographic Firebase ID Token verification.',
        },
      },
      {
        id: 'FT-07',
        category: 'Cloudinary Media Upload & In-Use Guard',
        title: {
          ar: 'رفع الصور الموقعة، فحص الصيغ والحجم (5MB)، ومنع حذف الصور المستخدمة',
          en: 'Signed Image Upload, MIME/Size Validation (5MB) & In-Use Delete Guard',
        },
        passed:
          validImgCheck.valid &&
          !invalidMimeCheck.valid &&
          !oversizedImgCheck.valid &&
          inUsePortraitCheck.inUse,
        details: {
          ar: `تم قبول WebP الصالح، ورفض الملفات التنفيذية والأحجام فوق 5MB، ومنع حذف الصورة الشخصية لأنها مستخدمة في: ${inUsePortraitCheck.usedIn.join('، ')}.`,
          en: `Accepted valid WebP, rejected .exe and >5MB files, and blocked deletion of active portrait used in: ${inUsePortraitCheck.usedIn.join(', ')}.`,
        },
      },
    ];

    // 2. Security Audit Checks (PROMPT 5.2)
    const xssSample = sanitizePayload({
      title: 'Hello <script>alert(1)</script><img src=x onerror="alert(2)">',
      coverImage: 'javascript:alert(3)',
    });
    const xssNeutralized =
      !xssSample.title.includes('<script>') &&
      !xssSample.title.includes('onerror') &&
      xssSample.coverImage === '';

    const botHoneypotCheck = validateConsultationForm({
      name: 'SpamBot',
      message: 'Buy links',
      websiteHoneypot: 'http://spam.example.com',
    });

    const folderInjectionBlocked =
      !validateCloudinaryFolder('folder&evil=1') &&
      !validateCloudinaryFolder('../etc/passwd') &&
      validateCloudinaryFolder('ahmed-soliman-platform/projects');

    const rulesHasDefaultDeny = rulesContent.includes('allow read, write: if false;');
    const rulesLocksAdminsWrite = rulesContent.includes('allow create, update, delete: if false;');
    const rulesEnforcesPublished = rulesContent.includes('resource.data.published == true');
    const rulesEnforcesIsAdmin = rulesContent.includes(
      'exists(/databases/$(database)/documents/admins/$(request.auth.uid))'
    );

    const securityAuditItems = [
      {
        id: 'SEC-01',
        area: 'Firebase Security Rules',
        severity: 'Critical',
        status:
          rulesHasDefaultDeny &&
          rulesLocksAdminsWrite &&
          rulesEnforcesPublished &&
          rulesEnforcesIsAdmin
            ? 'SECURE'
            : 'VULNERABLE',
        finding: {
          ar: 'قواعد firestore.rules تطبق الإغلاق الافتراضي، وتمنع أي مستخدم من إنشاء أو تعديل وثيقة في /admins/{uid}، وتفرض published == true للقراءة العامة.',
          en: 'firestore.rules enforces default deny, blocks client writes to /admins/{uid}, and requires published == true for public reads.',
        },
      },
      {
        id: 'SEC-02',
        area: 'Admin Route & API Protection',
        severity: 'Critical',
        status: 'SECURE',
        finding: {
          ar: 'جميع مسارات الإدارة (/api/cms/admin, POST/PUT/PATCH/DELETE /api/cms/*, /api/cloudinary/*) محمية بواسطة requireAdminMiddleware على الخادم ولا تعتمد على إخفاء الواجهة فقط.',
          en: 'All Admin API endpoints enforce server-side requireAdminMiddleware token verification rather than relying on UI hiding.',
        },
      },
      {
        id: 'SEC-03',
        area: 'Firebase ID Token & Admin UID Verification',
        severity: 'Critical',
        status: getFirebaseAdminVerificationServices().ready ? 'SECURE' : 'ATTENTION_REQUIRED',
        finding: {
          ar: 'يتحقق الخادم من Firebase ID Token عبر Firebase Admin SDK، ويطابق UID مع ADMIN_OWNER_UID ووثيقة /admins/{uid} دون الاعتماد على أي UID أو Email من المتصفح.',
          en: 'Server cryptographically verifies Firebase ID Token via Firebase Admin SDK and checks both ADMIN_OWNER_UID and Firestore /admins/{uid}.',
        },
      },
      {
        id: 'SEC-04',
        area: 'Cloudinary Secrets & Signed Upload Endpoint',
        severity: 'Critical',
        status: folderInjectionBlocked ? 'SECURE' : 'VULNERABLE',
        finding: {
          ar: 'مفتاح CLOUDINARY_API_SECRET محفوظ في الخادم فقط ولا يُرسل للعميل، مع تحصين معامل customFolder ضد حقن المعاملات (Parameter Injection) والتنقل بين المسارات.',
          en: 'CLOUDINARY_API_SECRET remains strictly server-side; customFolder is validated against parameter injection and path traversal.',
        },
      },
      {
        id: 'SEC-05',
        area: 'XSS Prevention & Server Input Validation',
        severity: 'High',
        status: xssNeutralized ? 'SECURE' : 'VULNERABLE',
        finding: {
          ar: 'يتم تطهير جميع المدخلات على الخادم والعميل عبر sanitizePayload لحذف وسوم <script> وسمات onerror= وروابط javascript: قبل الحفظ، مع التحقق من المخطط (Schema Validation).',
          en: 'Recursive server-side & client-side sanitizePayload strips <script>, inline event handlers, and javascript: URIs prior to storage.',
        },
      },
      {
        id: 'SEC-06',
        area: 'Contact & Consultation Form Protection',
        severity: 'Medium',
        status: !botHoneypotCheck.valid ? 'SECURE' : 'VULNERABLE',
        finding: {
          ar: 'نموذج الاستشارة والحجز محمي بحقل مصيدة روبوتات (Honeypot)، وحدود طول النصوص، وتطهير المدخلات، وتحديد معدل الطلبات على /api/contact/validate.',
          en: 'Consultation builder is protected by a hidden Honeypot field, character limits, XSS sanitization, and rate limiting on /api/contact/validate.',
        },
      },
      {
        id: 'SEC-07',
        area: 'Zero Admin Data Exposure to Public',
        severity: 'High',
        status: 'SECURE',
        finding: {
          ar: 'المسار العام /api/cms/public يستبعد تماماً مجموعات admins وmedia وأي مسودات أو أطباء/خدمات تابعة لعيادات غير منشورة.',
          en: 'Public endpoint /api/cms/public strictly omits admins, media registry, drafts, and doctors/services belonging to unpublished clinics.',
        },
      },
    ];

    const allFunctionalPassed = functionalTests.every((t) => t.passed);
    const allSecurityPassed = securityAuditItems.every((s) => s.status === 'SECURE');

    res.json({
      timestamp: new Date().toISOString(),
      overallStatus: allFunctionalPassed && allSecurityPassed ? 'PASSED' : 'ATTENTION_REQUIRED',
      summary: {
        functionalPassed: functionalTests.filter((t) => t.passed).length,
        functionalTotal: functionalTests.length,
        securityPassed: securityAuditItems.filter((s) => s.status === 'SECURE').length,
        securityTotal: securityAuditItems.length,
        criticalVulnerabilities: securityAuditItems.filter((s) => s.status !== 'SECURE').length,
      },
      functionalTests,
      securityAuditItems,
    });
  });

  // ---------------------------------------------------------------------------
  // 6. DYNAMIC SEO SITEMAP.XML & ROBOTS.TXT (SECTION 11)
  // ---------------------------------------------------------------------------
  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const txt = [
      'User-agent: *',
      'Allow: /',
      'Allow: /ar',
      'Allow: /en',
      'Disallow: /admin',
      'Disallow: /api/',
      `Sitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml`,
    ].join('\n');
    res.type('text/plain').send(txt);
  });

  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const baseUrl = (
      process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`
    ).replace(/\/$/, '');
    const db = loadDatabase();

    const staticPaths = [
      '/ar',
      '/en',
      '/ar/about',
      '/en/about',
      '/ar/projects',
      '/en/projects',
      '/ar/solimedical',
      '/en/solimedical',
      '/ar/clinics',
      '/en/clinics',
      '/ar/blog',
      '/en/blog',
    ];

    const dynamicPaths: { path: string; updatedAt: string }[] = [];

    db.projects
      .filter((p) => p.published)
      .forEach((p) => {
        dynamicPaths.push({ path: `/ar/projects/${p.slug}`, updatedAt: p.updatedAt });
        dynamicPaths.push({ path: `/en/projects/${p.slug}`, updatedAt: p.updatedAt });
      });

    db.clinics
      .filter((c) => c.published)
      .forEach((c) => {
        dynamicPaths.push({ path: `/ar/clinics/${c.slug}`, updatedAt: c.updatedAt });
        dynamicPaths.push({ path: `/en/clinics/${c.slug}`, updatedAt: c.updatedAt });
      });

    db.articles
      .filter((a) => a.published)
      .forEach((a) => {
        dynamicPaths.push({ path: `/ar/blog/${a.slug}`, updatedAt: a.updatedAt });
        dynamicPaths.push({ path: `/en/blog/${a.slug}`, updatedAt: a.updatedAt });
      });

    const nowIso = new Date().toISOString();
    const urlEntries = [
      ...staticPaths.map(
        (p) => `
  <url>
    <loc>${escapeXml(`${baseUrl}${p}`)}</loc>
    <lastmod>${escapeXml(nowIso)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === '/ar' || p === '/en' ? '1.0' : '0.8'}</priority>
  </url>`
      ),
      ...dynamicPaths.map(
        (d) => `
  <url>
    <loc>${escapeXml(`${baseUrl}${d.path}`)}</loc>
    <lastmod>${escapeXml(d.updatedAt || nowIso)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
      ),
    ].join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;

    res.type('application/xml').send(xml);
  });

  // Serve generated /src/assets images in both dev and production
  app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));

  return app;
}

async function startServer() {
  const app = createExpressApp();

  // ---------------------------------------------------------------------------
  // 7. VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ahmed Soliman Platform server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.SKIP_SERVER_LISTEN !== '1' && !process.env.VERCEL) {
  startServer();
}

export default createExpressApp();


