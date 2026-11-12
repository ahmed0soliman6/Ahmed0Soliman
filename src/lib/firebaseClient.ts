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
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  disableNetwork,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  Firestore,
} from 'firebase/firestore';
import { PlatformDatabase } from '../types/cms';

// Silence noisy @firebase/firestore 10-second WebChannel timeout logs in iframe/offline states
try {
  setLogLevel('silent');
} catch {
  // ignore
}

export interface ExternalFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  databaseId?: string;
}

const STORAGE_KEY_FB_CONFIG = 'ahmed_soliman_existing_firebase_config_v1';
export const OWNER_ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_OWNER_EMAIL || 'ahmed0soliman6@gmail.com';
export const OWNER_ADMIN_UID = import.meta.env.VITE_ADMIN_OWNER_UID || '';

// In-memory read cache to protect Firestore Free Tier quota (PROMPT 4.3 & 4.5)
let firestoreCache: {
  timestamp: number;
  isAdmin: boolean;
  data: Partial<PlatformDatabase>;
} | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL, invalidated immediately on any mutation
let firestoreBackendReachable = true;

function withTimeout<T>(promise: Promise<T>, ms = 2500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('FIRESTORE_TIMEOUT'));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

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
  firestoreCache = null;
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
  cachedDb = null;
  cachedAuth = null;
  firestoreBackendReachable = true;
  invalidateFirestoreCache();
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
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

export function getFirebaseInstances(requireFirestoreReachable = false): {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  config: ExternalFirebaseConfig;
} | null {
  if (requireFirestoreReachable && !firestoreBackendReachable) return null;
  const config = getSavedFirebaseConfig();
  if (!config) return null;

  try {
    setLogLevel('silent');
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
      try {
        cachedDb =
          config.databaseId && config.databaseId !== '(default)'
            ? initializeFirestore(
                cachedApp,
                { experimentalAutoDetectLongPolling: true },
                config.databaseId
              )
            : initializeFirestore(cachedApp, { experimentalAutoDetectLongPolling: true });
      } catch {
        cachedDb =
          config.databaseId && config.databaseId !== '(default)'
            ? getFirestore(cachedApp, config.databaseId)
            : getFirestore(cachedApp);
      }
      cachedAuth = getAuth(cachedApp);
    }
    if (!cachedApp || !cachedDb || !cachedAuth) return null;
    return { app: cachedApp, db: cachedDb, auth: cachedAuth, config };
  } catch {
    return null;
  }
}

/**
 * Read-only check against Firestore /admins/{user.uid}.
 * Never writes or auto-creates /admins/{uid} documents from the client,
 * and never grants access based on email string matching alone.
 */
export async function verifyFirebaseUserIsAdmin(user: User): Promise<boolean> {
  if (!user || !user.uid || !user.emailVerified) {
    return false;
  }

  const instances = getFirebaseInstances(false);
  if (!instances) return false;

  try {
    const adminDocRef = doc(instances.db, 'admins', user.uid);
    const adminSnap = await withTimeout(getDoc(adminDocRef), 2500);
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export async function signInWithExistingFirebaseGoogle(): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  idToken: string;
}> {
  let instances = getFirebaseInstances(false);
  if (!instances) {
    await hydrateFirebaseConfigFromServer();
    instances = getFirebaseInstances(false);
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

  invalidateFirestoreCache();
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Admin',
    photoURL: user.photoURL || '/assets/aistudio/1770146906397_16665dd0.png',
    idToken,
  };
}

export async function signOutFromExistingFirebase(): Promise<void> {
  invalidateFirestoreCache();
  const instances = getFirebaseInstances();
  if (instances) {
    await fbSignOut(instances.auth);
  }
}

export async function fetchFromExistingFirestore(
  isAdminUser: boolean,
  forceRefresh = false
): Promise<Partial<PlatformDatabase> | null> {
  const instances = getFirebaseInstances(true);
  if (!instances) return null;

  if (
    !forceRefresh &&
    firestoreCache &&
    firestoreCache.isAdmin === isAdminUser &&
    Date.now() - firestoreCache.timestamp < CACHE_TTL_MS
  ) {
    return firestoreCache.data;
  }

  const { db } = instances;
  const collectionsToLoad = [
    'pages',
    'projects',
    'clinics',
    'doctors',
    'services',
    'articles',
  ] as const;

  try {
    const result: Partial<PlatformDatabase> = {};
    const settingsSnap = await withTimeout(getDoc(doc(db, 'siteSettings', 'global')), 2500);
    if (settingsSnap.exists()) {
      const data = settingsSnap.data() as PlatformDatabase['siteSettings'];
      if (isAdminUser || data.published) {
        result.siteSettings = data;
      }
    }

    for (const colName of collectionsToLoad) {
      const colRef = collection(db, colName);
      const q = isAdminUser ? colRef : query(colRef, where('published', '==', true));
      const snap = await withTimeout(getDocs(q), 2500);
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));
      (result as any)[colName] = list;
    }

    if (isAdminUser) {
      const mediaSnap = await withTimeout(getDocs(collection(db, 'media')), 2500);
      result.media = mediaSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      const adminsSnap = await withTimeout(getDocs(collection(db, 'admins')), 2500);
      result.admins = adminsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    }

    firestoreCache = {
      timestamp: Date.now(),
      isAdmin: isAdminUser,
      data: result,
    };

    return result;
  } catch {
    firestoreBackendReachable = false;
    disableNetwork(db).catch(() => {});
    return null;
  }
}

export async function saveDocumentToExistingFirestore(
  collectionName: string,
  docId: string,
  payload: Record<string, any>
): Promise<boolean> {
  const instances = getFirebaseInstances(true);
  if (!instances) return false;
  try {
    await withTimeout(
      setDoc(doc(instances.db, collectionName, docId), payload, { merge: true }),
      2500
    );
    invalidateFirestoreCache();
    return true;
  } catch {
    firestoreBackendReachable = false;
    disableNetwork(instances.db).catch(() => {});
    return false;
  }
}

export async function deleteDocumentFromExistingFirestore(
  collectionName: string,
  docId: string
): Promise<boolean> {
  const instances = getFirebaseInstances(true);
  if (!instances) return false;
  try {
    await withTimeout(deleteDoc(doc(instances.db, collectionName, docId)), 2500);
    invalidateFirestoreCache();
    return true;
  } catch {
    firestoreBackendReachable = false;
    disableNetwork(instances.db).catch(() => {});
    return false;
  }
}

export function subscribeToFirebaseAuth(callback: (user: User | null) => void): () => void {
  const instances = getFirebaseInstances();
  if (!instances) return () => {};
  return onAuthStateChanged(instances.auth, callback);
}
