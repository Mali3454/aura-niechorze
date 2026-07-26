import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parseHTML } from 'linkedom';

/*
  STRAŻNIK MARTWYCH SELEKTORÓW.

  Ta gałąź złapała już PIĘĆ razy ten sam błąd: reguła CSS w komponencie Astro
  kompiluje się z atrybutem zakresu (data-astro-cid-…) doklejonym do compoundu,
  który w gotowym HTML nosi zakres INNEGO pliku — więc selektor nie pasuje do
  niczego, styl milczy, a oba pakiety testów (121 asercji) przechodzą na
  zielono. Wszystkie pięć znalazł człowiek patrzący na ekran.

  Test odwraca ten porządek: bierze KAŻDY selektor z CSS-a faktycznie
  wyemitowanego do dist/ i sprawdza, czy pasuje choć do jednego elementu w tym
  samym dokumencie. Zero trafień = martwa reguła = błąd.

  Selektory zależne od stanu ustawianego dopiero w przeglądarce nie mogą pasować
  w statycznym HTML. NIE rozluźniamy przez to sprawdzenia — zamiast tego
  USUWAMY z selektora dokładnie ten jeden token stanu i sprawdzamy resztę.
  Dzięki temu `.chrome[data-on-light] .chrome__logo .logo[data-astro-cid-X]`
  nadal jest weryfikowany jako `.chrome .chrome__logo .logo[data-astro-cid-X]`
  — i to właśnie ta wersja obnaża błąd zakresu, zamiast go ukryć.
*/

// Tokeny stanu ustawianego w czasie działania strony (skrypty, interakcja,
// tryb UA). Każdy jest wycinany z selektora, a reszta selektora nadal musi
// pasować. Kolejność bez znaczenia — wycinamy wszystkie wystąpienia.
const RUNTIME_TOKENS = [
  // --- stan interakcji: nigdy nie występuje w świeżo sparsowanym dokumencie
  /:hover\b/g,
  /:focus-visible\b/g,
  /:focus-within\b/g,
  /:focus\b/g,
  /:active\b/g,
  /:target\b/g,
  // --- pseudo-elementy: nie są elementami DOM, więc querySelector ich nie
  //     znajdzie; sprawdzamy element, DO KTÓREGO są doczepione (::backdrop
  //     istnieje tylko przy otwartym <dialog>, ::before/::after nigdy).
  /::[a-z-]+(\([^)]*\))?/g,
  //     minifikator Astro zapisuje ::before/::after starą, jednodwukropkową
  //     składnią (:before/:after) — ta lista musi ją obejmować, inaczej test
  //     wywala się na „Pseudo-elements are not supported” zamiast sprawdzać
  /:(before|after|first-line|first-letter)\b/g,
  // --- klasa dopisywana przez inline-skrypt w Base.astro po starcie JS
  /(?<=^|[\s>+~,(])html\.js\b/g,
  /\.js\b(?=[\s>+~,)]|$)/g,
  // --- klasa dopisywana przez skrypt intra na czas blokady przewijania
  /\.intro-active\b/g,
  // --- klasy fazy animacji intra, dopisywane przez skrypt intra
  /\.is-playing\b/g,
  /\.is-flying\b/g,
  // --- atrybut ustawiany przez IntersectionObserver w Chrome.astro na jasnych
  //     slajdach (to on maskował błąd C1 — dlatego wycinamy, a nie pomijamy)
  /\[data-on-light\]/g,
  // --- atrybut ustawiany przez IntersectionObserver w SlideNav.astro
  //     (minifikator zdejmuje cudzysłowy z wartości atrybutu — dopuszczamy obie postacie)
  /\[aria-current=("true"|'true'|true)\]/g,
];

