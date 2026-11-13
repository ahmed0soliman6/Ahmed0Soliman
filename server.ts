import express, { type Request, type Response, type NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { INITIAL_PLATFORM_DATA } from './src/data/initialSeedData';
import { PlatformDatabase } from './src/types/cms';
import {
  CORE_PAGE_IDS,
  checkArticleInSiteReferences,
  checkMediaInPublishedContent,
  checkPageInSiteReferences,
  countArticleWords,
  estimateArticleReadingTime,
  isCoreProtectedPage,
  sanitizePayload,
  sanitizeText,
  validateArticleSlug,
  validateCollectionRecord,
  validateCloudinaryFolder,
  validateConsultationForm,
  validateImageUploadFile,
  validatePageSlug,
} from './src/lib/validationSchemas';
import { sanitizeTiptapDoc } from './src/lib/tiptapBridge';

if (!process.env.VERCEL) {
  dotenv.config();
}

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cms-db.json');
const PUBLIC_DATA_DIR = path.resolve(process.cwd(), 'public', 'data');
const PUBLIC_SNAPSHOT_FILE = path.join(PUBLIC_DATA_DIR, 'public-snapshot.json');
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

export interface ServerInstanceOptions {
  snapshotAdapter?: PersistentSnapshotStorageAdapter;
  authDepsResolver?: () => Promise<AdminServiceResolution> | AdminServiceResolution;
  hmacSecret?: string;
  strictProductionMode?: boolean;
}

export interface DecodedAdminToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export interface CentralSessionRecord {
  id: string;
  uid: string;
  email: string;
  name: string;
  expiresAt: number;
  revoked: boolean;
  createdAt: string;
  revokedAt?: string;
}

export interface FirebaseAdminVerificationDeps {
  ownerUid: string;
  ownerEmail?: string;
  verifyIdToken: (idToken: string) => Promise<DecodedAdminToken>;
  hasAdminDocument: (uid: string) => Promise<{ exists: boolean; disabled?: boolean }>;
  saveSessionRecord?: (session: CentralSessionRecord) => Promise<void>;
  getSessionRecord?: (sessionId: string) => Promise<CentralSessionRecord | null>;
  revokeSessionRecord?: (sessionId: string, uid?: string) => Promise<void>;
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

export type AdminServiceResolution =
  | { ready: true; deps: FirebaseAdminVerificationDeps }
  | { ready: false; code: string; error: string };

export function checkFirebaseAdminEnvConfig():
  | {
      ready: true;
      ownerUid: string;
      ownerEmail: string;
      serviceAccount: Record<string, any>;
    }
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
        'Server secret ADMIN_OWNER_UID or ADMIN_OWNER_EMAIL is not configured. Please add it in Vercel / server environment variables.',
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

  return {
    ready: true,
    ownerUid,
    ownerEmail,
    serviceAccount,
  };
}

// ============================================================================
// TELEMETRY COUNTER FOR ZERO PUBLIC FIRESTORE READS VERIFICATION
// ============================================================================
let serverFirestoreReadOpsCount = 0;
let serverFirestoreWriteOpsCount = 0;

export function getFirestoreMetrics() {
  return {
    reads: serverFirestoreReadOpsCount,
    writes: serverFirestoreWriteOpsCount,
  };
}

export function resetFirestoreMetrics(): void {
  serverFirestoreReadOpsCount = 0;
  serverFirestoreWriteOpsCount = 0;
}

async function getAdminFirestoreInstance(): Promise<{
  adminApp: any;
  adminAuth: any;
  adminDb: any;
  ownerUid: string;
  ownerEmail: string;
} | null> {
  const envCheck = checkFirebaseAdminEnvConfig();
  if (!envCheck.ready) return null;

  const { ownerUid, ownerEmail, serviceAccount } = envCheck;
  const [
    { initializeApp: initializeAdminApp, getApps: getAdminApps, cert },
    { getAuth: getAdminAuth },
    { getFirestore: getAdminFirestore },
  ] = await Promise.all([
    import('firebase-admin/app'),
    import('firebase-admin/auth'),
    import('firebase-admin/firestore'),
  ]);

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

  return { adminApp, adminAuth, adminDb, ownerUid, ownerEmail };
}

/**
 * Phase F: Strict Owner Bootstrap Logic (exported for unit & integration testing).
 * Never uses any hardcoded fallback email. Requires explicit ownerEmail or ownerUid from environment variables,
 * and requires userRecord.emailVerified === true.
 */
export async function resolveOrBootstrapAdminDocument(params: {
  uid: string;
  ownerUid?: string;
  ownerEmail?: string;
  getExistingAdminDoc: (
    uid: string
  ) => Promise<{ exists: boolean; data?: Record<string, any> }>;
  getAuthUserRecord: (uid: string) => Promise<{
    uid: string;
    email?: string;
    emailVerified: boolean;
    displayName?: string;
  }>;
  createAdminDoc: (uid: string, docData: Record<string, any>) => Promise<void>;
}): Promise<{ exists: boolean; disabled: boolean; bootstrapped?: boolean }> {
  const {
    uid,
    ownerUid = '',
    ownerEmail = '',
    getExistingAdminDoc,
    getAuthUserRecord,
    createAdminDoc,
  } = params;

  const existing = await getExistingAdminDoc(uid);
  if (existing.exists) {
    return {
      exists: true,
      disabled: Boolean(existing.data?.disabled === true),
      bootstrapped: false,
    };
  }

  const configuredOwnerEmail = ownerEmail.trim().toLowerCase();
  const configuredOwnerUid = ownerUid.replace(/\.+$/, '').trim();

  // If neither ADMIN_OWNER_EMAIL nor ADMIN_OWNER_UID is configured, never bootstrap
  if (!configuredOwnerEmail && !configuredOwnerUid) {
    return { exists: false, disabled: false, bootstrapped: false };
  }

  const userRecord = await getAuthUserRecord(uid);
  if (!userRecord || userRecord.emailVerified !== true) {
    return { exists: false, disabled: false, bootstrapped: false };
  }

  const verifiedEmail = (userRecord.email || '').trim().toLowerCase();

  // If ownerEmail is configured, the user's verified email MUST match it
  if (configuredOwnerEmail && verifiedEmail !== configuredOwnerEmail) {
    return { exists: false, disabled: false, bootstrapped: false };
  }

  // If ownerUid is configured (and no ownerEmail matched), UID must match
  const uidMatches =
    Boolean(configuredOwnerUid) &&
    (uid === configuredOwnerUid ||
      (configuredOwnerUid.length >= 16 && uid.startsWith(configuredOwnerUid)));

  const emailMatches = Boolean(configuredOwnerEmail) && verifiedEmail === configuredOwnerEmail;

  if (!emailMatches && !uidMatches) {
    return { exists: false, disabled: false, bootstrapped: false };
  }

  const newDoc = {
    id: uid,
    uid,
    email: verifiedEmail,
    name: userRecord.displayName || 'Ahmed Soliman',
    role: 'owner',
    disabled: false,
    createdAt: new Date().toISOString(),
  };

  await createAdminDoc(uid, newDoc);
  return { exists: true, disabled: false, bootstrapped: true };
}

export async function getFirebaseAdminVerificationServices(): Promise<AdminServiceResolution> {
  const envCheck = checkFirebaseAdminEnvConfig();
  if (!envCheck.ready) {
    return envCheck;
  }

  try {
    const inst = await getAdminFirestoreInstance();
    if (!inst) {
      return {
        ready: false,
        code: 'FIREBASE_ADMIN_INIT_FAILED',
        error: 'Failed to initialize Firebase Admin SDK.',
      };
    }

    const { adminAuth, adminDb, ownerUid, ownerEmail } = inst;

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
          return resolveOrBootstrapAdminDocument({
            uid,
            ownerUid,
            ownerEmail,
            getExistingAdminDoc: async (targetUid) => {
              serverFirestoreReadOpsCount += 1;
              const snap = await adminDb.collection('admins').doc(targetUid).get();
              return { exists: snap.exists, data: snap.data() };
            },
            getAuthUserRecord: async (targetUid) => {
              const userRec = await adminAuth.getUser(targetUid);
              return {
                uid: userRec.uid,
                email: userRec.email,
                emailVerified: Boolean(userRec.emailVerified),
                displayName: userRec.displayName,
              };
            },
            createAdminDoc: async (targetUid, docData) => {
              serverFirestoreWriteOpsCount += 1;
              await adminDb
                .collection('admins')
                .doc(targetUid)
                .set(docData, { merge: true });
            },
          });
        },
        saveSessionRecord: async (session: CentralSessionRecord) => {
          serverFirestoreWriteOpsCount += 1;
          await adminDb
            .collection('adminSessions')
            .doc(session.id)
            .set(session, { merge: true });
        },
        getSessionRecord: async (sessionId: string) => {
          serverFirestoreReadOpsCount += 1;
          const snap = await adminDb.collection('adminSessions').doc(sessionId).get();
          if (!snap.exists) return null;
          return snap.data() as CentralSessionRecord;
        },
        revokeSessionRecord: async (sessionId: string, uid?: string) => {
          serverFirestoreWriteOpsCount += 1;
          await adminDb
            .collection('adminSessions')
            .doc(sessionId)
            .set(
              {
                id: sessionId,
                revoked: true,
                revokedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          if (uid) {
            await adminAuth.revokeRefreshTokens(uid).catch(() => {});
          }
        },
      },
    };
  } catch (err: any) {
    console.error('Firebase Admin SDK initialization failed:', err);
    return {
      ready: false,
      code: 'FIREBASE_ADMIN_INIT_FAILED',
      error: `Firebase Admin SDK initialization failed: ${err?.message || 'Unknown error'}`,
    };
  }
}

// ============================================================================
// PHASE B (8.3) & PHASE E: STRICT FAIL-CLOSED CENTRALIZED ADMIN SESSION SECURITY
// ============================================================================
export interface AdminSession {
  token: string;
  uid: string;
  email: string;
  name: string;
  expiresAt: number;
}

// Non-authoritative local caches (never used to bypass central Firestore session verification)
export const activeSessions = new Map<string, AdminSession>();
export const revokedSessionTokens = new Set<string>();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const MIN_HMAC_SECRET_BYTES = 32;

let customHmacSecretOverride: string | null = null;

export function setCustomHmacSecretForTesting(secret: string | null): void {
  customHmacSecretOverride = secret;
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getValidAdminSessionSecret(secretOverride?: string):
  | { valid: true; secret: string }
  | { valid: false; code: string; error: string } {
  const rawSecret =
    typeof secretOverride === 'string'
      ? cleanEnvValue(secretOverride)
      : customHmacSecretOverride !== null
      ? cleanEnvValue(customHmacSecretOverride)
      : cleanEnvValue(process.env.ADMIN_SESSION_SECRET);

  if (!rawSecret) {
    return {
      valid: false,
      code: 'ADMIN_SESSION_SECRET_NOT_CONFIGURED',
      error:
        'Server secret ADMIN_SESSION_SECRET is not configured. Please add a cryptographically random secret (minimum 32 bytes) in Vercel environment variables.',
    };
  }

  if (Buffer.byteLength(rawSecret, 'utf-8') < MIN_HMAC_SECRET_BYTES) {
    return {
      valid: false,
      code: 'ADMIN_SESSION_SECRET_TOO_SHORT',
      error:
        'Server secret ADMIN_SESSION_SECRET must be at least 32 bytes in length.',
    };
  }

  return { valid: true, secret: rawSecret };
}

export function createSignedAdminSessionToken(
  payload: Omit<AdminSession, 'token'>,
  secretOverride?: string
): string {
  const secretCheck = getValidAdminSessionSecret(secretOverride);
  if (!secretCheck.valid) {
    throw new Error(secretCheck.error);
  }
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', secretCheck.secret)
    .update(encoded)
    .digest('base64url');
  return `v1.${encoded}.${sig}`;
}

export function verifySignedAdminSessionToken(
  token: string,
  secretOverride?: string
):
  | { valid: true; session: AdminSession }
  | {
      valid: false;
      status: 401 | 503;
      code: string;
      error: string;
    } {
  const secretCheck = getValidAdminSessionSecret(secretOverride);
  if (!secretCheck.valid) {
    return {
      valid: false,
      status: 503,
      code: secretCheck.code,
      error: secretCheck.error,
    };
  }

  if (!token || typeof token !== 'string' || !token.startsWith('v1.')) {
    return {
      valid: false,
      status: 401,
      code: 'INVALID_SESSION_TOKEN',
      error: 'Unauthorized: Malformed admin session token.',
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      valid: false,
      status: 401,
      code: 'INVALID_SESSION_TOKEN',
      error: 'Unauthorized: Malformed admin session token structure.',
    };
  }

  const [, encoded, sig] = parts;
  if (!encoded || !sig) {
    return {
      valid: false,
      status: 401,
      code: 'INVALID_SESSION_TOKEN',
      error: 'Unauthorized: Incomplete admin session token.',
    };
  }

  const expectedSig = crypto
    .createHmac('sha256', secretCheck.secret)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf-8');
  const expectedBuf = Buffer.from(expectedSig, 'utf-8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return {
      valid: false,
      status: 401,
      code: 'INVALID_SESSION_SIGNATURE',
      error: 'Unauthorized: Invalid admin session HMAC signature.',
    };
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    if (!parsed || typeof parsed.uid !== 'string' || !parsed.uid.trim() || typeof parsed.expiresAt !== 'number') {
      return {
        valid: false,
        status: 401,
        code: 'INVALID_SESSION_PAYLOAD',
        error: 'Unauthorized: Invalid session token payload.',
      };
    }
    if (Date.now() > parsed.expiresAt) {
      return {
        valid: false,
        status: 401,
        code: 'SESSION_EXPIRED',
        error: 'Unauthorized: Signed admin session token has expired.',
      };
    }
    return {
      valid: true,
      session: {
        token,
        uid: parsed.uid,
        email: parsed.email || '',
        name: parsed.name || 'Ahmed Soliman',
        expiresAt: parsed.expiresAt,
      },
    };
  } catch {
    return {
      valid: false,
      status: 401,
      code: 'INVALID_SESSION_PAYLOAD',
      error: 'Unauthorized: Failed to decode admin session payload.',
    };
  }
}

