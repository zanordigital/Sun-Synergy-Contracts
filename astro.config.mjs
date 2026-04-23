import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import react from '@astrojs/react';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  site: 'https://sunsynergycontracts.com.my',
  output: 'static',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
    react(),
    ...(isDev ? [keystatic()] : []),
  ],
});
