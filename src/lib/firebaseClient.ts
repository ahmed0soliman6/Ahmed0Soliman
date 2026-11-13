import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  Auth,
  User,
} from 'firebase/auth';

export interface ExternalFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  databaseId?: string;
}

const STORAGE_KEY_FB_CONFIG = 'ahmed_soliman_existing_firebase_config_v1';

// Phase F: Strictly read owner email/UID from environment variables with zero hardcoded email fallback
export const OWNER_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_OWNER_EMAIL || '').trim().toLowerCase();
export const OWNER_ADMIN_UID = (import.meta.env.VITE_ADMIN_OWNER_UID || '').trim();

function cleanConfigString(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let val = raw.trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }
  return val;
}

export function isValidExternalFirebaseConfig(
  cfg: Partial<ExternalFirebaseConfig> | null | undefined
): cfg is ExternalFirebaseConfig {
  if (!cfg || typeof cfg !== 'object') {
    return false;
  }
  const apiKey = cleanConfigString(cfg.apiKey);
  const projectId = cleanConfigString(cfg.projectId);
  if (!apiKey.startsWith('AIza') || apiKey.length < 25) {
    return false;
  }
  if (
    projectId.length < 3 ||
    projectId === 'my-existing-firebase-project' ||
    projectId === 'my-project' ||
    !/^[a-zA-Z0-9_-]+$/.test(projectId)
  ) {
    return false;
  }
  return true;
}

function normalizeFirebaseConfig(cfg: Partial<ExternalFirebaseConfig>): ExternalFirebaseConfig {
  const projectId = cleanConfigString(cfg.projectId);
  const authDomain =
    cleanConfigString(cfg.authDomain) || (projectId ? `${projectId}.firebaseapp.com` : '');
  return {
    apiKey: cleanConfigString(cfg.apiKey),
    authDomain,
    projectId,
    appId: cleanConfigString(cfg.appId),
    messagingSenderId: cleanConfigString(cfg.messagingSenderId),
    databaseId: cleanConfigString(cfg.databaseId) || '(default)',
  };
}

export function invalidateFirestoreCache(): void {
  // Public visitors read from static/CDN snapshots (0 client Firestore reads).
  // Admin mutations are persisted through the trusted Express + Firebase Admin SDK server.
}

export function getSavedFirebaseConfig(): ExternalFirebaseConfig | null {
  const rawProjectId = cleanConfigString(import.meta.env.VITE_FIREBASE_PROJECT_ID);
  const envCfg = normalizeFirebaseConfig({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain:
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
      (rawProjectId ? `${rawProjectId}.firebaseapp.com` : ''),
    projectId: rawProjectId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
  });

  if (isValidExternalFirebaseConfig(envCfg)) {
    return envCfg;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_FB_CONFIG);
    if (!raw) return null;
    const parsed = normalizeFirebaseConfig(JSON.parse(raw) as ExternalFirebaseConfig);
    if (isValidExternalFirebaseConfig(parsed)) {
      return parsed;
    }
    localStorage.removeItem(STORAGE_KEY_FB_CONFIG);
  } catch {
    // ignore storage errors
  }
  return null;
}

export function saveExternalFirebaseConfig(config: ExternalFirebaseConfig | null): void {
  cachedApp = null;
  cachedAuth = null;
  if (!config || !isValidExternalFirebaseConfig(config)) {
    localStorage.removeItem(STORAGE_KEY_FB_CONFIG);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('firebase-config-updated'));
    }
    return;
  }
  const normalized = normalizeFirebaseConfig(config);
  localStorage.setItem(STORAGE_KEY_FB_CONFIG, JSON.stringify(normalized));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('firebase-config-updated'));
  }
}

export async function hydrateFirebaseConfigFromServer(): Promise<ExternalFirebaseConfig | null> {
  const existing = getSavedFirebaseConfig();
  if (existing) return existing;

  try {
    const res = await fetch('/api/auth/firebase-config');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && isValidExternalFirebaseConfig(data)) {
      const normalized = normalizeFirebaseConfig(data);
      saveExternalFirebaseConfig(normalized);
      return normalized;
    }
  } catch {
    // ignore network errors on static hosts
  }
  return null;
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

