import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

const isDev = process.env.NODE_ENV !== 'production';

async function getIntegrations() {
  const base = [sitemap(), react()];
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