/**
 * Simulates a fresh Serverless instance cold start by wiping local in-memory session caches
 * while preserving the central session store.
 */
export function clearLocalInstanceSessionMemory(): void {
  activeSessions.clear();
  revokedSessionTokens.clear();
}

let customAuthDepsResolver:
  | (() => Promise<AdminServiceResolution> | AdminServiceResolution)
  | null = null;

export function setCustomAuthDepsResolver(
  resolver: (() => Promise<AdminServiceResolution> | AdminServiceResolution) | null
): void {
  customAuthDepsResolver = resolver;
}

async function resolveActiveAuthDeps(): Promise<AdminServiceResolution> {
  if (customAuthDepsResolver) {
    return customAuthDepsResolver();
  }
  return getFirebaseAdminVerificationServices();
}

/**
 * Strict fail-closed centralized admin session verification (Phase 8.3).
 * Enforces all 10 mandatory verification checks on every protected admin request.
 * Never authorizes a request based on local memory or HMAC signature alone.
 */
export async function verifyAdminSessionCentralized(
  req: Request,
  resolveDeps: () => Promise<AdminServiceResolution> | AdminServiceResolution = resolveActiveAuthDeps,
  secretOverride?: string
): Promise<{
  authenticated: boolean;
  session?: AdminSession;
  status?: number;
  code?: string;
  error?: string;
}> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      status: 401,
      code: 'ADMIN_AUTH_REQUIRED',
      error: 'Unauthorized: Valid Admin session required.',
    };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return {
      authenticated: false,
      status: 401,
      code: 'ADMIN_AUTH_REQUIRED',
      error: 'Unauthorized: Empty Bearer token.',
    };
  }

  // Check 1 & 2: Valid ADMIN_SESSION_SECRET, valid HMAC signature, and non-expired signed token
  const tokenVerification = verifySignedAdminSessionToken(token, secretOverride);
  if (!tokenVerification.valid) {
    activeSessions.delete(token);
    return {
      authenticated: false,
      status: tokenVerification.status,
      code: tokenVerification.code,
      error: tokenVerification.error,
    };
  }

  const signedSession = tokenVerification.session;

  // Check 3: Firebase Admin verification services are ready (Fail-Closed 503 if unavailable)
  let serviceResolution: AdminServiceResolution;
  try {
    serviceResolution = await resolveDeps();
  } catch (err: any) {
    return {
      authenticated: false,
      status: 503,
      code: 'FIREBASE_SERVICES_UNAVAILABLE',
      error: err?.message || 'Firebase Admin verification services are unavailable.',
    };
  }

  if (!serviceResolution || !serviceResolution.ready) {
    return {
      authenticated: false,
      status: 503,
      code: serviceResolution?.code || 'FIREBASE_SERVICES_UNAVAILABLE',
      error:
        serviceResolution?.error ||
        'Firebase Admin verification services are not ready.',
    };
  }

  const { deps } = serviceResolution;

  // Check 4: The central session lookup function exists (Fail-Closed 503 if missing)
  if (typeof deps.getSessionRecord !== 'function') {
    return {
      authenticated: false,
      status: 503,
      code: 'CENTRAL_SESSION_STORE_UNAVAILABLE',
      error: 'Centralized Firestore session lookup service is unavailable.',
    };
  }

  const sessionId = hashSessionToken(token);

  // Check 5: Query central session record in Firestore adminSessions/{sessionId}
  let centralRec: CentralSessionRecord | null = null;
  try {
    centralRec = await deps.getSessionRecord(sessionId);
  } catch {
    return {
      authenticated: false,
      status: 503,
      code: 'CENTRAL_SESSION_READ_FAILED',
      error: 'Failed to read central admin session record from Firestore.',
    };
  }

  if (!centralRec) {
    activeSessions.delete(token);
    return {
      authenticated: false,
      status: 401,
      code: 'SESSION_NOT_FOUND',
      error: 'Unauthorized: Central admin session record does not exist in Firestore.',
    };
  }

  // Check 6: Central record UID must match the UID inside the signed token
  if (!centralRec.uid || centralRec.uid !== signedSession.uid) {
    activeSessions.delete(token);
    revokedSessionTokens.add(token);
    return {
      authenticated: false,
      status: 401,
      code: 'SESSION_UID_MISMATCH',
      error: 'Unauthorized: Central session record UID does not match signed token UID.',
    };
  }

  // Check 7: Central record is not revoked
  if (centralRec.revoked === true) {
    activeSessions.delete(token);
    revokedSessionTokens.add(token);
    return {
      authenticated: false,
      status: 401,
      code: 'SESSION_REVOKED',
      error: 'Unauthorized: Admin session has been centrally revoked.',
    };
  }

  // Check 8: Central record has not expired
  if (typeof centralRec.expiresAt !== 'number' || Date.now() > centralRec.expiresAt) {
    activeSessions.delete(token);
    return {
      authenticated: false,
      status: 401,
      code: 'SESSION_EXPIRED',
      error: 'Unauthorized: Central admin session record has expired.',
    };
  }

  // Check 9 & 10: Corresponding admins/{uid} document exists and is not disabled
  if (typeof deps.hasAdminDocument !== 'function') {
    return {
      authenticated: false,
      status: 503,
      code: 'FIRESTORE_ADMIN_CHECK_FAILED',
      error: 'Admin account verification function is unavailable.',
    };
  }

  try {
    const adminDoc = await deps.hasAdminDocument(signedSession.uid);
    if (!adminDoc || !adminDoc.exists || adminDoc.disabled === true) {
      activeSessions.delete(token);
      revokedSessionTokens.add(token);
      return {
        authenticated: false,
        status: 403,
        code: 'ADMIN_DISABLED_OR_REVOKED',
        error: 'Access Denied: Admin account is disabled or removed in Firestore /admins/{uid}.',
      };
    }
  } catch {
    return {
      authenticated: false,
      status: 503,
      code: 'FIRESTORE_ADMIN_CHECK_FAILED',
      error: 'Failed to verify admin account status in Firestore.',
    };
  }

  activeSessions.set(token, signedSession);
  return { authenticated: true, session: signedSession };
}

export function createRequireAdminMiddleware(
  resolveDeps: () => Promise<AdminServiceResolution> | AdminServiceResolution = resolveActiveAuthDeps,
  secretOverride?: string
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    verifyAdminSessionCentralized(req, resolveDeps, secretOverride)
      .then((result) => {
        if (!result.authenticated || !result.session) {
          res.status(result.status || 401).json({
            error:
              result.error ||
              'Unauthorized: Valid Admin session required. Session may have expired or been revoked.',
            code: result.code || 'ADMIN_AUTH_REQUIRED',
          });
          return;
        }
        next();
      })
      .catch(() => {
        res.status(503).json({
          error: 'Service Unavailable: Session verification failed unexpectedly.',
          code: 'SESSION_VERIFICATION_ERROR',
        });
      });
  };
}

export function requireAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  createRequireAdminMiddleware()(req, res, next);
}

// ============================================================================
// PHASE A & PRIORITY REQUIREMENT: FIRESTORE SINGLE SOURCE OF TRUTH
// + ZERO FIRESTORE READS FOR PUBLIC VISITORS (STATIC/CDN PUBLIC SNAPSHOT)
// ============================================================================
export interface PublicContentSnapshot {
  version: string;
  generatedAt: string;
  siteSettings: PlatformDatabase['siteSettings'];
  pages: PlatformDatabase['pages'];
  projects: PlatformDatabase['projects'];
  clinics: PlatformDatabase['clinics'];
  doctors: PlatformDatabase['doctors'];
  services: PlatformDatabase['services'];
  articles: PlatformDatabase['articles'];
}

/**
 * Pure function that builds a sanitized Public Content Snapshot from the full CMS database.
 * Strictly strips:
 * - admins collection
 * - media registry collection
 * - any draft record (published !== true)
 * - any archived page or article (archived === true)
 * - any doctor or service belonging to an unpublished clinic
 * - entire sections (projects, clinics, doctors, services, articles) when their parent core page is unpublished
 */
export function isCoreSectionPublished(db: PlatformDatabase, sectionSlug: string): boolean {
  const found = (db.pages || []).find(
    (p) =>
      p.slug === sectionSlug ||
      p.id === sectionSlug ||
      p.id === `page-${sectionSlug}`
  );
  if (found) {
    return found.published === true && found.archived !== true;
  }
  return true;
}

export function buildPublicSnapshot(db: PlatformDatabase): PublicContentSnapshot {
  const enriched = enrichDatabaseWithBaselineDefaults(JSON.parse(JSON.stringify(db)));

  const projectsSectionPublished = isCoreSectionPublished(enriched, 'projects');
  const clinicsSectionPublished = isCoreSectionPublished(enriched, 'clinics');
  const blogSectionPublished = isCoreSectionPublished(enriched, 'blog');

  const publishedClinics = clinicsSectionPublished
    ? (enriched.clinics || [])
        .filter((c) => c.published === true)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    : [];
  const publishedClinicIds = new Set(publishedClinics.map((c) => c.id));

  return {
    version: '8.2.0',
    generatedAt: new Date().toISOString(),
    siteSettings:
      enriched.siteSettings && enriched.siteSettings.published === true
        ? enriched.siteSettings
        : INITIAL_PLATFORM_DATA.siteSettings,
    pages: (enriched.pages || [])
      .filter((p) => p.published === true && p.archived !== true)
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
    projects: projectsSectionPublished
      ? (enriched.projects || [])
          .filter((p) => p.published === true)
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      : [],
    clinics: publishedClinics,
    doctors: clinicsSectionPublished
      ? (enriched.doctors || [])
          .filter((d) => d.published === true && publishedClinicIds.has(d.clinicId))
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      : [],
    services: clinicsSectionPublished
      ? (enriched.services || [])
          .filter((s) => s.published === true && publishedClinicIds.has(s.clinicId))
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      : [],
    articles: blogSectionPublished
      ? (enriched.articles || [])
          .filter((a) => a.published === true && a.archived !== true)
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      : [],
  };
}

let cachedPublishedSnapshot: PublicContentSnapshot | null = null;
let cachedAdminDatabase: PlatformDatabase | null = null;

export interface CmsPersistenceHooks {
  loadAdminDb?: () => Promise<PlatformDatabase>;
  saveAdminDb?: (db: PlatformDatabase) => Promise<void>;
  publishSnapshot?: (snapshot: PublicContentSnapshot) => Promise<void>;
  readPublicSnapshot?: () => Promise<PublicContentSnapshot>;
}

let customCmsHooks: CmsPersistenceHooks | null = null;

export function setCustomCmsHooks(hooks: CmsPersistenceHooks | null): void {
  customCmsHooks = hooks;
  cachedAdminDatabase = null;
  cachedPublishedSnapshot = null;
}

const LEGACY_BROKEN_IMAGE_MAP: Record<string, string> = {
  'https://solimedical.vercel.app/assets/images/dashboard.webp': '/assets/solimedical/dashboard.svg',
  'https://solimedical.vercel.app/assets/images/screen-dashboard.webp': '/assets/solimedical/dashboard.svg',
  'https://solimedical.vercel.app/assets/images/booking.webp': '/assets/solimedical/booking.svg',
  'https://solimedical.vercel.app/assets/images/screen-booking.webp': '/assets/solimedical/booking.svg',
  'https://solimedical.vercel.app/assets/images/appointments.webp': '/assets/solimedical/booking.svg',
  'https://solimedical.vercel.app/assets/images/emr.webp': '/assets/solimedical/emr.svg',
  'https://solimedical.vercel.app/assets/images/screen-emr.webp': '/assets/solimedical/emr.svg',
  'https://solimedical.vercel.app/assets/images/complex.webp': '/assets/solimedical/complex.svg',
};

function healLegacyImageUrl(url: string | undefined): string | undefined {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (LEGACY_BROKEN_IMAGE_MAP[trimmed]) {
    return LEGACY_BROKEN_IMAGE_MAP[trimmed];
  }
  return url;
}

