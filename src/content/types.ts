export type Lang = 'pl' | 'de' | 'en';

export interface Stat { value: string; label: string; }
export interface Distance { name: string; value: string; }
export interface Attraction { name: string; text: string; }

export interface SiteContent {
  lang: Lang;
  htmlLang: string;
  meta: { title: string; description: string; ogAlt: string };
  chrome: {
    skip: string;
    callLabel: string;
    langLabel: string;
    langNames: Record<Lang, string>;
    navLabel: string;
    slideNames: string[];
  };
  hero: { h1: string; sub: string; cta: string; scrollHint: string };
  about: { h2: string; lead: string; body: string; stats: Stat[] };
  apartment: {
    h2: string; lead: string;
    amenities: string[];
    rules: string[];
    gallery: { open: string; close: string; prev: string; next: string; label: string };
  };
  area: { h2: string; lead: string; distancesLabel: string; distances: Distance[]; attractions: Attraction[] };
  contact: {
    h2: string; lead: string;
    phoneLabel: string; addressLabel: string;
    mapCta: string; mapNotice: string; routeCta: string; fbLabel: string;
  };
  footer: { rights: string };
  alts: Record<string, string>;
}
