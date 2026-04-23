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
  integrations: await getIntegrations(),
});
