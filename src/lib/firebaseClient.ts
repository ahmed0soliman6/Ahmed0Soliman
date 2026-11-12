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

export function isValidExternalFirebaseConfig(
  cfg: Partial<ExternalFirebaseConfig> | null | undefined
): cfg is ExternalFirebaseConfig {
  if (!cfg || typeof cfg.apiKey !== 'string' || typeof cfg.projectId !== 'string') {
    return false;
  }
  const apiKey = cfg.apiKey.trim();
  const projectId = cfg.projectId.trim();
  if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
    return false;
  }
  if (
    projectId.length < 4 ||
    projectId === 'my-existing-firebase-project' ||
    projectId === 'my-project' ||
    !/^[a-z0-9-]+$/.test(projectId)
  ) {
    return false;
  }
  return true;
}

export function invalidateFirestoreCache(): void {
  firestoreCache = null;
}

export function getSavedFirebaseConfig(): ExternalFirebaseConfig | null {
  const envCfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain:
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
      `${import.meta.env.VITE_FIREBASE_PROJECT_ID || ''}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
  };

  if (isValidExternalFirebaseConfig(envCfg)) {
    return envCfg;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_FB_CONFIG);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExternalFirebaseConfig;
    if (isValidExternalFirebaseConfig(parsed)) {
      return parsed;
    }
    // Remove invalid/incomplete config so Firestore SDK does not attempt broken connections
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
  if (!isValidExternalFirebaseConfig(config)) {
    localStorage.removeItem(STORAGE_KEY_FB_CONFIG);
    return;
  }
  localStorage.setItem(STORAGE_KEY_FB_CONFIG, JSON.stringify(config));
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
 * Verifies that a signed-in Firebase User is an approved Admin by checking:
 * 1) Matching the verified Owner Admin email (ahmed0soliman6@gmail.com) or OWNER_ADMIN_UID
 * 2) Document existence at /admins/{user.uid} in Firestore
 */
export async function verifyFirebaseUserIsAdmin(user: User): Promise<boolean> {
  if (
    user.email &&
    user.email.trim().toLowerCase() === OWNER_ADMIN_EMAIL.trim().toLowerCase()
  ) {
    // Best-effort auto-registration of owner UID in /admins/{uid}
    const instances = getFirebaseInstances(false);
    if (instances) {
      withTimeout(
        setDoc(
          doc(instances.db, 'admins', user.uid),
          {
            id: user.uid,
            uid: user.uid,
            email: user.email.trim().toLowerCase(),
            name: user.displayName || 'Ahmed Soliman',
            role: 'owner',
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        ),
        2000
      ).catch(() => {});
    }
    return true;
  }

  if (OWNER_ADMIN_UID && user.uid === OWNER_ADMIN_UID) {
    return true;
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
  const instances = getFirebaseInstances(false);
  if (!instances) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(instances.auth, provider);
  const user = result.user;

  const isAuthorizedAdmin = await verifyFirebaseUserIsAdmin(user);
  if (!isAuthorizedAdmin) {
    await fbSignOut(instances.auth);
    throw new Error(
      `Access Denied: Account (${user.email || user.uid}) is not authorized as Admin.`
    );
  }

  invalidateFirestoreCache();
  const idToken = await user.getIdToken();
  return {
    uid: user.uid,
    email: user.email || OWNER_ADMIN_EMAIL,
    displayName: user.displayName || 'Ahmed Soliman',
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
