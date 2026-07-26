import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
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

  it('slajd o obiekcie ma trzy liczby jako prawdziwą listę definicji i zdjęcie z alt', () => {
    const d = doc(path);
    const stats = [...d.querySelectorAll('#obiekt .stat')];
    expect(stats).toHaveLength(3);
    for (const stat of stats) {
      const dt = stat.querySelector('dt');
      const dd = stat.querySelector('dd');
      expect(dt.tagName, 'etykieta statystyki musi być <dt>').toBe('DT');
      expect(dd.tagName, 'wartość statystyki musi być <dd>').toBe('DD');
      // dt musi poprzedzać dd w DOM (semantyka listy definicji), nawet jeśli
      // wizualnie liczba jest nad podpisem dzięki column-reverse w CSS.
      const order = [...stat.children].map((el) => el.tagName);
      expect(order.indexOf('DT'), 'dt musi poprzedzać dd w kodzie źródłowym').toBeLessThan(order.indexOf('DD'));
    }
    const img = d.querySelector('#obiekt img');
    expect(img.getAttribute('alt').length).toBeGreaterThan(20);
    expect(img.getAttribute('loading')).toBe('lazy');
    // zdjęcie nie jest LCP (to zdjęcie startowe) — na szerokich ekranach zajmuje
    // ok. połowę szerokości, więc nie może rywalizować o pasmo z heroem.
    expect(img.getAttribute('sizes')).toBe('(max-width: 60rem) 100vw, 44vw');
  });

  it('galeria ma miniatury z alt i przyciski otwierające', () => {
    const d = doc(path);
    const thumbs = d.querySelectorAll('#apartament .gallery__item');
    expect(thumbs.length).toBeGreaterThanOrEqual(6);
    for (const t of thumbs) {
      expect(t.tagName).toBe('BUTTON');
      expect(t.querySelector('img').getAttribute('alt').length).toBeGreaterThan(15);
    }
  });

  it('galeria ma dialog z przyciskami nawigacji opisanymi tekstowo', () => {
    const dlg = doc(path).querySelector('#apartament dialog');
    expect(dlg).not.toBeNull();
    for (const sel of ['[data-gallery-prev]', '[data-gallery-next]', '[data-gallery-close]']) {
      const btn = dlg.querySelector(sel);
      expect(btn, `brak ${sel}`).not.toBeNull();
      expect((btn.getAttribute('aria-label') || btn.textContent).trim().length).toBeGreaterThan(3);
    }
  });

  it('slajd apartamentu wypisuje wyposażenie i zasady', () => {
    const d = doc(path);
    expect(d.querySelectorAll('#apartament .amenity').length).toBeGreaterThanOrEqual(10);
    expect(d.querySelectorAll('#apartament .rule').length).toBeGreaterThanOrEqual(5);
  });

  it('slajd okolicy ma listę odległości jako prawdziwą listę definicji i trzy atrakcje', () => {
    const d = doc(path);
    const distances = [...d.querySelectorAll('#okolica .distance')];
    expect(distances.length).toBeGreaterThanOrEqual(6);
    for (const distance of distances) {
      const dt = distance.querySelector('dt');
      const dd = distance.querySelector('dd');
      expect(dt.tagName, 'nazwa odległości musi być <dt>').toBe('DT');
      expect(dd.tagName, 'wartość odległości musi być <dd>').toBe('DD');
      const order = [...distance.children].map((el) => el.tagName);
      expect(order.indexOf('DT'), 'dt musi poprzedzać dd w kodzie źródłowym').toBeLessThan(order.indexOf('DD'));
    }
    expect(d.querySelectorAll('#okolica .attraction')).toHaveLength(3);
  });

  it('nagłówki slajdów obiektu i okolicy to h2, a podnagłówki wewnątrz to h3', () => {
    const d = doc(path);
    const obiektTitle = d.getElementById('obiekt-title');
    const okolicaTitle = d.getElementById('okolica-title');
    expect(obiektTitle.tagName).toBe('H2');
    expect(okolicaTitle.tagName).toBe('H2');
    for (const h of d.querySelectorAll('#obiekt h3, #okolica h3')) {
      expect(h.tagName).toBe('H3');
    }
    // brak nagłówków o niższym poziomie niż h3 wewnątrz tych dwóch slajdów
    expect(d.querySelectorAll('#obiekt h4, #obiekt h5, #obiekt h6')).toHaveLength(0);
    expect(d.querySelectorAll('#okolica h4, #okolica h5, #okolica h6')).toHaveLength(0);
  });

  it('nie publikuje danych niepotwierdzonych', () => {
    // Celowo sprawdzamy tekst widoczny dla użytkownika i JSON-LD, a nie całe
    // źródło — słowo "null" legalnie występuje w kodzie skryptów komponentów.
    // body.textContent w linkedom (jak w prawdziwym DOM) obejmuje też zawartość
    // <script>/<style>, więc usuwamy te węzły z klonu przed sprawdzeniem —
    // inaczej test sprawdzałby nie to, co deklaruje.
    const d = doc(path);
    const bodyClone = d.body.cloneNode(true);
    for (const el of bodyClone.querySelectorAll('script, style')) el.remove();
    const visible = bodyClone.textContent;
    expect(visible).not.toContain('null');
    expect(visible).not.toContain('undefined');
    expect(visible).not.toMatch(/\bNaN\b/);

    const ld = JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent);
    const nullPaths = findNulls(ld);
    expect(nullPaths, `null znaleziony w JSON-LD pod: ${nullPaths.join(', ')}`).toEqual([]);
  });

  it('slajd kontaktu ma telefon, e-mail, adres, trasę i od razu osadzoną mapę', () => {
    const d = doc(path);
    expect(d.querySelector('#kontakt a[href^="tel:"]')).not.toBeNull();
    expect(d.querySelector('#kontakt a[href^="mailto:"]')).not.toBeNull();
    expect(d.querySelector('#kontakt address')).not.toBeNull();
    expect(d.querySelector('#kontakt a[href*="google.com/maps/dir"]')).not.toBeNull();
    const iframe = d.querySelector('#kontakt iframe');
    expect(iframe).not.toBeNull();
    expect(iframe.getAttribute('loading')).toBe('lazy');
    expect(iframe.getAttribute('src')).toContain('maps.google.com');
  });

  it('linkuje Facebooka teraz, gdy adres profilu jest potwierdzony', () => {
    expect(readFileSync(path, 'utf8')).toContain('facebook.com/profile.php?id=61592126218435');
  });

  it('ma stopkę z nazwą obiektu', () => {
    const f = doc(path).querySelector('footer');
    expect(f).not.toBeNull();
    expect(f.textContent).toContain('Aura');
  });

  it('intro startuje ukryte i nie blokuje treści', () => {
    const d = doc(path);
    const intro = d.querySelector('.intro');
    expect(intro).not.toBeNull();
    expect(intro.hasAttribute('hidden')).toBe(true);
    expect(intro.getAttribute('aria-hidden')).toBe('true');
    // treść pierwszego slajdu istnieje w HTML niezależnie od intro
    expect(d.querySelector('#start-title').textContent.length).toBeGreaterThan(10);
  });

  it('intro ma logo do animacji lotu oraz istnieje dokładnie jedno logo w nagłówku jako cel', () => {
    const d = doc(path);
    const mark = d.querySelector('.intro .intro__mark');
    expect(mark).not.toBeNull();
    // te same dwa elementy SVG co w Logo.astro — skrypt animuje je niezależnie
    expect(mark.querySelector('.logo__wave')).not.toBeNull();
    expect(mark.querySelector('.logo__word')).not.toBeNull();
    // cel lotu musi istnieć i być jedyny — inaczej querySelector('.chrome__logo')
    // w skrypcie trafi w przypadkowy element albo w nic
    expect(d.querySelectorAll('.chrome__logo')).toHaveLength(1);
  });

  it('intro mierzy pozycję celu w czasie działania zamiast zaszywać współrzędne w kodzie', () => {
    // Sedno wymagania właściciela: logo musi trafić DOKŁADNIE w logo nagłówka
    // przy każdej szerokości ekranu. To wymaga pomiaru w locie
    // (getBoundingClientRect), a nie stałej transformacji w CSS/JS. Statyczny
    // test HTML nie uruchomi animacji, ale może potwierdzić, że kod w ogóle
    // mierzy, zamiast zawierać zahardkodowane wartości px/deg przesunięcia.
    const html = readFileSync(path, 'utf8');
    expect(html).toContain('getBoundingClientRect');
    expect(html).toContain('--fly-x');
    expect(html).toContain('--fly-y');
    expect(html).toContain('--fly-scale');
  });
});