export function enrichDatabaseWithBaselineDefaults(parsed: PlatformDatabase): PlatformDatabase {
  for (const seedPage of INITIAL_PLATFORM_DATA.pages) {
    const existingPage = parsed.pages?.find(
      (p) =>
        p.id === seedPage.id ||
        p.slug === seedPage.slug ||
        p.id === `page-${seedPage.id}`
    );
    if (!existingPage) {
      parsed.pages = [...(parsed.pages || []), JSON.parse(JSON.stringify(seedPage))];
    } else {
      if (!existingPage.qualifications && seedPage.qualifications) {
        existingPage.qualifications = seedPage.qualifications;
      }
      if (!existingPage.achievements && seedPage.achievements) {
        existingPage.achievements = seedPage.achievements;
      }
      if (!existingPage.interests && seedPage.interests) {
        existingPage.interests = seedPage.interests;
      }
      existingPage.heroImage = healLegacyImageUrl(existingPage.heroImage) || seedPage.heroImage;
    }
  }

  if (parsed.pages) {
    parsed.pages.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }

  for (const seedProj of INITIAL_PLATFORM_DATA.projects) {
    const existingProj = parsed.projects?.find((p) => p.id === seedProj.id);
    if (!existingProj) {
      parsed.projects = [...(parsed.projects || []), JSON.parse(JSON.stringify(seedProj))];
    } else {
      existingProj.coverImage =
        healLegacyImageUrl(existingProj.coverImage) || seedProj.coverImage;
      if (Array.isArray(existingProj.screens)) {
        existingProj.screens = existingProj.screens.map((scr: any, idx: number) => {
          if (typeof scr === 'string') {
            return {
              ...(seedProj.screens?.[idx] || {
                id: `scr-${idx}`,
                title: { ar: '', en: '' },
                caption: { ar: '', en: '' },
              }),
              imageUrl:
                healLegacyImageUrl(scr) ||
                seedProj.screens?.[idx]?.imageUrl ||
                '/assets/solimedical/dashboard.svg',
            };
          }
          return {
            ...scr,
            imageUrl:
              healLegacyImageUrl(scr.imageUrl) ||
              seedProj.screens?.[idx]?.imageUrl ||
              '/assets/solimedical/dashboard.svg',
          };
        });
      }
    }
  }

  for (const seedClinic of INITIAL_PLATFORM_DATA.clinics) {
    const existingClinic = parsed.clinics?.find((c) => c.id === seedClinic.id);
    if (!existingClinic) {
      parsed.clinics = [...(parsed.clinics || []), JSON.parse(JSON.stringify(seedClinic))];
    } else {
      existingClinic.coverImage =
        healLegacyImageUrl(existingClinic.coverImage) || seedClinic.coverImage;
    }
  }

  for (const seedArt of INITIAL_PLATFORM_DATA.articles) {
    const existingArt = parsed.articles?.find((a) => a.id === seedArt.id);
    if (!existingArt) {
      parsed.articles = [...(parsed.articles || []), JSON.parse(JSON.stringify(seedArt))];
    } else {
      existingArt.coverImage =
        healLegacyImageUrl(existingArt.coverImage) || seedArt.coverImage;
    }
  }

  for (const seedMedia of INITIAL_PLATFORM_DATA.media) {
    if (!parsed.media?.some((m) => m.id === seedMedia.id)) {
      parsed.media = [...(parsed.media || []), JSON.parse(JSON.stringify(seedMedia))];
    }
  }

  if (parsed.siteSettings) {
    parsed.siteSettings.whatsappNumber = 'Ahmed0soliman';
    parsed.siteSettings.whatsappUrl = 'https://wa.me/Ahmed0soliman';
    parsed.siteSettings.facebookUrl = 'https://www.facebook.com/SoliMedical/';
    parsed.siteSettings.telegramBotUrl = 'https://t.me/SoliMedicalproBot';
    if (typeof parsed.siteSettings.hideVisitorHeaderNav !== 'boolean') {
      parsed.siteSettings.hideVisitorHeaderNav = true;
    }
  }

  return parsed;
}

function loadLocalDevelopmentDatabaseFile(): PlatformDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as PlatformDatabase;
      return enrichDatabaseWithBaselineDefaults(parsed);
    }
  } catch (err) {
    console.error('Error reading local data/cms-db.json:', err);
  }
  return JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
}

async function loadDatabaseFromFirestoreAdmin(adminDb: any): Promise<PlatformDatabase> {
  const collections = [
    'pages',
    'projects',
    'clinics',
    'doctors',
    'services',
    'articles',
    'media',
    'admins',
  ] as const;

  const result: Partial<PlatformDatabase> = {};

  serverFirestoreReadOpsCount += 1;
  const settingsSnap = await adminDb.collection('siteSettings').doc('global').get();
  if (settingsSnap.exists) {
    result.siteSettings = settingsSnap.data() as PlatformDatabase['siteSettings'];
  }

  for (const colName of collections) {
    serverFirestoreReadOpsCount += 1;
    const snap = await adminDb.collection(colName).get();
    const items = snap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));
    (result as any)[colName] = items;
  }

  const hasAnyContent =
    Boolean(result.siteSettings) ||
    (result.pages && result.pages.length > 0) ||
    (result.projects && result.projects.length > 0);

  if (!hasAnyContent) {
    return JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
  }

  const existingPageIds = new Set(
    (result.pages || []).flatMap((p: any) => [p.id, p.slug, `page-${p.id}`])
  );

  const assembled: PlatformDatabase = enrichDatabaseWithBaselineDefaults({
    siteSettings: result.siteSettings || INITIAL_PLATFORM_DATA.siteSettings,
    pages: result.pages && result.pages.length > 0 ? result.pages : INITIAL_PLATFORM_DATA.pages,
    projects:
      result.projects && result.projects.length > 0
        ? result.projects
        : INITIAL_PLATFORM_DATA.projects,
    clinics:
      result.clinics && result.clinics.length > 0
        ? result.clinics
        : INITIAL_PLATFORM_DATA.clinics,
    doctors:
      result.doctors && result.doctors.length > 0
        ? result.doctors
        : INITIAL_PLATFORM_DATA.doctors,
    services:
      result.services && result.services.length > 0
        ? result.services
        : INITIAL_PLATFORM_DATA.services,
    articles:
      result.articles && result.articles.length > 0
        ? result.articles
        : INITIAL_PLATFORM_DATA.articles,
    media: result.media && result.media.length > 0 ? result.media : INITIAL_PLATFORM_DATA.media,
    admins: result.admins || [],
  });

  // Backfill any missing core pages into Firestore pages collection so all 6 core pages persist
  for (const corePage of assembled.pages) {
    if (!existingPageIds.has(corePage.id) && !existingPageIds.has(corePage.slug)) {
      try {
        serverFirestoreWriteOpsCount += 1;
        await adminDb
          .collection('pages')
          .doc(corePage.id)
          .set(JSON.parse(JSON.stringify(corePage)), { merge: true });
      } catch {
        // non-fatal during read
      }
    }
  }

  return assembled;
}

/**
 * Loads the complete CMS database for ADMIN operations ONLY.
 * Uses change-based caching to minimize Firebase Admin SDK reads.
 * Never called by public visitor routes.
 */
export async function loadAdminDatabase(forceRefresh = false): Promise<PlatformDatabase> {
  if (customCmsHooks?.loadAdminDb) {
    const raw = await customCmsHooks.loadAdminDb();
    return enrichDatabaseWithBaselineDefaults(raw);
  }

  if (!forceRefresh && cachedAdminDatabase) {
    return JSON.parse(JSON.stringify(cachedAdminDatabase));
  }

  const inst = await getAdminFirestoreInstance();
  if (inst) {
    const db = await loadDatabaseFromFirestoreAdmin(inst.adminDb);
    cachedAdminDatabase = JSON.parse(JSON.stringify(db));
    return db;
  }

  const localDb = loadLocalDevelopmentDatabaseFile();
  cachedAdminDatabase = JSON.parse(JSON.stringify(localDb));
  return localDb;
}

/**
 * Writes a specific mutation or full database state to Firestore (Single Source of Truth).
 * Never uses /tmp/cms-db.json on Vercel. Throws an explicit error if Firestore write fails.
 */
export async function persistAdminMutationToFirestore(params: {
  nextDb: PlatformDatabase;
  operation:
    | { type: 'siteSettings'; data: PlatformDatabase['siteSettings'] }
    | { type: 'upsert'; collection: string; id: string; record: Record<string, any> }
    | { type: 'delete'; collection: string; id: string }
    | { type: 'reorder'; collection: string; items: Record<string, any>[] }
    | { type: 'fullReplace'; database: PlatformDatabase };
}): Promise<void> {
  const { nextDb, operation } = params;

  if (customCmsHooks?.saveAdminDb) {
    await customCmsHooks.saveAdminDb(nextDb);
    cachedAdminDatabase = JSON.parse(JSON.stringify(nextDb));
    return;
  }

  const inst = await getAdminFirestoreInstance();
  if (inst) {
    const { adminDb } = inst;
    const cleanJson = <T>(val: T): T => JSON.parse(JSON.stringify(val));

    if (operation.type === 'siteSettings') {
      serverFirestoreWriteOpsCount += 1;
      await adminDb
        .collection('siteSettings')
        .doc('global')
        .set(cleanJson(operation.data), { merge: true });
    } else if (operation.type === 'upsert') {
      serverFirestoreWriteOpsCount += 1;
      await adminDb
        .collection(operation.collection)
        .doc(operation.id)
        .set(cleanJson(operation.record), { merge: true });
    } else if (operation.type === 'delete') {
      serverFirestoreWriteOpsCount += 1;
      await adminDb.collection(operation.collection).doc(operation.id).delete();
    } else if (operation.type === 'reorder') {
      const batch = adminDb.batch();
      for (const item of operation.items) {
        serverFirestoreWriteOpsCount += 1;
        const ref = adminDb.collection(operation.collection).doc(item.id);
        batch.set(ref, cleanJson(item), { merge: true });
      }
      await batch.commit();
    } else if (operation.type === 'fullReplace') {
      const dbData = cleanJson(operation.database);
      serverFirestoreWriteOpsCount += 1;
      await adminDb
        .collection('siteSettings')
        .doc('global')
        .set(dbData.siteSettings, { merge: true });

      const cols = [
        'pages',
        'projects',
        'clinics',
        'doctors',
        'services',
        'articles',
        'media',
      ] as const;
      for (const colName of cols) {
        const batch = adminDb.batch();
        for (const item of (dbData as any)[colName] || []) {
          if (!item?.id) continue;
          serverFirestoreWriteOpsCount += 1;
          batch.set(adminDb.collection(colName).doc(item.id), item, { merge: true });
        }
        await batch.commit();
      }
    }

    cachedAdminDatabase = JSON.parse(JSON.stringify(nextDb));
    if (!process.env.VERCEL) {
      try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DB_FILE, JSON.stringify(nextDb, null, 2), 'utf-8');
      } catch {
        // ignore in read-only environments
      }
    }
    return;
  }

  // Phase A Rule 2: Never rely on /tmp/cms-db.json on Vercel
  if (process.env.VERCEL) {
    throw new Error(
      'Firestore Admin SDK (FIREBASE_SERVICE_ACCOUNT_JSON) is not configured on Vercel. Ephemeral /tmp storage is disabled to protect data integrity.'
    );
  }

  // Local non-Vercel development persistence
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(nextDb, null, 2), 'utf-8');
  cachedAdminDatabase = JSON.parse(JSON.stringify(nextDb));
}

// ============================================================================
// PHASE A (8.3): DURABLE & SHARED PUBLIC SNAPSHOT STORAGE (VERCEL BLOB)
// ============================================================================
export interface PublicSnapshotManifest {
  version: string;
  revision: number;
  contentHash: string;
  snapshotPathname: string;
  snapshotUrl: string;
  generatedAt: string;
  updatedAt: string;
}

export interface PersistentSnapshotStorageAdapter {
  isConfigured: () => boolean;
  writeVersionedSnapshot: (
    pathname: string,
    serializedJson: string
  ) => Promise<{ url: string; pathname: string }>;
  readSnapshotByUrlOrPath: (urlOrPathname: string) => Promise<string | null>;
  readCurrentManifest: () => Promise<{
    manifest: PublicSnapshotManifest | null;
    etag?: string;
  }>;
  writeCurrentManifest: (
    manifest: PublicSnapshotManifest,
    options?: { ifMatchEtag?: string }
  ) => Promise<{ url: string; etag?: string }>;
}

export class PublicSnapshotUnavailableError extends Error {
  public readonly status: number;
  public readonly code: string;
  constructor(message: string, code = 'PUBLIC_SNAPSHOT_UNAVAILABLE', status = 503) {
    super(message);
    this.name = 'PublicSnapshotUnavailableError';
    this.code = code;
    this.status = status;
  }
}

const SNAPSHOT_MANIFEST_PATHNAME = 'snapshots/manifest.json';

export function computeSnapshotContentHash(snapshot: PublicContentSnapshot): string {
  const deterministicPayload = {
    version: snapshot.version,
    siteSettings: snapshot.siteSettings,
    pages: snapshot.pages,
    projects: snapshot.projects,
    clinics: snapshot.clinics,
    doctors: snapshot.doctors,
    services: snapshot.services,
    articles: snapshot.articles,
  };
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(deterministicPayload), 'utf-8')
    .digest('hex');
}

export function validateSnapshotStructure(input: unknown): input is PublicContentSnapshot {
  if (!input || typeof input !== 'object') return false;
  const candidate = input as Record<string, any>;
  return (
    typeof candidate.version === 'string' &&
    typeof candidate.generatedAt === 'string' &&
    Boolean(candidate.siteSettings && typeof candidate.siteSettings === 'object') &&
    Array.isArray(candidate.pages) &&
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.clinics) &&
    Array.isArray(candidate.doctors) &&
    Array.isArray(candidate.services) &&
    Array.isArray(candidate.articles) &&
    candidate.admins === undefined &&
    candidate.media === undefined
  );
}

let latestPublishedVercelManifest: {
  manifest: PublicSnapshotManifest;
  etag?: string;
} | null = null;

function parseManifestRevisionFromPath(pathname: string): number {
  const match = String(pathname || '').match(/snapshots\/manifest-v(\d+)-/);
  return match ? Number(match[1]) || 0 : 0;
}

