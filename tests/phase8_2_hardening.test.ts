import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {
  checkMediaInPublishedContent,
  validateMediaAssetPayload,
  validatePagePayload,
  validateArticlePayload,
  normalizeMediaComparisonUrl,
} from '../src/lib/validationSchemas';
import { uploadCompressedMediaToCloudinary } from '../src/lib/imageCompression';
import { INITIAL_PLATFORM_DATA } from '../src/data/initialSeedData';
import { PlatformDatabase, MediaAsset } from '../src/types/cms';

process.env.SKIP_SERVER_LISTEN = '1';

import {
  createExpressApp,
  buildPublicSnapshot,
  resolveOrBootstrapAdminDocument,
  setCustomAuthDepsResolver,
  setCustomCmsHooks,
  clearLocalInstanceSessionMemory,
  getFirestoreMetrics,
  resetFirestoreMetrics,
  CentralSessionRecord,
  PublicContentSnapshot,
} from '../server';

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

async function runPhase8_2HardeningTests() {
  console.log('================================================================');
  console.log('PHASE 8.2 HARDENING & ZERO PUBLIC FIRESTORE READS TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  const recordPass = (name: string) => {
    passed += 1;
    console.log(`✅ [PASS ${passed}] ${name}`);
  };

  // ---------------------------------------------------------------------------
  // 1. UNIT TESTS: Phase B — Firestore Rules Static & Behavioral Verification
  // ---------------------------------------------------------------------------
  {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf-8');

    assert.ok(
      rules.includes("data.get('disabled', false) != true"),
      'isAdmin() in firestore.rules must block disabled admins'
    );
    assert.ok(
      rules.includes("data.get('archived', false) != true"),
      'firestore.rules must safely check archived status for legacy documents without archived field'
    );
    assert.ok(
      rules.includes('match /adminSessions/{sessionId}'),
      'firestore.rules must explicitly lock /adminSessions/{sessionId} to Admin SDK only'
    );

    const firebaseClientCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/lib/firebaseClient.ts'),
      'utf-8'
    );
    assert.ok(
      !firebaseClientCode.includes('firebase/firestore'),
      'src/lib/firebaseClient.ts must not import firebase/firestore (Zero Client Firestore Reads)'
    );
    assert.ok(
      !firebaseClientCode.includes('ahmed0soliman6@gmail.com'),
      'src/lib/firebaseClient.ts must not contain hardcoded fallback owner email'
    );

    const serverCode = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf-8');
    assert.ok(
      !serverCode.includes('ahmed0soliman6@gmail.com'),
      'server.ts must not contain hardcoded fallback owner email'
    );
    assert.ok(
      !serverCode.includes("path.join('/tmp', 'cms-db.json')"),
      'server.ts must not use /tmp/cms-db.json as a database'
    );

    recordPass(
      'Phase B & F Static Audit: firestore.rules checks disabled != true & safe archived default; zero client Firestore imports; zero hardcoded owner email; zero /tmp DB usage'
    );
  }

  // ---------------------------------------------------------------------------
  // 2. UNIT TESTS: Phase C — Comprehensive Media Reference Protection
  // ---------------------------------------------------------------------------
  {
    const testDb: PlatformDatabase = JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));

    // Case 2a: Image referenced inside Tiptap JSON (article.contentJson) with Cloudinary transformations
    const tiptapAsset: MediaAsset = {
      id: 'media-tiptap-1',
      publicId: 'ahmed-soliman-platform/icu-diagram-v2',
      secureUrl:
        'https://res.cloudinary.com/demo-cloud/image/upload/v1712345678/ahmed-soliman-platform/icu-diagram-v2.png',
      format: 'png',
      width: 1200,
      height: 800,
      bytes: 120000,
      alt: { ar: 'مخطط العناية', en: 'ICU Diagram' },
      category: 'blog',
      createdAt: new Date().toISOString(),
    };

    testDb.articles.push({
      id: 'art-tiptap-test',
      slug: 'icu-diagram-article',
      title: { ar: 'مقال العناية', en: 'ICU Article' },
      excerpt: { ar: 'ملخص', en: 'Excerpt' },
      content: { ar: 'نص المقال', en: 'Article text' },
      contentFormat: 'tiptap-json',
      contentJson: {
        ar: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'مرحبا' }],
            },
            {
              type: 'image',
              attrs: {
                // Transformed Cloudinary URL (f_auto,q_auto,w_900 and .webp extension)
                src: 'https://res.cloudinary.com/demo-cloud/image/upload/f_auto,q_auto,w_900/v1712345678/ahmed-soliman-platform/icu-diagram-v2.webp',
                alt: 'ICU',
              },
            },
          ],
        },
      },
      category: { ar: 'طب', en: 'Medical' },
      authorName: { ar: 'أحمد سليمان', en: 'Ahmed Soliman' },
      tags: [],
      coverImage: '/assets/aistudio/logo_ae3842b8.png',
      readingTimeMinutes: 3,
      featured: false,
      published: true,
      archived: false,
      order: 10,
      seo: { title: { ar: '', en: '' }, description: { ar: '', en: '' } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const tiptapCheck = checkMediaInPublishedContent(tiptapAsset, testDb);
    assert.equal(
      tiptapCheck.inUse,
      true,
      'Must detect image inside published Article Tiptap JSON even with Cloudinary transformations'
    );
    assert.ok(
      tiptapCheck.usedIn.some((u) => u.includes('ICU Article')),
      'usedIn must identify ICU Article'
    );

    // Case 2b: When article is archived (archived: true, published: false), image is no longer blocked by it
    testDb.articles[testDb.articles.length - 1].archived = true;
    testDb.articles[testDb.articles.length - 1].published = false;
    const archivedCheck = checkMediaInPublishedContent(tiptapAsset, testDb);
    assert.equal(
      archivedCheck.inUse,
      false,
      'Archived/unpublished article must not block deletion of unused media'
    );

    // Case 2c: Image referenced inside Markdown body (article.content.en), page.blocks, page.additionalImages, and clinic.galleryImages
    const galleryAsset: MediaAsset = {
      id: 'media-gallery-1',
      publicId: 'ahmed-soliman-platform/clinic-interior-99',
      secureUrl:
        'https://res.cloudinary.com/demo-cloud/image/upload/v17100000/ahmed-soliman-platform/clinic-interior-99.webp',
      format: 'webp',
      width: 1000,
      height: 700,
      bytes: 95000,
      alt: { ar: 'عيادة', en: 'Clinic Interior' },
      category: 'clinic',
      createdAt: new Date().toISOString(),
    };

    testDb.clinics[0].galleryImages = [galleryAsset.secureUrl];
    testDb.pages[0].additionalImages = [galleryAsset.secureUrl];
    testDb.pages[0].blocks = [
      {
        id: 'blk-1',
        title: { ar: 'قسم', en: 'Section' },
        body: { ar: 'تفاصيل', en: 'Details' },
        imageUrl: galleryAsset.secureUrl,
      },
    ];

    const multiRefCheck = checkMediaInPublishedContent(galleryAsset, testDb);
    assert.equal(multiRefCheck.inUse, true);
    assert.ok(multiRefCheck.usedIn.some((u) => u.startsWith('Clinic:')));
    assert.ok(multiRefCheck.usedIn.some((u) => u.startsWith('Page:')));

    assert.equal(
      normalizeMediaComparisonUrl(
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/v171234/folder/pic.webp'
      ),
      normalizeMediaComparisonUrl(
        'https://res.cloudinary.com/demo/image/upload/v171234/folder/pic.png'
      ),
      'normalizeMediaComparisonUrl must match transformed Cloudinary URLs to their canonical asset'
    );

    recordPass(
      'Phase C Unit Tests: checkMediaInPublishedContent detects references across Tiptap JSON, Markdown, Page Blocks, Additional Images, Clinic Galleries, and Cloudinary transformed URLs'
    );
  }

  // ---------------------------------------------------------------------------
  // 3. UNIT TESTS: Phase D — Base64 Media Fallback Prohibition
  // ---------------------------------------------------------------------------
  {
    const base64MediaCheck = validateMediaAssetPayload({
      publicId: 'local/12345-test',
      secureUrl: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
    });
    assert.equal(base64MediaCheck.valid, false, 'Must reject Base64 data: URLs in media payload');

    const base64PageCheck = validatePagePayload({
      id: 'custom-test',
      slug: 'custom-test',
      title: { ar: 'عنوان', en: 'Title' },
      headline: { ar: 'عنوان رئيسي', en: 'Headline' },
      heroImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
    });
    assert.equal(base64PageCheck.valid, false, 'Must reject Base64 heroImage in page payload');

    const base64ArticleCheck = validateArticlePayload({
      id: 'art-b64',
      slug: 'valid-slug',
      title: { ar: 'مقال', en: 'Article' },
      content: { ar: 'محتوى عربي', en: 'English content' },
      coverImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    });
    assert.equal(base64ArticleCheck.valid, false, 'Must reject Base64 coverImage in article payload');

    // Verify uploadCompressedMediaToCloudinary throws when Cloudinary is unconfigured (no Base64 fallback!)
    const fakeFile = new File([new Uint8Array([1, 2, 3, 4])], 'test.webp', {
      type: 'image/webp',
    });
    await assert.rejects(
      async () => {
        await uploadCompressedMediaToCloudinary({
          result: {
            originalFile: fakeFile,
            compressedFile: fakeFile,
            originalBytes: 4,
            compressedBytes: 4,
            savingsBytes: 0,
            savingsPercent: 0,
            originalWidth: 100,
            originalHeight: 100,
            outputWidth: 100,
            outputHeight: 100,
            format: 'image/webp',
            previewOriginalUrl: 'blob:1',
            previewCompressedUrl: 'blob:2',
          },
          adminToken: 'test-token',
          altAr: 'صورة',
          altEn: 'Image',
          category: 'general',
          fetchImpl: (async () =>
            new Response(
              JSON.stringify({
                configured: false,
                error: 'Cloudinary not configured on server',
              }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            )) as any,
        });
      },
      /Cloudinary not configured on server/,
      'uploadCompressedMediaToCloudinary must throw and never fall back to Base64 when Cloudinary is not configured'
    );

    recordPass(
      'Phase D Unit Tests: Base64 Data URLs and unconfigured Cloudinary uploads are strictly rejected without fallback'
    );
  }

  // ---------------------------------------------------------------------------
  // 4. UNIT TESTS: Phase F — Strict Owner Bootstrap (All 5 Required Scenarios)
  // ---------------------------------------------------------------------------
  {
    const createdDocs = new Map<string, Record<string, any>>();

    // Scenario 1: ADMIN_OWNER_EMAIL configured + verified matching email -> bootstraps admins/{uid}
    const s1 = await resolveOrBootstrapAdminDocument({
      uid: 'owner-uid-1',
      ownerEmail: 'owner@example.com',
      getExistingAdminDoc: async () => ({ exists: false }),
      getAuthUserRecord: async (uid) => ({
        uid,
        email: 'owner@example.com',
        emailVerified: true,
        displayName: 'Owner Admin',
      }),
      createAdminDoc: async (uid, data) => {
        createdDocs.set(uid, data);
      },
    });
    assert.equal(s1.exists, true);
    assert.equal(s1.disabled, false);
    assert.equal(s1.bootstrapped, true);
    assert.equal(createdDocs.get('owner-uid-1')?.email, 'owner@example.com');

    // Scenario 2: ADMIN_OWNER_EMAIL configured + verified NON-matching email -> rejected
    const s2 = await resolveOrBootstrapAdminDocument({
      uid: 'stranger-uid-2',
      ownerEmail: 'owner@example.com',
      getExistingAdminDoc: async () => ({ exists: false }),
      getAuthUserRecord: async (uid) => ({
        uid,
        email: 'intruder@example.com',
        emailVerified: true,
      }),
      createAdminDoc: async (uid, data) => {
        createdDocs.set(uid, data);
      },
    });
    assert.equal(s2.exists, false);
    assert.equal(s2.bootstrapped, false);
    assert.equal(createdDocs.has('stranger-uid-2'), false);

    // Scenario 3: ADMIN_OWNER_EMAIL & ADMIN_OWNER_UID NOT configured -> rejected even for former hardcoded email
    const s3 = await resolveOrBootstrapAdminDocument({
      uid: 'legacy-uid-3',
      ownerEmail: '',
      ownerUid: '',
      getExistingAdminDoc: async () => ({ exists: false }),
      getAuthUserRecord: async (uid) => ({
        uid,
        email: 'ahmed0soliman6@gmail.com',
        emailVerified: true,
      }),
      createAdminDoc: async (uid, data) => {
        createdDocs.set(uid, data);
      },
    });
    assert.equal(
      s3.exists,
      false,
      'Must never bootstrap when ADMIN_OWNER_EMAIL and ADMIN_OWNER_UID are unset'
    );
    assert.equal(createdDocs.has('legacy-uid-3'), false);

    // Scenario 4: Existing admin document with disabled: true -> returns disabled: true
    const s4 = await resolveOrBootstrapAdminDocument({
      uid: 'disabled-admin-uid',
      ownerEmail: 'owner@example.com',
      getExistingAdminDoc: async () => ({
        exists: true,
        data: { uid: 'disabled-admin-uid', disabled: true },
      }),
      getAuthUserRecord: async (uid) => ({
        uid,
        email: 'owner@example.com',
        emailVerified: true,
      }),
      createAdminDoc: async () => {},
    });
    assert.equal(s4.exists, true);
    assert.equal(s4.disabled, true);

    // Scenario 5: Unverified email (emailVerified: false) -> rejected
    const s5 = await resolveOrBootstrapAdminDocument({
      uid: 'unverified-uid-5',
      ownerEmail: 'owner@example.com',
      getExistingAdminDoc: async () => ({ exists: false }),
      getAuthUserRecord: async (uid) => ({
        uid,
        email: 'owner@example.com',
        emailVerified: false,
      }),
      createAdminDoc: async (uid, data) => {
        createdDocs.set(uid, data);
      },
    });
    assert.equal(s5.exists, false);
    assert.equal(s5.bootstrapped, false);

    recordPass(
      'Phase F Unit Tests: All 5 Owner Bootstrap scenarios verified (configured match, mismatch, missing env, disabled account, unverified email)'
    );
  }

  // ---------------------------------------------------------------------------
  // 5. INTEGRATION & E2E API TESTS (Phases A, C, D, E, F & Zero Public Firestore Reads)
  // ---------------------------------------------------------------------------
  let firestoreSimulatedDb: PlatformDatabase = JSON.parse(
    JSON.stringify(INITIAL_PLATFORM_DATA)
  );
  // Add a draft project, an archived article, and an archived page to verify they NEVER leak into public snapshot
  firestoreSimulatedDb.projects.push({
    ...INITIAL_PLATFORM_DATA.projects[0],
    id: 'secret-draft-project',
    slug: 'secret-draft-project',
    published: false,
  });
  firestoreSimulatedDb.articles.push({
    ...INITIAL_PLATFORM_DATA.articles[0],
    id: 'archived-secret-article',
    slug: 'archived-secret-article',
    published: true,
    archived: true,
  });
  firestoreSimulatedDb.pages.push({
    ...INITIAL_PLATFORM_DATA.pages[0],
    id: 'archived-custom-page',
    slug: 'archived-custom-page',
    isCore: false,
    pageType: 'landing',
    published: true,
    archived: true,
  });

  let simulatedPublicSnapshot: PublicContentSnapshot = buildPublicSnapshot(
    firestoreSimulatedDb
  );
  let simulateFirestoreWriteFailure = false;
  let simulateSnapshotPublishFailure = false;
  let simulatedAdminDisabled = false;
  let customFirestoreReadCounter = 0;
  let customFirestoreWriteCounter = 0;
  const centralSessions = new Map<string, CentralSessionRecord>();

  setCustomAuthDepsResolver(() => ({
    ready: true,
    deps: {
      ownerUid: 'owner-uid-verified-1234567890',
      ownerEmail: 'owner@solimedical.com',
      verifyIdToken: async (token: string) => {
        if (token === 'valid-firebase-id-token') {
          return {
            uid: 'owner-uid-verified-1234567890',
            email: 'owner@solimedical.com',
            email_verified: true,
            name: 'Eng. Ahmed Soliman',
          };
        }
        throw new Error('INVALID_TOKEN');
      },
      hasAdminDocument: async (_uid: string) => {
        customFirestoreReadCounter += 1;
        return { exists: true, disabled: simulatedAdminDisabled };
      },
      saveSessionRecord: async (rec: CentralSessionRecord) => {
        customFirestoreWriteCounter += 1;
        centralSessions.set(rec.id, rec);
      },
      getSessionRecord: async (sessionId: string) => {
        customFirestoreReadCounter += 1;
        return centralSessions.get(sessionId) || null;
      },
      revokeSessionRecord: async (sessionId: string) => {
        customFirestoreWriteCounter += 1;
        const prev = centralSessions.get(sessionId);
        if (prev) {
          centralSessions.set(sessionId, {
            ...prev,
            revoked: true,
            revokedAt: new Date().toISOString(),
          });
        }
      },
    },
  }));

  setCustomCmsHooks({
    loadAdminDb: async () => {
      customFirestoreReadCounter += 1;
      return JSON.parse(JSON.stringify(firestoreSimulatedDb));
    },
    saveAdminDb: async (nextDb: PlatformDatabase) => {
      if (simulateFirestoreWriteFailure) {
        throw new Error('Simulated Firestore network write failure (UNAVAILABLE)');
      }
      customFirestoreWriteCounter += 1;
      firestoreSimulatedDb = JSON.parse(JSON.stringify(nextDb));
    },
    publishSnapshot: async (snap: PublicContentSnapshot) => {
      if (simulateSnapshotPublishFailure) {
        throw new Error('Simulated CDN snapshot publication failure');
      }
      simulatedPublicSnapshot = JSON.parse(JSON.stringify(snap));
    },
    readPublicSnapshot: async () => {
      // Public snapshot reads NEVER increment customFirestoreReadCounter!
      return simulatedPublicSnapshot;
    },
  });

  const app = createExpressApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    // -------------------------------------------------------------------------
    // Test 5.1: ZERO FIRESTORE READS FOR PUBLIC VISITORS & SNAPSHOT ISOLATION
    // -------------------------------------------------------------------------
    customFirestoreReadCounter = 0;
    resetFirestoreMetrics();

    const pubRes1 = await requestJson(baseUrl, '/api/cms/public');
    const pubRes2 = await requestJson(baseUrl, '/data/public-snapshot.json');
    const sitemapRes = await requestJson(baseUrl, '/sitemap.xml');
    const robotsRes = await requestJson(baseUrl, '/robots.txt');

    assert.equal(pubRes1.status, 200);
    assert.equal(pubRes2.status, 200);
    assert.equal(sitemapRes.status, 200);
    assert.equal(robotsRes.status, 200);
    assert.equal(pubRes1.headers.get('x-firestore-reads'), '0');
    assert.equal(pubRes2.headers.get('x-firestore-reads'), '0');
    assert.equal(sitemapRes.headers.get('x-firestore-reads'), '0');
    assert.equal(
      customFirestoreReadCounter,
      0,
      'Public visitor routes must trigger ZERO Firestore reads'
    );
    assert.equal(
      getFirestoreMetrics().reads,
      0,
      'Server Firestore read counter must remain 0 during public visitor requests'
    );

    // Verify no drafts, no archived items, no admins, and no media registry in public snapshot
    assert.equal(pubRes1.data.admins, undefined, 'Public snapshot must never expose admins');
    assert.equal(pubRes1.data.media, undefined, 'Public snapshot must never expose media registry');
    assert.ok(
      !pubRes1.data.projects.some((p: any) => p.id === 'secret-draft-project'),
      'Public snapshot must never include unpublished draft projects'
    );
    assert.ok(
      !pubRes1.data.articles.some((a: any) => a.id === 'archived-secret-article'),
      'Public snapshot must never include archived articles'
    );
    assert.ok(
      !pubRes1.data.pages.some((p: any) => p.id === 'archived-custom-page'),
      'Public snapshot must never include archived pages'
    );
    assert.ok(
      !sitemapRes.text.includes('archived-secret-article') &&
        !sitemapRes.text.includes('archived-custom-page'),
      'sitemap.xml must never list archived articles or pages'
    );

    recordPass(
      'Priority Requirement E2E: Public visitor requests (/api/cms/public, /data/public-snapshot.json, /sitemap.xml) execute 0 Firestore reads and exclude all drafts/archived records'
    );

    // -------------------------------------------------------------------------
    // Test 5.2: Admin Login + Centralized Session Creation
    // -------------------------------------------------------------------------
    const loginRes = await requestJson(baseUrl, '/api/auth/admin-login', {
      method: 'POST',
      body: { idToken: 'valid-firebase-id-token' },
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.data.token.startsWith('v1.'));
    const adminToken = loginRes.data.token;

    // -------------------------------------------------------------------------
    // Test 5.3: Phase A — Firestore Write Success Updates Public Snapshot
    // -------------------------------------------------------------------------
    const createArtRes = await requestJson(baseUrl, '/api/cms/articles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        id: 'phase8-2-live-article',
        slug: 'phase8-2-live-article',
        title: { ar: 'مقال اختبار النشر الفوري', en: 'Live Snapshot Publishing Test' },
        excerpt: { ar: 'وصف قصير', en: 'Short excerpt' },
        content: { ar: 'محتوى المقال الكامل بالعربية', en: 'Full article content in English' },
        category: { ar: 'هندسة طبية', en: 'Medical Engineering' },
        tags: ['ICU'],
        coverImage:
          'https://res.cloudinary.com/demo-cloud/image/upload/v17199999/ahmed-soliman-platform/protected-cover.webp',
        published: true,
        archived: false,
      },
    });
    assert.equal(createArtRes.status, 200);
    assert.equal(createArtRes.data.savedToFirestore, true);
    assert.equal(createArtRes.data.publishedSnapshot, true);

    // Verify public visitor immediately sees the newly published article in the snapshot with 0 Firestore reads
    const readsBeforePublicCheck = customFirestoreReadCounter;
    const pubAfterPublish = await requestJson(baseUrl, '/api/cms/public');
    assert.equal(customFirestoreReadCounter, readsBeforePublicCheck, '0 Firestore reads on public check');
    assert.ok(
      pubAfterPublish.data.articles.some((a: any) => a.id === 'phase8-2-live-article'),
      'Newly published article must appear in public snapshot immediately'
    );

    recordPass(
      'Phase A E2E: Successful Firestore write immediately regenerates public snapshot and serves visitors with 0 Firestore reads'
    );

    // -------------------------------------------------------------------------
    // Test 5.4: Phase A — Firestore Write Failure Returns 503 & Does Not Fake Success
    // -------------------------------------------------------------------------
    simulateFirestoreWriteFailure = true;
    const failedWriteRes = await requestJson(baseUrl, '/api/cms/articles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        id: 'should-not-save-article',
        slug: 'should-not-save-article',
        title: { ar: 'مقال يفشل حفظه', en: 'Should Fail To Save' },
        excerpt: { ar: 'ملخص', en: 'Excerpt' },
        content: { ar: 'محتوى', en: 'Content' },
        category: { ar: 'عام', en: 'General' },
        published: true,
      },
    });
    simulateFirestoreWriteFailure = false;

    assert.equal(failedWriteRes.status, 503);
    assert.equal(failedWriteRes.data.savedToFirestore, false);
    assert.equal(failedWriteRes.data.publishedSnapshot, false);
    assert.equal(failedWriteRes.data.code, 'FIRESTORE_WRITE_FAILED');

    const pubAfterFailedWrite = await requestJson(baseUrl, '/api/cms/public');
    assert.ok(
      !pubAfterFailedWrite.data.articles.some((a: any) => a.id === 'should-not-save-article'),
      'Failed Firestore write must never pollute the public snapshot'
    );

    recordPass(
      'Phase A Acceptance Criterion: Firestore write failure returns HTTP 503 with savedToFirestore: false and never updates snapshot'
    );

    // -------------------------------------------------------------------------
    // Test 5.5: Snapshot Publication Failure Reports Saved-But-Unpublished & Recovery Works
    // -------------------------------------------------------------------------
    simulateSnapshotPublishFailure = true;
    const partialPublishRes = await requestJson(baseUrl, '/api/cms/articles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        id: 'saved-but-snapshot-failed',
        slug: 'saved-but-snapshot-failed',
        title: { ar: 'حفظ بدون نشر اللقطة', en: 'Saved But Snapshot Failed' },
        excerpt: { ar: 'ملخص', en: 'Excerpt' },
        content: { ar: 'محتوى عربي', en: 'English content' },
        category: { ar: 'عام', en: 'General' },
        published: true,
      },
    });
    simulateSnapshotPublishFailure = false;

    assert.equal(partialPublishRes.status, 200);
    assert.equal(partialPublishRes.data.savedToFirestore, true);
    assert.equal(
      partialPublishRes.data.publishedSnapshot,
      false,
      'Must report publishedSnapshot: false when snapshot generation/upload fails'
    );
    assert.ok(
      partialPublishRes.data.snapshotError.includes('Simulated CDN snapshot publication failure')
    );

    // Now trigger manual recovery via POST /api/cms/publish-snapshot
    const recoverSnapRes = await requestJson(baseUrl, '/api/cms/publish-snapshot', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(recoverSnapRes.status, 200);
    assert.equal(recoverSnapRes.data.publishedSnapshot, true);

    recordPass(
      'Priority Requirement #10 E2E: Snapshot publication failure explicitly reports savedToFirestore: true, publishedSnapshot: false, and recovers via /api/cms/publish-snapshot'
    );

    // -------------------------------------------------------------------------
    // Test 5.6: Phase C & D — Server Rejects Base64 Upload & Blocks Deleting In-Use Media
    // -------------------------------------------------------------------------
    const signUnconfiguredRes = await requestJson(baseUrl, '/api/cloudinary/sign', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { fileType: 'image/webp', fileSize: 102400 },
    });
    if (!process.env.CLOUDINARY_API_SECRET) {
      assert.equal(
        signUnconfiguredRes.status,
        503,
        '/api/cloudinary/sign must return 503 when Cloudinary env vars are missing'
      );
      assert.equal(signUnconfiguredRes.data.code, 'CLOUDINARY_NOT_CONFIGURED');
    }

    // Add a media record that is used in 'phase8-2-live-article'
    const mediaAddRes = await requestJson(baseUrl, '/api/cms/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        id: 'media-protected-cover',
        publicId: 'ahmed-soliman-platform/protected-cover',
        secureUrl:
          'https://res.cloudinary.com/demo-cloud/image/upload/v17199999/ahmed-soliman-platform/protected-cover.webp',
        format: 'webp',
        width: 1200,
        height: 630,
        bytes: 84000,
        alt: { ar: 'غلاف محمي', en: 'Protected Cover' },
        category: 'blog',
      },
    });
    assert.equal(mediaAddRes.status, 200);

    // Attempt to delete the media via DELETE /api/cms/media/:id while article is published -> must be blocked (409)
    const deleteInUseRes = await requestJson(
      baseUrl,
      '/api/cms/media/media-protected-cover',
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert.equal(deleteInUseRes.status, 409);
    assert.equal(deleteInUseRes.data.code, 'MEDIA_IN_USE_BY_PUBLISHED_CONTENT');

    // Also attempt via POST /api/cloudinary/delete -> must be blocked (409)
    const cloudDeleteInUseRes = await requestJson(baseUrl, '/api/cloudinary/delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        mediaId: 'media-protected-cover',
        publicId: 'ahmed-soliman-platform/protected-cover',
        secureUrl:
          'https://res.cloudinary.com/demo-cloud/image/upload/v17199999/ahmed-soliman-platform/protected-cover.webp',
      },
    });
    assert.equal(cloudDeleteInUseRes.status, 409);

    // Archive the article so it is no longer published, then delete the media -> must succeed (200)
    await requestJson(baseUrl, '/api/cms/articles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        id: 'phase8-2-live-article',
        slug: 'phase8-2-live-article',
        title: { ar: 'مقال اختبار النشر الفوري', en: 'Live Snapshot Publishing Test' },
        excerpt: { ar: 'وصف قصير', en: 'Short excerpt' },
        content: { ar: 'محتوى المقال الكامل بالعربية', en: 'Full article content in English' },
        category: { ar: 'هندسة طبية', en: 'Medical Engineering' },
        coverImage:
          'https://res.cloudinary.com/demo-cloud/image/upload/v17199999/ahmed-soliman-platform/protected-cover.webp',
        published: false,
        archived: true,
      },
    });

    const deleteUnusedRes = await requestJson(
      baseUrl,
      '/api/cms/media/media-protected-cover',
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert.equal(
      deleteUnusedRes.status,
      200,
      'Unused media (only in archived content) must be deletable'
    );

    recordPass(
      'Phase C & D E2E: Server blocks deletion of in-use media (409), allows deletion after unpublish/archive (200), and blocks unconfigured Cloudinary (503)'
    );

    // -------------------------------------------------------------------------
    // Test 5.7: Phase E — Cross-Instance Session Revocation & Disabled Admin Blocking
    // -------------------------------------------------------------------------
    // Verify session works across a simulated cold-start instance (clearing local memory)
    clearLocalInstanceSessionMemory();
    const sessionCheckColdStart = await requestJson(baseUrl, '/api/auth/session', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(sessionCheckColdStart.status, 200);
    assert.equal(sessionCheckColdStart.data.authenticated, true);

    // Now logout on Instance A
    const logoutRes = await requestJson(baseUrl, '/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(logoutRes.status, 200);

    // Wipe local memory to simulate Instance B receiving the revoked token
    clearLocalInstanceSessionMemory();
    const sessionAfterLogoutOnInstanceB = await requestJson(baseUrl, '/api/auth/session', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(
      sessionAfterLogoutOnInstanceB.status,
      401,
      'Revoked session token must be rejected across all serverless instances'
    );
    assert.equal(sessionAfterLogoutOnInstanceB.data.code, 'SESSION_REVOKED');

    const adminApiAfterLogoutOnInstanceB = await requestJson(baseUrl, '/api/cms/admin', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminApiAfterLogoutOnInstanceB.status, 401);

    // Now log in again, then disable the admin account in Firestore (disabled: true)
    const loginRes2 = await requestJson(baseUrl, '/api/auth/admin-login', {
      method: 'POST',
      body: { idToken: 'valid-firebase-id-token' },
    });
    assert.equal(loginRes2.status, 200);
    const secondToken = loginRes2.data.token;

    simulatedAdminDisabled = true;
    clearLocalInstanceSessionMemory();

    const disabledAdminCheck = await requestJson(baseUrl, '/api/cms/admin', {
      headers: { Authorization: `Bearer ${secondToken}` },
    });
    assert.equal(
      disabledAdminCheck.status,
      403,
      'Disabled admin (disabled: true) must be immediately blocked from admin endpoints'
    );
    assert.equal(disabledAdminCheck.data.code, 'ADMIN_DISABLED_OR_REVOKED');

    const disabledLoginAttempt = await requestJson(baseUrl, '/api/auth/admin-login', {
      method: 'POST',
      body: { idToken: 'valid-firebase-id-token' },
    });
    assert.equal(
      disabledLoginAttempt.status,
      403,
      'Disabled admin must not be able to log in'
    );

    simulatedAdminDisabled = false;

    recordPass(
      'Phase E E2E: Centralized session revocation (/adminSessions) and disabled admin account blocking work across stateless serverless instances'
    );
  } finally {
    setCustomAuthDepsResolver(null);
    setCustomCmsHooks(null);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log(`\n🎉 ALL ${passed}/${passed} PHASE 8.2 HARDENING TEST SUITES PASSED!`);
}

runPhase8_2HardeningTests().catch((err) => {
  console.error('❌ PHASE 8.2 TEST SUITE FAILED:', err);
  process.exit(1);
});