/**
 * Initializes Firebase Client App & Auth ONLY (Zero client-side Firestore SDK usage).
 * All Firestore reads/writes occur exclusively on the server via Firebase Admin SDK.
 */
export function getFirebaseInstances(): {
  app: FirebaseApp;
  auth: Auth;
  config: ExternalFirebaseConfig;
} | null {
  const config = getSavedFirebaseConfig();
  if (!config) return null;

  try {
    if (!cachedApp) {
      const existing = getApps();
      cachedApp =
        existing.length > 0
          ? existing[0]
          : initializeApp({
              apiKey: config.apiKey,
              authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
              projectId: config.projectId,
              appId: config.appId,
              messagingSenderId: config.messagingSenderId,
            });
      cachedAuth = getAuth(cachedApp);
    }
    if (!cachedApp || !cachedAuth) return null;
    return { app: cachedApp, auth: cachedAuth, config };
  } catch {
    return null;
  }
}

export async function signInWithExistingFirebaseGoogle(): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  idToken: string;
}> {
  let instances = getFirebaseInstances();
  if (!instances) {
    await hydrateFirebaseConfigFromServer();
    instances = getFirebaseInstances();
  }
  if (!instances) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  let result;
  try {
    result = await signInWithPopup(instances.auth, provider);
  } catch (popupErr: any) {
    const code = String(popupErr?.code || popupErr?.message || '');
    if (code.includes('auth/unauthorized-domain')) {
      const domain = typeof window !== 'undefined' ? window.location.hostname : '';
      throw new Error(
        `نطاق الموقع الحالي (${domain}) غير مضاف في Authorized domains داخل Firebase Console. أضفه من: Authentication -> Settings -> Authorized domains -> Add domain`
      );
    }
    if (code.includes('auth/popup-closed-by-user')) {
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;
      throw new Error(
        inIframe
          ? 'تم إغلاق نافذة تسجيل دخول Google (auth/popup-closed-by-user). لأن المعاينة تعمل داخل إطار iframe، افتح الموقع في نافذة/تبويب مستقل أو أعد المحاولة وأكمل اختيار حسابك دون إغلاق النافذة.'
          : 'تم إغلاق نافذة تسجيل دخول Google قبل إتمام المصادقة (auth/popup-closed-by-user). يرجى إعادة الضغط واختيار حسابك دون إغلاق النافذة.'
      );
    }
    if (code.includes('auth/popup-blocked')) {
      throw new Error(
        'قام المتصفح بحظر نافذة تسجيل دخول Google المنبثقة (auth/popup-blocked). يرجى السماح للنوافذ المنبثقة (Pop-ups) لهذا الموقع ثم المحاولة مجدداً.'
      );
    }
    if (code.includes('auth/cancelled-popup-request')) {
      throw new Error(
        'تم إلغاء طلب تسجيل الدخول السابق بسبب نقرة متكررة (auth/cancelled-popup-request). انتظر لحظة ثم اضغط مرة واحدة.'
      );
    }
    throw popupErr;
  }

  const user = result.user;

  if (!user || !user.emailVerified) {
    await fbSignOut(instances.auth);
    throw new Error('Access Denied: A verified Google account is required.');
  }

  const idToken = await user.getIdToken(true);
  if (!idToken) {
    await fbSignOut(instances.auth);
    throw new Error('Authentication Failed: Could not obtain Firebase ID Token.');
  }

  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Admin',
    photoURL: user.photoURL || '/assets/aistudio/1770146906397_16665dd0.png',
    idToken,
  };
}

export async function signOutFromExistingFirebase(): Promise<void> {
  const instances = getFirebaseInstances();
  if (instances) {
    await fbSignOut(instances.auth);
  }
}

export function subscribeToFirebaseAuth(callback: (user: User | null) => void): () => void {
  const instances = getFirebaseInstances();
  if (!instances) return () => {};
  return onAuthStateChanged(instances.auth, callback);
}