describe('waga obrazów wysyłanych gościowi', () => {
  it('build nie emituje ani jednego zapasowego PNG', () => {
    // Bez fallbackFormat="webp" Astro robi zapasem PNG: 39 plików, do 9,7 MB
    // każdy, łącznie 86 z 96 MB katalogu dist. Gość na telefonie nad morzem
    // płaci za to transferem.
    const pngs = readdirSync('dist/_astro').filter((f) => f.endsWith('.png'));
    expect(pngs, `PNG-i w dist/_astro: ${pngs.join(', ')}`).toEqual([]);
  });

  it.each(PAGES)('$path nie linkuje żadnego .png', ({ path }) => {
    expect(readFileSync(path, 'utf8')).not.toMatch(/\.png/);
  });

  it.each(PAGES)('$path: podgląd galerii dostaje duży zestaw webp, nie srcset miniatury', ({ path }) => {
    const d = doc(path);
    const items = [...d.querySelectorAll('#apartament .gallery__item')];
    expect(items.length).toBeGreaterThanOrEqual(6);
    for (const item of items) {
      const srcset = item.getAttribute('data-full-srcset');
      expect(srcset, 'przycisk galerii bez data-full-srcset').toBeTruthy();
      expect(srcset, 'podgląd nie może serwować formatu zapasowego').not.toMatch(/\.(png|jpe?g)/);
      const widths = [...srcset.matchAll(/(\d+)w/g)].map((m) => Number(m[1]));
      // miniatura ma maksymalnie 840 px — podgląd rozciąga zdjęcie na 78%
      // wysokości okna, więc ten sam zestaw dawał obrazek rozciągany w górę
      expect(Math.max(...widths), `największa szerokość w podglądzie: ${widths}`).toBeGreaterThanOrEqual(1400);
      expect(item.getAttribute('data-full-src')).toBeTruthy();
    }
    const dialogImg = d.querySelector('#apartament dialog img[data-gallery-image]');
    expect(dialogImg.getAttribute('sizes'), 'podgląd bez sizes wybierze najszerszy plik').toBeTruthy();
  });
});