// Selektory, które celowo nie mają czego dopasować w AKTUALNYM stanie danych:
// treść pojawia się dopiero, gdy właściciel potwierdzi wartość w facts.ts
// (wzorzec hasFact). Wypisane z nazwy, żeby lista sama się nie rozrastała.
const CONDITIONAL_ON_FACTS = new Set([
  // Area.astro: odległość przy atrakcji — renderowana tylko gdy
  // FACTS.lighthouseDistance / narrowGaugeDistance / oceanariumDistance != null.
  '.attraction__distance',
]);

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Wyciąga preludia wszystkich reguł stylu (pomija @font-face, @keyframes itp.). */
function selectorPreludes(css) {
  const found = [];
  let i = 0;
  let buf = '';

  const skipBlock = () => {
    let depth = 1;
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
      i++;
    }
  };

  const walk = () => {
    while (i < css.length) {
      const ch = css[i];
      if (ch === '}') { i++; return; }
      if (ch === '{') {
        const prelude = buf.trim();
        buf = '';
        i++;
        if (prelude.startsWith('@')) {
          const name = prelude.slice(1).split(/[\s({]/)[0].toLowerCase();
          // reguły warunkowe zawierają w środku zwykłe reguły stylu
          if (['media', 'supports', 'layer', 'container', 'scope'].includes(name)) walk();
          else skipBlock(); // @font-face, @keyframes, @property, @page…
        } else {
          if (prelude) found.push(prelude);
          skipBlock();
        }
        continue;
      }
      if (ch === ';' && buf.trim().startsWith('@')) { buf = ''; i++; continue; } // @import/@charset
      buf += ch;
      i++;
    }
  };

  walk();
  return found;
}

/** Dzieli listę selektorów po przecinkach najwyższego poziomu. */
function splitSelectorList(prelude) {
  const out = [];
  let depth = 0;
  let buf = '';
  for (const ch of prelude) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(buf); buf = ''; continue; }
    buf += ch;
  }
  out.push(buf);
  return out.map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function stripRuntimeTokens(selector) {
  let s = selector;
  for (const re of RUNTIME_TOKENS) s = s.replace(re, '');
  // po wycięciu tokenu może zostać goły kombinator albo pusty compound
  return s.replace(/\s+/g, ' ').trim();
}

/** Cały CSS, który realnie trafia do przeglądarki dla danej strony. */
function cssFor(path, document) {
  const parts = [...document.querySelectorAll('style')].map((s) => s.textContent);
  for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
    const href = link.getAttribute('href');
    if (!href || /^https?:/.test(href)) continue;
    const file = href.startsWith('/') ? join('dist', href.slice(1)) : join(dirname(path), href);
    expect(existsSync(file), `arkusz ${href} podlinkowany, ale nie ma go w dist/`).toBe(true);
    parts.push(readFileSync(file, 'utf8'));
  }
  return stripComments(parts.join('\n'));
}

const PAGES = ['dist/index.html', 'dist/de/index.html', 'dist/en/index.html'];

describe('każdy selektor w wyemitowanym CSS pasuje do czegoś w wyemitowanym HTML', () => {
  it.each(PAGES)('%s', (path) => {
    expect(existsSync(path), `brak ${path} — czy build się wykonał?`).toBe(true);
    const { document } = parseHTML(readFileSync(path, 'utf8'));
    const css = cssFor(path, document);
    expect(css.length, 'nie znaleziono żadnego CSS — test sprawdzałby pustkę').toBeGreaterThan(1000);

    const dead = [];
    const unparseable = [];
    const seen = new Set();

    for (const prelude of selectorPreludes(css)) {
      for (const raw of splitSelectorList(prelude)) {
        if (seen.has(raw)) continue;
        seen.add(raw);
        // porównujemy bez atrybutu zakresu Astro, żeby lista wyjątków
        // opisywała klasę, a nie losowy hash kompilacji
        if (CONDITIONAL_ON_FACTS.has(raw.replace(/\[data-astro-cid-[^\]]*\]/g, '').trim())) continue;
        const probe = stripRuntimeTokens(raw);
        if (!probe) continue; // selektor był w całości pseudo-elementem
        try {
          if (!document.querySelector(probe)) dead.push(`${raw}   →  próbowano: ${probe}`);
        } catch (e) {
          unparseable.push(`${raw}: ${e.message}`);
        }
      }
    }

    expect(unparseable, `selektory, których nie dało się sprawdzić:\n${unparseable.join('\n')}`).toEqual([]);
    expect(
      dead,
      `martwe reguły CSS (selektor nie pasuje do żadnego elementu na tej stronie):\n  ${dead.join('\n  ')}`
    ).toEqual([]);
  });
});
