import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Locale,
  ThemeMode,
  PlatformDatabase,
  SiteSettings,
} from '../types/cms';
import { INITIAL_PLATFORM_DATA } from '../data/initialSeedData';
import {
  fetchFromExistingFirestore,
  saveDocumentToExistingFirestore,
  deleteDocumentFromExistingFirestore,
  signInWithExistingFirebaseGoogle,
  signOutFromExistingFirebase,
  getSavedFirebaseConfig,
  hydrateFirebaseConfigFromServer,
  invalidateFirestoreCache,
} from '../lib/firebaseClient';

export interface AdminUserSession {
  uid: string;
  email: string;
  name: string;
  token: string;
  expiresAt: number;
  viaFirebase?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface PlatformContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  pathname: string;
  searchParams: URLSearchParams;
  navigate: (to: string) => void;
  db: PlatformDatabase;
  loading: boolean;
  error: string | null;
  adminSession: AdminUserSession | null;
  loginAsOwnerAdmin: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
  refreshData: () => Promise<void>;
  saveSiteSettings: (settings: SiteSettings) => Promise<void>;
  upsertRecord: (
    collection: 'pages' | 'projects' | 'clinics' | 'doctors' | 'services' | 'articles' | 'media',
    record: Record<string, any>
  ) => Promise<any>;
  deleteRecord: (
    collection: 'pages' | 'projects' | 'clinics' | 'doctors' | 'services' | 'articles' | 'media',
    id: string
  ) => Promise<void>;
  reorderRecords: (
    collection: 'pages' | 'projects' | 'clinics' | 'doctors' | 'services' | 'articles',
    orderedIds: string[]
  ) => Promise<void>;
  seedBaselineDatabase: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  isFirebaseConnected: boolean;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

const STORAGE_LOCALE_KEY = 'ahmed_soliman_locale_pref';
const STORAGE_THEME_KEY = 'ahmed_soliman_theme_pref';
const STORAGE_ADMIN_SESSION_KEY = 'ahmed_soliman_admin_session_v1';
const STORAGE_LOCAL_CMS_DB_KEY = 'ahmed_soliman_cms_db_snapshot_v1';

function loadLocalDbSnapshot(): PlatformDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_CMS_DB_KEY);
    if (!raw) return INITIAL_PLATFORM_DATA;
    const parsed = JSON.parse(raw) as PlatformDatabase;
    return {
      ...INITIAL_PLATFORM_DATA,
      ...parsed,
      siteSettings: {
        ...INITIAL_PLATFORM_DATA.siteSettings,
        ...(parsed.siteSettings || {}),
        whatsappNumber: 'Ahmed0soliman',
        whatsappUrl: 'https://wa.me/Ahmed0soliman',
        facebookUrl: 'https://www.facebook.com/SoliMedical/',
        telegramBotUrl: 'https://t.me/SoliMedicalproBot',
      },
    };
  } catch {
    return INITIAL_PLATFORM_DATA;
  }
}

function saveLocalDbSnapshot(nextDb: PlatformDatabase): void {
  try {
    localStorage.setItem(STORAGE_LOCAL_CMS_DB_KEY, JSON.stringify(nextDb));
  } catch {
    // ignore storage quota errors
  }
}