describe('podgląd linku w komunikatorze (og:image)', () => {
  it.each(PAGES)('$path ma og:image w JPEG 1200x630 z zadeklarowanymi wymiarami', ({ path }) => {
    // Scrapery Facebooka i WhatsAppa nie renderują WebP w og:image, a link do
    // tego obiektu rozchodzi się właśnie komunikatorem.
    const d = doc(path);
    const get = (prop) => d.querySelector(`meta[property="${prop}"]`)?.getAttribute('content');
    const src = get('og:image');
    expect(src, 'brak og:image').toBeTruthy();
    expect(src).toMatch(/^https:\/\/aura-niechorze\.pl\//);
    expect(src, 'og:image nie może być WebP').toMatch(/\.jpe?g$/);
    expect(get('og:image:type')).toBe('image/jpeg');
    expect(get('og:image:width')).toBe('1200');
    expect(get('og:image:height')).toBe('630');
    const file = 'dist' + new URL(src).pathname;
    expect(existsSync(file), `og:image ${src} nie istnieje w dist/`).toBe(true);
  });
});

describe('preload podzbioru fontu odpowiada literom w nagłówku LCP', () => {
  it.each(PAGES)('$path preloaduje dokładnie te podzbiory, których używa h1', ({ path }) => {
    const d = doc(path);
    const preloaded = [...d.querySelectorAll('link[rel="preload"][as="font"]')].map((l) =>
      l.getAttribute('href')
    );
    expect(preloaded.some((h) => /outfit-latin-wght/.test(h)), 'brak preloadu podzbioru latin').toBe(true);

    // ż (U+017C) w polskim h1 mieszka w latin-ext — jedynym podzbiorze, który
    // wcześniej NIE był preloadowany, akurat na stronie, której tekst LCP go
    // potrzebuje. DE/EN nie mają takich znaków w h1, więc 14,8 kB byłoby tam
    // czystym kosztem.
    const h1 = d.querySelector('h1').textContent;
    const needsExt = /[Ā-ʺʽ-˅Ḁ-ẟⱠ-Ɀ]/.test(h1);
    const hasExt = preloaded.some((h) => /outfit-latin-ext-wght/.test(h));
    expect(hasExt, `h1 "${h1}" ${needsExt ? 'wymaga' : 'nie wymaga'} latin-ext`).toBe(needsExt);
  });

  it('polski h1 naprawdę zawiera znak z latin-ext (inaczej test wyżej niczego nie pilnuje)', () => {
    expect(doc('dist/index.html').querySelector('h1').textContent).toContain('ż');
  });
});

describe('dane niepotwierdzone są podłączone, a nie martwe', () => {
  // Dokumentacja obiecuje właścicielowi, że wpisanie liczby coś odblokuje.
  // Te asercje pilnują, że obietnica jest prawdziwa: pole musi być CZYTANE
  // w kodzie, który renderuje stronę, a nie tylko zadeklarowane w facts.ts.
  const readers = {
    areaSqm: ['src/content/pl.ts', 'src/content/de.ts', 'src/content/en.ts'],
    beachDistanceM: ['src/content/pl.ts', 'src/content/de.ts', 'src/content/en.ts'],
    lighthouseDistance: ['src/content/pl.ts', 'src/content/de.ts', 'src/content/en.ts'],
    narrowGaugeDistance: ['src/content/pl.ts', 'src/content/de.ts', 'src/content/en.ts'],
    oceanariumDistance: ['src/content/pl.ts', 'src/content/de.ts', 'src/content/en.ts'],
    facebookUrl: ['src/components/slides/Contact.astro', 'src/components/StructuredData.astro'],
  };
  it.each(Object.entries(readers))('FACTS.%s jest odczytywane w kodzie strony', (field, files) => {
    const used = files.filter((f) => readFileSync(f, 'utf8').includes(`FACTS.${field}`));
    expect(used, `FACTS.${field} nie jest czytane w: ${files.join(', ')}`).toEqual(files);
  });

  it.each(PAGES)('$path nie publikuje wiersza „odległość do plaży”, dopóki liczby brak', ({ path }) => {
    // beachDistanceM jest null, bo źródła podają raz 50 m, raz 300 m. Lista
    // odległości to same zmierzone liczby — wpis „tuż obok” czytał się w niej
    // jak pomiar. Do czasu potwierdzenia wiersza po prostu nie ma.
    const names = [...doc(path).querySelectorAll('#okolica .distance dt')].map((dt) =>
      dt.textContent.toLowerCase()
    );
    for (const n of names) {
      expect(n, 'wiersz odległości do plaży w Niechorzu bez potwierdzonej liczby').not.toMatch(
        /^(plaża w niechorzu|strand in niechorze|niechorze beach)$/
      );
    }
  });
});

describe('jedno źródło adresu strony', () => {
  it('domena nie jest przepisana z ręki w kodzie źródłowym poza astro.config', () => {
    // Canonical, wszystkie hreflangi, og:url, og:image i JSON-LD karmią się z
    // Astro.site. Każda dodatkowa kopia adresu to cichy rozjazd SEO.
    const sources = [
      'src/layouts/Base.astro',
      'src/components/StructuredData.astro',
      'src/pages/index.astro',
    ];
    for (const f of sources) {
      const code = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      expect(code, `adres strony wpisany z ręki w ${f}`).not.toContain('aura-niechorze.pl');
    }
    expect(readFileSync('astro.config.mjs', 'utf8')).toContain('https://aura-niechorze.pl');
  });
});

describe('reguła wypełnienia logo (przecięte kontury liter A i R)', () => {
  // Logo.astro nie miało w ogóle atrybutu fill-rule, więc ścieżki renderowały
  // się domyślną regułą "nonzero" — a te konkretne ścieżki (wyeksportowane z
  // narzędzia do trasowania) zakładają "evenodd": bez niego wewnętrzne kontury
  // liter "A" i "R" (i zamknięte pasy fali) wypełniają się na czarno zamiast
  // zostać puste. Sprawdzamy to na każdej z trzech instancji <Logo> w
  // wyrenderowanym HTML (Chrome.astro, Intro.astro, Contact.astro), a nie
  // tylko w źródle komponentu — inaczej regresja w kompilacji/atrybutach
  // przekazywanych przez Astro umknęłaby testowi.
  it.each(PAGES)('$path: każda z trzech instancji logo ma fill-rule="evenodd" na obu ścieżkach', ({ path }) => {
    const d = doc(path);
    const logos = d.querySelectorAll('.logo');
    expect(logos.length, 'oczekiwano trzech wystąpień logo (nagłówek, intro, stopka)').toBe(3);
    for (const logo of logos) {
      const wavePath = logo.querySelector('.logo__wave path');
      const wordPath = logo.querySelector('.logo__word path');
      expect(wavePath, 'brak ścieżki fali w instancji logo').not.toBeNull();
      expect(wordPath, 'brak ścieżki napisu w instancji logo').not.toBeNull();
      expect(wavePath.getAttribute('fill-rule')).toBe('evenodd');
      expect(wordPath.getAttribute('fill-rule')).toBe('evenodd');
    }
  });

  it('favicon.svg (wytrasowany z tych samych ścieżek) też ma fill-rule="evenodd"', () => {
    const svg = readFileSync('public/favicon.svg', 'utf8');
    const { document: fdoc } = parseHTML(svg);
    const path = fdoc.querySelector('path');
    expect(path).not.toBeNull();
    expect(path.getAttribute('fill-rule')).toBe('evenodd');
  });
});
