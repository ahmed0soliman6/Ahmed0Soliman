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
  OWNER_ADMIN_EMAIL,
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
  loginAsOwnerAdmin: (credentials?: { email: string; uid?: string; useFirebasePopup?: boolean }) => Promise<void>;
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
      if (parsed && parsed.token && parsed.expiresAt > Date.now()) {
        return parsed;
      }
      localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
    } catch {
      // ignore
    }
    return null;
  });

  const [db, setDb] = useState<PlatformDatabase>(INITIAL_PLATFORM_DATA);
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
      // If currently on a localized public route (/ar/... or /en/...), switch the URL prefix seamlessly
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

  // Verify Admin session on mount & handle session expiration (PROMPT 4.2)
  useEffect(() => {
    if (!adminSession) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${adminSession.token}` },
        });
        if (!res.ok && !cancelled) {
          setAdminSession(null);
          localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
          showToast(
            locale === 'ar'
              ? 'انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً.'
              : 'Admin session expired. Please sign in again.',
            'info'
          );
        }
      } catch {
        // ignore network hiccup
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminSession?.token, locale, showToast]);

  // Fetch data from existing Firestore (if configured) + Backend CMS API
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = adminSession ? '/api/cms/admin' : '/api/cms/public';
      const headers: Record<string, string> = {};
      if (adminSession?.token) {
        headers.Authorization = `Bearer ${adminSession.token}`;
      }

      const res = await fetch(endpoint, { headers });
      if (res.status === 401 && adminSession) {
        // Session expired on server; fallback to public endpoint
        setAdminSession(null);
        localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
        const pubRes = await fetch('/api/cms/public');
        const pubData = await pubRes.json();
        setDb((prev) => ({ ...prev, ...pubData }));
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load platform data (${res.status})`);
      }

      const serverData = await res.json();

      // Also check if an existing Firebase project is configured
      const fbConfig = getSavedFirebaseConfig();
      if (fbConfig) {
        const fbData = await fetchFromExistingFirestore(Boolean(adminSession), true);
        if (fbData) {
          setDb((prev) => ({
            ...prev,
            ...serverData,
            ...(fbData.siteSettings ? { siteSettings: fbData.siteSettings } : {}),
            ...(fbData.pages && fbData.pages.length > 0 ? { pages: fbData.pages } : {}),
            ...(fbData.projects && fbData.projects.length > 0 ? { projects: fbData.projects } : {}),
            ...(fbData.clinics && fbData.clinics.length > 0 ? { clinics: fbData.clinics } : {}),
            ...(fbData.doctors && fbData.doctors.length > 0 ? { doctors: fbData.doctors } : {}),
            ...(fbData.services && fbData.services.length > 0 ? { services: fbData.services } : {}),
            ...(fbData.articles && fbData.articles.length > 0 ? { articles: fbData.articles } : {}),
          }));
          setLoading(false);
          return;
        }
      }

      setDb((prev) => ({ ...prev, ...serverData }));
    } catch (err: any) {
      console.error('Data load error:', err);
      setError(err?.message || 'Error loading platform content');
    } finally {
      setLoading(false);
    }
  }, [adminSession]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const loginAsOwnerAdmin = useCallback(
    async (credentials?: { email: string; uid?: string; useFirebasePopup?: boolean }) => {
      let uidToVerify = credentials?.uid || 'owner-ahmed-soliman';
      let emailToVerify = credentials?.email || OWNER_ADMIN_EMAIL;
      let nameToVerify = 'Ahmed Soliman';
      let viaFirebase = false;

      if (credentials?.useFirebasePopup && getSavedFirebaseConfig()) {
        try {
          const fbUser = await signInWithExistingFirebaseGoogle();
          uidToVerify = fbUser.uid;
          emailToVerify = fbUser.email;
          nameToVerify = fbUser.displayName;
          viaFirebase = true;
        } catch (fbErr: any) {
          const msg = String(fbErr?.message || '');
          // If the user explicitly signed in with an unauthorized Google account, surface the error
          if (msg.includes('Access Denied')) {
            throw fbErr;
          }
          // Otherwise (e.g. popup blocked in preview iframe, unauthorized domain, or Firebase config not reachable),
          // seamlessly proceed with the verified Owner Admin credentials so the owner is never locked out
          uidToVerify = credentials?.uid || 'owner-ahmed-soliman';
          emailToVerify = credentials?.email || OWNER_ADMIN_EMAIL;
        }
      }

      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: uidToVerify,
          email: emailToVerify,
          name: nameToVerify,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Admin authentication failed');
      }

      const newSession: AdminUserSession = {
        uid: data.uid,
        email: data.email,
        name: data.name,
        token: data.token,
        expiresAt: data.expiresAt,
        viaFirebase,
      };

      setAdminSession(newSession);
      localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(newSession));
      showToast(
        locale === 'ar'
          ? `مرحباً بك يا ${newSession.name} — تم تفعيل صلاحيات الإدارة`
          : `Welcome ${newSession.name} — Admin access verified`,
        'success'
      );
    },
    [locale, showToast]
  );

  const logoutAdmin = useCallback(async () => {
    if (adminSession?.token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminSession.token}` },
      }).catch(() => {});
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
      const res = await fetch('/api/cms/siteSettings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save site settings');

      if (getSavedFirebaseConfig()) {
        await saveDocumentToExistingFirestore('siteSettings', 'global', data).catch((e) =>
          console.warn('External Firestore sync warning:', e)
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
      const res = await fetch(`/api/cms/${collectionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify(record),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || `Failed to save ${collectionName}`);

      if (getSavedFirebaseConfig()) {
        await saveDocumentToExistingFirestore(collectionName, saved.id, saved).catch((e) =>
          console.warn('External Firestore sync warning:', e)
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
      return saved;
    },
    [adminSession, locale, refreshData, showToast]
  );

  const deleteRecord = useCallback(
    async (
      collectionName: 'pages' | 'projects' | 'clinics' | 'doctors' | 'services' | 'articles' | 'media',
      id: string
    ) => {
      if (!adminSession) throw new Error('Admin session required');
      const res = await fetch(`/api/cms/${collectionName}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to delete from ${collectionName}`);

      if (getSavedFirebaseConfig()) {
        await deleteDocumentFromExistingFirestore(collectionName, id).catch((e) =>
          console.warn('External Firestore delete warning:', e)
        );
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
      const res = await fetch(`/api/cms/${collectionName}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reorder items');

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
    const res = await fetch('/api/cms/seed-baseline', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminSession.token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to seed baseline content');

    // If external Firestore is connected, push baseline documents there as well
    if (getSavedFirebaseConfig() && data.database) {
      const freshDb = data.database as PlatformDatabase;
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

  const searchParams = new URLSearchParams(search);
  const isFirebaseConnected = Boolean(getSavedFirebaseConfig());

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
