import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { execFileSync } from 'node:child_process';
import LASTMOD_FALLBACK from './src/data/lastmod.mjs';

const isDev = process.env.NODE_ENV !== 'production';

// Counters so the build log shows where each URL's lastmod came from. The
// previous silent fallback made it impossible to tell from a Cloudflare build
// log whether the dates were real or the build timestamp.
const lastmodSource = { git: 0, fallback: 0, none: 0 };

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
    const out = execFileSync('git', ['log', '-1', '--format=%aI', '--', file], { cwd: new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return out || null;
  } catch {
    return null;
  }
}

// Live git first (authoritative, and correct for uncommitted local work), then
// the committed map so production builds still get real per-URL dates.
function fileLastModified(file) {
  const fromGit = gitLastModified(file);
  if (fromGit) {
    lastmodSource.git += 1;
    return fromGit;
  }
  const fromMap = LASTMOD_FALLBACK[file];
  if (fromMap) {
    lastmodSource.fallback += 1;
    return fromMap;
  }
  lastmodSource.none += 1;
  return null;
}

function sitemapSerialize(item) {
  const pathname = new URL(item.url).pathname;
  const files = routeSourceFiles(pathname);
  if (files) {
    const dates = files.map(fileLastModified).filter(Boolean);
    if (dates.length) {
      item.lastmod = dates.sort().reverse()[0];
      return item;
    }
  }
  // Neither git nor the committed map knows this file (new/uncommitted, or an
  // unmapped route), so omit lastmod rather than guess. A wrong date is worse
  // than no date.
  return item;
}

// Reports where the sitemap's lastmod dates came from, once the build is done.
// Without this the fallback fails silently: production once shipped 52 URLs all
// carrying the build timestamp while local builds looked correct, and the build
// log gave no way to tell the two apart.
function lastmodReporter() {
  return {
    name: 'lastmod-reporter',
    hooks: {
      'astro:build:done': ({ logger }) => {
        const { git, fallback, none } = lastmodSource;
        logger.info(`lastmod from git: ${git}, from committed map: ${fallback}, unresolved: ${none}`);
        if (git === 0 && fallback === 0) {
          logger.warn('no lastmod resolved; every URL will inherit the build timestamp');
        }
      },
    },
  };
}

async function getIntegrations() {
  const base = [sitemap({ serialize: sitemapSerialize }), react(), lastmodReporter()];
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
