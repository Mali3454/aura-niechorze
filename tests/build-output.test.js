import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { FACTS } from '../src/content/facts.ts';

export function doc(path) {
  expect(existsSync(path), `brak pliku ${path} — czy build się wykonał?`).toBe(true);
  return parseHTML(readFileSync(path, 'utf8')).document;
}

// Zwraca listę ścieżek (np. "address.addressRegion" albo "amenityFeature[2].name"),
// pod którymi w dowolnie zagnieżdżonej strukturze występuje null.
function findNulls(value, path = '$') {
  if (value === null) return [path];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findNulls(item, `${path}[${i}]`));
  }
  if (typeof value === 'object' && value !== undefined) {
    return Object.entries(value).flatMap(([key, v]) => findNulls(v, `${path}.${key}`));
  }
  return [];
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

  it('ma pięć sekcji-slajdów o ustalonych identyfikatorach', () => {
    const ids = [...doc(path).querySelectorAll('main section')].map((s) => s.id);
    expect(ids).toEqual(['start', 'obiekt', 'apartament', 'okolica', 'kontakt']);
  });

  it('każdy slajd ma nagłówek powiązany przez aria-labelledby', () => {
    const d = doc(path);
    for (const s of d.querySelectorAll('main section')) {
      const ref = s.getAttribute('aria-labelledby');
      expect(ref, `sekcja #${s.id} bez aria-labelledby`).toBe(`${s.id}-title`);
      const heading = d.getElementById(ref);
      expect(heading, `brak elementu #${ref}`).not.toBeNull();
      expect(heading.tagName, `#${ref} nie jest nagłówkiem (h1–h6), tylko ${heading.tagName}`).toMatch(/^H[1-6]$/);
    }
  });

  it('kolejność nagłówków to jedno h1 i cztery h2', () => {
    const levels = [...doc(path).querySelectorAll('main h1, main h2')].map((h) => h.tagName);
    expect(levels).toEqual(['H1', 'H2', 'H2', 'H2', 'H2']);
  });

  it('ma nawigację z kotwicami do wszystkich slajdów', () => {
    const d = doc(path);
    const hrefs = [...d.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));
    for (const id of ['start', 'obiekt', 'apartament', 'okolica', 'kontakt']) {
      expect(hrefs).toContain(`#${id}`);
      const target = d.getElementById(id);
      expect(target, `brak elementu #${id}, na który wskazuje kotwica`).not.toBeNull();
      expect(target.tagName, `#${id} nie jest sekcją slajdu, tylko ${target.tagName}`).toBe('SECTION');
    }
  });

  it('ma klikalny telefon w stałej warstwie', () => {
    const tel = doc(path).querySelector('a[href^="tel:"]');
    expect(tel).not.toBeNull();
    expect(tel.getAttribute('href')).toBe('tel:+48576040656');
  });

  it('przełącznik języka prowadzi do pozostałych wersji', () => {
    const hrefs = [...doc(path).querySelectorAll('a[hreflang]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/de/', '/en/']));
  });

  it('slajd otwierający ma zdjęcie z srcset, wymiarami i priorytetem', () => {
    const img = doc(path).querySelector('#start img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('srcset')).toBeTruthy();
    expect(img.getAttribute('width')).toBeTruthy();
    expect(img.getAttribute('height')).toBeTruthy();
    expect(img.getAttribute('alt').length).toBeGreaterThan(20);
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });

  it('slajd otwierający ma źródło AVIF', () => {
    const source = doc(path).querySelector('#start source[type="image/avif"]');
    expect(source).not.toBeNull();
    expect(source.getAttribute('srcset')).toBeTruthy();
  });

  it('slajd otwierający ma przycisk telefonu', () => {
    const cta = doc(path).querySelector('#start a[href^="tel:"]');
    expect(cta).not.toBeNull();
  });

  it('slajd o obiekcie ma trzy liczby i zdjęcie z alt', () => {
    const d = doc(path);
    expect(d.querySelectorAll('#obiekt .stat')).toHaveLength(3);
    const img = d.querySelector('#obiekt img');
    expect(img.getAttribute('alt').length).toBeGreaterThan(20);
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('slajd okolicy ma listę odległości i trzy atrakcje', () => {
    const d = doc(path);
    expect(d.querySelectorAll('#okolica .distance').length).toBeGreaterThanOrEqual(6);
    expect(d.querySelectorAll('#okolica .attraction')).toHaveLength(3);
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
    const nullPaths = findNulls(ld);
    expect(nullPaths, `null znaleziony w JSON-LD pod: ${nullPaths.join(', ')}`).toEqual([]);
  });
});
