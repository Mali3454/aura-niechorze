import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aura-niechorze.pl',
  trailingSlash: 'always',
  i18n: {
    locales: ['pl', 'de', 'en'],
    defaultLocale: 'pl',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'pl',
        locales: { pl: 'pl-PL', de: 'de-DE', en: 'en-GB' },
      },
    }),
  ],
  build: { inlineStylesheets: 'always' },
});
