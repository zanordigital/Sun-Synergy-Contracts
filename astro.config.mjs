import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import LASTMOD_FALLBACK from './src/data/lastmod.mjs';

const isDev = process.env.NODE_ENV !== 'production';

// Counters so the build log shows where each URL's lastmod came from.
const lastmodSource = { map: 0, git: 0, none: 0 };

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

// The committed map is authoritative and is consulted FIRST.
//
// Do not be tempted to prefer live git here. Cloudflare Pages clones at depth
// 1, so the checkout contains a single commit and `git log -1 -- <file>`
// happily returns that one commit's date for EVERY file. Git does not fail, it
// returns a uniformly wrong answer, which is why production shipped 52 URLs all
// stamped with the HEAD commit time while local builds looked correct.
//
// Git is kept only as a gap-filler for files absent from the map, which happens
// locally for content that has been added but not yet run through
// `npm run lastmod`.
function fileLastModified(file) {
  const fromMap = LASTMOD_FALLBACK[file];
  if (fromMap) {
    lastmodSource.map += 1;
    return fromMap;
  }
  const fromGit = gitLastModified(file);
  if (fromGit) {
    lastmodSource.git += 1;
    return fromGit;
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
        const { map, git, none } = lastmodSource;
        logger.info(`lastmod from committed map: ${map}, from live git: ${git}, unresolved: ${none}`);
        if (map === 0 && git === 0) {
          logger.warn('no lastmod resolved; every URL will inherit the build timestamp');
        }
      },
    },
  };
}

// Fails the build if an editorial [VERIFY: ...] note reaches the built output.
// Three of these shipped live on two cost guides via the content pipeline, so
// the check runs on the rendered files, whatever source they came from. A
// failed build on Cloudflare keeps the previous deploy live.
function editorialNoteGuard() {
  return {
    name: 'editorial-note-guard',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const hits = [];
        for (const file of readdirSync(root, { recursive: true })) {
          if (!/\.(html|txt|xml)$/.test(file)) continue;
          const text = readFileSync(join(root, file), 'utf8');
          for (const m of text.matchAll(/\[VERIFY\b[^\]]*\]?/gi)) hits.push(`${file}: ${m[0].slice(0, 80)}`);
        }
        if (hits.length > 0) {
          throw new Error(`editorial notes found in built output:\n  ${hits.join('\n  ')}`);
        }
        logger.info('no editorial notes in built output');
      },
    },
  };
}

async function getIntegrations() {
  const base = [sitemap({ serialize: sitemapSerialize }), react(), lastmodReporter(), editorialNoteGuard()];
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