async function safeFetchJson(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: any } | null> {
  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch {
    return null;
  }
}

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/ar');
  const [search, setSearch] = useState<string>(() => window.location.search || '');

  // Determine initial locale from URL prefix (/ar or /en) or localStorage
  const [locale, setLocaleState] = useState<Locale>(() => {
    const path = window.location.pathname;
    if (path === '/en' || path.startsWith('/en/')) return 'en';
    if (path === '/ar' || path.startsWith('/ar/')) return 'ar';
    const saved = localStorage.getItem(STORAGE_LOCALE_KEY);
    return saved === 'en' ? 'en' : 'ar';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  const [adminSession, setAdminSession] = useState<AdminUserSession | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AdminUserSession;
      if (
        parsed &&
        parsed.token &&
        !parsed.token.startsWith('local-owner-token-') &&
        parsed.viaFirebase === true &&
        parsed.expiresAt > Date.now()
      ) {
        return parsed;
      }
      localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
    } catch {
      // ignore
    }
    return null;
  });

  const [db, setDb] = useState<PlatformDatabase>(() => loadLocalDbSnapshot());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync HTML lang and dir attributes whenever locale changes
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', locale);
    html.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem(STORAGE_LOCALE_KEY, locale);
  }, [locale]);

  // Sync HTML dark class whenever theme changes
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_THEME_KEY, theme);
  }, [theme]);

  // Listen to browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newPath = window.location.pathname || '/ar';
      setPathname(newPath);
      setSearch(window.location.search || '');
      if (newPath === '/en' || newPath.startsWith('/en/')) {
        setLocaleState('en');
      } else if (newPath === '/ar' || newPath.startsWith('/ar/')) {
        setLocaleState('ar');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setPathname(url.pathname);
    setSearch(url.search);
    if (url.pathname === '/en' || url.pathname.startsWith('/en/')) {
      setLocaleState('en');
    } else if (url.pathname === '/ar' || url.pathname.startsWith('/ar/')) {
      setLocaleState('ar');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      if (pathname === '/' || pathname === '/ar' || pathname === '/en') {
        const nextPath = `/${newLocale}${search}`;
        window.history.replaceState({}, '', nextPath);
        setPathname(`/${newLocale}`);
      } else if (pathname.startsWith('/ar/') || pathname.startsWith('/en/')) {
        const rest = pathname.slice(3);
        const nextPath = `/${newLocale}${rest}${search}`;
        window.history.replaceState({}, '', nextPath);
        setPathname(`/${newLocale}${rest}`);
      }
    },
    [pathname, search]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Verify Admin session on mount & handle session expiration / revocation
  useEffect(() => {
    if (!adminSession) return;
    let cancelled = false;
    (async () => {
      const apiSession = await safeFetchJson('/api/auth/session', {
        headers: { Authorization: `Bearer ${adminSession.token}` },
      });
      if ((!apiSession || !apiSession.ok) && !cancelled) {
        setAdminSession(null);
        localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminSession?.token]);

  // Fetch data from existing Firestore (if configured) + Backend CMS API (or local snapshot on static Vercel)
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = adminSession ? '/api/cms/admin' : '/api/cms/public';
      const headers: Record<string, string> = {};
      if (adminSession?.token) {
        headers.Authorization = `Bearer ${adminSession.token}`;
      }

      let baseData: Partial<PlatformDatabase> = loadLocalDbSnapshot();
      const apiRes = await safeFetchJson(endpoint, { headers });

      if (apiRes && apiRes.ok && apiRes.data) {
        baseData = apiRes.data;
      } else if (apiRes && apiRes.status === 401 && adminSession) {
        const pubRes = await safeFetchJson('/api/cms/public');
        if (pubRes && pubRes.ok && pubRes.data) {
          baseData = pubRes.data;
        }
      }

      // Also check if an existing Firebase project is configured
      const fbConfig = getSavedFirebaseConfig();
      if (fbConfig) {
        const fbData = await fetchFromExistingFirestore(Boolean(adminSession), true);
        if (fbData) {
          setDb((prev) => {
            const merged = {
              ...prev,
              ...baseData,
              ...(fbData.siteSettings ? { siteSettings: fbData.siteSettings } : {}),
              ...(fbData.pages && fbData.pages.length > 0 ? { pages: fbData.pages } : {}),
              ...(fbData.projects && fbData.projects.length > 0 ? { projects: fbData.projects } : {}),
              ...(fbData.clinics && fbData.clinics.length > 0 ? { clinics: fbData.clinics } : {}),
              ...(fbData.doctors && fbData.doctors.length > 0 ? { doctors: fbData.doctors } : {}),
              ...(fbData.services && fbData.services.length > 0 ? { services: fbData.services } : {}),
              ...(fbData.articles && fbData.articles.length > 0 ? { articles: fbData.articles } : {}),
            };
            saveLocalDbSnapshot(merged);
            return merged;
          });
          setLoading(false);
          return;
        }
      }

      setDb((prev) => {
        const merged = { ...prev, ...baseData };
        saveLocalDbSnapshot(merged);
        return merged;
      });
    } catch (err: any) {
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
    }
  }, [adminSession]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const loginAsOwnerAdmin = useCallback(async () => {
    if (!getSavedFirebaseConfig()) {
      await hydrateFirebaseConfigFromServer();
    }
    if (!getSavedFirebaseConfig()) {
      throw new Error(
        locale === 'ar'
          ? 'إعدادات Firebase Auth غير متوفرة. يرجى إدخال API Key ومعرّف المشروع (Project ID) أدناه أو في متغيرات VITE_FIREBASE_*.'
          : 'Firebase Auth is not configured. Please provide API Key & Project ID below or in VITE_FIREBASE_*.'
      );
    }

    const fbUser = await signInWithExistingFirebaseGoogle();

    const apiRes = await safeFetchJson('/api/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fbUser.idToken}`,
      },
      body: JSON.stringify({
        idToken: fbUser.idToken,
      }),
    });

    if (!apiRes) {
      await signOutFromExistingFirebase().catch(() => {});
      throw new Error(
        locale === 'ar'
          ? 'تعذر الوصول إلى خادم التحقق (/api/auth/admin-login). لا يمكن إصدار جلسة إدارة بدون تحقق الخادم.'
          : 'Could not reach server verification endpoint (/api/auth/admin-login).'
      );
    }

    if (!apiRes.ok || !apiRes.data?.token) {
      await signOutFromExistingFirebase().catch(() => {});
      throw new Error(apiRes.data?.error || 'Admin authentication failed');
    }

    const newSession: AdminUserSession = {
      uid: apiRes.data.uid,
      email: apiRes.data.email,
      name: apiRes.data.name,
      token: apiRes.data.token,
      expiresAt: apiRes.data.expiresAt,
      viaFirebase: true,
    };

    setAdminSession(newSession);
    localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(newSession));
    showToast(
      locale === 'ar'
        ? `مرحباً بك يا ${newSession.name} — تم التحقق من الهوية عبر Firebase`
        : `Welcome ${newSession.name} — Firebase Admin session verified`,
      'success'
    );
  }, [locale, showToast]);

  const logoutAdmin = useCallback(async () => {
    if (adminSession?.token) {
      await safeFetchJson('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminSession.token}` },
      });
    }
    await signOutFromExistingFirebase().catch(() => {});
    setAdminSession(null);
    localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
    showToast(
      locale === 'ar' ? 'تم تسجيل الخروج من لوحة الإدارة' : 'Signed out of Admin CMS',
      'info'
    );
  }, [adminSession?.token, locale, showToast]);

  const saveSiteSettings = useCallback(
    async (settings: SiteSettings) => {
      if (!adminSession) throw new Error('Admin session required');
      const apiRes = await safeFetchJson('/api/cms/siteSettings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify(settings),
      });

      const savedSettings = apiRes && apiRes.ok ? apiRes.data : settings;

      setDb((prev) => {
        const next = { ...prev, siteSettings: savedSettings };
        saveLocalDbSnapshot(next);
        return next;
      });

      if (getSavedFirebaseConfig()) {
        await saveDocumentToExistingFirestore('siteSettings', 'global', savedSettings).catch(
          () => {}
        );
      }

      invalidateFirestoreCache();
      await refreshData();
      showToast(
        locale === 'ar' ? 'تم حفظ إعدادات الموقع بنجاح' : 'Site settings saved and revalidated',
        'success'
      );
    },
    [adminSession, locale, refreshData, showToast]
  );

  const upsertRecord = useCallback(
    async (
      collectionName: 'pages' | 'projects' | 'clinics' | 'doctors' | 'services' | 'articles' | 'media',
      record: Record<string, any>
    ) => {
      if (!adminSession) throw new Error('Admin session required');
      const apiRes = await safeFetchJson(`/api/cms/${collectionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify(record),
      });

      const savedRecord =
        apiRes && apiRes.ok
          ? apiRes.data
          : { ...record, id: record.id || `${collectionName}-${Date.now()}` };

      setDb((prev) => {
        const list = [...((prev as any)[collectionName] || [])];
        const idx = list.findIndex((item: any) => item.id === savedRecord.id);
        if (idx >= 0) {
          list[idx] = savedRecord;
        } else {
          list.push(savedRecord);
        }
        const next = { ...prev, [collectionName]: list };
        saveLocalDbSnapshot(next);
        return next;
      });

      if (getSavedFirebaseConfig()) {
        await saveDocumentToExistingFirestore(collectionName, savedRecord.id, savedRecord).catch(
          () => {}
        );
      }

      invalidateFirestoreCache();
      await refreshData();
      showToast(
        locale === 'ar'
          ? 'تم حفظ التعديلات وتحديث الموقع العام فوراً'
          : 'Changes saved and reflected on live site immediately',
        'success'
      );
      return savedRecord;
    },
    [adminSession, locale, refreshData, showToast]
  );

  const deleteRecord = useCallback(
    async (
      collectionName: 'pages' | 'projects' | 'clinics' | 'doctors' | 'services' | 'articles' | 'media',
      id: string
    ) => {
      if (!adminSession) throw new Error('Admin session required');
      await safeFetchJson(`/api/cms/${collectionName}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
        },
      });

      setDb((prev) => {
        const list = ((prev as any)[collectionName] || []).filter((item: any) => item.id !== id);
        const next = { ...prev, [collectionName]: list };
        saveLocalDbSnapshot(next);
        return next;
      });

      if (getSavedFirebaseConfig()) {
        await deleteDocumentFromExistingFirestore(collectionName, id).catch(() => {});
      }

      invalidateFirestoreCache();
      await refreshData();
      showToast(
        locale === 'ar' ? 'تم الحذف بنجاح' : 'Item deleted successfully',
        'success'
      );
    },
    [adminSession, locale, refreshData, showToast]
  );

  const reorderRecords = useCallback(
    async (
      collectionName: 'pages' | 'projects' | 'clinics' | 'doctors' | 'services' | 'articles',
      orderedIds: string[]
    ) => {
      if (!adminSession) throw new Error('Admin session required');
      await safeFetchJson(`/api/cms/${collectionName}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify({ orderedIds }),
      });

      setDb((prev) => {
        const list = [...((prev as any)[collectionName] || [])];
        const reordered = list
          .map((item: any) => {
            const idx = orderedIds.indexOf(item.id);
            return { ...item, order: idx >= 0 ? idx + 1 : item.order };
          })
          .sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));
        const next = { ...prev, [collectionName]: reordered };
        saveLocalDbSnapshot(next);
        return next;
      });

      invalidateFirestoreCache();
      await refreshData();
      showToast(
        locale === 'ar' ? 'تم تحديث الترتيب بنجاح' : 'Order updated successfully',
        'success'
      );
    },
    [adminSession, locale, refreshData, showToast]
  );

  const seedBaselineDatabase = useCallback(async () => {
    if (!adminSession) throw new Error('Admin session required');
    const apiRes = await safeFetchJson('/api/cms/seed-baseline', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminSession.token}`,
      },
    });

    const freshDb: PlatformDatabase =
      apiRes && apiRes.ok && apiRes.data?.database
        ? apiRes.data.database
        : INITIAL_PLATFORM_DATA;

    setDb(freshDb);
    saveLocalDbSnapshot(freshDb);

    if (getSavedFirebaseConfig()) {
      await saveDocumentToExistingFirestore('siteSettings', 'global', freshDb.siteSettings).catch(() => {});
      for (const p of freshDb.pages) await saveDocumentToExistingFirestore('pages', p.id, p).catch(() => {});
      for (const pr of freshDb.projects) await saveDocumentToExistingFirestore('projects', pr.id, pr).catch(() => {});
      for (const c of freshDb.clinics) await saveDocumentToExistingFirestore('clinics', c.id, c).catch(() => {});
      for (const d of freshDb.doctors) await saveDocumentToExistingFirestore('doctors', d.id, d).catch(() => {});
      for (const s of freshDb.services) await saveDocumentToExistingFirestore('services', s.id, s).catch(() => {});
      for (const a of freshDb.articles) await saveDocumentToExistingFirestore('articles', a.id, a).catch(() => {});
    }

    invalidateFirestoreCache();
    await refreshData();
    showToast(
      locale === 'ar'
        ? 'تمت تهيئة قاعدة البيانات بالبيانات الحقيقية بنجاح'
        : 'Database initialized with authentic baseline content',
      'success'
    );
  }, [adminSession, locale, refreshData, showToast]);

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(() =>
    Boolean(getSavedFirebaseConfig())
  );

  useEffect(() => {
    const syncFbState = () => {
      setIsFirebaseConnected(Boolean(getSavedFirebaseConfig()));
    };
    window.addEventListener('firebase-config-updated', syncFbState);
    if (!getSavedFirebaseConfig()) {
      hydrateFirebaseConfigFromServer().then((cfg) => {
        if (cfg) setIsFirebaseConnected(true);
      });
    }
    return () => window.removeEventListener('firebase-config-updated', syncFbState);
  }, []);

  const searchParams = new URLSearchParams(search);

  return (
    <PlatformContext.Provider
      value={{
        locale,
        setLocale,
        theme,
        toggleTheme,
        pathname,
        searchParams,
        navigate,
        db,
        loading,
        error,
        adminSession,
        loginAsOwnerAdmin,
        logoutAdmin,
        refreshData,
        saveSiteSettings,
        upsertRecord,
        deleteRecord,
        reorderRecords,
        seedBaselineDatabase,
        toasts,
        showToast,
        dismissToast,
        isFirebaseConnected,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within a PlatformProvider');
  return ctx;
}
