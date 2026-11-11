import React, { Suspense, lazy } from 'react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { CustomCursorAndRipple } from './components/common/CustomCursorAndRipple';
import { HomePage } from './pages/HomePage';

// Lazy-load secondary & admin routes for optimal mobile First Contentful Paint & Core Web Vitals (PROMPT 5.3)
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectDetailPage = lazy(() =>
  import('./pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage }))
);
const ClinicsPage = lazy(() =>
  import('./pages/ClinicsPage').then((m) => ({ default: m.ClinicsPage }))
);
const ClinicDetailPage = lazy(() =>
  import('./pages/ClinicDetailPage').then((m) => ({ default: m.ClinicDetailPage }))
);
const BlogPage = lazy(() =>
  import('./pages/BlogPage').then((m) => ({ default: m.BlogPage }))
);
const BlogDetailPage = lazy(() =>
  import('./pages/BlogDetailPage').then((m) => ({ default: m.BlogDetailPage }))
);
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070E1A]">
    <div className="w-8 h-8 rounded-full border-2 border-[#00C2CB]/30 border-t-[#00C2CB] animate-spin" />
  </div>
);

const RouteDispatcher: React.FC = () => {
  const { pathname } = usePlatform();

  // Normalize trailing slash
  const cleanPath =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // 1. Admin Routes (/admin, /admin/*)
  if (cleanPath === '/admin') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminDashboard subRoute="overview" />
      </Suspense>
    );
  }
  if (cleanPath === '/admin/projects') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminDashboard subRoute="projects" />
      </Suspense>
    );
  }
  if (cleanPath === '/admin/clinics') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminDashboard subRoute="clinics" />
      </Suspense>
    );
  }
  if (cleanPath === '/admin/pages') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminDashboard subRoute="pages" />
      </Suspense>
    );
  }
  if (cleanPath === '/admin/blog') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminDashboard subRoute="blog" />
      </Suspense>
    );
  }
  if (cleanPath === '/admin/media') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminDashboard subRoute="media" />
      </Suspense>
    );
  }
  if (cleanPath === '/admin/settings') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminDashboard subRoute="settings" />
      </Suspense>
    );
  }
  if (cleanPath.startsWith('/admin/')) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminDashboard subRoute="overview" />
      </Suspense>
    );
  }

  // Strip /ar or /en locale prefix for matching public routes
  let routeWithoutLocale = cleanPath;
  if (cleanPath === '/ar' || cleanPath === '/en') {
    routeWithoutLocale = '/';
  } else if (cleanPath.startsWith('/ar/') || cleanPath.startsWith('/en/')) {
    routeWithoutLocale = cleanPath.slice(3);
  }

  // 2. Home Route (/, /ar, /en) - Eagerly loaded for fastest LCP
  if (routeWithoutLocale === '/' || routeWithoutLocale === '') {
    return <HomePage />;
  }

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      {routeWithoutLocale === '/about' ? (
        <AboutPage />
      ) : routeWithoutLocale === '/projects' ? (
        <ProjectsPage />
      ) : routeWithoutLocale.startsWith('/projects/') ? (
        <ProjectDetailPage slug={decodeURIComponent(routeWithoutLocale.slice('/projects/'.length))} />
      ) : routeWithoutLocale === '/clinics' ? (
        <ClinicsPage />
      ) : routeWithoutLocale.startsWith('/clinics/') ? (
        <ClinicDetailPage slug={decodeURIComponent(routeWithoutLocale.slice('/clinics/'.length))} />
      ) : routeWithoutLocale === '/blog' ? (
        <BlogPage />
      ) : routeWithoutLocale.startsWith('/blog/') ? (
        <BlogDetailPage slug={decodeURIComponent(routeWithoutLocale.slice('/blog/'.length))} />
      ) : (
        <HomePage />
      )}
    </Suspense>
  );
};

export default function App() {
  return (
    <PlatformProvider>
      <CustomCursorAndRipple />
      <RouteDispatcher />
    </PlatformProvider>
  );
}
