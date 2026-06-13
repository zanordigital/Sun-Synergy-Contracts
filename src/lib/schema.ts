const BASE_URL = 'https://sunsynergycontracts.com.my';
const PHONE = '+60128773999';
const EMAIL = 'info@sunsynergycontracts.com.my';

const ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '17C, Jalan PJS 1/33, Taman Petaling Utama',
  addressLocality: 'Petaling Jaya',
  postalCode: '46150',
  addressRegion: 'Selangor',
  addressCountry: 'MY',
};

const GEO = {
  '@type': 'GeoCoordinates',
  latitude: 3.0807,
  longitude: 101.6496,
};

const AREA_SERVED = [
  'Petaling Jaya',
  'Subang Jaya',
  'USJ',
  'Puchong',
  'Kuala Lumpur',
  'Shah Alam',
  'Klang',
  'Cyberjaya',
  'Kajang',
  'Klang Valley',
];

const OPENING_HOURS = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
];

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SchemaGraphOptions {
  page: 'home' | 'faqs' | 'contact' | 'service' | 'area' | 'project' | 'blog' | 'about' | 'other';
  canonicalUrl: string;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FaqItem[];
  serviceName?: string;
  serviceDescription?: string;
  areaName?: string;
  projectName?: string;
  articleTitle?: string;
  articlePublishDate?: string;
  articleAuthor?: string;
  articleImage?: string;
}

export function getSchemaGraph(opts: SchemaGraphOptions): object {
  const graph: object[] = [];

  // Core business entity (GeneralContractor)
  const business = {
    '@type': ['GeneralContractor', 'LocalBusiness'],
    '@id': `${BASE_URL}/#business`,
    name: 'Sun Synergy Contracts',
    url: BASE_URL,
    logo: `${BASE_URL}/img/logo-full.png`,
    image: `${BASE_URL}/img/logo-full.png`,
    description:
      'CIDB G4 certified renovation contractor and interior design firm serving Klang Valley since 2016. Specialising in home renovation, interior design, commercial fit-out, bespoke carpentry, premium flooring, wet works, aluminium and glass works, and authority submission.',
    telephone: PHONE,
    email: EMAIL,
    address: ADDRESS,
    geo: GEO,
    foundingDate: '2016-12-29',
    areaServed: AREA_SERVED.map((name) => ({ '@type': 'City', name })),
    openingHoursSpecification: OPENING_HOURS,
    priceRange: '$$',
    paymentAccepted: 'Cash, Bank Transfer, Cheque',
    currenciesAccepted: 'MYR',
    sameAs: [
      'https://www.facebook.com/sunsynergycontracts',
      'https://www.instagram.com/sunsynergycontracts',
    ],
    memberOf: [
      { '@type': 'Organization', name: 'Malaysian Institute of Interior Designers', alternateName: 'MIID', url: 'https://www.miid.org.my' },
      { '@type': 'Organization', name: 'Master Builders Association Malaysia', alternateName: 'MBA Malaysia', url: 'https://www.mbam.org.my' },
      { '@type': 'Organization', name: 'Malaysian Interior Industry Partners', alternateName: 'MIIP', url: 'https://miip.com.my' },
    ],
    hasMap: 'https://maps.google.com/?cid=17296778017041670019',
    founder: { '@id': `${BASE_URL}/#person-catherine` },
  };

  graph.push(business);

  // Organization node
  const organisation = {
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'Sun Synergy Contracts',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/img/logo-full.png`,
      width: 400,
      height: 100,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: PHONE,
      contactType: 'customer service',
      availableLanguage: ['English', 'Malay', 'Chinese'],
    },
  };
  graph.push(organisation);

  // Person — Design Director
  if (opts.page === 'home' || opts.page === 'contact' || opts.page === 'about') {
    const person = {
      '@type': 'Person',
      '@id': `${BASE_URL}/#person-catherine`,
      name: 'Catherine Ng',
      jobTitle: 'Design Director',
      worksFor: { '@id': `${BASE_URL}/#organization` },
      url: `${BASE_URL}/contact`,
    };
    graph.push(person);
  }

  // BreadcrumbList
  if (opts.breadcrumbs && opts.breadcrumbs.length > 0) {
    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${BASE_URL}/`,
        },
        ...opts.breadcrumbs.map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: crumb.name,
          // Match the trailing-slash canonical so breadcrumb URLs do not point
          // at the non-slash form that 301s elsewhere.
          item: `${BASE_URL}${crumb.url.endsWith('/') ? crumb.url : `${crumb.url}/`}`,
        })),
      ],
    };
    graph.push(breadcrumb);
  }

  // FAQPage schema
  if (opts.faqs && opts.faqs.length > 0) {
    const faqPage = {
      '@type': 'FAQPage',
      '@id': `${opts.canonicalUrl}#faqpage`,
      mainEntity: opts.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
    graph.push(faqPage);
  }

  // Service schema
  if (opts.page === 'service' && opts.serviceName) {
    const service = {
      '@type': 'Service',
      name: opts.serviceName,
      description: opts.serviceDescription ?? '',
      provider: { '@id': `${BASE_URL}/#business` },
      areaServed: AREA_SERVED.map((name) => ({ '@type': 'City', name })),
      url: opts.canonicalUrl,
    };
    graph.push(service);
  }

  // Article schema (blog posts)
  if (opts.page === 'blog' && opts.articleTitle) {
    const article = {
      '@type': 'Article',
      '@id': `${opts.canonicalUrl}#article`,
      headline: opts.articleTitle,
      datePublished: opts.articlePublishDate ?? '',
      dateModified: opts.articlePublishDate ?? '',
      author: {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: opts.articleAuthor ?? 'Sun Synergy Contracts',
      },
      publisher: { '@id': `${BASE_URL}/#organization` },
      mainEntityOfPage: opts.canonicalUrl,
      ...(opts.articleImage ? { image: `${BASE_URL}${opts.articleImage}` } : {}),
    };
    graph.push(article);
  }

  // Place / Area schema
  if (opts.page === 'area' && opts.areaName) {
    const place = {
      '@type': 'Place',
      name: opts.areaName,
      containedInPlace: { '@type': 'State', name: 'Selangor' },
    };
    graph.push(place);
  }

  // WebPage node
  const webPage = {
    '@type': 'WebPage',
    '@id': opts.canonicalUrl,
    url: opts.canonicalUrl,
    isPartOf: { '@id': `${BASE_URL}/#website` },
    about: { '@id': `${BASE_URL}/#business` },
  };
  graph.push(webPage);

  // WebSite node — emitted on every page so the WebPage `isPartOf` reference
  // (`#website`) always resolves within the page's own graph.
  const website = {
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url: BASE_URL,
    name: 'Sun Synergy Contracts',
    publisher: { '@id': `${BASE_URL}/#organization` },
  };
  graph.push(website);

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
