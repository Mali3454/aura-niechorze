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

  it('zawiera poprawny JSON-LD typu LodgingBusiness', () => {
    const el = doc(path).querySelector('script[type="application/ld+json"]');
    expect(el).not.toBeNull();
    const data = JSON.parse(el.textContent);
    expect(data['@type']).toBe('LodgingBusiness');
    expect(data.name).toBe('Aura Niechorze — apartamenty przy plaży');
    expect(data.telephone).toBe('+48576040656');
    expect(data.address.streetAddress).toBe('Leśna 9');
    expect(data.address.postalCode).toBe('72-350');
    expect(data.address.addressLocality).toBe('Niechorze');
    expect(data.address.addressCountry).toBe('PL');
    expect(data.checkinTime).toBe('16:00');
    expect(data.checkoutTime).toBe('10:00');
    expect(Array.isArray(data.amenityFeature)).toBe(true);
    expect(data.amenityFeature.length).toBeGreaterThan(4);
  });

  it('nie publikuje danych niepotwierdzonych', () => {
    // Celowo sprawdzamy tekst widoczny dla użytkownika i JSON-LD, a nie całe
    // źródło — słowo "null" legalnie występuje w kodzie skryptów komponentów.
    const d = doc(path);
    const visible = d.body.textContent;
    expect(visible).not.toContain('null');
    expect(visible).not.toContain('undefined');
    expect(visible).not.toMatch(/\bNaN\b/);

    const ld = JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent);
    for (const [key, value] of Object.entries(ld)) {
      expect(value, `klucz ${key} w JSON-LD ma wartość pustą`).not.toBeNull();
    }
  });
});
