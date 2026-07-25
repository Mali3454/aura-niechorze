import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { FACTS } from '../src/content/facts.ts';

export function doc(path) {
  expect(existsSync(path), `brak pliku ${path} — czy build się wykonał?`).toBe(true);
  return parseHTML(readFileSync(path, 'utf8')).document;
}

const PAGES = [
  { path: 'dist/index.html', lang: 'pl-PL', url: 'https://aura-niechorze.pl/' },
  { path: 'dist/de/index.html', lang: 'de-DE', url: 'https://aura-niechorze.pl/de/' },
  { path: 'dist/en/index.html', lang: 'en-GB', url: 'https://aura-niechorze.pl/en/' },
];

describe('nazwa obiektu w gotowym HTML', () => {
  it('tytuł strony polskiej jest bajtowo identyczny z FACTS.name', () => {
    expect(doc('dist/index.html').querySelector('title').textContent).toBe(FACTS.name);
  });
});

describe.each(PAGES)('strona $lang', ({ path, lang, url }) => {
  it('ma poprawny atrybut lang', () => {
    expect(doc(path).documentElement.getAttribute('lang')).toBe(lang);
  });

  it('ma dokładnie jeden h1', () => {
    expect(doc(path).querySelectorAll('h1')).toHaveLength(1);
  });

  it('ma canonical wskazujący na siebie', () => {
    expect(doc(path).querySelector('link[rel="canonical"]').getAttribute('href')).toBe(url);
  });

  it('ma opis meta o sensownej długości', () => {
    const desc = doc(path).querySelector('meta[name="description"]').getAttribute('content');
    expect(desc.length).toBeGreaterThan(70);
    expect(desc.length).toBeLessThan(165);
  });

  it('linkuje hreflang do wszystkich trzech wersji i x-default', () => {
    const hrefs = [...doc(path).querySelectorAll('link[rel="alternate"]')]
      .map((l) => `${l.getAttribute('hreflang')} ${l.getAttribute('href')}`);
    expect(hrefs).toContain('pl-PL https://aura-niechorze.pl/');
    expect(hrefs).toContain('de-DE https://aura-niechorze.pl/de/');
    expect(hrefs).toContain('en-GB https://aura-niechorze.pl/en/');
    expect(hrefs).toContain('x-default https://aura-niechorze.pl/');
  });

  it('ma favicon', () => {
    expect(doc(path).querySelector('link[rel="icon"]').getAttribute('href')).toContain('favicon.svg');
  });

  it('nie odwołuje się do Google Fonts', () => {
    const html = readFileSync(path, 'utf8');
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
  });

  it('nie zawiera słowa „pensjonat”', () => {
    expect(readFileSync(path, 'utf8').toLowerCase()).not.toContain('pensjonat');
  });
});
