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

function stripDraftRecords(rawDb: PlatformDatabase): PlatformDatabase {
  return {
    ...rawDb,
    pages: (rawDb.pages || []).filter((item) => item.published !== false && item.archived !== true),
    projects: (rawDb.projects || []).filter((item) => item.published !== false),
    clinics: (rawDb.clinics || []).filter((item) => item.published !== false),
    doctors: (rawDb.doctors || []).filter((item) => item.published !== false),
    services: (rawDb.services || []).filter((item) => item.published !== false),
    articles: (rawDb.articles || []).filter((item) => item.published !== false && item.archived !== true),
  };
}

function loadLocalDbSnapshot(includeDrafts = false): PlatformDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_CMS_DB_KEY);
    if (!raw) return includeDrafts ? INITIAL_PLATFORM_DATA : stripDraftRecords(INITIAL_PLATFORM_DATA);
    const parsed = JSON.parse(raw) as PlatformDatabase;
    const merged: PlatformDatabase = {
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
    return includeDrafts ? merged : stripDraftRecords(merged);
  } catch {
    return includeDrafts ? INITIAL_PLATFORM_DATA : stripDraftRecords(INITIAL_PLATFORM_DATA);
  }
}

function readCandidateAdminSession(): AdminUserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminUserSession;
    if (
      parsed &&
      parsed.token &&
      !parsed.token.startsWith('local-owner-token-') &&
      parsed.viaFirebase === true &&
      typeof parsed.expiresAt === 'number' &&
      parsed.expiresAt > Date.now()
    ) {
      return parsed;
    }
    localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
  } catch {
    localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
  }
  return null;
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

  // Never trust localStorage alone on initial mount; keep adminSession null until server verifies token
  const [adminSession, setAdminSession] = useState<AdminUserSession | null>(null);

  const [db, setDb] = useState<PlatformDatabase>(() => loadLocalDbSnapshot(false));
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
      const currentSearch = window.location.search || search || '';
      const currentPath = window.location.pathname || pathname;

      // Never rewrite /admin routes with locale prefixes
      if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
        return;
      }

      let nextCleanPath: string;
      if (currentPath === '/' || currentPath === '/ar' || currentPath === '/en' || currentPath === '/ar/' || currentPath === '/en/') {
        nextCleanPath = `/${newLocale}`;
      } else if (currentPath.startsWith('/ar/') || currentPath.startsWith('/en/')) {
        nextCleanPath = `/${newLocale}${currentPath.slice(3)}`;
      } else {
        nextCleanPath = `/${newLocale}${currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`;
      }

      const nextUrl = `${nextCleanPath}${currentSearch}`;
      window.history.replaceState({}, '', nextUrl);
      setPathname(nextCleanPath);
      setSearch(currentSearch);
    },
    [pathname, search]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Verify any saved candidate session against /api/auth/session before trusting adminSession
  useEffect(() => {
    let cancelled = false;
    const candidate = adminSession || readCandidateAdminSession();
    if (!candidate) return;

    (async () => {
      const apiSession = await safeFetchJson('/api/auth/session', {
        headers: { Authorization: `Bearer ${candidate.token}` },
      });
      if (cancelled) return;

      if (apiSession && apiSession.ok && apiSession.data?.authenticated === true) {
        const verifiedSession: AdminUserSession = {
          uid: apiSession.data.uid || candidate.uid,
          email: apiSession.data.email || candidate.email,
          name: apiSession.data.name || candidate.name,
          token: candidate.token,
          expiresAt: apiSession.data.expiresAt || candidate.expiresAt,
          viaFirebase: true,
        };
        setAdminSession((prev) =>
          prev && prev.token === verifiedSession.token ? prev : verifiedSession
        );
      } else {
        setAdminSession(null);
        localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [adminSession?.token]);

  // Fetch data from existing Firestore (if configured) + Backend CMS API (or local snapshot)
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const hasVerifiedAdmin = Boolean(adminSession?.token);
    try {
      const endpoint = hasVerifiedAdmin ? '/api/cms/admin' : '/api/cms/public';
      const headers: Record<string, string> = {};
      if (hasVerifiedAdmin && adminSession?.token) {
        headers.Authorization = `Bearer ${adminSession.token}`;
      }

      let baseData: Partial<PlatformDatabase> = loadLocalDbSnapshot(hasVerifiedAdmin);
      const apiRes = await safeFetchJson(endpoint, { headers });

      if (apiRes && apiRes.ok && apiRes.data) {
        baseData = hasVerifiedAdmin
          ? apiRes.data
          : stripDraftRecords(apiRes.data as PlatformDatabase);
      } else if (apiRes && apiRes.status === 401 && hasVerifiedAdmin) {
        setAdminSession(null);
        localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
        const pubRes = await safeFetchJson('/api/cms/public');
        if (pubRes && pubRes.ok && pubRes.data) {
          baseData = stripDraftRecords(pubRes.data as PlatformDatabase);
        }
      }

      // Also check if an existing Firebase project is configured
      const fbConfig = getSavedFirebaseConfig();
      if (fbConfig) {
        const fbData = await fetchFromExistingFirestore(hasVerifiedAdmin, true);
        if (fbData) {
          const toMs = (iso?: string) => {
            const t = iso ? Date.parse(iso) : 0;
            return Number.isNaN(t) ? 0 : t;
          };
          const mergeByNewest = <T extends { id?: string; updatedAt?: string }>(
            serverList: T[] = [],
            fbList: T[] = []
          ): T[] => {
            const map = new Map<string, T>();
            for (const item of serverList) {
              if (item?.id) map.set(item.id, item);
            }
            for (const fbItem of fbList) {
              if (!fbItem?.id) continue;
              const existing = map.get(fbItem.id);
              if (!existing || toMs(fbItem.updatedAt) > toMs(existing.updatedAt)) {
                map.set(fbItem.id, fbItem);
              }
            }
            return Array.from(map.values());
          };

          const serverSettingsTime = toMs((baseData.siteSettings as any)?.updatedAt);
          const fbSettingsTime = toMs((fbData.siteSettings as any)?.updatedAt);
          const resolvedSettings =
            fbData.siteSettings && fbSettingsTime > serverSettingsTime
              ? fbData.siteSettings
              : baseData.siteSettings || fbData.siteSettings;

          setDb((prev) => {
            const combined: PlatformDatabase = {
              ...prev,
              ...baseData,
              ...(resolvedSettings ? { siteSettings: resolvedSettings } : {}),
              pages: mergeByNewest(baseData.pages, fbData.pages),
              projects: mergeByNewest(baseData.projects, fbData.projects),
              clinics: mergeByNewest(baseData.clinics, fbData.clinics),
              doctors: mergeByNewest(baseData.doctors, fbData.doctors),
              services: mergeByNewest(baseData.services, fbData.services),
              articles: mergeByNewest(baseData.articles, fbData.articles),
              media: mergeByNewest(baseData.media, fbData.media),
            };
            const sanitized = hasVerifiedAdmin ? combined : stripDraftRecords(combined);
            saveLocalDbSnapshot(sanitized);
            return sanitized;
          });
          setLoading(false);
          return;
        }
      }

      setDb((prev) => {
        const combined = { ...prev, ...baseData } as PlatformDatabase;
        const sanitized = hasVerifiedAdmin ? combined : stripDraftRecords(combined);
        saveLocalDbSnapshot(sanitized);
        return sanitized;
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

    let resStatus = 0;
    let resText = '';
    let apiData: any = null;
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${fbUser.idToken}`,
        },
        body: JSON.stringify({
          idToken: fbUser.idToken,
        }),
      });
      resStatus = res.status;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        apiData = await res.json();
      } else {
        resText = (await res.text()).slice(0, 140);
      }
      if (!res.ok || !apiData?.token) {
        await signOutFromExistingFirebase().catch(() => {});
        if (apiData?.error) {
          throw new Error(apiData.error);
        }
        throw new Error(
          locale === 'ar'
            ? `تعذر الوصول إلى خادم التحقق (/api/auth/admin-login) — استجابة الخادم (HTTP ${resStatus}${resText ? `: ${resText}` : ''}). تأكد من نشر آخر تحديثات الخادم على Vercel.`
            : `Server verification failed (/api/auth/admin-login, HTTP ${resStatus}). Ensure latest server bundle is deployed.`
        );
      }
    } catch (err: any) {
      if (resStatus === 0) {
        await signOutFromExistingFirebase().catch(() => {});
        throw new Error(
          locale === 'ar'
            ? 'تعذر الوصول إلى خادم التحقق (/api/auth/admin-login). لا يمكن إصدار جلسة إدارة بدون تحقق الخادم.'
            : 'Could not reach server verification endpoint (/api/auth/admin-login).'
        );
      }
      throw err;
    }

    const newSession: AdminUserSession = {
      uid: apiData.uid,
      email: apiData.email,
      name: apiData.name,
      token: apiData.token,
      expiresAt: apiData.expiresAt,
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

      if (apiRes && !apiRes.ok) {
        const msg = apiRes.data?.error || 'Failed to save changes';
        showToast(msg, 'error');
        throw new Error(msg);
      }

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
      const apiRes = await safeFetchJson(`/api/cms/${collectionName}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
        },
      });

      if (apiRes && !apiRes.ok) {
        const msg = apiRes.data?.error || 'Deletion rejected by server';
        showToast(msg, 'error');
        throw new Error(msg);
      }

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
