import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { execFileSync } from 'node:child_process';

const isDev = process.env.NODE_ENV !== 'production';

// Maps a sitemap URL's pathname to the source file that actually controls its
// content, so lastmod reflects real edit history instead of being absent
// (the previous state) or a single build-time stamp for every URL.
const ROUTE_SOURCE_FILES = {
  '/': ['src/pages/index.astro'],
  '/about/': ['src/pages/about.astro'],
  '/contact/': ['src/pages/contact.astro'],
  '/faqs/': ['src/pages/faqs.astro', 'src/content/faqs.yaml'],
  '/legal/terms/': ['src/pages/legal/terms.astro'],
  '/legal/privacy/': ['src/pages/legal/privacy.astro'],
  '/projects/': ['src/pages/projects.astro'],
  '/services/': ['src/pages/services/index.astro'],
  '/areas/': ['src/pages/areas/index.astro'],
  '/blog/': ['src/pages/blog/index.astro'],
};

function routeSourceFiles(pathname) {
  if (ROUTE_SOURCE_FILES[pathname]) return ROUTE_SOURCE_FILES[pathname];
  const m = pathname.match(/^\/(projects|services|areas|blog)\/([^/]+)\/$/);
  if (!m) return null;
  const [, section, slug] = m;
  const dir = { areas: 'locations' }[section] || section;
  const ext = section === 'blog' ? 'md' : 'yaml';
  const pageFile = section === 'areas' ? 'src/pages/areas/[slug].astro' : `src/pages/${section}/[slug].astro`;
  return [`src/content/${dir}/${slug}.${ext}`, pageFile];
}

function gitLastModified(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%aI', '--', file], { cwd: new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), encoding: 'utf8' }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function sitemapSerialize(item) {
  const pathname = new URL(item.url).pathname;
  const files = routeSourceFiles(pathname);
  if (files) {
    const dates = files.map(gitLastModified).filter(Boolean);
    if (dates.length) {
      item.lastmod = dates.sort().reverse()[0];
      return item;
    }
  }
  // No git history match (new/uncommitted file, or an unmapped route) — omit
  // lastmod rather than guess, since a wrong date is worse than no date.
  return item;
}

async function getIntegrations() {
  const base = [sitemap({ serialize: sitemapSerialize }), react()];
  if (isDev) {
    try {
      const { default: keystatic } = await import('@keystatic/astro');
      base.push(keystatic());
    } catch {
      // keystatic not installed, skip
    }
  }
  return base;
}

export default defineConfig({
  site: 'https://sunsynergycontracts.com.my',
  output: 'static',
  // Enforce a single canonical URL form sitewide. Every page is served with a
  // trailing slash; the non-slash form 301s to it (see public/_redirects). This
  // stops Google from splitting authority across /page and /page/.
  trailingSlash: 'always',
  integrations: await getIntegrations(),
  build: {
    // Directory output (/about/index.html) is what produces the trailing-slash
    // URLs and is what Cloudflare Pages redirects bare paths to.
    format: 'directory',
    // Inline all CSS into each page so the stylesheet is no longer a
    // render-blocking request on the critical path (helps mobile FCP/LCP).
    inlineStylesheets: 'always',
  },
});
