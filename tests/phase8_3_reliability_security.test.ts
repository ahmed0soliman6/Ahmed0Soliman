import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { INITIAL_PLATFORM_DATA } from '../src/data/initialSeedData';
import { PlatformDatabase } from '../src/types/cms';

process.env.SKIP_SERVER_LISTEN = '1';

import {
  createExpressApp,
  publishPublicSnapshot,
  readPublishedPublicSnapshot,
  createSignedAdminSessionToken,
  verifySignedAdminSessionToken,
  hashSessionToken,
  clearLocalInstanceSessionMemory,
  clearLocalInstanceSnapshotMemory,
  setCustomCmsHooks,
  getFirestoreMetrics,
  resetFirestoreMetrics,
  CentralSessionRecord,
  PersistentSnapshotStorageAdapter,
  PublicSnapshotManifest,
  PublicContentSnapshot,
  AdminServiceResolution,
} from '../server';

const VALID_TEST_SECRET = 'phase-8-3-production-hmac-secret-minimum-32-bytes-long-key!!';

async function requestJson(
  baseUrl: string,
  urlPath: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  }
): Promise<{
  status: number;
  headers: Headers;
  data: any;
  text: string;
}> {
  const res = await fetch(`${baseUrl}${urlPath}`, {
    method: options?.method || 'GET',
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options?.headers || {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  return { status: res.status, headers: res.headers, data, text };
}

/**
 * Shared serialized in-memory Blob storage simulator for testing multi-instance
 * Vercel Serverless behavior without sharing JavaScript object references.
 */
function createSharedBlobStorageSimulator(options?: {
  configured?: boolean;
  failWriteSnapshot?: boolean;
  failReadSnapshot?: boolean;
  failWriteManifest?: boolean;
}): {
  adapter: PersistentSnapshotStorageAdapter;
  blobs: Map<string, string>;
  manifestState: { raw: string | null; etag: string };
} {
  const blobs = new Map<string, string>();
  const manifestState: { raw: string | null; etag: string } = {
    raw: null,
    etag: 'etag-0',
  };
  let etagCounter = 1;

  const adapter: PersistentSnapshotStorageAdapter = {
    isConfigured: () => options?.configured !== false,
    writeVersionedSnapshot: async (pathname: string, serializedJson: string) => {
      if (options?.failWriteSnapshot) {
        throw new Error('Simulated Vercel Blob writeVersionedSnapshot network failure');
      }
      // Store serialized string copy only
      blobs.set(pathname, String(serializedJson));
      return {
        url: `https://blob.vercel-storage.com/${pathname}`,
        pathname,
      };
    },
    readSnapshotByUrlOrPath: async (urlOrPathname: string) => {
      if (options?.failReadSnapshot) {
        throw new Error('Simulated Vercel Blob readSnapshotByUrlOrPath failure');
      }
      const key = urlOrPathname.replace('https://blob.vercel-storage.com/', '');
      const found = blobs.get(key) ?? blobs.get(urlOrPathname) ?? null;
      return found !== null ? String(found) : null;
    },
    readCurrentManifest: async () => {
      if (!manifestState.raw) {
        return { manifest: null };
      }
      const parsed = JSON.parse(manifestState.raw) as PublicSnapshotManifest;
      return { manifest: parsed, etag: manifestState.etag };
    },
    writeCurrentManifest: async (
      manifest: PublicSnapshotManifest,
      writeOpts?: { ifMatchEtag?: string }
    ) => {
      if (options?.failWriteManifest) {
        throw new Error('Simulated Vercel Blob writeCurrentManifest failure');
      }
      if (
        writeOpts?.ifMatchEtag &&
        manifestState.raw !== null &&
        writeOpts.ifMatchEtag !== manifestState.etag
      ) {
        throw new Error('Precondition Failed: Manifest ETag mismatch');
      }
      manifestState.raw = JSON.stringify(manifest, null, 2);
      etagCounter += 1;
      manifestState.etag = `etag-${etagCounter}`;
      blobs.set('snapshots/manifest.json', manifestState.raw);
      return {
        url: 'https://blob.vercel-storage.com/snapshots/manifest.json',
        etag: manifestState.etag,
      };
    },
  };

  return { adapter, blobs, manifestState };
}

async function startTestServer(app: ReturnType<typeof createExpressApp>): Promise<{
  server: http.Server;
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    server,
    baseUrl,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

async function runPhase8_3Tests() {
  console.log('================================================================');
  console.log('PHASE 8.3 — PRODUCTION RELIABILITY & CENTRALIZED SESSION SECURITY');
  console.log('================================================================\n');

  let passed = 0;
  const recordPass = (name: string) => {
    passed += 1;
    console.log(`✅ [PASS ${passed}] ${name}`);
  };

  const ownerUid = '0BgJZ46TQGRQpJ8OwnerUid12345';
  const ownerEmail = 'owner-verified@solimedical.com';

  // Shared simulated Firestore state across Serverless Instance A and Instance B
  let sharedFirestoreDb: PlatformDatabase = JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
  sharedFirestoreDb.admins = [
    {
      id: ownerUid,
      uid: ownerUid,
      email: ownerEmail,
      name: 'Ahmed Soliman',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Shared serialized central session store (stores JSON strings to avoid shared object refs)
  const sharedCentralSessionsJson = new Map<string, string>();
  let failFirestoreWrite = false;
  let failCentralSessionSave = false;
  let failCentralSessionRead = false;
  let failCentralSessionRevoke = false;
  let simulateFirebaseUnavailable = false;
  let simulateAdminDisabled = false;

  setCustomCmsHooks({
    loadAdminDb: async () => {
      return JSON.parse(JSON.stringify(sharedFirestoreDb));
    },
    saveAdminDb: async (nextDb) => {
      if (failFirestoreWrite) {
        throw new Error('Simulated Firestore write outage');
      }
      sharedFirestoreDb = JSON.parse(JSON.stringify(nextDb));
    },
  });

  const createAuthResolver = (): (() => Promise<AdminServiceResolution>) => {
    return async (): Promise<AdminServiceResolution> => {
      if (simulateFirebaseUnavailable) {
        return {
          ready: false,
          code: 'FIREBASE_SERVICES_UNAVAILABLE',
          error: 'Simulated Firebase Admin SDK outage',
        };
      }
      return {
        ready: true,
        deps: {
          ownerEmail,
          ownerUid,
          verifyIdToken: async (idToken: string) => {
            if (idToken === 'valid-owner-firebase-id-token') {
              return {
                uid: ownerUid,
                email: ownerEmail,
                email_verified: true,
                name: 'Ahmed Soliman',
              };
            }
            throw new Error('Invalid Firebase ID Token');
          },
          hasAdminDocument: async (uid: string) => {
            if (uid !== ownerUid) return { exists: false };
            return {
              exists: true,
              disabled: simulateAdminDisabled,
            };
          },
          saveSessionRecord: async (record: CentralSessionRecord) => {
            if (failCentralSessionSave) {
              throw new Error('Simulated Firestore adminSessions write failure');
            }
            sharedCentralSessionsJson.set(record.id, JSON.stringify(record));
          },
          getSessionRecord: async (sessionId: string) => {
            if (failCentralSessionRead) {
              throw new Error('Simulated Firestore adminSessions read failure');
            }
            const raw = sharedCentralSessionsJson.get(sessionId);
            return raw ? (JSON.parse(raw) as CentralSessionRecord) : null;
          },
          revokeSessionRecord: async (sessionId: string, uid?: string) => {
            if (failCentralSessionRevoke) {
              throw new Error('Simulated Firestore adminSessions revoke write failure');
            }
            const raw = sharedCentralSessionsJson.get(sessionId);
            const existing: CentralSessionRecord = raw
              ? JSON.parse(raw)
              : {
                  id: sessionId,
                  uid: uid || ownerUid,
                  email: ownerEmail,
                  name: 'Ahmed Soliman',
                  expiresAt: 0,
                  revoked: true,
                  createdAt: new Date().toISOString(),
                };
            existing.revoked = true;
            existing.revokedAt = new Date().toISOString();
            sharedCentralSessionsJson.set(sessionId, JSON.stringify(existing));
          },
        },
      };
    };
  };

  // ===========================================================================
  // PART 1: SNAPSHOT PERSISTENCE & CROSS-INSTANCE CONSISTENCY TESTS (1.1 - 1.11)
  // ===========================================================================

  // Test 1.1 & 1.2: Snapshot generation filters unpublished/draft/archived & preserves structure
  {
    const sampleDb: PlatformDatabase = JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
    sampleDb.pages.push({
      ...sampleDb.pages[0],
      id: 'draft-custom-page',
      slug: 'draft-secret',
      pageType: 'landing',
      isCore: false,
      title: { ar: 'مسودة', en: 'Draft' },
      headline: { ar: 'مسودة', en: 'Draft' },
      subheadline: { ar: 'مسودة', en: 'Draft' },
      blocks: [],
      published: false,
      archived: false,
      order: 99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    sampleDb.articles.push({
      ...sampleDb.articles[0],
      id: 'archived-article-test',
      slug: 'archived-article-slug',
      title: { ar: 'مقال مؤرشف', en: 'Archived Article' },
      excerpt: { ar: 'ملخص', en: 'Excerpt' },
      content: { ar: 'محتوى', en: 'Content' },
      category: { ar: 'عام', en: 'General' },
      tags: [],
      coverImage: '/assets/aistudio/owner_portrait.png',
      readingTimeMinutes: 3,
      featured: false,
      published: true,
      archived: true,
      order: 99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const blobSim = createSharedBlobStorageSimulator({ configured: true });
    const pubRes = await publishPublicSnapshot(sampleDb, { adapter: blobSim.adapter });
    assert.equal(pubRes.published, true, 'Snapshot must publish to configured Blob adapter');
    assert.ok(pubRes.manifest, 'Manifest must be returned on successful publication');
    assert.equal(pubRes.manifest.revision, 1, 'Initial snapshot revision must be 1');

    const rawBlob = blobSim.blobs.get(pubRes.manifest.snapshotPathname);
    assert.ok(rawBlob, 'Versioned immutable snapshot blob must exist in storage');
    const parsedSnapshot = JSON.parse(rawBlob!) as PublicContentSnapshot;

    assert.ok(
      !parsedSnapshot.pages.some((p) => p.id === 'draft-custom-page'),
      'Unpublished draft page must be excluded from published snapshot'
    );
    assert.ok(
      !parsedSnapshot.articles.some((a) => a.id === 'archived-article-test'),
      'Archived article must be excluded from published snapshot'
    );
    assert.ok(Array.isArray(parsedSnapshot.pages) && parsedSnapshot.pages.length === 6);
    assert.ok(Array.isArray(parsedSnapshot.projects));
    assert.ok(Array.isArray(parsedSnapshot.clinics));
    assert.ok(Array.isArray(parsedSnapshot.doctors));
    assert.ok(Array.isArray(parsedSnapshot.services));
    assert.ok(Array.isArray(parsedSnapshot.articles));
    assert.equal((parsedSnapshot as any).admins, undefined, 'Admin records must never be included in public snapshot');
    assert.equal((parsedSnapshot as any).media, undefined, 'Admin media library must never be included in public snapshot');
    assert.ok(parsedSnapshot.siteSettings && typeof parsedSnapshot.siteSettings === 'object');

    recordPass(
      'Tests 1.1, 1.2 & 1.3: Snapshot filters drafts/archived, validates full schema, writes versioned blob first, and updates manifest pointer'
    );
  }

  // Test 1.4, 1.5, 1.10 & 1.11: Two independent Serverless Instances (Instance A & Instance B)
  // Cold-start recovery, CMS update propagation, section visibility sync, and ZERO Firestore reads
  {
    const sharedStorage = createSharedBlobStorageSimulator({ configured: true });

    const appInstanceA = createExpressApp({
      authDepsResolver: createAuthResolver(),
      hmacSecret: VALID_TEST_SECRET,
      snapshotAdapter: sharedStorage.adapter,
      strictProductionMode: true,
    });

    const appInstanceB = createExpressApp({
      authDepsResolver: createAuthResolver(),
      hmacSecret: VALID_TEST_SECRET,
      snapshotAdapter: sharedStorage.adapter,
      strictProductionMode: true,
    });

    const serverA = await startTestServer(appInstanceA);
    const serverB = await startTestServer(appInstanceB);

    try {
      // Before any snapshot is published in production mode, Instance B must return 503 (never fallback to INITIAL_PLATFORM_DATA)
      const coldBeforePublish = await requestJson(serverB.baseUrl, '/api/cms/public');
      assert.equal(
        coldBeforePublish.status,
        503,
        'Unpublished production snapshot must return 503 instead of silent INITIAL_PLATFORM_DATA fallback'
      );
      assert.equal(coldBeforePublish.data?.code, 'PUBLIC_SNAPSHOT_NOT_INITIALIZED');

      // Log in as admin on Instance A
      const loginRes = await requestJson(serverA.baseUrl, '/api/auth/admin-login', {
        method: 'POST',
        body: { idToken: 'valid-owner-firebase-id-token' },
      });
      assert.equal(loginRes.status, 200, 'Admin login on Instance A must succeed');
      const adminToken = loginRes.data.token as string;
      assert.ok(adminToken, 'Admin login must return signed session token');

      // Publish initial baseline snapshot via /api/cms/publish-snapshot on Instance A
      const pubInitRes = await requestJson(serverA.baseUrl, '/api/cms/publish-snapshot', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(pubInitRes.status, 200);
      assert.equal(pubInitRes.data.publishedSnapshot, true);
      assert.equal(pubInitRes.data.manifest.revision, 1);

      // Cold-start Instance B reads the published snapshot from shared storage with 0 Firestore reads
      resetFirestoreMetrics();
      const coldReadB = await requestJson(serverB.baseUrl, '/api/cms/public');
      assert.equal(coldReadB.status, 200, 'Instance B must load published snapshot from shared Blob');
      assert.equal(coldReadB.headers.get('x-firestore-reads'), '0');
      assert.equal(getFirestoreMetrics().reads, 0, 'Public read on Instance B must use 0 Firestore reads');
      assert.equal(coldReadB.data.pages.length, 6);

      // Now on Instance A: Unpublish 'projects' and 'clinics' core pages AND enable hideVisitorHeaderNav
      const projectsPage = sharedFirestoreDb.pages.find((p) => p.id === 'projects')!;
      const clinicsPage = sharedFirestoreDb.pages.find((p) => p.id === 'clinics')!;

      const hideProjectsRes = await requestJson(serverA.baseUrl, '/api/cms/pages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { ...projectsPage, published: false },
      });
      assert.equal(hideProjectsRes.status, 200);
      assert.equal(hideProjectsRes.data.savedToFirestore, true);
      assert.equal(hideProjectsRes.data.publishedSnapshot, true);

      const hideClinicsRes = await requestJson(serverA.baseUrl, '/api/cms/pages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { ...clinicsPage, published: false },
      });
      assert.equal(hideClinicsRes.status, 200);
      assert.equal(hideClinicsRes.data.publishedSnapshot, true);

      const updateNavRes = await requestJson(serverA.baseUrl, '/api/cms/siteSettings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { ...sharedFirestoreDb.siteSettings, hideVisitorHeaderNav: true },
      });
      assert.equal(updateNavRes.status, 200);
      assert.equal(updateNavRes.data.publishedSnapshot, true);

      // Immediately request from Instance B (without restarting Instance B or clearing its memory manually)
      resetFirestoreMetrics();
      const bPublicApi = await requestJson(serverB.baseUrl, '/api/cms/public');
      const bPublicStatic = await requestJson(serverB.baseUrl, '/data/public-snapshot.json');
      const bSitemap = await requestJson(serverB.baseUrl, '/sitemap.xml');

      assert.equal(bPublicApi.status, 200);
      assert.equal(bPublicStatic.status, 200);
      assert.equal(bSitemap.status, 200);
      assert.equal(
        getFirestoreMetrics().reads,
        0,
        'All public routes on Instance B must execute 0 Firestore reads'
      );
      assert.equal(bPublicApi.headers.get('x-firestore-reads'), '0');
      assert.equal(bPublicStatic.headers.get('x-firestore-reads'), '0');
      assert.equal(bSitemap.headers.get('x-firestore-reads'), '0');

      // Verify Instance B immediately reflects hidden 'projects' and 'clinics' and hideVisitorHeaderNav = true
      const bPageIds = bPublicApi.data.pages.map((p: any) => p.id);
      assert.ok(!bPageIds.includes('projects'), 'Instance B /api/cms/public must hide unpublished projects page');
      assert.ok(!bPageIds.includes('clinics'), 'Instance B /api/cms/public must hide unpublished clinics page');
      assert.equal(
        bPublicApi.data.siteSettings.hideVisitorHeaderNav,
        true,
        'Instance B must reflect hideVisitorHeaderNav: true'
      );

      // Verify /data/public-snapshot.json matches /api/cms/public on Instance B
      const bStaticPageIds = bPublicStatic.data.pages.map((p: any) => p.id);
      assert.deepEqual(
        bStaticPageIds,
        bPageIds,
        '/data/public-snapshot.json and /api/cms/public must return identical page visibility'
      );

      // Verify /sitemap.xml on Instance B excludes /ar/projects and /ar/clinics
      assert.ok(
        !bSitemap.text.includes('/ar/projects</loc>'),
        '/sitemap.xml on Instance B must exclude hidden /ar/projects section'
      );
      assert.ok(
        !bSitemap.text.includes('/ar/clinics</loc>'),
        '/sitemap.xml on Instance B must exclude hidden /ar/clinics section'
      );
      assert.ok(
        bSitemap.text.includes('/ar/about</loc>'),
        '/sitemap.xml on Instance B must include published /ar/about section'
      );

      recordPass(
        'Tests 1.4, 1.5, 1.10 & 1.11: Cross-instance snapshot propagation (Instance A -> Instance B), cold-start 503 guard, section visibility sync across /api/cms/public, /data/public-snapshot.json, and /sitemap.xml, and 0 public Firestore reads'
      );
    } finally {
      await serverA.close();
      await serverB.close();
      // Restore projects and clinics published state in sharedFirestoreDb
      sharedFirestoreDb = JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
    }
  }

  // Test 1.6: Snapshot upload failure does not overwrite last valid manifest & reports publishedSnapshot: false
  {
    const sharedStorage = createSharedBlobStorageSimulator({ configured: true });
    // First publish a valid revision 1
    const firstPub = await publishPublicSnapshot(sharedFirestoreDb, {
      adapter: sharedStorage.adapter,
    });
    assert.equal(firstPub.published, true);
    assert.equal(firstPub.manifest?.revision, 1);

    // Now create an adapter sharing the same manifest that fails on versioned snapshot upload
    const failingAdapter: PersistentSnapshotStorageAdapter = {
      ...sharedStorage.adapter,
      writeVersionedSnapshot: async () => {
        throw new Error('Blob upload failed');
      },
    };

    const app = createExpressApp({
      authDepsResolver: createAuthResolver(),
      hmacSecret: VALID_TEST_SECRET,
      snapshotAdapter: failingAdapter,
      strictProductionMode: true,
    });
    const srv = await startTestServer(app);
    try {
      const loginRes = await requestJson(srv.baseUrl, '/api/auth/admin-login', {
        method: 'POST',
        body: { idToken: 'valid-owner-firebase-id-token' },
      });
      const token = loginRes.data.token;

      const mutRes = await requestJson(srv.baseUrl, '/api/cms/siteSettings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: { ...sharedFirestoreDb.siteSettings, hideVisitorHeaderNav: true },
      });

      assert.equal(mutRes.status, 200);
      assert.equal(mutRes.data.savedToFirestore, true, 'Firestore write succeeded');
      assert.equal(
        mutRes.data.publishedSnapshot,
        false,
        'Must truthfully report publishedSnapshot: false when Blob upload fails'
      );
      assert.ok(mutRes.data.snapshotError, 'Must return snapshotError message');

      // Verify manifest still points to revision 1
      const currentManifest = await sharedStorage.adapter.readCurrentManifest();
      assert.equal(
        currentManifest.manifest?.revision,
        1,
        'Last valid manifest (revision 1) must remain intact when new snapshot upload fails'
      );

      recordPass(
        'Test 1.6: Snapshot upload failure preserves last valid manifest and reports savedToFirestore: true, publishedSnapshot: false'
      );
    } finally {
      await srv.close();
    }
  }

  // Test 1.7: Missing BLOB_READ_WRITE_TOKEN (unconfigured adapter) returns publishedSnapshot: false
  {
    const unconfiguredStorage = createSharedBlobStorageSimulator({ configured: false });
    const pubRes = await publishPublicSnapshot(sharedFirestoreDb, {
      adapter: unconfiguredStorage.adapter,
    });
    assert.equal(
      pubRes.published,
      false,
      'Missing Blob configuration must never claim published: true'
    );
    assert.equal(pubRes.code, 'BLOB_NOT_CONFIGURED');

    recordPass(
      'Test 1.7: Missing BLOB_READ_WRITE_TOKEN returns publishedSnapshot: false with code BLOB_NOT_CONFIGURED'
    );
  }

  // Test 1.8: Firestore write failure prevents snapshot publication
  {
    const sharedStorage = createSharedBlobStorageSimulator({ configured: true });
    await publishPublicSnapshot(sharedFirestoreDb, { adapter: sharedStorage.adapter });

    const app = createExpressApp({
      authDepsResolver: createAuthResolver(),
      hmacSecret: VALID_TEST_SECRET,
      snapshotAdapter: sharedStorage.adapter,
      strictProductionMode: true,
    });
    const srv = await startTestServer(app);
    try {
      const loginRes = await requestJson(srv.baseUrl, '/api/auth/admin-login', {
        method: 'POST',
        body: { idToken: 'valid-owner-firebase-id-token' },
      });
      const token = loginRes.data.token;

      failFirestoreWrite = true;
      const mutRes = await requestJson(srv.baseUrl, '/api/cms/siteSettings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: { ...sharedFirestoreDb.siteSettings, hideVisitorHeaderNav: false },
      });

      assert.equal(mutRes.status, 503, 'Firestore write failure must return 503');
      assert.equal(mutRes.data.savedToFirestore, false);
      assert.equal(mutRes.data.publishedSnapshot, false);

      const manifestAfter = await sharedStorage.adapter.readCurrentManifest();
      assert.equal(
        manifestAfter.manifest?.revision,
        1,
        'Manifest revision must not increment when Firestore write fails'
      );

      recordPass('Test 1.8: Firestore write failure prevents snapshot publication');
    } finally {
      failFirestoreWrite = false;
      await srv.close();
    }
  }

  // Test 1.9: Concurrent publish guard prevents older revision from overwriting newer revision
  {
    const sharedStorage = createSharedBlobStorageSimulator({ configured: true });
    const rev2 = await publishPublicSnapshot(sharedFirestoreDb, {
      adapter: sharedStorage.adapter,
      revision: 2,
    });
    assert.equal(rev2.published, true);
    assert.equal(rev2.manifest?.revision, 2);

    const staleRev1 = await publishPublicSnapshot(sharedFirestoreDb, {
      adapter: sharedStorage.adapter,
      revision: 1,
    });
    assert.equal(
      staleRev1.published,
      false,
      'Stale revision (1 < 2) must be rejected by monotonic revision guard'
    );
    assert.equal(staleRev1.code, 'STALE_SNAPSHOT_REVISION');

    const currentManifest = await sharedStorage.adapter.readCurrentManifest();
    assert.equal(
      currentManifest.manifest?.revision,
      2,
      'Current manifest must remain at newer revision 2'
    );

    recordPass(
      'Test 1.9: Concurrent publish monotonic guard prevents older revision from overwriting newer revision'
    );
  }

  // ===========================================================================
  // PART 2: CENTRALIZED SESSION SECURITY TESTS (2.1 - 2.17)
  // ===========================================================================

  // Test 2.1 & 2.2: Missing or short ADMIN_SESSION_SECRET rejects session creation and verification
  {
    const sharedStorage = createSharedBlobStorageSimulator({ configured: true });
    const appMissingSecret = createExpressApp({
      authDepsResolver: createAuthResolver(),
      hmacSecret: '',
      snapshotAdapter: sharedStorage.adapter,
    });
    const appShortSecret = createExpressApp({
      authDepsResolver: createAuthResolver(),
      hmacSecret: 'too-short-secret-123',
      snapshotAdapter: sharedStorage.adapter,
    });

    const srvMissing = await startTestServer(appMissingSecret);
    const srvShort = await startTestServer(appShortSecret);

    try {
      const loginMissing = await requestJson(srvMissing.baseUrl, '/api/auth/admin-login', {
        method: 'POST',
        body: { idToken: 'valid-owner-firebase-id-token' },
      });
      assert.equal(loginMissing.status, 503, 'Missing ADMIN_SESSION_SECRET must fail closed with 503');
      assert.equal(loginMissing.data.code, 'ADMIN_SESSION_SECRET_NOT_CONFIGURED');

      const loginShort = await requestJson(srvShort.baseUrl, '/api/auth/admin-login', {
        method: 'POST',
        body: { idToken: 'valid-owner-firebase-id-token' },
      });
      assert.equal(loginShort.status, 503, 'Short ADMIN_SESSION_SECRET (<32 bytes) must fail closed with 503');
      assert.equal(loginShort.data.code, 'ADMIN_SESSION_SECRET_TOO_SHORT');

      // Also verify admin route with a token fails closed with 503 when secret is missing/short
      const validSignedToken = createSignedAdminSessionToken(
        {
          uid: ownerUid,
          email: ownerEmail,
          name: 'Ahmed Soliman',
          expiresAt: Date.now() + 60000,
        },
        VALID_TEST_SECRET
      );
      const adminCheckMissing = await requestJson(srvMissing.baseUrl, '/api/cms/admin', {
        headers: { Authorization: `Bearer ${validSignedToken}` },
      });
      assert.equal(adminCheckMissing.status, 503);
      assert.equal(adminCheckMissing.data.code, 'ADMIN_SESSION_SECRET_NOT_CONFIGURED');

      recordPass(
        'Tests 2.1 & 2.2: Missing or short (<32 bytes) ADMIN_SESSION_SECRET fails closed with 503 on both login and verification'
      );
    } finally {
      await srvMissing.close();
      await srvShort.close();
    }
  }

  // Test 2.3 & 2.4: Invalid HMAC signature and expired signed token are rejected with 401
  {
    const tamperedCheck = verifySignedAdminSessionToken(
      'v1.eyJ1aWQiOiIxMjMifQ.invalidsignature',
      VALID_TEST_SECRET
    );
    assert.equal(tamperedCheck.valid, false);
    if (!tamperedCheck.valid) {
      assert.equal(tamperedCheck.status, 401);
      assert.equal(tamperedCheck.code, 'INVALID_SESSION_SIGNATURE');
    }

    const expiredToken = createSignedAdminSessionToken(
      {
        uid: ownerUid,
        email: ownerEmail,
        name: 'Ahmed Soliman',
        expiresAt: Date.now() - 10000,
      },
      VALID_TEST_SECRET
    );
    const expiredCheck = verifySignedAdminSessionToken(expiredToken, VALID_TEST_SECRET);
    assert.equal(expiredCheck.valid, false);
    if (!expiredCheck.valid) {
      assert.equal(expiredCheck.status, 401);
      assert.equal(expiredCheck.code, 'SESSION_EXPIRED');
    }

    recordPass('Tests 2.3 & 2.4: Invalid HMAC signature and expired signed token are rejected with 401');
  }

  // Tests 2.5 - 2.16: Full Centralized Firestore Session Verification & Cross-Instance Logout
  {
    const sharedStorage = createSharedBlobStorageSimulator({ configured: true });
    await publishPublicSnapshot(sharedFirestoreDb, { adapter: sharedStorage.adapter });

    const appInstanceA = createExpressApp({
      authDepsResolver: createAuthResolver(),
      hmacSecret: VALID_TEST_SECRET,
      snapshotAdapter: sharedStorage.adapter,
      strictProductionMode: true,
    });
    const appInstanceB = createExpressApp({
      authDepsResolver: createAuthResolver(),
      hmacSecret: VALID_TEST_SECRET,
      snapshotAdapter: sharedStorage.adapter,
      strictProductionMode: true,
    });

    const serverA = await startTestServer(appInstanceA);
    const serverB = await startTestServer(appInstanceB);

    try {
      // Test 2.11: Session creation write failure returns 503 and does NOT return a session token
      failCentralSessionSave = true;
      const failedSaveLogin = await requestJson(serverA.baseUrl, '/api/auth/admin-login', {
        method: 'POST',
        body: { idToken: 'valid-owner-firebase-id-token' },
      });
      assert.equal(failedSaveLogin.status, 503);
      assert.equal(failedSaveLogin.data.code, 'SESSION_CREATION_WRITE_FAILED');
      assert.equal(failedSaveLogin.data.token, undefined, 'Must not return token if central write fails');
      failCentralSessionSave = false;
      recordPass('Test 2.11: Session creation Firestore write failure returns 503 and withholds token');

      // Test 2.13: Login persists central session record before returning token
      sharedCentralSessionsJson.clear();
      const loginRes = await requestJson(serverA.baseUrl, '/api/auth/admin-login', {
        method: 'POST',
        body: { idToken: 'valid-owner-firebase-id-token' },
      });
      assert.equal(loginRes.status, 200);
      const token = loginRes.data.token as string;
      const sessionId = hashSessionToken(token);
      assert.ok(
        sharedCentralSessionsJson.has(sessionId),
        'Central session record must exist in Firestore adminSessions/{sessionId} upon login'
      );
      recordPass('Test 2.13: Login creates central adminSessions/{sessionId} record before returning token');

      // Test 2.5: Firebase Admin service unavailable returns 503
      simulateFirebaseUnavailable = true;
      const unavailRes = await requestJson(serverB.baseUrl, '/api/cms/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(unavailRes.status, 503);
      assert.equal(unavailRes.data.code, 'FIREBASE_SERVICES_UNAVAILABLE');
      simulateFirebaseUnavailable = false;
      recordPass('Test 2.5: Firebase Admin service unavailable fails closed with 503');

      // Test 2.10: Central session read failure returns 503 (never falls back to activeSessions!)
      failCentralSessionRead = true;
      const readFailRes = await requestJson(serverA.baseUrl, '/api/cms/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(readFailRes.status, 503);
      assert.equal(readFailRes.data.code, 'CENTRAL_SESSION_READ_FAILED');
      failCentralSessionRead = false;
      recordPass(
        'Test 2.10: Central session Firestore read failure returns 503 even when token is in Instance A memory'
      );

      // Test 2.6 & 2.16: Valid HMAC signature without central session record returns 401 SESSION_NOT_FOUND
      const savedRecordRaw = sharedCentralSessionsJson.get(sessionId)!;
      sharedCentralSessionsJson.delete(sessionId);
      const missingRecordRes = await requestJson(serverA.baseUrl, '/api/cms/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(missingRecordRes.status, 401);
      assert.equal(missingRecordRes.data.code, 'SESSION_NOT_FOUND');
      sharedCentralSessionsJson.set(sessionId, savedRecordRaw);
      recordPass(
        'Tests 2.6 & 2.16: Valid HMAC signature without central Firestore session record is rejected with 401 SESSION_NOT_FOUND'
      );

      // Test 2.7: Central session UID mismatch returns 401 SESSION_UID_MISMATCH
      const uidMismatchRecord = JSON.parse(savedRecordRaw) as CentralSessionRecord;
      uidMismatchRecord.uid = 'different-uid-999999';
      sharedCentralSessionsJson.set(sessionId, JSON.stringify(uidMismatchRecord));
      const uidMismatchRes = await requestJson(serverB.baseUrl, '/api/cms/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(uidMismatchRes.status, 401);
      assert.equal(uidMismatchRes.data.code, 'SESSION_UID_MISMATCH');
      sharedCentralSessionsJson.set(sessionId, savedRecordRaw);
      recordPass('Test 2.7: Central session UID mismatch returns 401 SESSION_UID_MISMATCH');

      // Test 2.9: Expired central session returns 401 SESSION_EXPIRED
      const expiredCentralRecord = JSON.parse(savedRecordRaw) as CentralSessionRecord;
      expiredCentralRecord.expiresAt = Date.now() - 5000;
      sharedCentralSessionsJson.set(sessionId, JSON.stringify(expiredCentralRecord));
      const expiredCentralRes = await requestJson(serverB.baseUrl, '/api/cms/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(expiredCentralRes.status, 401);
      assert.equal(expiredCentralRes.data.code, 'SESSION_EXPIRED');
      sharedCentralSessionsJson.set(sessionId, savedRecordRaw);
      recordPass('Test 2.9: Expired central session record returns 401 SESSION_EXPIRED');

      // Test 2.15: Disabled admin returns 403 ADMIN_DISABLED_OR_REVOKED
      simulateAdminDisabled = true;
      const disabledAdminRes = await requestJson(serverB.baseUrl, '/api/cms/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(disabledAdminRes.status, 403);
      assert.equal(disabledAdminRes.data.code, 'ADMIN_DISABLED_OR_REVOKED');
      simulateAdminDisabled = false;
      recordPass('Test 2.15: Disabled admin (admins/{uid}.disabled === true) returns 403 ADMIN_DISABLED_OR_REVOKED');

      // Test 2.12: Logout revocation write failure returns 503 and does not report success: true
      failCentralSessionRevoke = true;
      const failedLogoutRes = await requestJson(serverA.baseUrl, '/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(failedLogoutRes.status, 503);
      assert.equal(failedLogoutRes.data.success, false);
      assert.equal(failedLogoutRes.data.code, 'SESSION_LOGOUT_REVOCATION_FAILED');
      failCentralSessionRevoke = false;
      recordPass(
        'Test 2.12: Logout revocation Firestore write failure returns 503 and does not claim success: true'
      );

      // Test 2.8 & 2.14: Cross-instance logout — Logout on Instance A immediately revokes token on Instance B
      // First verify Instance B currently accepts the token
      const beforeLogoutB = await requestJson(serverB.baseUrl, '/api/cms/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(beforeLogoutB.status, 200, 'Instance B accepts active session before logout');

      // Now execute logout on Instance A
      const logoutResA = await requestJson(serverA.baseUrl, '/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(logoutResA.status, 200);
      assert.equal(logoutResA.data.success, true);
      assert.equal(logoutResA.data.revoked, true);

      // Immediately attempt protected admin action on Instance B with the same token
      const afterLogoutB = await requestJson(serverB.baseUrl, '/api/cms/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(
        afterLogoutB.status,
        401,
        'Instance B must immediately reject token revoked on Instance A'
      );
      assert.equal(afterLogoutB.data.code, 'SESSION_REVOKED');

      const sessionStatusB = await requestJson(serverB.baseUrl, '/api/auth/session', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(sessionStatusB.status, 401);
      assert.equal(sessionStatusB.data.authenticated, false);
      assert.equal(sessionStatusB.data.code, 'SESSION_REVOKED');

      recordPass(
        'Tests 2.8 & 2.14: Cross-instance logout on Instance A immediately revokes session on Instance B with 401 SESSION_REVOKED'
      );
    } finally {
      await serverA.close();
      await serverB.close();
      clearLocalInstanceSessionMemory();
      clearLocalInstanceSnapshotMemory();
    }
  }

  // Test 2.17: Static Audit — Verify fallback secret and in-memory central fallback store are removed
  {
    const serverSource = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf-8');
    assert.ok(
      !serverSource.includes('local-dev-hmac-secret-ahmed-soliman-platform'),
      'server.ts must not contain hardcoded fallback HMAC secret local-dev-hmac-secret-ahmed-soliman-platform'
    );
    assert.ok(
      !serverSource.includes('centralSessionFallbackStore'),
      'server.ts must not contain centralSessionFallbackStore in-memory fallback'
    );

    const vercelJson = fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf-8');
    assert.ok(
      vercelJson.includes('/data/public-snapshot.json'),
      'vercel.json must route /data/public-snapshot.json to /api/index.js'
    );
    assert.ok(
      vercelJson.includes('/sitemap.xml'),
      'vercel.json must route /sitemap.xml to /api/index.js'
    );

    recordPass(
      'Test 2.17: Static Audit confirms removal of local-dev-hmac-secret-ahmed-soliman-platform and centralSessionFallbackStore, and verifies vercel.json rewrites'
    );
  }

  // Test 2.18: Eventual consistency on manifest read after write does NOT cause false-negative MANIFEST_VERIFICATION_FAILED, and page hide -> show immediately updates public snapshot with no-store Cache-Control
  {
    const baseSim = createSharedBlobStorageSimulator({ configured: true });
    // First publish revision 1
    const first = await publishPublicSnapshot(sharedFirestoreDb, { adapter: baseSim.adapter });
    assert.equal(first.published, true);
    assert.equal(first.manifest?.revision, 1);

    // Simulate Vercel Blob 60s overwrite CDN cache returning revision 1 right after writeCurrentManifest(rev 2) succeeds
    let simulateStalePostWriteRead = true;
    const delayedManifestReadAdapter: PersistentSnapshotStorageAdapter = {
      ...baseSim.adapter,
      readCurrentManifest: async () => {
        const res = await baseSim.adapter.readCurrentManifest();
        if (simulateStalePostWriteRead && res.manifest && res.manifest.revision > 1) {
          return {
            manifest: { ...res.manifest, revision: 1 },
            etag: res.etag,
          };
        }
        return res;
      },
    };

    const second = await publishPublicSnapshot(sharedFirestoreDb, {
      adapter: delayedManifestReadAdapter,
    });
    assert.equal(
      second.published,
      true,
      'publishPublicSnapshot must not fail with false-negative MANIFEST_VERIFICATION_FAILED when writeCurrentManifest succeeded'
    );
    simulateStalePostWriteRead = false;

    // Also test hide -> reload -> show -> reload cycle on public endpoint with no-store header
    const app = createExpressApp({
      authDepsResolver: createAuthResolver(),
      hmacSecret: VALID_TEST_SECRET,
      snapshotAdapter: baseSim.adapter,
      strictProductionMode: true,
    });
    const srv = await startTestServer(app);
    try {
      const loginRes = await requestJson(srv.baseUrl, '/api/auth/admin-login', {
        method: 'POST',
        body: { idToken: 'valid-owner-firebase-id-token' },
      });
      const token = loginRes.data.token as string;
      const clinicsPage = sharedFirestoreDb.pages.find((p) => p.id === 'clinics')!;

      // Hide clinics page
      const hideRes = await requestJson(srv.baseUrl, '/api/cms/pages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { ...clinicsPage, published: false },
      });
      assert.equal(hideRes.status, 200);
      assert.equal(hideRes.data.publishedSnapshot, true);

      const pubAfterHide = await requestJson(srv.baseUrl, '/api/cms/public');
      assert.equal(pubAfterHide.status, 200);
      assert.ok(
        pubAfterHide.headers.get('cache-control')?.includes('no-store'),
        '/api/cms/public must return Cache-Control: no-store for immediate F5 reload reflection'
      );
      assert.ok(
        !pubAfterHide.data.pages.some((p: any) => p.id === 'clinics'),
        'Hidden clinics page must immediately disappear from /api/cms/public'
      );

      // Re-publish clinics page
      const showRes = await requestJson(srv.baseUrl, '/api/cms/pages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { ...clinicsPage, published: true },
      });
      assert.equal(showRes.status, 200);
      assert.equal(showRes.data.publishedSnapshot, true);

      const pubAfterShow = await requestJson(srv.baseUrl, '/api/cms/public');
      assert.equal(pubAfterShow.status, 200);
      assert.ok(
        pubAfterShow.data.pages.some((p: any) => p.id === 'clinics'),
        'Re-published clinics page must immediately reappear in /api/cms/public on reload'
      );

      recordPass(
        'Test 2.18: Eventual consistency on manifest read never causes false-negative error, and Hide -> Show page cycle reflects immediately with no-store Cache-Control'
      );
    } finally {
      await srv.close();
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed} PHASE 8.3 RELIABILITY & SECURITY SUITES PASSED!`);
  console.log('================================================================');
}

runPhase8_3Tests().catch((err) => {
  console.error('❌ PHASE 8.3 TEST SUITE FAILED:', err);
  process.exit(1);
});
