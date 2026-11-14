import React, { useEffect } from 'react';
import { Locale, SEOConfig } from '../../types/cms';

interface SEOHeadProps {
  locale: Locale;
  seo?: SEOConfig;
  fallbackTitle: string;
  fallbackDescription: string;
  pathname: string;
  structuredDataPayload?: Record<string, any>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  locale,
  seo,
  fallbackTitle,
  fallbackDescription,
  pathname,
  structuredDataPayload,
}) => {
  const title = (seo?.title?.[locale] || fallbackTitle).trim();
  const description = (seo?.description?.[locale] || fallbackDescription).trim();
  const ogImage = seo?.ogImage || '/assets/images/soli-personal-icon.jpg';
  const noindex = Boolean(seo?.noindex || pathname.startsWith('/admin'));

  useEffect(() => {
    document.title = title;

    const setMeta = (
      selector: string,
      attrName: 'name' | 'property',
      attrVal: string,
      content: string
    ) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLink = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector(selector) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        document.head.appendChild(el);
      }
      for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, v);
      }
    };

    const origin = window.location.origin;

    // Dynamic Browser Tab Icon & Mobile Web App Icon:
    // - Personal pages ONLY (Home & About): Personal Portrait Icon (/assets/images/soli-personal-icon.jpg)
    // - Blog/Articles, Projects, Clinics & Soli Medical: Soli Medical Logo (/assets/solimedical/soli-medical-icon.svg)
    const strippedRoute = pathname.replace(/^\/(ar|en)(?=\/|$)/, '') || '/';
    const isPersonalPage =
      strippedRoute === '/' ||
      strippedRoute === '/about' ||
      strippedRoute.startsWith('/about/');
    const activeIconHref = isPersonalPage
      ? '/assets/images/soli-personal-icon.jpg'
      : '/assets/solimedical/soli-medical-icon.svg';
    const activeIconType = isPersonalPage ? 'image/jpeg' : 'image/svg+xml';

    setLink('link[rel="icon"]', {
      rel: 'icon',
      type: activeIconType,
      href: activeIconHref,
    });
    setLink('link[rel="apple-touch-icon"]', {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: isPersonalPage
        ? '/assets/images/soli-personal-icon.jpg'
        : '/assets/solimedical/soli-medical-icon.svg',
    });

    // Compute canonical path cleanly without duplicate aliases
    let canonicalPath = pathname;
    if (seo?.canonicalSlug && seo.canonicalSlug.trim()) {
      const rawCanon = seo.canonicalSlug.trim();
      if (rawCanon.startsWith('http://') || rawCanon.startsWith('https://')) {
        canonicalPath = rawCanon;
      } else {
        const strippedCanon =
          rawCanon === '/' || rawCanon === '/ar' || rawCanon === '/en'
            ? ''
            : rawCanon.startsWith('/ar/') || rawCanon.startsWith('/en/')
            ? rawCanon.slice(3)
            : rawCanon.startsWith('/')
            ? rawCanon
            : `/${rawCanon}`;
        canonicalPath = `/${locale}${strippedCanon}`;
      }
    }

    const canonicalUrl = canonicalPath.startsWith('http')
      ? canonicalPath
      : `${origin}${canonicalPath}`;
    const fullOgImage = ogImage.startsWith('http') ? ogImage : `${origin}${ogImage}`;

    // Compute bilingual alternate paths (/ar/... and /en/...)
    const pathForAlternates = canonicalPath.startsWith('http')
      ? pathname
      : canonicalPath;
    const strippedPath =
      pathForAlternates === '/ar' || pathForAlternates === '/en'
        ? ''
        : pathForAlternates.startsWith('/ar/') || pathForAlternates.startsWith('/en/')
        ? pathForAlternates.slice(3)
        : pathForAlternates;
    const arUrl = `${origin}/ar${strippedPath}`;
    const enUrl = `${origin}/en${strippedPath}`;

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
    );
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMeta('meta[property="og:image"]', 'property', 'og:image', fullOgImage);
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Ahmed Soliman');
    setMeta(
      'meta[property="og:locale"]',
      'property',
      'og:locale',
      locale === 'ar' ? 'ar_EG' : 'en_US'
    );
    setMeta(
      'meta[property="og:locale:alternate"]',
      'property',
      'og:locale:alternate',
      locale === 'ar' ? 'en_US' : 'ar_EG'
    );
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', fullOgImage);

    // Canonical & Bilingual hreflang links
    setLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
    setLink('link[rel="alternate"][hreflang="ar"]', {
      rel: 'alternate',
      hreflang: 'ar',
      href: arUrl,
    });
    setLink('link[rel="alternate"][hreflang="en"]', {
      rel: 'alternate',
      hreflang: 'en',
      href: enUrl,
    });
    setLink('link[rel="alternate"][hreflang="x-default"]', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: arUrl,
    });

    // JSON-LD Structured Data
    const defaultSchema = structuredDataPayload || {
      '@context': 'https://schema.org',
      '@type': seo?.structuredDataType || 'Person',
      name: locale === 'ar' ? 'أحمد سليمان' : 'Ahmed Soliman',
      jobTitle:
        locale === 'ar'
          ? 'مطوّر أنظمة العيادات الطبية والبرمجيات الصحية'
          : 'Healthcare Systems Architect & Full-Stack Developer',
      url: canonicalUrl,
      image: fullOgImage,
      description,
      sameAs: [
        'https://www.facebook.com/SoliMedical/',
        'https://t.me/SoliMedicalproBot',
        'https://wa.me/Ahmed0soliman',
      ],
    };

    let ldScript = document.head.querySelector(
      'script[data-schema="ahmed-soliman-jsonld"]'
    ) as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.type = 'application/ld+json';
      ldScript.setAttribute('data-schema', 'ahmed-soliman-jsonld');
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify(defaultSchema);
  }, [
    title,
    description,
    ogImage,
    noindex,
    pathname,
    locale,
    seo?.canonicalSlug,
    seo?.structuredDataType,
    structuredDataPayload,
  ]);

  return null;
};