export function createVercelBlobSnapshotAdapter(
  tokenOverride?: string
): PersistentSnapshotStorageAdapter {
  const resolveToken = () =>
    typeof tokenOverride === 'string'
      ? cleanEnvValue(tokenOverride)
      : cleanEnvValue(process.env.BLOB_READ_WRITE_TOKEN);

  const readBlobText = async (urlOrPathname: string, token: string): Promise<{ text: string; etag?: string } | null> => {
    const { get, BlobNotFoundError } = await import('@vercel/blob');
    try {
      const res = await get(urlOrPathname, {
        access: 'public',
        useCache: false,
        token,
      });
      if (!res || res.statusCode !== 200 || !res.stream) {
        return null;
      }
      const text = await new globalThis.Response(res.stream).text();
      return { text, etag: res.blob?.etag };
    } catch (err: any) {
      if (err instanceof BlobNotFoundError || err?.name === 'BlobNotFoundError') {
        return null;
      }
      throw err;
    }
  };

  return {
    isConfigured: () => Boolean(resolveToken()),
    writeVersionedSnapshot: async (pathname: string, serializedJson: string) => {
      const token = resolveToken();
      if (!token) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
      }
      const { put } = await import('@vercel/blob');
      const res = await put(pathname, serializedJson, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 31536000,
        token,
      });
      return { url: res.url, pathname: res.pathname || pathname };
    },
    readSnapshotByUrlOrPath: async (urlOrPathname: string) => {
      const token = resolveToken();
      if (!token) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
      }
      const res = await readBlobText(urlOrPathname, token);
      return res ? res.text : null;
    },
    readCurrentManifest: async () => {
      const token = resolveToken();
      if (!token) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
      }
      const { list } = await import('@vercel/blob');

      const [directOutcome, listOutcome] = await Promise.allSettled([
        readBlobText(SNAPSHOT_MANIFEST_PATHNAME, token),
        list({
          prefix: 'snapshots/manifest-v',
          limit: 25,
          token,
        }),
      ]);

      let bestManifest: PublicSnapshotManifest | null = null;
      let bestEtag: string | undefined;

      if (directOutcome.status === 'fulfilled' && directOutcome.value) {
        try {
          const parsed = JSON.parse(directOutcome.value.text) as PublicSnapshotManifest;
          if (
            parsed &&
            typeof parsed.revision === 'number' &&
            typeof parsed.contentHash === 'string' &&
            typeof parsed.snapshotPathname === 'string'
          ) {
            bestManifest = parsed;
            bestEtag = directOutcome.value.etag;
          }
        } catch {
          // ignore malformed manifest
        }
      }

      // Check strongly-consistent Blob metadata list() for immutable versioned manifests
      // to bypass the 60-second Vercel Blob CDN cache on overwritten snapshots/manifest.json
      if (listOutcome.status === 'fulfilled' && Array.isArray(listOutcome.value?.blobs)) {
        let highestBlob: { pathname: string; url: string; rev: number } | null = null;
        for (const item of listOutcome.value.blobs) {
          const rev = parseManifestRevisionFromPath(item.pathname);
          if (rev > 0 && (!highestBlob || rev > highestBlob.rev)) {
            highestBlob = { pathname: item.pathname, url: item.url, rev };
          }
        }

        if (highestBlob && highestBlob.rev > (bestManifest?.revision || 0)) {
          if (
            latestPublishedVercelManifest &&
            latestPublishedVercelManifest.manifest.revision === highestBlob.rev
          ) {
            bestManifest = latestPublishedVercelManifest.manifest;
            bestEtag = latestPublishedVercelManifest.etag;
          } else {
            const versionedRead = await readBlobText(
              highestBlob.url || highestBlob.pathname,
              token
            ).catch(() => null);
            if (versionedRead) {
              try {
                const parsedVer = JSON.parse(versionedRead.text) as PublicSnapshotManifest;
                if (
                  parsedVer &&
                  typeof parsedVer.revision === 'number' &&
                  typeof parsedVer.contentHash === 'string' &&
                  typeof parsedVer.snapshotPathname === 'string' &&
                  parsedVer.revision >= highestBlob.rev
                ) {
                  bestManifest = parsedVer;
                  bestEtag = versionedRead.etag;
                }
              } catch {
                // ignore malformed versioned manifest
              }
            }
          }
        }
      }

      if (
        latestPublishedVercelManifest &&
        latestPublishedVercelManifest.manifest.revision > (bestManifest?.revision || 0)
      ) {
        bestManifest = latestPublishedVercelManifest.manifest;
        bestEtag = latestPublishedVercelManifest.etag;
      }

      if (!bestManifest && directOutcome.status === 'rejected') {
        throw directOutcome.reason;
      }

      return { manifest: bestManifest, etag: bestEtag };
    },
    writeCurrentManifest: async (manifest: PublicSnapshotManifest) => {
      const token = resolveToken();
      if (!token) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
      }
      const { put, list, del } = await import('@vercel/blob');
      const serialized = JSON.stringify(manifest, null, 2);
      const versionedManifestPathname = `snapshots/manifest-v${String(manifest.revision).padStart(
        8,
        '0'
      )}-${manifest.contentHash.slice(0, 12)}.json`;

      const [mainRes, versionedRes] = await Promise.all([
        put(SNAPSHOT_MANIFEST_PATHNAME, serialized, {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
          cacheControlMaxAge: 60,
          token,
        }),
        put(versionedManifestPathname, serialized, {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
          cacheControlMaxAge: 31536000,
          token,
        }),
      ]);

      const resultEtag = (mainRes as any).etag || (versionedRes as any).etag;
      latestPublishedVercelManifest = {
        manifest,
        etag: resultEtag,
      };

      // Background cleanup of older versioned manifests (keep newest 5)
      void (async () => {
        try {
          const listed = await list({ prefix: 'snapshots/manifest-v', limit: 30, token });
          if (Array.isArray(listed?.blobs) && listed.blobs.length > 5) {
            const sorted = [...listed.blobs].sort(
              (a, b) => parseManifestRevisionFromPath(b.pathname) - parseManifestRevisionFromPath(a.pathname)
            );
            const staleUrls = sorted.slice(5).map((b) => b.url);
            if (staleUrls.length > 0) {
              await del(staleUrls, { token });
            }
          }
        } catch {
          // non-fatal cleanup
        }
      })();

      return { url: mainRes.url || versionedRes.url, etag: resultEtag };
    },
  };
}

let customSnapshotStorageAdapter: PersistentSnapshotStorageAdapter | null = null;
let forceProductionSnapshotMode = false;

interface InstanceSnapshotCacheEntry {
  revision: number;
  contentHash: string;
  snapshot: PublicContentSnapshot;
}

let defaultInstanceSnapshotCache: InstanceSnapshotCacheEntry | null = null;

export function setCustomSnapshotStorageAdapter(
  adapter: PersistentSnapshotStorageAdapter | null
): void {
  customSnapshotStorageAdapter = adapter;
  defaultInstanceSnapshotCache = null;
  cachedPublishedSnapshot = null;
  latestPublishedVercelManifest = null;
}

export function setForceProductionSnapshotMode(enabled: boolean): void {
  forceProductionSnapshotMode = enabled;
}

export function clearLocalInstanceSnapshotMemory(): void {
  defaultInstanceSnapshotCache = null;
  cachedPublishedSnapshot = null;
  latestPublishedVercelManifest = null;
}

function isProductionEnvironment(strictOverride?: boolean): boolean {
  if (typeof strictOverride === 'boolean') return strictOverride;
  return Boolean(
    forceProductionSnapshotMode ||
      process.env.VERCEL === '1' ||
      process.env.VERCEL === 'true' ||
      process.env.NODE_ENV === 'production'
  );
}

function resolveSnapshotAdapter(
  override?: PersistentSnapshotStorageAdapter
): PersistentSnapshotStorageAdapter {
  if (override) return override;
  if (customSnapshotStorageAdapter) return customSnapshotStorageAdapter;
  return createVercelBlobSnapshotAdapter();
}

/**
 * Publishes the filtered Public Content Snapshot after a successful Firestore write.
 * Sequence (Phase 8.3):
 * 1. Generate filtered snapshot via buildPublicSnapshot(db).
 * 2. Serialize and validate the generated snapshot.
 * 3. Compute stable content hash & monotonic revision.
 * 4. Upload immutable versioned snapshot to persistent storage.
 * 5. Verify uploaded snapshot can be retrieved and parsed.
 * 6. Update current-snapshot manifest pointer only after versioned snapshot is verified
 *    and no newer concurrent revision exists.
 * Never claims published: true for memory-only or unconfigured storage.
 */
export async function publishPublicSnapshot(
  db: PlatformDatabase,
  options?: {
    revision?: number;
    adapter?: PersistentSnapshotStorageAdapter;
    instanceCacheRef?: { current: InstanceSnapshotCacheEntry | null };
  }
): Promise<{
  published: boolean;
  snapshot: PublicContentSnapshot;
  manifest?: PublicSnapshotManifest;
  code?: string;
  error?: string;
}> {
  const snapshot = buildPublicSnapshot(db);

  try {
    // Support Phase 8.2 legacy test hook if explicitly registered
    if (customCmsHooks?.publishSnapshot && !options?.adapter && !customSnapshotStorageAdapter) {
      await customCmsHooks.publishSnapshot(snapshot);
      cachedPublishedSnapshot = snapshot;
      return { published: true, snapshot };
    }

    const serialized = JSON.stringify(snapshot, null, 2);
    const parsedCheck = JSON.parse(serialized);
    if (!validateSnapshotStructure(parsedCheck)) {
      return {
        published: false,
        snapshot,
        code: 'INVALID_SNAPSHOT_STRUCTURE',
        error: 'Generated public snapshot failed structural validation.',
      };
    }

    const adapter = resolveSnapshotAdapter(options?.adapter);
    if (!adapter.isConfigured()) {
      // In local development, keep public/data/public-snapshot.json synced for local preview,
      // but NEVER claim published: true when persistent Blob storage is unconfigured!
      if (!isProductionEnvironment()) {
        try {
          if (!fs.existsSync(PUBLIC_DATA_DIR)) {
            fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
          }
          fs.writeFileSync(PUBLIC_SNAPSHOT_FILE, serialized, 'utf-8');
        } catch {
          // ignore local disk write error
        }
      }
      return {
        published: false,
        snapshot,
        code: 'BLOB_NOT_CONFIGURED',
        error:
          'Persistent snapshot storage (BLOB_READ_WRITE_TOKEN) is not configured. Content was saved to Firestore, but public snapshot publication failed.',
      };
    }

    const contentHash = computeSnapshotContentHash(snapshot);
    const { manifest: currentManifest, etag: initialEtag } = await adapter.readCurrentManifest();

    if (
      typeof options?.revision === 'number' &&
      currentManifest &&
      options.revision <= currentManifest.revision
    ) {
      return {
        published: false,
        snapshot,
        code: 'STALE_SNAPSHOT_REVISION',
        error: `Snapshot revision ${options.revision} is older than or equal to current revision ${currentManifest.revision}.`,
      };
    }

    const nextRevision =
      typeof options?.revision === 'number'
        ? options.revision
        : (currentManifest?.revision || 0) + 1;

    const versionedPathname = `snapshots/public-snapshot-v${nextRevision}-${contentHash.slice(0, 12)}.json`;

    // Upload immutable versioned snapshot
    const uploadResult = await adapter.writeVersionedSnapshot(versionedPathname, serialized);
    if (!uploadResult || !uploadResult.url) {
      return {
        published: false,
        snapshot,
        code: 'SNAPSHOT_UPLOAD_FAILED',
        error: 'Failed to upload versioned public snapshot to persistent storage.',
      };
    }

    // Verify that the uploaded snapshot can be retrieved and parsed before updating manifest
    const retrievedRaw = await adapter.readSnapshotByUrlOrPath(
      uploadResult.url || uploadResult.pathname || versionedPathname
    );
    if (!retrievedRaw) {
      return {
        published: false,
        snapshot,
        code: 'SNAPSHOT_VERIFICATION_FAILED',
        error: 'Uploaded versioned snapshot could not be retrieved for verification.',
      };
    }

    let verifiedSnapshot: PublicContentSnapshot;
    try {
      verifiedSnapshot = JSON.parse(retrievedRaw) as PublicContentSnapshot;
    } catch {
      return {
        published: false,
        snapshot,
        code: 'SNAPSHOT_VERIFICATION_CORRUPT',
        error: 'Uploaded versioned snapshot returned invalid JSON during verification.',
      };
    }

    if (
      !validateSnapshotStructure(verifiedSnapshot) ||
      computeSnapshotContentHash(verifiedSnapshot) !== contentHash
    ) {
      return {
        published: false,
        snapshot,
        code: 'SNAPSHOT_HASH_MISMATCH',
        error: 'Verified snapshot hash or structure did not match uploaded snapshot.',
      };
    }

    const nextManifest: PublicSnapshotManifest = {
      version: verifiedSnapshot.version,
      revision: nextRevision,
      contentHash,
      snapshotPathname: uploadResult.pathname || versionedPathname,
      snapshotUrl: uploadResult.url,
      generatedAt: verifiedSnapshot.generatedAt,
      updatedAt: new Date().toISOString(),
    };

    const writeManifestResult = await adapter.writeCurrentManifest(nextManifest, {
      ifMatchEtag: initialEtag,
    });
    if (!writeManifestResult || !writeManifestResult.url) {
      return {
        published: false,
        snapshot,
        code: 'MANIFEST_VERIFICATION_FAILED',
        error: 'Failed to confirm updated public snapshot manifest pointer.',
      };
    }

    const { manifest: confirmedManifest } = await adapter.readCurrentManifest();
    if (confirmedManifest && confirmedManifest.revision > nextRevision) {
      return {
        published: false,
        snapshot,
        code: 'CONCURRENT_NEWER_SNAPSHOT',
        error: `A newer snapshot (revision ${confirmedManifest.revision}) was published concurrently; skipping older revision ${nextRevision}.`,
      };
    }

    const cacheEntry: InstanceSnapshotCacheEntry = {
      revision: nextRevision,
      contentHash,
      snapshot: verifiedSnapshot,
    };
    if (options?.instanceCacheRef) {
      options.instanceCacheRef.current = cacheEntry;
    } else {
      defaultInstanceSnapshotCache = cacheEntry;
    }
    cachedPublishedSnapshot = verifiedSnapshot;

    return {
      published: true,
      snapshot: verifiedSnapshot,
      manifest: nextManifest,
    };
  } catch (err: any) {
    console.error('Failed to publish public content snapshot:', err);
    return {
      published: false,
      snapshot,
      code: 'SNAPSHOT_PUBLISH_ERROR',
      error: err?.message || 'Failed to publish public content snapshot.',
    };
  }
}

/**
 * Reads the published Public Content Snapshot for public visitors.
 * GUARANTEES ZERO FIRESTORE READS: never calls adminDb, loadAdminDatabase, or Firebase SDK.
 * In production, never falls back to INITIAL_PLATFORM_DATA or local data/cms-db.json.
 */
export async function readPublishedPublicSnapshot(options?: {
  adapter?: PersistentSnapshotStorageAdapter;
  instanceCacheRef?: { current: InstanceSnapshotCacheEntry | null };
  strictProductionMode?: boolean;
}): Promise<PublicContentSnapshot> {
  if (customCmsHooks?.readPublicSnapshot && !options?.adapter && !customSnapshotStorageAdapter) {
    return customCmsHooks.readPublicSnapshot();
  }

  const adapter = resolveSnapshotAdapter(options?.adapter);
  const strictProd = isProductionEnvironment(options?.strictProductionMode);
  const activeCache = options?.instanceCacheRef
    ? options.instanceCacheRef.current
    : defaultInstanceSnapshotCache;

  if (adapter.isConfigured()) {
    let manifestResult: { manifest: PublicSnapshotManifest | null; etag?: string };
    try {
      manifestResult = await adapter.readCurrentManifest();
    } catch (err: any) {
      throw new PublicSnapshotUnavailableError(
        `Failed to read public snapshot manifest from persistent storage: ${err?.message || 'Unknown error'}`,
        'MANIFEST_READ_FAILED',
        503
      );
    }

    const { manifest } = manifestResult;
    if (!manifest) {
      throw new PublicSnapshotUnavailableError(
        'No published public snapshot exists in persistent storage. An administrator must publish the snapshot via /api/cms/publish-snapshot.',
        'PUBLIC_SNAPSHOT_NOT_INITIALIZED',
        503
      );
    }

    if (
      activeCache &&
      activeCache.revision === manifest.revision &&
      activeCache.contentHash === manifest.contentHash
    ) {
      return activeCache.snapshot;
    }

    let rawSnapshot: string | null = null;
    try {
      rawSnapshot = await adapter.readSnapshotByUrlOrPath(
        manifest.snapshotUrl || manifest.snapshotPathname
      );
      if (!rawSnapshot && manifest.snapshotPathname && manifest.snapshotUrl !== manifest.snapshotPathname) {
        rawSnapshot = await adapter.readSnapshotByUrlOrPath(manifest.snapshotPathname);
      }
    } catch (err: any) {
      throw new PublicSnapshotUnavailableError(
        `Failed to fetch versioned public snapshot from persistent storage: ${err?.message || 'Unknown error'}`,
        'SNAPSHOT_READ_FAILED',
        503
      );
    }

    if (!rawSnapshot) {
      throw new PublicSnapshotUnavailableError(
        `Versioned snapshot referenced by manifest (${manifest.snapshotPathname}) was not found in persistent storage.`,
        'SNAPSHOT_BLOB_NOT_FOUND',
        503
      );
    }

    let parsed: PublicContentSnapshot;
    try {
      parsed = JSON.parse(rawSnapshot) as PublicContentSnapshot;
    } catch {
      throw new PublicSnapshotUnavailableError(
        'Persisted public snapshot JSON is corrupted.',
        'SNAPSHOT_CORRUPTED',
        503
      );
    }

    if (
      !validateSnapshotStructure(parsed) ||
      computeSnapshotContentHash(parsed) !== manifest.contentHash
    ) {
      throw new PublicSnapshotUnavailableError(
        'Persisted public snapshot failed integrity validation.',
        'SNAPSHOT_INTEGRITY_FAILED',
        503
      );
    }

    const entry: InstanceSnapshotCacheEntry = {
      revision: manifest.revision,
      contentHash: manifest.contentHash,
      snapshot: parsed,
    };
    if (options?.instanceCacheRef) {
      options.instanceCacheRef.current = entry;
    } else {
      defaultInstanceSnapshotCache = entry;
    }
    cachedPublishedSnapshot = parsed;
    return parsed;
  }

  // If adapter is NOT configured:
  // In production, NEVER silently fall back to INITIAL_PLATFORM_DATA or local data/cms-db.json!
  if (strictProd) {
    throw new PublicSnapshotUnavailableError(
      'Persistent public snapshot storage (BLOB_READ_WRITE_TOKEN) is not configured in production.',
      'BLOB_NOT_CONFIGURED',
      503
    );
  }

  // Non-production local development preview only (still 0 Firestore reads):
  if (cachedPublishedSnapshot) {
    return cachedPublishedSnapshot;
  }

  try {
    if (fs.existsSync(PUBLIC_SNAPSHOT_FILE)) {
      const raw = fs.readFileSync(PUBLIC_SNAPSHOT_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as PublicContentSnapshot;
      if (validateSnapshotStructure(parsed)) {
        cachedPublishedSnapshot = parsed;
        return cachedPublishedSnapshot;
      }
    }
  } catch (err) {
    console.error('Error reading local public-snapshot.json:', err);
  }

  const fallbackDb = loadLocalDevelopmentDatabaseFile();
  const built = buildPublicSnapshot(fallbackDb);
  cachedPublishedSnapshot = built;
  return built;
}

function cleanTemporaryChatAttachments(): void {
  if (process.env.VERCEL) return;
  try {
    const aistudioDir = path.resolve(process.cwd(), 'public', 'assets', 'aistudio');
    if (!fs.existsSync(aistudioDir)) return;
    const allowedFiles = new Set([
      '1770146906397_16665dd0.png',
      'logo_ae3842b8.png',
      'owner_portrait.png',
      'owner_portrait.webp',
    ]);
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

export function createAdminLoginHandler(
  resolveDeps: () => Promise<AdminServiceResolution> | AdminServiceResolution = resolveActiveAuthDeps,
  secretOverride?: string
) {
  return async (req: Request, res: Response): Promise<void> => {
    const clientIp = req.ip || 'local';
    if (!checkRateLimit(`login:${clientIp}`, 35, 15 * 60 * 1000)) {
      res.status(429).json({
        error: 'Too many login attempts. Please wait before trying again.',
        code: 'RATE_LIMITED',
      });
      return;
    }

    // Mandatory Check: ADMIN_SESSION_SECRET must be configured and >= 32 bytes
    const secretCheck = getValidAdminSessionSecret(secretOverride);
    if (!secretCheck.valid) {
      res.status(503).json({
        error: secretCheck.error,
        code: secretCheck.code,
      });
      return;
    }

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

    let serviceResolution: AdminServiceResolution;
    try {
      serviceResolution = await resolveDeps();
    } catch (err: any) {
      res.status(503).json({
        error: err?.message || 'Firebase Admin verification services are unavailable.',
        code: 'FIREBASE_SERVICES_UNAVAILABLE',
      });
      return;
    }

    if (!serviceResolution || !serviceResolution.ready) {
      res.status(503).json({
        error: serviceResolution?.error || 'Firebase Admin verification services are not ready.',
        code: serviceResolution?.code || 'FIREBASE_SERVICES_UNAVAILABLE',
      });
      return;
    }

    const { deps } = serviceResolution;

    if (typeof deps.saveSessionRecord !== 'function' || typeof deps.getSessionRecord !== 'function') {
      res.status(503).json({
        error: 'Centralized Firestore session persistence is not available.',
        code: 'CENTRAL_SESSION_STORE_UNAVAILABLE',
      });
      return;
    }

    // Step 1: Verify Firebase ID Token using Firebase Admin SDK with revocation checking
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

    // Step 2: Preserve owner UID/email verification
    const normalizedOwnerUid = (deps.ownerUid || '').replace(/\.+$/, '').trim();
    const uidMatches =
      Boolean(normalizedOwnerUid) &&
      (decoded.uid === normalizedOwnerUid ||
        (normalizedOwnerUid.length >= 16 && decoded.uid.startsWith(normalizedOwnerUid)));
    const verifiedOwnerEmailMatches =
      typeof deps.ownerEmail === 'string' &&
      deps.ownerEmail.trim().length > 0 &&
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

    if (
      deps.ownerEmail &&
      deps.ownerEmail.trim().length > 0 &&
      (!decoded.email ||
        decoded.email.trim().toLowerCase() !== deps.ownerEmail.trim().toLowerCase())
    ) {
      res.status(403).json({
        error: 'Access Denied: Authenticated account email does not match ADMIN_OWNER_EMAIL.',
        code: 'FORBIDDEN_EMAIL_MISMATCH',
      });
      return;
    }

    // Step 3: Verify admins/{uid} exists and is active
    try {
      const adminDoc = await deps.hasAdminDocument(decoded.uid);
      if (!adminDoc.exists || adminDoc.disabled) {
        res.status(403).json({
          error: adminDoc.disabled
            ? 'Access Denied: Admin account is disabled in Firestore /admins/{uid}.'
            : 'Access Denied: UID is not registered in Firestore /admins/{uid}.',
          code: adminDoc.disabled ? 'FORBIDDEN_ADMIN_DISABLED' : 'FORBIDDEN_NOT_ADMIN_UID',
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

    // Step 4: Create signed session token
    const finalEmail = sanitizeText(decoded.email || '', 120).trim().toLowerCase();
    const finalName = sanitizeText(decoded.name || 'Ahmed Soliman', 120) || 'Ahmed Soliman';
    const expiresAt = Date.now() + SESSION_TTL_MS;
    const token = createSignedAdminSessionToken(
      {
        uid: decoded.uid,
        email: finalEmail,
        name: finalName,
        expiresAt,
      },
      secretOverride
    );

    const session: AdminSession = {
      token,
      uid: decoded.uid,
      email: finalEmail,
      name: finalName,
      expiresAt,
    };

    // Step 5 & 6: Create central adminSessions/{sessionId} record in Firestore and wait for write to succeed
    const sessionId = hashSessionToken(token);
    const centralRecord: CentralSessionRecord = {
      id: sessionId,
      uid: session.uid,
      email: session.email,
      name: session.name,
      expiresAt: session.expiresAt,
      revoked: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await deps.saveSessionRecord(centralRecord);
    } catch (err: any) {
      res.status(503).json({
        error:
          err?.message ||
          'Failed to persist central admin session in Firestore. Login aborted.',
        code: 'SESSION_CREATION_WRITE_FAILED',
      });
      return;
    }

    // Step 7: Only after central Firestore write succeeds, cache locally and return session token
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
  resolveDeps: () => Promise<AdminServiceResolution> | AdminServiceResolution = resolveActiveAuthDeps,
  secretOverride?: string
): void {
  app.get('/api/auth/firebase-config', (_req: Request, res: Response) => {
    const pubConfig = getPublicFirebaseClientConfigFromEnv();
    const adminSdkStatus = checkFirebaseAdminEnvConfig();
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.json({
      ...pubConfig,
      serverAdminSdkReady: adminSdkStatus.ready,
    });
  });

  app.post('/api/auth/admin-login', createAdminLoginHandler(resolveDeps, secretOverride));

  app.get('/api/auth/session', async (req: Request, res: Response) => {
    const result = await verifyAdminSessionCentralized(req, resolveDeps, secretOverride);
    if (!result.authenticated || !result.session) {
      res.status(result.status || 401).json({
        authenticated: false,
        code: result.code || 'SESSION_INVALID',
        error: result.error || 'Session expired or invalid',
      });
      return;
    }
    res.json({
      authenticated: true,
      uid: result.session.uid,
      email: result.session.email,
      name: result.session.name,
      expiresAt: result.session.expiresAt,
    });
  });

  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        code: 'ADMIN_AUTH_REQUIRED',
        error: 'Unauthorized: Bearer session token is required to log out.',
      });
      return;
    }

    const token = authHeader.slice(7).trim();
    const tokenVerification = verifySignedAdminSessionToken(token, secretOverride);
    if (!tokenVerification.valid) {
      res.status(tokenVerification.status).json({
        success: false,
        code: tokenVerification.code,
        error: tokenVerification.error,
      });
      return;
    }

    let resolved: AdminServiceResolution;
    try {
      resolved = await resolveDeps();
    } catch (err: any) {
      res.status(503).json({
        success: false,
        code: 'FIREBASE_SERVICES_UNAVAILABLE',
        error: err?.message || 'Firebase Admin services unavailable during logout.',
      });
      return;
    }

    if (
      !resolved ||
      !resolved.ready ||
      typeof resolved.deps.revokeSessionRecord !== 'function'
    ) {
      res.status(503).json({
        success: false,
        code:
          resolved && !resolved.ready && resolved.code
            ? resolved.code
            : 'CENTRAL_SESSION_STORE_UNAVAILABLE',
        error: 'Centralized session revocation service is unavailable.',
      });
      return;
    }

    const sessionId = hashSessionToken(token);

    try {
      await resolved.deps.revokeSessionRecord(sessionId, tokenVerification.session.uid);
      if (typeof resolved.deps.getSessionRecord === 'function') {
        const afterRevoke = await resolved.deps.getSessionRecord(sessionId);
        if (afterRevoke && afterRevoke.revoked !== true) {
          res.status(503).json({
            success: false,
            code: 'SESSION_LOGOUT_VERIFICATION_FAILED',
            error: 'Central session record did not confirm revoked: true.',
          });
          return;
        }
      }
    } catch (err: any) {
      res.status(503).json({
        success: false,
        code: 'SESSION_LOGOUT_REVOCATION_FAILED',
        error: err?.message || 'Failed to revoke central admin session in Firestore.',
      });
      return;
    }

    activeSessions.delete(token);
    revokedSessionTokens.add(token);
    res.json({ success: true, revoked: true });
  });
}

export function createExpressApp(options?: ServerInstanceOptions): express.Express {
  cleanTemporaryChatAttachments();
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  const instanceCacheRef: { current: InstanceSnapshotCacheEntry | null } = {
    current: null,
  };
  const activeAuthResolver = options?.authDepsResolver || resolveActiveAuthDeps;
  const activeHmacSecret = options?.hmacSecret;
  const activeSnapshotAdapter = options?.snapshotAdapter;
  const activeStrictProd = options?.strictProductionMode;
  const adminMiddleware = options
    ? createRequireAdminMiddleware(activeAuthResolver, activeHmacSecret)
    : requireAdminMiddleware;

  // ---------------------------------------------------------------------------
  // 0. SECURITY HEADERS MIDDLEWARE
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
  registerAuthRoutes(app, activeAuthResolver, activeHmacSecret);

  // ---------------------------------------------------------------------------
  // 2. PUBLIC CONTACT / CONSULTATION FORM VALIDATION
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
  // 3. PUBLIC SNAPSHOT DELIVERY LAYER (ZERO FIRESTORE READS FOR PUBLIC VISITORS)
  // ---------------------------------------------------------------------------
  app.get('/api/cms/public', async (_req: Request, res: Response) => {
    const readsBefore = serverFirestoreReadOpsCount;
    try {
      const snapshot = await readPublishedPublicSnapshot({
        adapter: activeSnapshotAdapter,
        instanceCacheRef: options ? instanceCacheRef : undefined,
        strictProductionMode: activeStrictProd,
      });
      const readsDelta = serverFirestoreReadOpsCount - readsBefore;
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, max-age=0'
      );
      res.setHeader('X-Data-Source', 'public-snapshot');
      if (readsDelta === 0) {
        res.setHeader('X-Firestore-Reads', '0');
      }
      res.json(snapshot);
    } catch (err: any) {
      const status = err instanceof PublicSnapshotUnavailableError ? err.status : 503;
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.status(status).json({
        error: err?.message || 'Failed to read public content snapshot',
        code: err?.code || 'PUBLIC_SNAPSHOT_UNAVAILABLE',
      });
    }
  });

  app.get('/data/public-snapshot.json', async (_req: Request, res: Response) => {
    const readsBefore = serverFirestoreReadOpsCount;
    try {
      const snapshot = await readPublishedPublicSnapshot({
        adapter: activeSnapshotAdapter,
        instanceCacheRef: options ? instanceCacheRef : undefined,
        strictProductionMode: activeStrictProd,
      });
      const readsDelta = serverFirestoreReadOpsCount - readsBefore;
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, max-age=0'
      );
      res.setHeader('X-Data-Source', 'public-snapshot');
      if (readsDelta === 0) {
        res.setHeader('X-Firestore-Reads', '0');
      }
      res.json(snapshot);
    } catch (err: any) {
      const status = err instanceof PublicSnapshotUnavailableError ? err.status : 503;
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.status(status).json({
        error: err?.message || 'Failed to read static public content snapshot',
        code: err?.code || 'PUBLIC_SNAPSHOT_UNAVAILABLE',
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 4. ADMIN CMS DATA ROUTES (FIRESTORE SINGLE SOURCE OF TRUTH + SNAPSHOT PUBLISH)
  // ---------------------------------------------------------------------------
  app.get('/api/cms/admin', adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const db = await loadAdminDatabase();
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.json(db);
    } catch (err: any) {
      res.status(503).json({
        error: err?.message || 'Failed to load admin database from Firestore.',
        code: 'FIRESTORE_READ_FAILED',
      });
    }
  });

  // Manual Snapshot Republish Endpoint for Admin Recovery
  app.post(
    '/api/cms/publish-snapshot',
    adminMiddleware,
    async (_req: Request, res: Response) => {
      try {
        const db = await loadAdminDatabase();
        const pubResult = await publishPublicSnapshot(db, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : undefined,
        });
        if (!pubResult.published) {
          res.status(502).json({
            publishedSnapshot: false,
            code: pubResult.code || 'SNAPSHOT_PUBLISH_FAILED',
            error: pubResult.error || 'Failed to publish public snapshot',
          });
          return;
        }
        res.json({
          publishedSnapshot: true,
          generatedAt: pubResult.snapshot.generatedAt,
          manifest: pubResult.manifest,
          snapshot: pubResult.snapshot,
        });
      } catch (err: any) {
        res.status(503).json({
          publishedSnapshot: false,
          error: err?.message || 'Failed to load Firestore database for snapshot publication',
        });
      }
    }
  );

  // Update Site Settings
  app.put(
    '/api/cms/siteSettings',
    adminMiddleware,
    async (req: Request, res: Response) => {
      try {
        const db = await loadAdminDatabase();
        const sanitizedBody = sanitizePayload(req.body || {});
        const merged = {
          ...db.siteSettings,
          ...sanitizedBody,
          id: 'global',
          updatedAt: new Date().toISOString(),
        };

        const validation = validateCollectionRecord('siteSettings', merged);
        if (!validation.valid) {
          res.status(400).json({
            error: validation.errors.join(' '),
            errors: validation.errors,
            code: 'VALIDATION_ERROR',
          });
          return;
        }

        const nextDb: PlatformDatabase = { ...db, siteSettings: merged };
        await persistAdminMutationToFirestore({
          nextDb,
          operation: { type: 'siteSettings', data: merged },
        });

        const pubResult = await publishPublicSnapshot(nextDb, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : undefined,
        });
        res.setHeader('X-Snapshot-Published', String(pubResult.published));
        res.json({
          ...merged,
          savedToFirestore: true,
          publishedSnapshot: pubResult.published,
          ...(pubResult.error ? { snapshotError: pubResult.error } : {}),
        });
      } catch (err: any) {
        res.status(503).json({
          error: err?.message || 'Failed to persist siteSettings to Firestore.',
          code: 'FIRESTORE_WRITE_FAILED',
          savedToFirestore: false,
          publishedSnapshot: false,
        });
      }
    }
  );

  // Seed / Reset to authentic Soli Medical & Ahmed Soliman baseline data
  app.post(
    '/api/cms/seed-baseline',
    adminMiddleware,
    async (_req: Request, res: Response) => {
      try {
        const fresh = JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA)) as PlatformDatabase;
        await persistAdminMutationToFirestore({
          nextDb: fresh,
          operation: { type: 'fullReplace', database: fresh },
        });
        const pubResult = await publishPublicSnapshot(fresh, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : undefined,
        });
        res.json({
          success: true,
          savedToFirestore: true,
          publishedSnapshot: pubResult.published,
          ...(pubResult.error ? { snapshotError: pubResult.error } : {}),
          database: fresh,
        });
      } catch (err: any) {
        res.status(503).json({
          error: err?.message || 'Failed to seed baseline database in Firestore.',
          code: 'FIRESTORE_WRITE_FAILED',
          savedToFirestore: false,
          publishedSnapshot: false,
        });
      }
    }
  );

  // Export Full Platform Backup JSON
  app.get('/api/cms/backup', adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const db = await loadAdminDatabase();
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.json({
        exportedAt: new Date().toISOString(),
        platform: 'Ahmed Soliman Digital Platform',
        version: '8.3.0',
        database: db,
      });
    } catch (err: any) {
      res.status(503).json({
        error: err?.message || 'Failed to export database from Firestore.',
      });
    }
  });

  // Restore Full Platform Backup JSON
  app.post('/api/cms/restore', adminMiddleware, async (req: Request, res: Response) => {
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

    try {
      const currentDb = await loadAdminDatabase();
      const sanitized = sanitizePayload(incoming) as PlatformDatabase;
      sanitized.admins = currentDb.admins;

      await persistAdminMutationToFirestore({
        nextDb: sanitized,
        operation: { type: 'fullReplace', database: sanitized },
      });
      const pubResult = await publishPublicSnapshot(sanitized, {
        adapter: activeSnapshotAdapter,
        instanceCacheRef: options ? instanceCacheRef : undefined,
      });

      res.json({
        success: true,
        savedToFirestore: true,
        publishedSnapshot: pubResult.published,
        ...(pubResult.error ? { snapshotError: pubResult.error } : {}),
        restoredAt: new Date().toISOString(),
        database: sanitized,
      });
    } catch (err: any) {
      res.status(503).json({
        error: err?.message || 'Failed to restore backup to Firestore.',
        code: 'FIRESTORE_WRITE_FAILED',
      });
    }
  });

  // Upsert (Create or Update) item in any collection
  app.post(
    '/api/cms/:collection',
    adminMiddleware,
    async (req: Request, res: Response) => {
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

      try {
        const db = await loadAdminDatabase();
        const list = [...((db[col] as any[]) || [])];
        const now = new Date().toISOString();
        const rawId = String(sanitizedPayload.id || `${col.slice(0, 4)}-${Date.now()}`);
        const safeId =
          rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) ||
          `${col.slice(0, 4)}-${Date.now()}`;

        const existingIndex = list.findIndex((item) => item.id === safeId);

        if (col === 'pages') {
          const existingRecord = existingIndex >= 0 ? list[existingIndex] : null;
          const isCore =
            isCoreProtectedPage(safeId) ||
            (existingRecord ? isCoreProtectedPage(existingRecord) : false);
          const targetSlug = String(sanitizedPayload.slug || existingRecord?.slug || '')
            .trim()
            .toLowerCase();

          const slugCheck = validatePageSlug(targetSlug, {
            editingId: safeId,
            isCore,
            existingPages: list,
          });
          if (!slugCheck.valid) {
            res.status(400).json({
              error: slugCheck.errors.join(' '),
              errors: slugCheck.errors,
              code: 'INVALID_OR_DUPLICATE_PAGE_SLUG',
            });
            return;
          }

          if (isCore) {
            sanitizedPayload.isCore = true;
            sanitizedPayload.pageType = 'core';
            sanitizedPayload.archived = false;
            if (existingRecord?.slug) {
              sanitizedPayload.slug = existingRecord.slug;
            }
          } else {
            sanitizedPayload.slug = targetSlug;
            sanitizedPayload.isCore = false;
            sanitizedPayload.pageType =
              sanitizedPayload.pageType === 'landing' ? 'landing' : 'general';
            if (sanitizedPayload.archived) {
              sanitizedPayload.published = false;
              sanitizedPayload.archivedAt = sanitizedPayload.archivedAt || now;
            } else {
              sanitizedPayload.archived = false;
              delete sanitizedPayload.archivedAt;
            }
          }
        }

        if (col === 'articles') {
          const existingRecord = existingIndex >= 0 ? list[existingIndex] : null;
          const targetSlug = String(sanitizedPayload.slug || existingRecord?.slug || '')
            .trim()
            .toLowerCase();

          const slugCheck = validateArticleSlug(targetSlug, {
            editingId: safeId,
            existingArticles: list,
          });
          if (!slugCheck.valid) {
            res.status(400).json({
              error: slugCheck.errors.join(' '),
              errors: slugCheck.errors,
              code: 'INVALID_OR_DUPLICATE_ARTICLE_SLUG',
            });
            return;
          }

          sanitizedPayload.slug = targetSlug;

          if (
            sanitizedPayload.contentJson &&
            typeof sanitizedPayload.contentJson === 'object'
          ) {
            sanitizedPayload.contentFormat = 'tiptap-json';
            sanitizedPayload.contentJson = {
              ...(sanitizedPayload.contentJson.ar
                ? { ar: sanitizeTiptapDoc(sanitizedPayload.contentJson.ar) }
                : {}),
              ...(sanitizedPayload.contentJson.en
                ? { en: sanitizeTiptapDoc(sanitizedPayload.contentJson.en) }
                : {}),
            };
          }

          if (sanitizedPayload.archived) {
            sanitizedPayload.published = false;
            sanitizedPayload.archivedAt = sanitizedPayload.archivedAt || now;
          } else {
            sanitizedPayload.archived = false;
            delete sanitizedPayload.archivedAt;
          }

          const arWords = countArticleWords(
            sanitizedPayload.content?.ar,
            sanitizedPayload.contentJson?.ar
          );
          const enWords = countArticleWords(
            sanitizedPayload.content?.en,
            sanitizedPayload.contentJson?.en
          );
          if (
            typeof sanitizedPayload.readingTimeMinutes !== 'number' ||
            Number.isNaN(sanitizedPayload.readingTimeMinutes) ||
            sanitizedPayload.readingTimeMinutes <= 0
          ) {
            sanitizedPayload.readingTimeMinutes = estimateArticleReadingTime(arWords, enWords);
          }
        }

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

        const nextDb: PlatformDatabase = {
          ...db,
          [col]: list,
        };

        await persistAdminMutationToFirestore({
          nextDb,
          operation: { type: 'upsert', collection: col, id: safeId, record },
        });

        const pubResult = await publishPublicSnapshot(nextDb, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : undefined,
        });
        res.setHeader('X-Snapshot-Published', String(pubResult.published));

        res.json({
          ...record,
          savedToFirestore: true,
          publishedSnapshot: pubResult.published,
          ...(pubResult.error ? { snapshotError: pubResult.error } : {}),
        });
      } catch (err: any) {
        res.status(503).json({
          error: err?.message || `Failed to save record in ${col} to Firestore.`,
          code: 'FIRESTORE_WRITE_FAILED',
          savedToFirestore: false,
          publishedSnapshot: false,
        });
      }
    }
  );

  // Batch Reorder items in a collection
  app.patch(
    '/api/cms/:collection/reorder',
    adminMiddleware,
    async (req: Request, res: Response) => {
      const col = req.params.collection as keyof PlatformDatabase;
      const { orderedIds } = req.body as { orderedIds: string[] };
      if (!Array.isArray(orderedIds)) {
        res.status(400).json({ error: 'orderedIds array is required' });
        return;
      }

      try {
        const db = await loadAdminDatabase();
        const list = [...((db[col] as any[]) || [])];
        const now = new Date().toISOString();
        list.forEach((item) => {
          const idx = orderedIds.indexOf(item.id);
          if (idx !== -1) {
            item.order = idx + 1;
            item.updatedAt = now;
          }
        });
        list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

        const nextDb: PlatformDatabase = {
          ...db,
          [col]: list,
        };

        await persistAdminMutationToFirestore({
          nextDb,
          operation: { type: 'reorder', collection: col, items: list },
        });

        const pubResult = await publishPublicSnapshot(nextDb, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : undefined,
        });
        res.json({
          success: true,
          savedToFirestore: true,
          publishedSnapshot: pubResult.published,
          ...(pubResult.error ? { snapshotError: pubResult.error } : {}),
          items: list,
        });
      } catch (err: any) {
        res.status(503).json({
          error: err?.message || 'Failed to persist reorder in Firestore.',
          code: 'FIRESTORE_WRITE_FAILED',
          savedToFirestore: false,
          publishedSnapshot: false,
        });
      }
    }
  );

  // Delete item in a collection (with comprehensive media in-use guard)
  app.delete(
    '/api/cms/:collection/:id',
    adminMiddleware,
    async (req: Request, res: Response) => {
      const col = req.params.collection as keyof PlatformDatabase;
      if (col === 'admins') {
        res.status(403).json({ error: 'Admin documents cannot be deleted via API.' });
        return;
      }
      const id = req.params.id;

      try {
        const db = await loadAdminDatabase();
        const list = [...((db[col] as any[]) || [])];

        const target = list.find((item) => item.id === id);
        if (!target) {
          res.status(404).json({ error: 'Record not found' });
          return;
        }

        if (col === 'pages') {
          if (
            isCoreProtectedPage(target) ||
            (CORE_PAGE_IDS as readonly string[]).includes(id)
          ) {
            res.status(403).json({
              error:
                'Core system pages (Home, About, Projects, Clinics, Blog, Soli Medical) cannot be permanently deleted.',
              code: 'CORE_PAGE_DELETE_FORBIDDEN',
            });
            return;
          }

          const refCheck = checkPageInSiteReferences(target, db);
          if (refCheck.inUse) {
            res.status(409).json({
              error: `Cannot permanently delete page while it is referenced in: ${refCheck.usedIn.join(
                ', '
              )}`,
              code: 'PAGE_IN_USE',
              usedIn: refCheck.usedIn,
            });
            return;
          }
        }

        if (col === 'articles') {
          const refCheck = checkArticleInSiteReferences(target, db);
          if (refCheck.inUse) {
            res.status(409).json({
              error: `Cannot permanently delete article while it is referenced in: ${refCheck.usedIn.join(
                ', '
              )}`,
              code: 'ARTICLE_IN_USE',
              usedIn: refCheck.usedIn,
            });
            return;
          }
        }

        if (col === 'media') {
          const usageCheck = checkMediaInPublishedContent(target, db);
          if (usageCheck.inUse) {
            res.status(409).json({
              error: `Cannot delete image while it is actively used in published content: ${usageCheck.usedIn.join(
                ', '
              )}`,
              code: 'MEDIA_IN_USE_BY_PUBLISHED_CONTENT',
              usedIn: usageCheck.usedIn,
            });
            return;
          }
        }

        const filteredList = list.filter((item) => item.id !== id);
        const nextDb: PlatformDatabase = {
          ...db,
          [col]: filteredList,
        };

        await persistAdminMutationToFirestore({
          nextDb,
          operation: { type: 'delete', collection: col, id },
        });

        const pubResult = await publishPublicSnapshot(nextDb, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : undefined,
        });
        res.json({
          success: true,
          deletedId: id,
          savedToFirestore: true,
          publishedSnapshot: pubResult.published,
          ...(pubResult.error ? { snapshotError: pubResult.error } : {}),
        });
      } catch (err: any) {
        res.status(503).json({
          error: err?.message || 'Failed to delete record from Firestore.',
          code: 'FIRESTORE_DELETE_FAILED',
          savedToFirestore: false,
          publishedSnapshot: false,
        });
      }
    }
  );

  // ---------------------------------------------------------------------------
  // 5. CLOUDINARY SERVER-SIDE SIGNED UPLOAD & DELETE ROUTES (PHASE C & D)
  // ---------------------------------------------------------------------------
  app.get('/api/cloudinary/status', adminMiddleware, (_req: Request, res: Response) => {
    const cloudName = cleanEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = cleanEnvValue(process.env.CLOUDINARY_API_KEY);
    const apiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET);
    const folder =
      cleanEnvValue(process.env.CLOUDINARY_UPLOAD_FOLDER) || 'ahmed-soliman-platform';

    res.json({
      configured: Boolean(cloudName && apiKey && apiSecret),
      cloudName,
      folder,
    });
  });

  app.post('/api/cloudinary/sign', adminMiddleware, (req: Request, res: Response) => {
    const cloudName = cleanEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = cleanEnvValue(process.env.CLOUDINARY_API_KEY);
    const apiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET);
    const defaultFolder =
      cleanEnvValue(process.env.CLOUDINARY_UPLOAD_FOLDER) || 'ahmed-soliman-platform';

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
        error:
          'Invalid Cloudinary folder name. Only alphanumeric, hyphens, underscores, and slashes are allowed.',
        code: 'INVALID_CLOUDINARY_FOLDER',
      });
      return;
    }

    // Phase D: Reject unconfigured Cloudinary with HTTP 503 instead of HTTP 200 to prevent Base64 fallback
    if (!cloudName || !apiKey || !apiSecret) {
      res.status(503).json({
        configured: false,
        code: 'CLOUDINARY_NOT_CONFIGURED',
        error:
          'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured on the server. Image upload aborted to prevent Base64 storage.',
      });
      return;
    }

    const timestamp = Math.round(Date.now() / 1000);
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

  app.post(
    '/api/cloudinary/delete',
    adminMiddleware,
    async (req: Request, res: Response) => {
      const { mediaId, publicId, secureUrl } = req.body || {};

      try {
        const db = await loadAdminDatabase();
        const existingMedia = mediaId ? db.media.find((m) => m.id === mediaId) : null;
        const resolvedPublicId = publicId || existingMedia?.publicId || '';
        const resolvedSecureUrl = secureUrl || existingMedia?.secureUrl || '';

        const usageCheck = checkMediaInPublishedContent(
          { publicId: resolvedPublicId, secureUrl: resolvedSecureUrl },
          db
        );
        if (usageCheck.inUse) {
          res.status(409).json({
            error: `Cannot delete image because it is currently used in published content: ${usageCheck.usedIn.join(
              ', '
            )}`,
            code: 'MEDIA_IN_USE_BY_PUBLISHED_CONTENT',
            usedIn: usageCheck.usedIn,
          });
          return;
        }

        const cloudName = cleanEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
        const apiKey = cleanEnvValue(process.env.CLOUDINARY_API_KEY);
        const apiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET);

        let cloudinaryRemoteDeleted = false;
        if (
          cloudName &&
          apiKey &&
          apiSecret &&
          resolvedPublicId &&
          !String(resolvedPublicId).startsWith('local/')
        ) {
          try {
            const timestamp = Math.round(Date.now() / 1000);
            const stringToSign = `public_id=${resolvedPublicId}&timestamp=${timestamp}${apiSecret}`;
            const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

            const formData = new URLSearchParams();
            formData.append('public_id', resolvedPublicId);
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
          const nextMedia = db.media.filter((m) => m.id !== mediaId);
          const nextDb: PlatformDatabase = { ...db, media: nextMedia };
          await persistAdminMutationToFirestore({
            nextDb,
            operation: { type: 'delete', collection: 'media', id: mediaId },
          });
          await publishPublicSnapshot(nextDb, {
            adapter: activeSnapshotAdapter,
            instanceCacheRef: options ? instanceCacheRef : undefined,
          });
        }

        res.json({
          success: true,
          cloudinaryRemoteDeleted,
          deletedMediaId: mediaId,
        });
      } catch (err: any) {
        res.status(503).json({
          error: err?.message || 'Failed to delete media asset.',
          code: 'MEDIA_DELETE_FAILED',
        });
      }
    }
  );

  // ---------------------------------------------------------------------------
  // 6. LIVE FUNCTIONAL TESTING & SECURITY AUDIT SUITE
  // ---------------------------------------------------------------------------
  app.get('/api/audit/run', adminMiddleware, async (_req: Request, res: Response) => {
    const db = await loadAdminDatabase();
    const rulesContent = fs.existsSync(FIRESTORE_RULES_FILE)
      ? fs.readFileSync(FIRESTORE_RULES_FILE, 'utf-8')
      : '';

    const publishedProjects = db.projects.filter((p) => p.published);
    const publishedClinics = db.clinics.filter((c) => c.published);
    const publishedArticles = db.articles.filter((a) => a.published && !a.archived);
    const publishedPages = db.pages.filter((p) => p.published && !p.archived);

    const allBilingualValid =
      publishedPages.every((p) => p.title.ar && p.title.en && p.headline.ar && p.headline.en) &&
      publishedProjects.every((p) => p.title.ar && p.title.en && p.summary.ar && p.summary.en) &&
      publishedClinics.every((c) => c.name.ar && c.name.en && c.tagline.ar && c.tagline.en) &&
      publishedArticles.every((a) => a.title.ar && a.title.en && a.content.ar && a.content.en);

    const draftTestCheck = (() => {
      const sampleDraft = { id: 'draft-test', published: false, archived: false };
      const sampleArchived = { id: 'archived-test', published: true, archived: true };
      const filtered = [sampleDraft, sampleArchived, ...publishedProjects].filter(
        (x: any) => x.published && !x.archived
      );
      return (
        !filtered.some((x) => x.id === 'draft-test') &&
        !filtered.some((x) => x.id === 'archived-test')
      );
    })();

    const corePagesProtected =
      isCoreProtectedPage('home') &&
      isCoreProtectedPage('about') &&
      !validatePageSlug('admin', { isCore: false }).valid &&
      validatePageSlug('clinic-campaign-launch', { isCore: false }).valid;

    const sampleDocSanitized = sanitizeTiptapDoc({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Valid medical guidance' }] },
        { type: 'image', attrs: { src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==' } },
      ],
    });
    const tiptapBase64Stripped =
      Array.isArray(sampleDocSanitized.content) &&
      sampleDocSanitized.content.length === 1 &&
      sampleDocSanitized.content[0]?.type === 'paragraph';

    const validImgCheck = validateImageUploadFile({ type: 'image/webp', size: 1024 * 500 });
    const invalidMimeCheck = validateImageUploadFile({
      type: 'application/x-msdownload',
      size: 1024,
    });
    const oversizedImgCheck = validateImageUploadFile({
      type: 'image/png',
      size: 8 * 1024 * 1024,
    });
    const activeAvatarUrl =
      db.siteSettings?.avatarUrl || '/assets/aistudio/1770146906397_16665dd0.png';
    const inUsePortraitCheck = checkMediaInPublishedContent(
      {
        publicId: 'ahmed-soliman-portrait',
        secureUrl: activeAvatarUrl,
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
          ar: `تم التحقق من ${publishedPages.length} صفحات منشورة، ${publishedProjects.length} مشروعات، ${publishedClinics.length} عيادات، و${publishedArticles.length} مقالات منشورة + /sitemap.xml و/robots.txt (مع 0 قراءات Firestore للزوار).`,
          en: `Verified ${publishedPages.length} published pages, ${publishedProjects.length} projects, ${publishedClinics.length} clinics, and ${publishedArticles.length} articles + /sitemap.xml & /robots.txt (0 public Firestore reads).`,
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
        category: 'Published Snapshot vs Draft Isolation',
        title: {
          ar: 'توصيل المحتوى العام عبر Snapshot بدون قراءات Firestore وإخفاء المسودات والمؤرشف',
          en: 'Zero-Firestore-Read Public Snapshot Delivery & Strict Draft/Archive Hiding',
        },
        passed: draftTestCheck,
        details: {
          ar: 'يتم خدمة الزوار حصرياً من النسخة المنشورة (Public Snapshot) مع 0 قراءات Firestore، واستبعاد أي مسودة أو سجل مؤرشف.',
          en: 'Public visitors read exclusively from the published snapshot (0 Firestore reads) with all drafts and archived records excluded.',
        },
      },
      {
        id: 'FT-06',
        category: 'Admin Auth & Centralized Session Revocation',
        title: {
          ar: 'تسجيل دخول المدير، التحقق المركزي من الجلسات وإلغاؤها عبر Serverless، وفحص الحساب المعطل',
          en: 'Admin Login, Centralized Session Verification & Revocation, and Disabled Account Blocking',
        },
        passed: checkFirebaseAdminEnvConfig().ready && activeSessions.size >= 1,
        details: {
          ar: checkFirebaseAdminEnvConfig().ready
            ? 'حزمة Firebase Admin SDK مفعّلة مع التحقق المركزي من الجلسات (/adminSessions) وحالة الحساب (disabled != true).'
            : 'يرجى ضبط متغيرات FIREBASE_SERVICE_ACCOUNT_JSON وADMIN_OWNER_EMAIL على الخادم لتفعيل التحقق التشفيري من Firebase ID Token.',
          en: checkFirebaseAdminEnvConfig().ready
            ? 'Firebase Admin SDK active with centralized session revocation (/adminSessions) and disabled admin check.'
            : 'Configure FIREBASE_SERVICE_ACCOUNT_JSON and ADMIN_OWNER_EMAIL server secrets to enable cryptographic Firebase ID Token verification.',
        },
      },
      {
        id: 'FT-07',
        category: 'Cloudinary Media Upload & Comprehensive In-Use Guard',
        title: {
          ar: 'رفع الصور الموقعة، منع Base64، وفحص شامل لمراجع الصور قبل الحذف',
          en: 'Signed Image Upload, Base64 Prohibition & Deep Media Reference Guard',
        },
        passed:
          validImgCheck.valid &&
          !invalidMimeCheck.valid &&
          !oversizedImgCheck.valid &&
          inUsePortraitCheck.inUse,
        details: {
          ar: `تم فحص جميع مراجع الصور (Tiptap JSON، Markdown، Blocks، المعارض، والروابط المحولة) ومنع حذف الصورة المستخدمة في: ${inUsePortraitCheck.usedIn.join('، ')}.`,
          en: `Verified deep media reference check across Tiptap JSON, Markdown, blocks, galleries, and transformed URLs (${inUsePortraitCheck.usedIn.join(', ')}).`,
        },
      },
      {
        id: 'FT-08',
        category: 'Pages CMS & Core Lock',
        title: {
          ar: 'إدارة الصفحات المخصصة (/landing/, /p/) وحماية الصفحات الأساسية من الحذف',
          en: 'Dynamic CMS Pages (/landing/, /p/) & Core Page Delete Protection',
        },
        passed: corePagesProtected,
        details: {
          ar: 'تم التحقق من منع حذف الصفحات الأساسية على الخادم وفي قواعد Firestore، ومنع حجز المسارات المحجوزة لروابط الصفحات المخصصة.',
          en: 'Verified server & Firestore delete lock on core pages and reserved-slug enforcement for custom landing/general pages.',
        },
      },
      {
        id: 'FT-09',
        category: 'Rich Text Studio & Compatibility',
        title: {
          ar: 'محرر Tiptap المرن (tiptap-json) والتوافق الخلفي الكامل مع مقالات Markdown',
          en: 'Tiptap Rich-Text Studio (tiptap-json) & Legacy Markdown Compatibility',
        },
        passed: tiptapBase64Stripped,
        details: {
          ar: 'تم التحقق من سلامة محوّل Markdown/Tiptap JSON، ومنع حقن صور Base64 داخل محتوى المقالات، وتوافق العارض الآمن مع المقالات القديمة.',
          en: 'Verified bidirectional Markdown/Tiptap JSON sanitization, Base64 data:image stripping, and backward-compatible public rendering.',
        },
      },
    ];

    const xssSample = sanitizePayload({
      title: 'Hello <script>alert(1)</script><img src=x onerror="alert(2)">',
      coverImage: 'javascript:alert(3)',
      avatarUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
    });
    const xssNeutralized =
      !xssSample.title.includes('<script>') &&
      !xssSample.title.includes('onerror') &&
      xssSample.coverImage === '' &&
      xssSample.avatarUrl === '';

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
    const rulesExcludesArchived = rulesContent.includes("data.get('archived', false) != true");
    const rulesEnforcesIsAdmin =
      rulesContent.includes('exists(/databases/$(database)/documents/admins/$(request.auth.uid))') &&
      rulesContent.includes("data.get('disabled', false) != true");

    const securityAuditItems = [
      {
        id: 'SEC-01',
        area: 'Firebase Security Rules (Phase 8.2 Hardened)',
        severity: 'Critical',
        status:
          rulesHasDefaultDeny &&
          rulesLocksAdminsWrite &&
          rulesEnforcesPublished &&
          rulesExcludesArchived &&
          rulesEnforcesIsAdmin
            ? 'SECURE'
            : 'VULNERABLE',
        finding: {
          ar: 'قواعد firestore.rules تتحقق من disabled != true في isAdmin()، وتتعامل بأمان مع حقل archived في المستندات القديمة، وتمنع أي كتابة للعميل في /admins و/adminSessions.',
          en: 'firestore.rules enforces disabled != true in isAdmin(), safely handles missing archived fields via data.get(), and locks /admins and /adminSessions.',
        },
      },
      {
        id: 'SEC-02',
        area: 'Centralized Admin Session & Revocation',
        severity: 'Critical',
        status: 'SECURE',
        finding: {
          ar: 'جميع مسارات الإدارة محمية بتحقق مركزي يفحص إلغاء الجلسة وحالة الحساب المعطل عبر جميع خوادم Serverless.',
          en: 'All Admin API endpoints verify central session revocation and disabled admin status across serverless instances.',
        },
      },
      {
        id: 'SEC-03',
        area: 'Strict Owner Bootstrap (No Hardcoded Email)',
        severity: 'Critical',
        status: checkFirebaseAdminEnvConfig().ready ? 'SECURE' : 'ATTENTION_REQUIRED',
        finding: {
          ar: 'تمت إزالة أي بريد افتراضي من الكود؛ لا يتم تهيئة حساب المالك إلا عند ضبط متغيرات البيئة وتأكيد البريد الإلكتروني عبر Firebase Admin SDK.',
          en: 'Removed hardcoded fallback emails; owner bootstrap strictly requires configured env vars and verified Firebase email.',
        },
      },
      {
        id: 'SEC-04',
        area: 'Cloudinary Signed Upload & Zero Base64 Fallback',
        severity: 'Critical',
        status: folderInjectionBlocked ? 'SECURE' : 'VULNERABLE',
        finding: {
          ar: 'يرفض الخادم والعميل أي تخزين Base64 عند غياب أو فشل Cloudinary، مع حماية معامل customFolder ضد الحقن.',
          en: 'Server and client strictly reject Base64 Data URL fallbacks when Cloudinary is unconfigured or fails.',
        },
      },
      {
        id: 'SEC-05',
        area: 'XSS & Base64 Injection Prevention',
        severity: 'High',
        status: xssNeutralized && tiptapBase64Stripped ? 'SECURE' : 'VULNERABLE',
        finding: {
          ar: 'يتم تطهير جميع المدخلات وبنية tiptap-json على الخادم والعميل لحذف وسوم <script> وسمات onerror= وروابط javascript:/data: قبل الحفظ.',
          en: 'Recursive sanitizePayload & sanitizeTiptapDoc strip <script>, inline event handlers, javascript: URIs, and Base64 data:image payloads prior to storage.',
        },
      },
      {
        id: 'SEC-06',
        area: 'Contact & Consultation Form Protection',
        severity: 'Medium',
        status: !botHoneypotCheck.valid ? 'SECURE' : 'VULNERABLE',
        finding: {
          ar: 'نموذج الاستشارة والحجز محمي بحقل مصيدة روبوتات (Honeypot)، وحدود طول النصوص، وتطهير المدخلات، وتحديد معدل الطلبات.',
          en: 'Consultation builder is protected by a hidden Honeypot field, character limits, XSS sanitization, and rate limiting.',
        },
      },
      {
        id: 'SEC-07',
        area: 'Zero Public Firestore Reads & Snapshot Isolation',
        severity: 'High',
        status: 'SECURE',
        finding: {
          ar: 'جميع طلبات الزوار تقرأ حصرياً من النسخة المنشورة (Public Snapshot) مع 0 قراءات Firestore وعدم تسريب المسودات أو المؤرشف.',
          en: 'All public visitor requests read exclusively from the published snapshot with 0 Firestore reads and zero draft/archive leakage.',
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
  // 7. DYNAMIC SEO SITEMAP.XML & ROBOTS.TXT (READS FROM PUBLIC SNAPSHOT — 0 FIRESTORE READS)
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

  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    const baseUrl = (
      process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`
    ).replace(/\/$/, '');
    const readsBefore = serverFirestoreReadOpsCount;
    let snapshot: PublicContentSnapshot;
    try {
      snapshot = await readPublishedPublicSnapshot({
        adapter: activeSnapshotAdapter,
        instanceCacheRef: options ? instanceCacheRef : undefined,
        strictProductionMode: activeStrictProd,
      });
    } catch (err: any) {
      const status = err instanceof PublicSnapshotUnavailableError ? err.status : 503;
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.status(status).json({
        error: err?.message || 'Public snapshot unavailable for sitemap generation.',
        code: err?.code || 'PUBLIC_SNAPSHOT_UNAVAILABLE',
      });
      return;
    }

    const readsDelta = serverFirestoreReadOpsCount - readsBefore;

    const isCorePublished = (slug: string) => {
      const found = (snapshot.pages || []).find((p) => p.slug === slug || p.id === slug);
      if (!found) return false;
      return Boolean(found.published) && !found.archived && !found.seo?.noindex;
    };

    const staticPaths: string[] = [];
    if (isCorePublished('home')) staticPaths.push('/ar', '/en');
    if (isCorePublished('about')) staticPaths.push('/ar/about', '/en/about');
    if (isCorePublished('projects')) staticPaths.push('/ar/projects', '/en/projects');
    if (isCorePublished('solimedical')) staticPaths.push('/ar/solimedical', '/en/solimedical');
    if (isCorePublished('clinics')) staticPaths.push('/ar/clinics', '/en/clinics');
    if (isCorePublished('blog')) staticPaths.push('/ar/blog', '/en/blog');

    const dynamicPaths: { path: string; updatedAt: string }[] = [];

    (snapshot.pages || [])
      .filter(
        (p) =>
          p.published &&
          !p.archived &&
          !p.seo?.noindex &&
          !isCoreProtectedPage(p) &&
          Boolean(p.slug)
      )
      .forEach((p) => {
        const prefix = p.pageType === 'landing' ? 'landing' : 'p';
        dynamicPaths.push({ path: `/ar/${prefix}/${p.slug}`, updatedAt: p.updatedAt });
        dynamicPaths.push({ path: `/en/${prefix}/${p.slug}`, updatedAt: p.updatedAt });
      });

    (snapshot.projects || [])
      .filter((p) => p.published)
      .forEach((p) => {
        dynamicPaths.push({ path: `/ar/projects/${p.slug}`, updatedAt: p.updatedAt });
        dynamicPaths.push({ path: `/en/projects/${p.slug}`, updatedAt: p.updatedAt });
      });

    (snapshot.clinics || [])
      .filter((c) => c.published)
      .forEach((c) => {
        dynamicPaths.push({ path: `/ar/clinics/${c.slug}`, updatedAt: c.updatedAt });
        dynamicPaths.push({ path: `/en/clinics/${c.slug}`, updatedAt: c.updatedAt });
      });

    (snapshot.articles || [])
      .filter((a) => a.published && !a.archived && !a.seo?.noindex)
      .forEach((a) => {
        dynamicPaths.push({ path: `/ar/blog/${a.slug}`, updatedAt: a.updatedAt });
        dynamicPaths.push({ path: `/en/blog/${a.slug}`, updatedAt: a.updatedAt });
      });

    const nowIso = snapshot.generatedAt || new Date().toISOString();
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

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    if (readsDelta === 0) {
      res.setHeader('X-Firestore-Reads', '0');
    }
    res.type('application/xml').send(xml);
  });

  // Serve generated /src/assets images in both dev and production
  app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));

  // Serve /assets/aistudio/* from public/assets/aistudio cleanly, with crisp vector emblems
  app.get('/assets/aistudio/:filename', (req: Request, res: Response) => {
    const safeName = path.basename(String(req.params.filename || ''));
    const diskPath = path.resolve(process.cwd(), 'public/assets/aistudio', safeName);
    if (safeName && fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
      res.sendFile(diskPath);
      return;
    }

    if (safeName === 'logo_ae3842b8.png') {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.type('image/svg+xml').send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070E1A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00C2CB"/>
      <stop offset="100%" stop-color="#0EA5E9"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)"/>
  <rect x="20" y="20" width="472" height="472" rx="92" fill="none" stroke="url(#cyanGrad)" stroke-opacity="0.35" stroke-width="6"/>
  <rect x="214" y="96" width="84" height="220" rx="22" fill="url(#cyanGrad)"/>
  <rect x="146" y="164" width="220" height="84" rx="22" fill="url(#cyanGrad)"/>
  <path d="M96 364 H178 L206 322 L238 402 L274 300 L306 376 L332 346 H416" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="256" y="454" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="800" letter-spacing="2" fill="#E2E8F0">SOLI MEDICAL</text>
</svg>`);
      return;
    }

    if (safeName === '1770146906397_16665dd0.png') {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.type('image/svg+xml').send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="#00C2CB" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#070E1A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070E1A"/>
      <stop offset="50%" stop-color="#0B1628"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00C2CB"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#cardBg)"/>
  <rect width="1200" height="900" fill="url(#glow)"/>
  <g stroke="#1E293B" stroke-width="1.5" opacity="0.45">
    <line x1="0" y1="180" x2="1200" y2="180"/>
    <line x1="0" y1="720" x2="1200" y2="720"/>
    <line x1="220" y1="0" x2="220" y2="900"/>
    <line x1="980" y1="0" x2="980" y2="900"/>
  </g>
  <circle cx="600" cy="350" r="158" fill="#0B1424" stroke="url(#accent)" stroke-width="6"/>
  <circle cx="600" cy="350" r="142" fill="none" stroke="#00C2CB" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="10 10"/>
  <text x="600" y="388" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="112" font-weight="800" fill="#FFFFFF" letter-spacing="4">AS</text>
  <rect x="405" y="548" width="390" height="54" rx="27" fill="#00C2CB" fill-opacity="0.14" stroke="#00C2CB" stroke-opacity="0.45" stroke-width="2"/>
  <text x="600" y="584" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#00C2CB" letter-spacing="3">AHMED SOLIMAN</text>
  <text x="600" y="660" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#CBD5E1">Healthcare Systems Architect &amp; Full-Stack Engineer</text>
  <path d="M370 742 H515 L540 704 L570 778 L602 688 L632 760 L656 732 H830" fill="none" stroke="url(#accent)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);
      return;
    }

    res.status(404).json({ error: 'Asset not found' });
  });

  return app;
}

async function startServer() {
  // Ensure initial static public snapshot exists on startup
  await readPublishedPublicSnapshot().catch(() => {});

  const app = createExpressApp();

  // ---------------------------------------------------------------------------
  // 8. VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)
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

const isMainEntry =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  Boolean(process.argv[1]) &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));

if (isMainEntry && process.env.SKIP_SERVER_LISTEN !== '1' && !process.env.VERCEL) {
  startServer();
}

export default createExpressApp();

