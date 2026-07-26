# Aura Niechorze — plan wdrożenia przebudowy

> **Dla agentów wykonujących:** WYMAGANY SUB-SKILL: użyj `superpowers:subagent-driven-development` (zalecane) albo `superpowers:executing-plans`, żeby wdrożyć ten plan zadanie po zadaniu. Kroki mają składnię checkboxów (`- [ ]`) do śledzenia postępu.

**Cel:** Zastąpić testową stronę React statyczną witryną Astro w trzech językach, prezentowaną jako pełnoekranowe slajdy z animowanym intro, spełniającą WCAG 2.2 AA i osiągającą wysokie wyniki PageSpeed.

**Architektura:** Astro w trybie statycznym generuje trzy pliki HTML (`/`, `/de/`, `/en/`) z pełną treścią w źródle. Slajdy to zwykłe sekcje dokumentu przewijane natywnym `scroll-snap` — bez przechwytywania scrolla, dzięki czemu klawiatura, wyszukiwanie w stronie i czytniki ekranu działają bez dodatkowego kodu. Cały JavaScript strony to około 2 KB obsługujące intro, wskaźnik aktywnego slajdu, galerię i mapę na żądanie.

**Stos:** Astro 5, `@astrojs/sitemap`, `@fontsource-variable/outfit`, `astro:assets` (Sharp), Vitest + linkedom do asercji na wygenerowanym HTML, Playwright + axe-core do testów dostępności.

**Specyfikacja:** `docs/superpowers/specs/2026-07-25-aura-niechorze-redesign-design.md`

## Ograniczenia globalne

Poniższe obowiązują w każdym zadaniu i nie są powtarzane w treści zadań.

- Node 20.13.1 lokalnie, Node 20 w GitHub Actions. Nie podnosimy wersji Node.
- Astro instalowany jako `astro@^5`. Nie używamy Astro 6 — wymaga nowszego Node niż mamy w CI.
- Kolory wyłącznie: `#04477A` (granat marki), `#024076` (granat głęboki), `#FFFFFF`, `#EEF3F8` (mgła), `#8FC4E8` (błękit akcentu). Żadnych innych wartości kolorów w CSS poza przezroczystymi wariantami tych pięciu.
- Jedyny krój: Outfit, wariant zmienny, hostowany lokalnie z `@fontsource-variable/outfit`. Zero odwołań do `fonts.googleapis.com` i `fonts.gstatic.com` w kodzie produkcyjnym.
- Nazwa obiektu wszędzie identycznie: `Aura Niechorze — apartamenty przy plaży`. Adres: `Leśna 9, 72-350 Niechorze`. Telefon wyświetlany: `+48 576 040 656`, w `href`: `tel:+48576040656`.
- Nazewnictwo: **apartamenty**, nigdy „pensjonat", w żadnym języku.
- Dokładnie jedno `<h1>` na stronie. Każdy slajd ma `<h2>`.
- Żadna niepotwierdzona dana (metraż, odległość do plaży, odległości do atrakcji, URL Facebooka) nie może pojawić się w wygenerowanym HTML. Mechanizm opisany w zadaniu 3.
- `prefers-reduced-motion: reduce` wyłącza intro i płynne przewijanie w każdej funkcji, którą dodajesz.
- Wszystkie commity w języku polskim, tryb rozkazujący, prefiks konwencjonalny (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- Po każdym zadaniu `npm run test` musi przechodzić.

---

## Struktura plików

| Plik | Odpowiedzialność |
|---|---|
| `astro.config.mjs` | Konfiguracja Astro: `site`, i18n, sitemap, inlining CSS |
| `src/content/facts.ts` | Dane obiektu niezależne od języka + flagi danych niepotwierdzonych |
| `src/content/types.ts` | Typ `SiteContent` — kontrakt między treścią a układem |
| `src/content/pl.ts`, `de.ts`, `en.ts` | Treść w trzech językach, identyczna struktura |
| `src/layouts/Base.astro` | `<head>`, meta, hreflang, canonical, OG, JSON-LD, ładowanie fontu |
| `src/pages/index.astro`, `de/index.astro`, `en/index.astro` | Złożenie slajdów z treści danego języka |
| `src/components/Slide.astro` | Ramka pojedynczego slajdu: sekcja, snap, wariant tła |
| `src/components/Chrome.astro` | Stała warstwa: logo, telefon, przełącznik języka, skip link |
| `src/components/SlideNav.astro` | Boczne kropki nawigacyjne + skrypt aktywnego slajdu |
| `src/components/Intro.astro` | Animowane logo wejściowe + skrypt |
| `src/components/Gallery.astro` | Siatka miniatur i `<dialog>` z powiększeniem |
| `src/components/slides/Hero.astro` … `Contact.astro` | Po jednym pliku na slajd |
| `src/components/Logo.astro` | Logo SVG w trzech wariantach kolorystycznych |
| `src/styles/tokens.css` | Zmienne: kolory, skala typograficzna, odstępy |
| `src/styles/global.css` | Reset, `.slides`, `.slide`, wspólne prymitywy |
| `src/assets/` | Zdjęcia przetwarzane przez `astro:assets` |
| `tests/build-output.test.js` | Asercje na wygenerowanym HTML (SEO, i18n, semantyka) |
| `tests/a11y.spec.js` | Playwright: axe, klawiatura, reduced-motion |

---

### Task 1 — Fundament — Astro, tokeny, font, harness testowy

**Pliki:**
- Modyfikuj: `package.json`
- Utwórz: `astro.config.mjs`
- Utwórz: `src/styles/tokens.css`
- Utwórz: `src/styles/global.css`
- Utwórz: `src/pages/index.astro`
- Utwórz: `tests/build-output.test.js`
- Utwórz: `vitest.config.js`
- Modyfikuj: `.github/workflows/deploy.yml`
- Usuń: `index.html`, `vite.config.js`, `tweaks-panel.jsx`, `src/App.jsx`, `src/main.jsx`, `src/components/` (stare React), `src/hooks/`, `src/styles/index.css`

**Interfejsy:**
- Produkuje: `npm run build` generujący `dist/index.html`; `npm run test` uruchamiający build i Vitest; zmienne CSS `--navy`, `--navy-deep`, `--mist`, `--sky`, `--font`, `--step-0` … `--step-5`, `--space-*`.

- [ ] **Krok 1: Usuń stary kod React**

```bash
cd /c/Users/Wojtek/Documents/aura-niechorze
rm -rf src/components src/hooks src/styles src/App.jsx src/main.jsx
rm -f index.html vite.config.js tweaks-panel.jsx
git rm -r --cached dist 2>/dev/null || true
```

- [ ] **Krok 2: Przepisz `package.json`**

```json
{
  "name": "aura-niechorze",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "astro build && vitest run",
    "test:unit": "vitest run"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.2.0",
    "@fontsource-variable/outfit": "^5.1.0",
    "astro": "^5",
    "sharp": "^0.33.5"
  },
  "devDependencies": {
    "linkedom": "^0.18.5",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Krok 3: Zainstaluj zależności i sprawdź wersje**

```bash
rm -rf node_modules package-lock.json
npm install
npx astro --version
```

Oczekiwane: wersja `5.x`. Jeśli npm odmówi instalacji z powodu `engines`, zatrzymaj się i zgłoś — nie podnoś wersji Node na własną rękę.

- [ ] **Krok 4: Sprawdź nazwy plików CSS w pakiecie fontu**

```bash
ls node_modules/@fontsource-variable/outfit/
```

Oczekiwane: pliki `index.css`, `latin.css`, `latin-ext.css` (lub `wght.css` i `wght-*.css` — zależnie od wersji pakietu). Zanotuj faktyczne nazwy; użyjesz ich w kroku 6 i w zadaniu 3. Jeśli istnieje `latin-ext.css`, importujesz `latin.css` i `latin-ext.css`. Jeśli pakiet ma tylko `index.css`, importujesz `index.css`.

- [ ] **Krok 5: Utwórz `astro.config.mjs`**

```js
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
```

- [ ] **Krok 6: Utwórz `src/styles/tokens.css`**

```css
:root {
  --navy: #04477A;
  --navy-deep: #024076;
  --white: #FFFFFF;
  --mist: #EEF3F8;
  --sky: #8FC4E8;

  --font: 'Outfit Variable', system-ui, -apple-system, sans-serif;

  --step-0: clamp(1rem, 0.96rem + 0.18vw, 1.09rem);
  --step-1: clamp(1.2rem, 1.12rem + 0.38vw, 1.44rem);
  --step-2: clamp(1.44rem, 1.3rem + 0.7vw, 1.9rem);
  --step-3: clamp(1.73rem, 1.5rem + 1.15vw, 2.5rem);
  --step-4: clamp(2.07rem, 1.7rem + 1.85vw, 3.3rem);
  --step-5: clamp(2.49rem, 1.9rem + 2.9vw, 4.4rem);

  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.75rem;
  --space-4: 3rem;
  --space-5: 5rem;

  --measure: 34ch;
  --radius-pill: 999px;
}
```

- [ ] **Krok 7: Utwórz `src/styles/global.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: var(--font);
  font-weight: 300;
  font-size: var(--step-0);
  line-height: 1.6;
  color: var(--navy);
  background: var(--white);
}
h1, h2, h3 { font-weight: 200; line-height: 1.1; letter-spacing: -0.02em; margin: 0; }
p { margin: 0; }
img { max-width: 100%; display: block; }
a { color: inherit; }

.skip-link {
  position: absolute; left: var(--space-2); top: -100%;
  z-index: 100; background: var(--white); color: var(--navy);
  padding: 0.75rem 1.25rem; border-radius: var(--radius-pill); font-weight: 600;
}
.skip-link:focus { top: var(--space-2); }

:focus-visible { outline: 3px solid var(--sky); outline-offset: 3px; }

.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
```

- [ ] **Krok 8: Utwórz tymczasową stronę `src/pages/index.astro`**

```astro
---
import '../styles/tokens.css';
import '../styles/global.css';
---
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Aura Niechorze — apartamenty przy plaży</title>
  </head>
  <body>
    <h1>Aura Niechorze — apartamenty przy plaży</h1>
  </body>
</html>
```

- [ ] **Krok 9: Utwórz `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
```

- [ ] **Krok 10: Napisz test wyjścia builda**

`tests/build-output.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { parseHTML } from 'linkedom';

export function doc(path) {
  expect(existsSync(path), `brak pliku ${path} — czy build się wykonał?`).toBe(true);
  return parseHTML(readFileSync(path, 'utf8')).document;
}

describe('build produkuje stronę polską', () => {
  it('generuje dist/index.html z atrybutem lang="pl"', () => {
    const d = doc('dist/index.html');
    expect(d.documentElement.getAttribute('lang')).toBe('pl');
  });

  it('ma dokładnie jeden nagłówek h1', () => {
    const d = doc('dist/index.html');
    expect(d.querySelectorAll('h1')).toHaveLength(1);
  });

  it('nie odwołuje się do Google Fonts', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
  });
});
```

- [ ] **Krok 11: Uruchom testy i potwierdź, że przechodzą**

```bash
npm run test
```

Oczekiwane: build kończy się sukcesem, trzy testy na zielono.

- [ ] **Krok 12: Zaktualizuj workflow**

W `.github/workflows/deploy.yml` dodaj krok testów po `npm ci`, przed `npm run build`:

```yaml
      - run: npm ci
      - run: npm run test
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
```

Zauważ: `npm run test` sam wykonuje `astro build`, więc osobny krok `npm run build` znika. Usuń linię `- run: npm run build`.

- [ ] **Krok 13: Commit**

```bash
git add -A
git commit -m "feat: fundament Astro z tokenami, fontem i harnessem testowym"
```

---

### Task 2 — Zasoby — zdjęcia, logo SVG, favicon

**Pliki:**
- Utwórz: `src/assets/` (przeniesione zdjęcia)
- Utwórz: `src/components/Logo.astro`
- Utwórz: `public/favicon.svg`
- Modyfikuj: `public/` (usunięcie przeniesionych zdjęć)
- Modyfikuj: `tests/build-output.test.js`

**Interfejsy:**
- Konsumuje: nic.
- Produkuje: `Logo.astro` z propsami `{ variant?: 'navy' | 'white', class?: string, title?: string }`. Zawsze renderuje dwa osobne elementy — `<svg class="logo__wave">` i `<svg class="logo__word">` — wewnątrz `<div class="logo">`. Rozdzielenie na dwa elementy jest wymagane przez intro w zadaniu 10, które animuje je niezależnie.
- Produkuje: zdjęcia jako importy z `src/assets/`, dostępne dla `astro:assets`.

- [ ] **Krok 1: Przenieś zdjęcia do `src/assets/` z czytelnymi nazwami**

```bash
cd /c/Users/Wojtek/Documents/aura-niechorze
mkdir -p src/assets
git mv public/IMG-20260709-WA0023.webp src/assets/budynek-zmierzch.webp 2>/dev/null || mv public/IMG-20260709-WA0023.webp src/assets/budynek-zmierzch.webp
mv public/20260718_133223.webp src/assets/salon-okno.webp
mv public/20260718_133228.webp src/assets/salon-2.webp
mv public/20260718_133248.webp src/assets/salon-3.webp
mv public/20260718_133329.webp src/assets/jadalnia.webp
mv public/20260718_133346.webp src/assets/aneks-kuchenny.webp
mv public/20260718_120310.webp src/assets/sypialnia-antresola.webp
mv public/20260718_120322.webp src/assets/sypialnia-2.webp
mv public/20260718_120350.webp src/assets/sypialnia-3.webp
mv public/20260718_120418.webp src/assets/sypialnia-4.webp
mv public/20260718_120443.webp src/assets/sypialnia-5.webp
mv public/20260718_134151.webp src/assets/lazienka-1.webp
mv public/20260718_134209.webp src/assets/lazienka-2.webp
mv public/20260718_134226.webp src/assets/lazienka-3.webp
mv public/20260718_134241.webp src/assets/lazienka-kosmetyki.webp
mv public/20260718_134326.webp src/assets/lazienka-4.webp
mv public/20260718_134430.webp src/assets/balkon.webp
```

Po przeniesieniu obejrzyj każde zdjęcie i popraw nazwę, jeśli nie odpowiada treści. Nazwy plików są jedyną dokumentacją tego, co jest na zdjęciu — błędna nazwa wróci jako błędny `alt`.

- [ ] **Krok 2: Usuń pliki, których nie używamy**

```bash
rm -f public/Gemini_Generated_Image_cshw4dcshw4dcshw.webp public/logo-contact.webp
```

Grafika generowana przez AI nie wchodzi na stronę obiektu noclegowego — gość ma zobaczyć realne wnętrza. `logo-contact.webp` to gotowy kafel na social media z wtopionym szarym tłem, nieprzydatny w układzie strony.

- [ ] **Krok 3: Odrysuj logo do SVG**

Źródło: `public/logo-white.webp` (granatowe logo na białym tle, 1024×1024).

```bash
npm install --no-save potrace
node -e "
const potrace=require('potrace'), sharp=require('sharp'), fs=require('fs');
(async()=>{
  const t=await sharp('public/logo-white.webp').trim({threshold:12}).toBuffer({resolveWithObject:true});
  console.log('obszar logo:', t.info.width+'x'+t.info.height);
  // fala: górna część, wordmark: dolna
  await sharp(t.data).extract({left:0,top:0,width:t.info.width,height:272}).png().toFile('/tmp/wave.png');
  await sharp(t.data).extract({left:0,top:272,width:t.info.width,height:t.info.height-272}).trim({threshold:1}).png().toFile('/tmp/word.png');
  for (const n of ['wave','word']) {
    potrace.trace('/tmp/'+n+'.png', {threshold:128, turdSize:2, optCurve:true, color:'currentColor'}, (e,svg)=>{
      if(e) throw e; fs.writeFileSync('/tmp/'+n+'.svg', svg); console.log(n,'zapisany');
    });
  }
})();
"
```

Wysokość 272 px zakłada, że po przycięciu logo ma 466 px wysokości (fala u góry, napis u dołu). Jeśli krok wypisze inne wymiary, dobierz punkt cięcia proporcjonalnie — fala kończy się na około 58% wysokości.

- [ ] **Krok 4: Porównaj odrys z oryginałem i przedstaw do zatwierdzenia**

Wyrenderuj `/tmp/wave.svg` i `/tmp/word.svg` obok oryginalnego `public/logo-white.webp` i porównaj kształty. Specyfikacja wymaga zatwierdzenia odrysu przez właściciela przed wdrożeniem — kształt fali i liter musi zostać identyczny.

**Jeśli odrys odbiega od oryginału**, nie poprawiaj go ręcznie na siłę. Zamiast tego wygeneruj przezroczyste PNG (`logo-navy.png`, `logo-white.png`) tą samą metodą co w prototypie intro i użyj ich zamiast SVG — strona zadziała, tylko logo zajmie kilkanaście KB zamiast trzech. Zanotuj to jako dług do rozwiązania.

- [ ] **Krok 5: Utwórz `src/components/Logo.astro`**

Wklej ścieżki `<path d="…">` z `/tmp/wave.svg` i `/tmp/word.svg` w miejsca oznaczone poniżej. Zachowaj `viewBox` z wygenerowanych plików.

```astro
---
interface Props {
  variant?: 'navy' | 'white';
  class?: string;
  title?: string;
}
const { variant = 'navy', class: cls = '', title } = Astro.props;
const color = variant === 'white' ? 'var(--white)' : 'var(--navy)';
---
<div class:list={['logo', cls]} style={`color:${color}`}>
  <svg class="logo__wave" viewBox="0 0 708 272" fill="currentColor" role={title ? 'img' : 'presentation'} aria-label={title}>
    <!-- WKLEJ ścieżki z /tmp/wave.svg -->
  </svg>
  <svg class="logo__word" viewBox="0 0 708 194" fill="currentColor" aria-hidden="true">
    <!-- WKLEJ ścieżki z /tmp/word.svg -->
  </svg>
</div>

<style>
  .logo { display: block; }
  .logo__wave, .logo__word { display: block; width: 100%; height: auto; }
  .logo__word { margin-top: 4%; }
</style>
```

- [ ] **Krok 6: Utwórz `public/favicon.svg`**

Favicon to sama fala na granatowym tle — wordmark w 32 px i tak byłby nieczytelny. Użyj tych samych ścieżek co `logo__wave`, przeskalowanych do kwadratu.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#04477A"/>
  <g fill="#FFFFFF" transform="translate(6 28) scale(0.1271)">
    <!-- WKLEJ te same ścieżki co w logo__wave -->
  </g>
</svg>
```

Współczynnik `0.1271` przeskalowuje szerokość 708 do 90 px. Po wklejeniu otwórz plik w przeglądarce i sprawdź, czy fala mieści się w kwadracie z marginesem.

- [ ] **Krok 7: Dopisz test, że favicon i logo są w wyjściu**

Dodaj do `tests/build-output.test.js`:

```js
describe('zasoby graficzne', () => {
  it('favicon jest podlinkowany', () => {
    const d = doc('dist/index.html');
    const icon = d.querySelector('link[rel="icon"]');
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('href')).toContain('favicon.svg');
  });
});
```

Ten test przejdzie dopiero po zadaniu 3, które dodaje `<link rel="icon">` do `Base.astro`. Oznacz go teraz jako `it.skip` i odznacz w zadaniu 3, krok 8.

- [ ] **Krok 8: Uruchom build i commit**

```bash
npm run test
git add -A
git commit -m "feat: zasoby graficzne — zdjęcia w src/assets, logo SVG, favicon"
```

Uwaga: zdjęcia nie były dotąd śledzone przez gita. `git add -A` doda je do repozytorium — to zamierzone, bez nich build nie przejdzie w CI.

---

### Task 3 — Treść w trzech językach, layout, meta i hreflang

**Pliki:**
- Utwórz: `src/content/types.ts`
- Utwórz: `src/content/facts.ts`
- Utwórz: `src/content/pl.ts`, `src/content/de.ts`, `src/content/en.ts`
- Utwórz: `src/layouts/Base.astro`
- Modyfikuj: `src/pages/index.astro`
- Utwórz: `src/pages/de/index.astro`, `src/pages/en/index.astro`
- Modyfikuj: `tests/build-output.test.js`

**Interfejsy:**
- Konsumuje: `Logo.astro` z zadania 2.
- Produkuje: typ `SiteContent` (poniżej), obiekt `FACTS`, funkcję `hasFact(value)`, komponent `Base.astro` z propsami `{ content: SiteContent }` i slotem na slajdy.

- [ ] **Krok 1: Zdefiniuj kontrakt treści `src/content/types.ts`**

```ts
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
```

- [ ] **Krok 2: Zdefiniuj fakty `src/content/facts.ts`**

Wartości `null` oznaczają dane niepotwierdzone. Specyfikacja zabrania publikowania ich w jakiejkolwiek formie, więc komponenty pomijają je warunkowo.

```ts
export const FACTS = {
  name: 'Aura Niechorze — apartamenty przy plaży',
  street: 'Leśna 9',
  postalCode: '72-350',
  city: 'Niechorze',
  region: 'zachodniopomorskie',
  country: 'PL',
  phoneHref: 'tel:+48576040656',
  phoneDisplay: '+48 576 040 656',
  guests: 4,
  checkinFrom: '16:00',
  checkinTo: '21:00',
  checkoutFrom: '08:00',
  checkoutTo: '10:00',
  cribPrice: '20 zł',

  // === DANE NIEPOTWIERDZONE — nie publikować dopóki są null ===
  areaSqm: null as number | null,
  beachDistanceM: null as number | null,
  facebookUrl: null as string | null,
  lighthouseDistance: null as string | null,
  narrowGaugeDistance: null as string | null,
  oceanariumDistance: null as string | null,
} as const;

export function hasFact<T>(value: T | null): value is T {
  return value !== null && value !== undefined;
}

export const ADDRESS_QUERY = encodeURIComponent(
  `${FACTS.street}, ${FACTS.postalCode} ${FACTS.city}`
);
```

- [ ] **Krok 3: Napisz treść polską `src/content/pl.ts`**

```ts
import type { SiteContent } from './types';
import { FACTS, hasFact } from './facts';

const beach = hasFact(FACTS.beachDistanceM)
  ? `${FACTS.beachDistanceM} metrów od morza`
  : 'tuż przy plaży';

export const pl: SiteContent = {
  lang: 'pl',
  htmlLang: 'pl-PL',
  meta: {
    title: 'Aura Niechorze — apartamenty przy plaży',
    description:
      'Dwupoziomowy apartament dla 4 osób w Niechorzu, tuż przy plaży, w sosnowym lesie. Balkon z widokiem na morze, klimatyzacja, bezpłatny parking. Zadzwoń i zapytaj o termin.',
    ogAlt: 'Budynek apartamentów Aura w Niechorzu o zmierzchu, z podświetlonymi balkonami na tle sosen',
  },
  chrome: {
    skip: 'Przejdź do treści',
    callLabel: 'Zadzwoń',
    langLabel: 'Język',
    langNames: { pl: 'Polski', de: 'Deutsch', en: 'English' },
    navLabel: 'Nawigacja po sekcjach',
    slideNames: ['Start', 'O obiekcie', 'Apartament', 'Okolica', 'Kontakt'],
  },
  hero: {
    h1: 'Apartamenty przy plaży w Niechorzu',
    sub: `Dwupoziomowy apartament dla czterech osób — ${beach}, w sosnowym lesie.`,
    cta: 'Zadzwoń',
    scrollHint: 'Przewiń, aby zobaczyć więcej',
  },
  about: {
    h2: 'O obiekcie',
    lead: 'Cicho, zielono i blisko morza.',
    body:
      'Aura to kameralny budynek na skraju sosnowego lasu w Niechorzu. Każdy apartament ma dwa poziomy, własny balkon z widokiem na morze i klimatyzację. Na miejscu czeka ogród, taras i bezpłatny parking — auto zostawiasz przy wejściu i przez cały pobyt do niego nie wracasz.',
    stats: [
      { value: `${FACTS.guests}`, label: 'osoby' },
      { value: '950 m', label: 'do stacji kolejowej' },
      { value: '200 m', label: 'do restauracji' },
    ],
  },
  apartment: {
    h2: 'Apartament',
    lead: 'Dwa poziomy, sypialnia na antresoli, aneks kuchenny i pełna łazienka.',
    amenities: [
      'Klimatyzacja',
      'Balkon z widokiem na morze',
      'Bezpłatne WiFi',
      'Telewizor z kanałami kablowymi',
      'Aneks kuchenny',
      'Jadalnia',
      'Część wypoczynkowa',
      'Prywatna łazienka z prysznicem',
      'Suszarka do włosów',
      'Zestaw kosmetyków',
      'Pościel i ręczniki',
    ],
    rules: [
      `Zameldowanie ${FACTS.checkinFrom}–${FACTS.checkinTo}`,
      `Wymeldowanie ${FACTS.checkoutFrom}–${FACTS.checkoutTo}`,
      'Zwierzęta po uzgodnieniu',
      'Obiekt bez palenia',
      `Łóżeczko dziecięce ${FACTS.cribPrice} za dobę`,
    ],
    gallery: {
      open: 'Powiększ zdjęcie',
      close: 'Zamknij',
      prev: 'Poprzednie zdjęcie',
      next: 'Następne zdjęcie',
      label: 'Galeria wnętrz apartamentu',
    },
  },
  area: {
    h2: 'Okolica',
    lead: 'Morze na wyciągnięcie ręki, a dookoła cały pas nadmorski.',
    distancesLabel: 'Odległości',
    distances: [
      { name: 'Plaża w Niechorzu', value: 'tuż obok' },
      { name: 'Restauracje', value: '200–300 m' },
      { name: 'Stacja kolejowa Niechorze', value: '950 m' },
      { name: 'Plaża Pogorzelica', value: '900 m' },
      { name: 'Plaża Rewal', value: '1,8 km' },
      { name: 'Kołobrzeg', value: '47 km' },
      { name: 'Lotnisko Szczecin-Goleniów', value: '80 km' },
    ],
    attractions: [
      { name: 'Latarnia morska w Niechorzu', text: 'Ceglana wieża z 1866 roku i taras widokowy nad klifem.' },
      { name: 'Kolejka wąskotorowa', text: 'Zabytkowy pociąg kursujący wzdłuż wybrzeża między nadmorskimi miejscowościami.' },
      { name: 'Oceanarium', text: 'Ekspozycja morska w Niechorzu — dobry pomysł na deszczowe popołudnie.' },
    ],
  },
  contact: {
    h2: 'Kontakt',
    lead: 'Zadzwoń i zapytaj o wolny termin.',
    phoneLabel: 'Telefon',
    addressLabel: 'Adres',
    mapCta: 'Pokaż mapę',
    mapNotice: 'Mapa ładuje się z serwerów Google dopiero po kliknięciu.',
    routeCta: 'Wyznacz trasę',
    fbLabel: 'Facebook',
  },
  footer: { rights: 'Wszelkie prawa zastrzeżone.' },
  alts: {
    budynek: 'Budynek apartamentów Aura o zmierzchu, podświetlone balkony na tle sosnowego lasu',
    salon: 'Salon z granatową sofą i wysokim skośnym oknem z widokiem na sosny',
    salonStol: 'Część jadalna salonu z okrągłym drewnianym stołem i czarnymi krzesłami',
    aneks: 'Aneks kuchenny z pełną zabudową szafek, lodówką i blatem roboczym',
    salonZGory: 'Widok z antresoli w dół na salon, sofę i schody',
    sypialnia: 'Sypialnia na antresoli z podwójnym łóżkiem i granatową narzutą',
    sypialniaOkno: 'Sypialnia na antresoli z dużym oknem dachowym',
    lazienka: 'Łazienka z umywalką, lustrem i kabiną prysznicową w granatowych płytkach',
    kosmetyki: 'Zbliżenie na firmowe kosmetyki Aura przy prysznicu',
  },
};
```

**Klucze `alts` odpowiadają zdjęciom, które faktycznie istnieją.** Zadanie 2 obejrzało wszystkie fotografie i poprawiło pięć nazw, które nie zgadzały się z treścią kadru — nie ma zdjęcia jadalni ani balkonu jako osobnych ujęć. Pełna lista plików w `src/assets/`: `budynek-zmierzch`, `salon-okno`, `salon-2`, `salon-3`, `salon-4`, `salon-widok-z-gory`, `aneks-kuchenny`, `sypialnia-antresola`, `sypialnia-2`, `sypialnia-3`, `sypialnia-4`, `sypialnia-5`, `lazienka-1`, `lazienka-2`, `lazienka-kosmetyki`, `lazienka-kosmetyki-2`, `lazienka-kosmetyki-3`.

- [ ] **Krok 4: Napisz treść niemiecką `src/content/de.ts`**

Ta sama struktura, `lang: 'de'`, `htmlLang: 'de-DE'`. Tłumaczenie, nie kalka — niemieckie opisy noclegów są rzeczowe i konkretne. Nazwy własne zostają w brzmieniu polskim z niemieckim dopowiedzeniem przy pierwszym użyciu: `Niechorze`, `Leśna 9`. Frazy docelowe: `Ferienwohnung Niechorze`, `Apartment am Strand Ostsee Polen`, `Unterkunft Niechorze Ostsee`.

Przykład nagłówka i opisu meta:

```ts
meta: {
  title: 'Aura Niechorze — Ferienapartments am Strand',
  description:
    'Maisonette-Apartment für 4 Personen in Niechorze an der polnischen Ostsee, direkt am Strand im Kiefernwald. Balkon mit Meerblick, Klimaanlage, kostenfreier Parkplatz.',
  ogAlt: 'Das Apartmenthaus Aura in Niechorze in der Abenddämmerung, beleuchtete Balkone vor Kiefern',
},
hero: {
  h1: 'Ferienapartments am Strand in Niechorze',
  sub: 'Maisonette-Apartment für vier Personen — direkt am Strand, im Kiefernwald.',
  cta: 'Anrufen',
  scrollHint: 'Weiterscrollen',
},
```

Pozostałe pola przetłumacz analogicznie, zachowując wszystkie klucze z `SiteContent`.

- [ ] **Krok 5: Napisz treść angielską `src/content/en.ts`**

`lang: 'en'`, `htmlLang: 'en-GB'`. Frazy docelowe: `apartments Niechorze Poland`, `beach apartment Baltic Sea Poland`, `holiday apartment Niechorze`.

```ts
meta: {
  title: 'Aura Niechorze — apartments by the beach',
  description:
    'Two-level apartment for 4 guests in Niechorze on the Polish Baltic coast, right by the beach in a pine forest. Sea-view balcony, air conditioning, free parking.',
  ogAlt: 'The Aura apartment building in Niechorze at dusk, lit balconies against pine trees',
},
hero: {
  h1: 'Apartments by the beach in Niechorze',
  sub: 'A two-level apartment for four — right by the beach, in a pine forest.',
  cta: 'Call us',
  scrollHint: 'Scroll for more',
},
```

- [ ] **Krok 6: Utwórz `src/layouts/Base.astro`**

```astro
---
import '@fontsource-variable/outfit/index.css';
import '../styles/tokens.css';
import '../styles/global.css';
import type { SiteContent, Lang } from '../content/types';
import ogImage from '../assets/budynek-zmierzch.webp';
import outfitWoff2 from '@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url';

interface Props { content: SiteContent }
const { content } = Astro.props;

const SITE = 'https://aura-niechorze.pl';
const PATHS: Record<Lang, string> = { pl: '/', de: '/de/', en: '/en/' };
const HREF_LANGS: Record<Lang, string> = { pl: 'pl-PL', de: 'de-DE', en: 'en-GB' };
const canonical = SITE + PATHS[content.lang];
---
<!doctype html>
<html lang={content.htmlLang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{content.meta.title}</title>
    <meta name="description" content={content.meta.description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href={canonical} />
    <link rel="preload" as="font" type="font/woff2" href={outfitWoff2} crossorigin />

    {(['pl', 'de', 'en'] as Lang[]).map((l) => (
      <link rel="alternate" hreflang={HREF_LANGS[l]} href={SITE + PATHS[l]} />
    ))}
    <link rel="alternate" hreflang="x-default" href={SITE + PATHS.pl} />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Aura Niechorze" />
    <meta property="og:title" content={content.meta.title} />
    <meta property="og:description" content={content.meta.description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:locale" content={content.htmlLang.replace('-', '_')} />
    <meta property="og:image" content={SITE + ogImage.src} />
    <meta property="og:image:alt" content={content.meta.ogAlt} />
    <meta name="twitter:card" content="summary_large_image" />
    <slot name="head" />
  </head>
  <body>
    <a class="skip-link" href="#tresc">{content.chrome.skip}</a>
    <slot />
  </body>
</html>
```

Ustalenie z zadania 1: pakiet `@fontsource-variable/outfit@5.3.0` **nie ma** plików `latin.css` ani `latin-ext.css`. Ma `index.css`, który zawiera reguły `@font-face` dla obu subsetów naraz, oraz `wght.css`. Dlatego importujemy wyłącznie `index.css` — jeden import, nie dwa.

Ścieżka do pliku woff2 w imporcie `outfitWoff2` musi istnieć. Sprawdź:

```bash
ls node_modules/@fontsource-variable/outfit/files/ | grep latin | grep -v ext
```

Oczekiwane: plik w rodzaju `outfit-latin-wght-normal.woff2`. Wstaw faktyczną nazwę.

Preloadujemy tylko subset `latin`, mimo że polski nagłówek zawiera „ż" z subsetu `latin-ext`. Powód: elementem LCP jest zdjęcie tła hero, nie tekst, więc font nie leży w ścieżce krytycznej LCP — a dwa preloady fontów odebrałyby pasmo właśnie temu zdjęciu. `font-display: swap` z pakietu fontsource sprawia, że tekst jest widoczny od razu w kroju zastępczym. Zweryfikujesz to pomiarem w zadaniu 12; jeśli okaże się, że LCP wskazuje na nagłówek, dołóż preload subsetu `latin-ext`.

- [ ] **Krok 7: Utwórz trzy strony**

`src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import { pl } from '../content/pl';
---
<Base content={pl}>
  <main id="tresc"><h1>{pl.hero.h1}</h1></main>
</Base>
```

`src/pages/de/index.astro`:

```astro
---
import Base from '../../layouts/Base.astro';
import { de } from '../../content/de';
---
<Base content={de}>
  <main id="tresc"><h1>{de.hero.h1}</h1></main>
</Base>
```

`src/pages/en/index.astro`: analogicznie, z `en`.

- [ ] **Krok 8: Napisz testy i18n i meta**

Zamień zawartość `tests/build-output.test.js` na poniższą (zachowując eksport `doc` i odznaczając `it.skip` z zadania 2):

```js
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { parseHTML } from 'linkedom';

function doc(path) {
  expect(existsSync(path), `brak pliku ${path} — czy build się wykonał?`).toBe(true);
  return parseHTML(readFileSync(path, 'utf8')).document;
}

const PAGES = [
  { path: 'dist/index.html', lang: 'pl-PL', url: 'https://aura-niechorze.pl/' },
  { path: 'dist/de/index.html', lang: 'de-DE', url: 'https://aura-niechorze.pl/de/' },
  { path: 'dist/en/index.html', lang: 'en-GB', url: 'https://aura-niechorze.pl/en/' },
];

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

  it('nie zawiera słowa „pensjonat"', () => {
    expect(readFileSync(path, 'utf8').toLowerCase()).not.toContain('pensjonat');
  });
});
```

- [ ] **Krok 9: Napisz test kompletności tłumaczeń**

To jest zabezpieczenie przed najczęstszym błędem przy trzech językach: brakującym kluczem albo polskim tekstem, który został w wersji obcojęzycznej. Utwórz `tests/content-parity.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { pl } from '../src/content/pl.ts';
import { de } from '../src/content/de.ts';
import { en } from '../src/content/en.ts';

function paths(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? paths(v, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );
}

describe('tłumaczenia są kompletne', () => {
  it.each([['de', de], ['en', en]])('%s ma dokładnie te same klucze co pl', (_, other) => {
    expect(paths(other).sort()).toEqual(paths(pl).sort());
  });

  it.each([['de', de], ['en', en]])('%s ma tyle samo pozycji w listach co pl', (_, other) => {
    expect(other.about.stats.length).toBe(pl.about.stats.length);
    expect(other.apartment.amenities.length).toBe(pl.apartment.amenities.length);
    expect(other.apartment.rules.length).toBe(pl.apartment.rules.length);
    expect(other.area.distances.length).toBe(pl.area.distances.length);
    expect(other.area.attractions.length).toBe(pl.area.attractions.length);
    expect(other.chrome.slideNames.length).toBe(pl.chrome.slideNames.length);
  });

  it.each([['de', de], ['en', en]])('%s nie zawiera polskich znaków w tekstach interfejsu', (_, other) => {
    const suspicious = ['ą', 'ę', 'ć', 'ń', 'ś', 'ź', 'ż', 'ó', 'ł'];
    const texts = [
      other.hero.h1, other.hero.sub, other.hero.cta,
      other.about.h2, other.about.lead, other.about.body,
      other.apartment.h2, other.apartment.lead,
      other.area.h2, other.area.lead,
      other.contact.h2, other.contact.lead,
      ...other.apartment.amenities,
      ...other.apartment.rules,
    ].join(' ').toLowerCase();
    // wyjątek: nazwy własne Leśna i Kołobrzeg zostają w oryginale, więc
    // sprawdzamy tylko teksty interfejsu, gdzie nazw własnych nie ma
    for (const ch of suspicious) {
      expect(texts, `podejrzany polski znak "${ch}" w wersji ${_}`).not.toContain(ch);
    }
  });
});
```

Vitest domyślnie nie czyta TypeScriptu z rozszerzeniem w imporcie — jeśli import zgłosi błąd, usuń `.ts` ze ścieżek albo dodaj `resolve: { extensions: ['.ts', '.js'] }` w `vitest.config.js`.

- [ ] **Krok 10: Uruchom testy**

```bash
npm run test
```

Oczekiwane: 24 testy z `build-output` (8 × 3 strony) plus 6 z `content-parity`, wszystkie na zielono.

- [ ] **Krok 11: Commit**

```bash
git add -A
git commit -m "feat: treść w trzech językach, layout bazowy, hreflang i meta"
```

---

### Task 4 — Dane strukturalne, sitemap, robots

**Pliki:**
- Utwórz: `src/components/StructuredData.astro`
- Modyfikuj: `src/layouts/Base.astro`
- Utwórz: `public/robots.txt`
- Modyfikuj: `tests/build-output.test.js`

**Interfejsy:**
- Konsumuje: `FACTS`, `hasFact` z zadania 3.
- Produkuje: skrypt `application/ld+json` typu `LodgingBusiness` w `<head>` każdej strony.

- [ ] **Krok 1: Napisz test danych strukturalnych (najpierw test)**

Dodaj do `tests/build-output.test.js`, wewnątrz bloku `describe.each(PAGES)`:

```js
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
```

- [ ] **Krok 2: Uruchom test i potwierdź, że nie przechodzi**

```bash
npm run test
```

Oczekiwane: FAIL — `expect(el).not.toBeNull()` nie znajduje skryptu JSON-LD.

- [ ] **Krok 3: Utwórz `src/components/StructuredData.astro`**

```astro
---
import { FACTS, hasFact } from '../content/facts';
import type { SiteContent } from '../content/types';
import ogImage from '../assets/budynek-zmierzch.webp';

interface Props { content: SiteContent; canonical: string }
const { content, canonical } = Astro.props;

const amenities = [
  'Klimatyzacja', 'Bezpłatne WiFi', 'Bezpłatny parking', 'Balkon z widokiem na morze',
  'Aneks kuchenny', 'Prywatna łazienka', 'Telewizor', 'Ogród', 'Taras',
].map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true }));

const data = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: FACTS.name,
  description: content.meta.description,
  url: canonical,
  telephone: FACTS.phoneHref.replace('tel:', ''),
  image: 'https://aura-niechorze.pl' + ogImage.src,
  address: {
    '@type': 'PostalAddress',
    streetAddress: FACTS.street,
    postalCode: FACTS.postalCode,
    addressLocality: FACTS.city,
    addressRegion: FACTS.region,
    addressCountry: FACTS.country,
  },
  checkinTime: FACTS.checkinFrom,
  checkoutTime: FACTS.checkoutTo,
  petsAllowed: true,
  smokingAllowed: false,
  numberOfRooms: 1,
  amenityFeature: amenities,
  ...(hasFact(FACTS.facebookUrl) ? { sameAs: [FACTS.facebookUrl] } : {}),
};
---
<script type="application/ld+json" set:html={JSON.stringify(data)} is:inline />
```

Zwróć uwagę na `...(hasFact(...) ? {...} : {})` — klucz `sameAs` w ogóle nie powstaje, dopóki adres Facebooka jest niepotwierdzony. To jest wzorzec obowiązujący dla wszystkich danych z `null`.

- [ ] **Krok 4: Podłącz komponent w `Base.astro`**

Dodaj import na górze bloku frontmatter:

```astro
import StructuredData from '../components/StructuredData.astro';
```

i przed `<slot name="head" />`:

```astro
    <StructuredData content={content} canonical={canonical} />
```

- [ ] **Krok 5: Utwórz `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://aura-niechorze.pl/sitemap-index.xml
```

- [ ] **Krok 6: Uruchom testy i sprawdź sitemap**

```bash
npm run test
ls dist/sitemap*
cat dist/sitemap-0.xml
```

Oczekiwane: testy na zielono, w `dist/` są `sitemap-index.xml` i `sitemap-0.xml`, a w tym drugim trzy adresy z wpisami `xhtml:link` dla każdego języka.

- [ ] **Krok 7: Commit**

```bash
git add -A
git commit -m "feat: dane strukturalne LodgingBusiness, sitemap i robots"
```

---

### Task 5 — Ramka slajdów, stała warstwa i nawigacja

**Pliki:**
- Utwórz: `src/components/Slide.astro`
- Utwórz: `src/components/Chrome.astro`
- Utwórz: `src/components/SlideNav.astro`
- Modyfikuj: `src/styles/global.css`
- Modyfikuj: `src/pages/index.astro`, `src/pages/de/index.astro`, `src/pages/en/index.astro`
- Modyfikuj: `tests/build-output.test.js`

**Interfejsy:**
- Konsumuje: `SiteContent`, `Logo.astro`, `FACTS`.
- Produkuje: `Slide.astro` z propsami `{ id: string; variant?: 'photo'|'white'|'mist'|'navy' }` — renderuje `<section id={id} aria-labelledby={id + '-title'}>`. Nagłówek slajdu **musi** mieć `id={id + '-title'}`.
- Produkuje: `Chrome.astro` z propsem `{ content: SiteContent }`.
- Produkuje: `SlideNav.astro` z propsami `{ ids: string[]; names: string[]; label: string }`.
- Ustala identyfikatory slajdów używane we wszystkich kolejnych zadaniach: `start`, `obiekt`, `apartament`, `okolica`, `kontakt`.

- [ ] **Krok 1: Napisz testy struktury slajdów (najpierw test)**

Dodaj do bloku `describe.each(PAGES)`:

```js
  it('ma pięć sekcji-slajdów o ustalonych identyfikatorach', () => {
    const ids = [...doc(path).querySelectorAll('main section')].map((s) => s.id);
    expect(ids).toEqual(['start', 'obiekt', 'apartament', 'okolica', 'kontakt']);
  });

  it('każdy slajd ma nagłówek powiązany przez aria-labelledby', () => {
    const d = doc(path);
    for (const s of d.querySelectorAll('main section')) {
      const ref = s.getAttribute('aria-labelledby');
      expect(ref, `sekcja #${s.id} bez aria-labelledby`).toBe(`${s.id}-title`);
      expect(d.getElementById(ref), `brak nagłówka #${ref}`).not.toBeNull();
    }
  });

  it('kolejność nagłówków to jedno h1 i cztery h2', () => {
    const levels = [...doc(path).querySelectorAll('main h1, main h2')].map((h) => h.tagName);
    expect(levels).toEqual(['H1', 'H2', 'H2', 'H2', 'H2']);
  });

  it('ma nawigację z kotwicami do wszystkich slajdów', () => {
    const hrefs = [...doc(path).querySelectorAll('nav a')].map((a) => a.getAttribute('href'));
    for (const id of ['start', 'obiekt', 'apartament', 'okolica', 'kontakt']) {
      expect(hrefs).toContain(`#${id}`);
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
```

- [ ] **Krok 2: Uruchom testy i potwierdź, że nie przechodzą**

```bash
npm run test
```

Oczekiwane: FAIL — brak sekcji, nawigacji i telefonu.

- [ ] **Krok 3: Dopisz style slajdów do `src/styles/global.css`**

```css
.slides {
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
.slide {
  min-height: 100dvh;
  scroll-snap-align: start;
  display: grid;
  align-content: center;
  padding: clamp(4rem, 12vh, 8rem) clamp(1.25rem, 6vw, 6rem);
  position: relative;
}
.slide__inner { width: min(100%, 78rem); margin-inline: auto; }
.slide--white { background: var(--white); color: var(--navy); }
.slide--mist  { background: var(--mist);  color: var(--navy); }
.slide--navy  { background: var(--navy-deep); color: var(--white); }
.slide--photo { color: var(--white); }

@media (prefers-reduced-motion: reduce) {
  .slides { scroll-behavior: auto; }
}
```

Nie wyłączamy `scroll-snap` przy `prefers-reduced-motion` — samo zatrzymywanie na sekcji nie jest animacją. Wyłączamy wyłącznie płynne przewijanie, które nią jest.

- [ ] **Krok 4: Utwórz `src/components/WaveMark.astro` i `src/components/Slide.astro`**

Specyfikacja wymaga, żeby fala z logo wracała w trzech miejscach: przy wyjściu z intro, jako separator na styku slajdów i jako sygnatura w stopce. To jest ten drugi przypadek.

`src/components/WaveMark.astro` — pojedyncza, uproszczona krzywa (nie całe logo, bo w roli separatora byłoby natrętne):

```astro
---
interface Props { fill: string }
const { fill } = Astro.props;
---
<svg class="wavemark" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <path d="M0,52 C240,4 480,88 720,52 C960,16 1200,84 1440,40 L1440,0 L0,0 Z" fill={fill} />
</svg>

<style>
  .wavemark {
    position: absolute; inset: 0 0 auto 0;
    width: 100%; height: clamp(38px, 5vw, 78px);
    display: block; pointer-events: none;
  }
</style>
```

`src/components/Slide.astro` — separator rysuje kolorem tła slajdu poprzedniego, dzięki czemu poprzedni slajd „wlewa się" falą w kolejny:

```astro
---
import WaveMark from './WaveMark.astro';

interface Props {
  id: string;
  variant?: 'photo' | 'white' | 'mist' | 'navy';
  class?: string;
  waveFrom?: 'white' | 'mist' | 'navy' | null;
}
const { id, variant = 'white', class: cls = '', waveFrom = null } = Astro.props;

const FILL = {
  white: 'var(--white)',
  mist: 'var(--mist)',
  navy: 'var(--navy-deep)',
};
---
<section id={id} aria-labelledby={`${id}-title`} class:list={['slide', `slide--${variant}`, cls]}>
  {waveFrom && <WaveMark fill={FILL[waveFrom]} />}
  <div class="slide__inner"><slot /></div>
</section>
```

Slajd otwierający i slajdy ze zdjęciem w tle nie dostają separatora — `waveFrom` zostaje wtedy pominięte. Wartości dla pozostałych ustawisz przy składaniu stron w kroku 7: `obiekt` dostaje `waveFrom="navy"` (bo hero jest ciemny), `apartament` — `waveFrom="mist"`, `okolica` — `waveFrom="navy"`, `kontakt` — `waveFrom="white"`.

- [ ] **Krok 5: Utwórz `src/components/Chrome.astro`**

```astro
---
import Logo from './Logo.astro';
import { FACTS } from '../content/facts';
import type { SiteContent, Lang } from '../content/types';

interface Props { content: SiteContent }
const { content } = Astro.props;
const PATHS: Record<Lang, string> = { pl: '/', de: '/de/', en: '/en/' };
const HREF_LANGS: Record<Lang, string> = { pl: 'pl-PL', de: 'de-DE', en: 'en-GB' };
const others = (['pl', 'de', 'en'] as Lang[]).filter((l) => l !== content.lang);
---
<header class="chrome">
  <a class="chrome__logo" href={PATHS[content.lang]} aria-label={FACTS.name}>
    <Logo variant="white" />
  </a>

  <nav class="chrome__lang" aria-label={content.chrome.langLabel}>
    <span aria-current="true" class="chrome__lang-current">{content.lang.toUpperCase()}</span>
    {others.map((l) => (
      <a href={PATHS[l]} hreflang={HREF_LANGS[l]} lang={HREF_LANGS[l]}>
        <span class="visually-hidden">{content.chrome.langNames[l]}</span>
        <span aria-hidden="true">{l.toUpperCase()}</span>
      </a>
    ))}
  </nav>

  <a class="chrome__call" href={FACTS.phoneHref}>
    <span class="visually-hidden">{content.chrome.callLabel}: </span>
    {FACTS.phoneDisplay}
  </a>
</header>

<style>
  .chrome {
    position: fixed; inset: 0 0 auto 0; z-index: 20;
    display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-2) clamp(1.25rem, 6vw, 6rem);
    color: var(--white);
    pointer-events: none;
  }
  .chrome > * { pointer-events: auto; }
  .chrome__logo { width: clamp(74px, 8vw, 108px); margin-inline-end: auto; }
  .chrome__lang { display: flex; gap: 0.15rem; font-size: 0.82rem; font-weight: 600; }
  .chrome__lang a, .chrome__lang-current {
    display: grid; place-items: center; min-width: 2.25rem; min-height: 2.25rem;
    border-radius: var(--radius-pill); text-decoration: none;
  }
  .chrome__lang-current { background: rgba(255,255,255,0.22); }
  .chrome__lang a:hover { background: rgba(255,255,255,0.12); }
  .chrome__call {
    border: 1px solid rgba(255,255,255,0.75); border-radius: var(--radius-pill);
    padding: 0.6rem 1.15rem; font-weight: 600; text-decoration: none; white-space: nowrap;
  }
  .chrome__call:hover { background: var(--white); color: var(--navy); }

  @media (max-width: 40rem) {
    .chrome__call {
      position: fixed; inset: auto 0 0 0; z-index: 30;
      border: 0; border-radius: 0; text-align: center;
      background: var(--navy); color: var(--white);
      padding: 1rem; font-size: 1.05rem;
    }
  }
</style>
```

Uwaga na kontrast: stała warstwa jest biała, więc slajdy z jasnym tłem muszą mieć własne przyciemnienie pod nagłówkiem albo warstwa musi zmieniać kolor. Rozwiązanie w zadaniu 12, krok 3 — na razie zostaw białą i zanotuj.

- [ ] **Krok 6: Utwórz `src/components/SlideNav.astro`**

```astro
---
interface Props { ids: string[]; names: string[]; label: string }
const { ids, names, label } = Astro.props;
---
<nav class="dots" aria-label={label}>
  <ul>
    {ids.map((id, i) => (
      <li>
        <a href={`#${id}`} data-dot={id}>
          <span class="visually-hidden">{names[i]}</span>
          <span class="dots__mark" aria-hidden="true"></span>
        </a>
      </li>
    ))}
  </ul>
</nav>

<style>
  .dots { position: fixed; right: clamp(0.75rem, 2vw, 1.75rem); top: 50%; transform: translateY(-50%); z-index: 20; }
  .dots ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.35rem; }
  .dots a { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; }
  .dots__mark {
    width: 7px; height: 7px; border-radius: 50%;
    background: currentColor; opacity: 0.35; transition: opacity .25s, transform .25s;
  }
  .dots a[aria-current="true"] .dots__mark { opacity: 1; transform: scale(1.5); }
  @media (prefers-reduced-motion: reduce) { .dots__mark { transition: none; } }
  @media (max-width: 40rem) { .dots { display: none; } }
</style>

<script>
  const links = document.querySelectorAll('.dots a');
  const byId = new Map([...links].map((a) => [a.dataset.dot, a]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        for (const a of links) a.removeAttribute('aria-current');
        byId.get(e.target.id)?.setAttribute('aria-current', 'true');
      }
    },
    { threshold: 0.55 }
  );
  for (const id of byId.keys()) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
</script>
```

- [ ] **Krok 7: Złóż strony ze slajdami-zaślepkami**

`src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Chrome from '../components/Chrome.astro';
import Slide from '../components/Slide.astro';
import SlideNav from '../components/SlideNav.astro';
import { pl as c } from '../content/pl';

const IDS = ['start', 'obiekt', 'apartament', 'okolica', 'kontakt'];
---
<Base content={c}>
  <Chrome content={c} />
  <SlideNav ids={IDS} names={c.chrome.slideNames} label={c.chrome.navLabel} />
  <main id="tresc" class="slides">
    <Slide id="start" variant="navy"><h1 id="start-title">{c.hero.h1}</h1></Slide>
    <Slide id="obiekt" variant="mist" waveFrom="navy"><h2 id="obiekt-title">{c.about.h2}</h2></Slide>
    <Slide id="apartament" variant="navy" waveFrom="mist"><h2 id="apartament-title">{c.apartment.h2}</h2></Slide>
    <Slide id="okolica" variant="white" waveFrom="navy"><h2 id="okolica-title">{c.area.h2}</h2></Slide>
    <Slide id="kontakt" variant="navy" waveFrom="white"><h2 id="kontakt-title">{c.contact.h2}</h2></Slide>
  </main>
</Base>
```

Powtórz w `de/index.astro` i `en/index.astro`, zmieniając wyłącznie import treści (`de as c`, `en as c`) i głębokość ścieżek względnych.

- [ ] **Krok 8: Uruchom testy**

```bash
npm run test
```

Oczekiwane: wszystkie testy na zielono.

- [ ] **Krok 9: Sprawdź ręcznie zachowanie przewijania**

```bash
npm run dev
```

Otwórz `http://localhost:4321/`, sprawdź: kółko myszy zatrzymuje się na kolejnych slajdach; Tab przechodzi przez skip link, logo, języki, telefon i kropki; strzałka w dół i PageDown przewijają; klik w kropkę przeskakuje do slajdu; aktywna kropka się powiększa.

- [ ] **Krok 10: Commit**

```bash
git add -A
git commit -m "feat: ramka slajdów na scroll-snap, stała warstwa i nawigacja kropkowa"
```

---

### Task 6 — Slajd 1 — Otwarcie

**Pliki:**
- Utwórz: `src/components/slides/Hero.astro`
- Modyfikuj: trzy pliki stron
- Modyfikuj: `tests/build-output.test.js`

**Interfejsy:**
- Konsumuje: `Slide.astro`, `SiteContent`, `FACTS`, zdjęcie `src/assets/budynek-zmierzch.webp`.
- Produkuje: `Hero.astro` z propsem `{ content: SiteContent }`, renderujący `<h1 id="start-title">`.

- [ ] **Krok 1: Napisz test (najpierw test)**

Dodaj do bloku `describe.each(PAGES)`:

```js
  it('slajd otwierający ma zdjęcie z srcset, wymiarami i priorytetem', () => {
    const img = doc(path).querySelector('#start img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('srcset')).toBeTruthy();
    expect(img.getAttribute('width')).toBeTruthy();
    expect(img.getAttribute('height')).toBeTruthy();
    expect(img.getAttribute('alt').length).toBeGreaterThan(20);
    expect(img.getAttribute('loading')).not.toBe('lazy');
  });

  it('slajd otwierający ma przycisk telefonu', () => {
    const cta = doc(path).querySelector('#start a[href^="tel:"]');
    expect(cta).not.toBeNull();
  });
```

- [ ] **Krok 2: Uruchom test i potwierdź, że nie przechodzi**

```bash
npm run test
```

Oczekiwane: FAIL — `#start img` nie istnieje.

- [ ] **Krok 3: Utwórz `src/components/slides/Hero.astro`**

```astro
---
import { Picture } from 'astro:assets';
import Slide from '../Slide.astro';
import { FACTS } from '../../content/facts';
import type { SiteContent } from '../../content/types';
import budynek from '../../assets/budynek-zmierzch.webp';

interface Props { content: SiteContent }
const { content } = Astro.props;
---
<Slide id="start" variant="photo" class="hero">
  <Picture
    src={budynek}
    formats={['avif', 'webp']}
    widths={[640, 1024, 1600, 2400]}
    sizes="100vw"
    alt={content.alts.budynek}
    loading="eager"
    fetchpriority="high"
    class="hero__bg"
  />
  <div class="hero__copy">
    <h1 id="start-title">{content.hero.h1}</h1>
    <p class="hero__sub">{content.hero.sub}</p>
    <a class="hero__cta" href={FACTS.phoneHref}>
      {content.hero.cta}
      <span aria-hidden="true"> · {FACTS.phoneDisplay}</span>
    </a>
  </div>
  <p class="hero__hint" aria-hidden="true">{content.hero.scrollHint}</p>
</Slide>

<style>
  .hero { padding-block-end: clamp(6rem, 16vh, 10rem); }
  .hero :global(.hero__bg) {
    position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2;
  }
  .hero::before {
    content: ''; position: absolute; inset: 0; z-index: -1;
    background: linear-gradient(180deg, rgba(2,64,118,.62) 0%, rgba(2,64,118,.28) 42%, rgba(2,64,118,.82) 100%);
  }
  .hero__copy { max-width: 22ch; }
  h1 { font-size: var(--step-5); }
  .hero__sub { margin-top: var(--space-2); font-size: var(--step-1); max-width: var(--measure); opacity: .92; }
  .hero__cta {
    display: inline-block; margin-top: var(--space-3);
    background: var(--white); color: var(--navy);
    padding: 0.9rem 1.9rem; border-radius: var(--radius-pill);
    font-weight: 600; text-decoration: none;
  }
  .hero__cta:hover { background: var(--sky); }
  .hero__hint {
    position: absolute; inset: auto 0 var(--space-3) 0; text-align: center;
    font-size: 0.78rem; letter-spacing: .16em; text-transform: uppercase; opacity: .7;
  }
</style>
```

- [ ] **Krok 4: Podłącz w trzech stronach**

W każdej stronie zamień zaślepkę `<Slide id="start" …>` na `<Hero content={c} />` i dodaj import.

- [ ] **Krok 5: Uruchom testy**

```bash
npm run test
```

Oczekiwane: zielono. Sprawdź też w `dist/index.html`, że `<source>` zawiera warianty `image/avif`.

- [ ] **Krok 6: Commit**

```bash
git add -A
git commit -m "feat: slajd otwierający ze zdjęciem budynku i przyciskiem telefonu"
```

---

### Task 7 — Slajdy 2 i 4 — O obiekcie oraz Okolica

**Pliki:**
- Utwórz: `src/components/slides/About.astro`
- Utwórz: `src/components/slides/Area.astro`
- Modyfikuj: trzy pliki stron
- Modyfikuj: `tests/build-output.test.js`

**Interfejsy:**
- Konsumuje: `Slide.astro`, `SiteContent`, zdjęcie `src/assets/salon-okno.webp`.
- Produkuje: `About.astro` i `Area.astro`, obydwa z propsem `{ content: SiteContent }`, renderujące `<h2 id="obiekt-title">` i `<h2 id="okolica-title">`.

- [ ] **Krok 1: Napisz testy (najpierw testy)**

```js
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
```

- [ ] **Krok 2: Uruchom testy i potwierdź, że nie przechodzą**

```bash
npm run test
```

Oczekiwane: FAIL.

- [ ] **Krok 3: Utwórz `src/components/slides/About.astro`**

```astro
---
import { Picture } from 'astro:assets';
import Slide from '../Slide.astro';
import type { SiteContent } from '../../content/types';
import salon from '../../assets/salon-okno.webp';

interface Props { content: SiteContent }
const { content } = Astro.props;
---
<Slide id="obiekt" variant="mist" waveFrom="navy" class="about">
  <div class="about__grid">
    <div>
      <h2 id="obiekt-title">{content.about.h2}</h2>
      <p class="about__lead">{content.about.lead}</p>
      <p class="about__body">{content.about.body}</p>
      <dl class="about__stats">
        {content.about.stats.map((s) => (
          <div class="stat">
            <dt class="stat__label">{s.label}</dt>
            <dd class="stat__value">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
    <Picture
      src={salon}
      formats={['avif', 'webp']}
      widths={[480, 800, 1200]}
      sizes="(max-width: 60rem) 100vw, 44vw"
      alt={content.alts.salon}
      loading="lazy"
      class="about__photo"
    />
  </div>
</Slide>

<style>
  .about__grid { display: grid; gap: clamp(2rem, 5vw, 4rem); align-items: center; }
  @media (min-width: 60rem) { .about__grid { grid-template-columns: 1fr 1fr; } }
  h2 { font-size: var(--step-4); }
  .about__lead { margin-top: var(--space-2); font-size: var(--step-1); }
  .about__body { margin-top: var(--space-2); max-width: 46ch; }
  .about__stats { display: flex; flex-wrap: wrap; gap: var(--space-3); margin: var(--space-4) 0 0; }
  .stat { display: flex; flex-direction: column-reverse; }
  .stat__value { margin: 0; font-size: var(--step-3); font-weight: 200; line-height: 1; }
  .stat__label { font-size: 0.78rem; letter-spacing: .12em; text-transform: uppercase; opacity: .65; margin-top: .35rem; }
  .about :global(.about__photo) { width: 100%; height: auto; border-radius: 2px; }
</style>
```

Zwróć uwagę na `flex-direction: column-reverse` w `.stat`: w HTML `<dt>` (etykieta) poprzedza `<dd>` (wartość), bo tego wymaga poprawna semantyka listy definicji, ale wizualnie liczba ma być nad podpisem.

- [ ] **Krok 4: Utwórz `src/components/slides/Area.astro`**

```astro
---
import Slide from '../Slide.astro';
import type { SiteContent } from '../../content/types';

interface Props { content: SiteContent }
const { content } = Astro.props;
---
<Slide id="okolica" variant="white" waveFrom="navy" class="area">
  <h2 id="okolica-title">{content.area.h2}</h2>
  <p class="area__lead">{content.area.lead}</p>

  <div class="area__grid">
    <div>
      <h3 class="area__sub">{content.area.distancesLabel}</h3>
      <dl class="area__distances">
        {content.area.distances.map((d) => (
          <div class="distance">
            <dt>{d.name}</dt>
            <dd>{d.value}</dd>
          </div>
        ))}
      </dl>
    </div>
    <ul class="area__attractions">
      {content.area.attractions.map((a) => (
        <li class="attraction">
          <h3>{a.name}</h3>
          <p>{a.text}</p>
        </li>
      ))}
    </ul>
  </div>
</Slide>

<style>
  h2 { font-size: var(--step-4); }
  .area__lead { margin-top: var(--space-2); font-size: var(--step-1); max-width: var(--measure); }
  .area__grid { display: grid; gap: clamp(2rem, 5vw, 4rem); margin-top: var(--space-4); }
  @media (min-width: 60rem) { .area__grid { grid-template-columns: 1fr 1fr; } }
  .area__sub, .attraction h3 { font-size: 0.78rem; letter-spacing: .12em; text-transform: uppercase; opacity: .65; font-weight: 600; }
  .area__distances { margin: var(--space-2) 0 0; }
  .distance {
    display: flex; justify-content: space-between; gap: var(--space-2);
    padding: 0.6rem 0; border-bottom: 1px solid rgba(4,71,122,.14);
  }
  .distance dt { margin: 0; }
  .distance dd { margin: 0; font-weight: 600; white-space: nowrap; }
  .area__attractions { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-3); align-content: start; }
  .attraction h3 { margin-bottom: .3rem; opacity: 1; color: var(--navy); }
  .attraction p { max-width: 44ch; }
</style>
```

Odległości do latarni, kolejki i oceanarium są niepotwierdzone, więc atrakcje mają wyłącznie opis, bez liczb. Po potwierdzeniu dopisz je do `FACTS` i rozszerz `Attraction` o pole `distance`.

- [ ] **Krok 5: Podłącz oba slajdy w trzech stronach, uruchom testy**

```bash
npm run test
```

- [ ] **Krok 6: Commit**

```bash
git add -A
git commit -m "feat: slajdy o obiekcie i o okolicy"
```

---

### Task 8 — Slajd 3 — Apartament z galerią

**Pliki:**
- Utwórz: `src/components/Gallery.astro`
- Utwórz: `src/components/slides/Apartment.astro`
- Modyfikuj: trzy pliki stron
- Modyfikuj: `tests/build-output.test.js`

**Interfejsy:**
- Konsumuje: `Slide.astro`, `SiteContent`.
- Produkuje: `Gallery.astro` z propsami `{ images: { src: ImageMetadata; alt: string }[]; labels: SiteContent['apartment']['gallery'] }`.

- [ ] **Krok 1: Napisz testy (najpierw testy)**

```js
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
```

- [ ] **Krok 2: Uruchom testy i potwierdź, że nie przechodzą**

```bash
npm run test
```

- [ ] **Krok 3: Utwórz `src/components/Gallery.astro`**

```astro
---
import { Picture } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { SiteContent } from '../content/types';

interface Props {
  images: { src: ImageMetadata; alt: string }[];
  labels: SiteContent['apartment']['gallery'];
}
const { images, labels } = Astro.props;
---
<div class="gallery" data-gallery>
  <ul class="gallery__grid">
    {images.map((img, i) => (
      <li>
        <button type="button" class="gallery__item" data-index={i} aria-label={`${labels.open}: ${img.alt}`}>
          <Picture
            src={img.src}
            formats={['avif', 'webp']}
            widths={[280, 560, 840]}
            sizes="(max-width: 40rem) 45vw, 22vw"
            alt={img.alt}
            loading="lazy"
          />
        </button>
      </li>
    ))}
  </ul>

  <dialog class="gallery__dialog" aria-label={labels.label}>
    <figure>
      <img data-gallery-image src="" alt="" />
      <figcaption data-gallery-caption></figcaption>
    </figure>
    <button type="button" data-gallery-prev aria-label={labels.prev}>&#8592;</button>
    <button type="button" data-gallery-next aria-label={labels.next}>&#8594;</button>
    <button type="button" data-gallery-close aria-label={labels.close}>&#215;</button>
  </dialog>
</div>

<script>
  for (const root of document.querySelectorAll('[data-gallery]')) {
    const buttons = [...root.querySelectorAll('.gallery__item')];
    const dialog = root.querySelector('dialog');
    const image = root.querySelector('[data-gallery-image]');
    const caption = root.querySelector('[data-gallery-caption]');
    let current = 0;
    let opener = null;

    const sources = buttons.map((b) => {
      const img = b.querySelector('img');
      return { src: img.currentSrc || img.src, srcset: img.srcset, alt: img.alt };
    });

    function show(i) {
      current = (i + sources.length) % sources.length;
      const s = sources[current];
      image.src = s.src;
      image.srcset = s.srcset;
      image.alt = s.alt;
      caption.textContent = s.alt;
    }

    buttons.forEach((b, i) =>
      b.addEventListener('click', () => {
        opener = b;
        show(i);
        dialog.showModal();
      })
    );

    root.querySelector('[data-gallery-prev]').addEventListener('click', () => show(current - 1));
    root.querySelector('[data-gallery-next]').addEventListener('click', () => show(current + 1));
    root.querySelector('[data-gallery-close]').addEventListener('click', () => dialog.close());

    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    });

    dialog.addEventListener('close', () => opener?.focus());
  }
</script>

<style>
  .gallery__grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 48rem) { .gallery__grid { grid-template-columns: repeat(4, 1fr); } }
  .gallery__item { padding: 0; border: 0; background: none; cursor: pointer; display: block; width: 100%; }
  .gallery__item :global(img) { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
  .gallery__item:hover :global(img) { opacity: .85; }

  .gallery__dialog { border: 0; padding: 0; background: var(--navy-deep); max-width: 96vw; max-height: 92dvh; color: var(--white); }
  .gallery__dialog::backdrop { background: rgba(2,64,118,.92); }
  .gallery__dialog figure { margin: 0; }
  .gallery__dialog img { max-height: 78dvh; width: auto; margin-inline: auto; }
  .gallery__dialog figcaption { padding: .85rem 1.25rem; font-size: .85rem; opacity: .85; max-width: 60ch; }
  .gallery__dialog button {
    position: absolute; background: rgba(255,255,255,.14); color: var(--white);
    border: 0; border-radius: 50%; width: 2.75rem; height: 2.75rem; font-size: 1.2rem; cursor: pointer;
  }
  .gallery__dialog button:hover { background: rgba(255,255,255,.28); }
  [data-gallery-prev] { left: .75rem; top: 50%; }
  [data-gallery-next] { right: .75rem; top: 50%; }
  [data-gallery-close] { right: .75rem; top: .75rem; }
</style>
```

Element `<dialog>` z `showModal()` daje pułapkę focusu i zamykanie klawiszem Escape natywnie — nie piszemy tego ręcznie.

- [ ] **Krok 4: Utwórz `src/components/slides/Apartment.astro`**

```astro
---
import Slide from '../Slide.astro';
import Gallery from '../Gallery.astro';
import type { SiteContent } from '../../content/types';
import salon from '../../assets/salon-okno.webp';
import salonStol from '../../assets/salon-2.webp';
import aneks from '../../assets/aneks-kuchenny.webp';
import salonZGory from '../../assets/salon-widok-z-gory.webp';
import sypialnia from '../../assets/sypialnia-antresola.webp';
import sypialniaOkno from '../../assets/sypialnia-4.webp';
import lazienka from '../../assets/lazienka-1.webp';
import kosmetyki from '../../assets/lazienka-kosmetyki.webp';

interface Props { content: SiteContent }
const { content } = Astro.props;

const images = [
  { src: salon, alt: content.alts.salon },
  { src: salonStol, alt: content.alts.salonStol },
  { src: aneks, alt: content.alts.aneks },
  { src: salonZGory, alt: content.alts.salonZGory },
  { src: sypialnia, alt: content.alts.sypialnia },
  { src: sypialniaOkno, alt: content.alts.sypialniaOkno },
  { src: lazienka, alt: content.alts.lazienka },
  { src: kosmetyki, alt: content.alts.kosmetyki },
];
---
<Slide id="apartament" variant="navy" waveFrom="mist" class="apt">
  <h2 id="apartament-title">{content.apartment.h2}</h2>
  <p class="apt__lead">{content.apartment.lead}</p>

  <Gallery images={images} labels={content.apartment.gallery} />

  <div class="apt__cols">
    <ul class="apt__amenities">
      {content.apartment.amenities.map((a) => <li class="amenity">{a}</li>)}
    </ul>
    <ul class="apt__rules">
      {content.apartment.rules.map((r) => <li class="rule">{r}</li>)}
    </ul>
  </div>
</Slide>

<style>
  h2 { font-size: var(--step-4); }
  .apt__lead { margin-top: var(--space-2); font-size: var(--step-1); max-width: var(--measure); }
  .apt :global(.gallery) { margin-top: var(--space-3); }
  .apt__cols { display: grid; gap: var(--space-3); margin-top: var(--space-3); }
  @media (min-width: 60rem) { .apt__cols { grid-template-columns: 2fr 1fr; } }
  .apt__amenities, .apt__rules { list-style: none; margin: 0; padding: 0; }
  .apt__amenities { display: flex; flex-wrap: wrap; gap: .45rem; }
  .amenity { border: 1px solid rgba(255,255,255,.35); border-radius: var(--radius-pill); padding: .35rem .9rem; font-size: .86rem; }
  .apt__rules { display: grid; gap: .3rem; font-size: .86rem; opacity: .85; }
</style>
```

Każde z ośmiu zdjęć w galerii ma własny, odrębny `alt` — żaden klucz nie jest użyty dwa razy. Zestaw dobrany tak, żeby pokazać wszystkie pomieszczenia bez powtarzania tego samego ujęcia: dwa kadry salonu, aneks, widok z antresoli, dwa kadry sypialni, łazienka i detal kosmetyków. Pozostałe dziewięć fotografii z `src/assets/` to alternatywne ujęcia tych samych wnętrz i celowo nie trafiają do galerii — więcej zdjęć tego samego pokoju to więcej kilobajtów, nie więcej informacji.

- [ ] **Krok 5: Podłącz w trzech stronach, uruchom testy**

```bash
npm run test
```

- [ ] **Krok 6: Sprawdź galerię ręcznie**

```bash
npm run dev
```

Otwórz slajd Apartament: Tab dochodzi do miniatur, Enter otwiera powiększenie, Escape zamyka, focus wraca na klikniętą miniaturę, strzałki przewijają zdjęcia.

- [ ] **Krok 7: Commit**

```bash
git add -A
git commit -m "feat: slajd apartamentu z galerią w dialogu"
```

---

### Task 9 — Slajd 5 — Kontakt, mapa na żądanie, stopka

**Pliki:**
- Utwórz: `src/components/slides/Contact.astro`
- Modyfikuj: trzy pliki stron
- Modyfikuj: `tests/build-output.test.js`

**Interfejsy:**
- Konsumuje: `Slide.astro`, `SiteContent`, `FACTS`, `ADDRESS_QUERY`, `Logo.astro`.
- Produkuje: `Contact.astro` z propsem `{ content: SiteContent }`, renderujący `<h2 id="kontakt-title">` i stopkę.

- [ ] **Krok 1: Napisz testy (najpierw testy)**

```js
  it('slajd kontaktu ma telefon, adres i trasę, a mapa nie ładuje się od razu', () => {
    const d = doc(path);
    const html = readFileSync(path, 'utf8');
    expect(d.querySelector('#kontakt a[href^="tel:"]')).not.toBeNull();
    expect(d.querySelector('#kontakt address')).not.toBeNull();
    expect(d.querySelector('#kontakt a[href*="google.com/maps/dir"]')).not.toBeNull();
    expect(html).not.toContain('<iframe');
  });

  it('nie linkuje Facebooka, dopóki adres jest niepotwierdzony', () => {
    expect(readFileSync(path, 'utf8')).not.toContain('facebook.com');
  });

  it('ma stopkę z nazwą obiektu', () => {
    const f = doc(path).querySelector('footer');
    expect(f).not.toBeNull();
    expect(f.textContent).toContain('Aura');
  });
```

- [ ] **Krok 2: Uruchom testy i potwierdź, że nie przechodzą**

```bash
npm run test
```

- [ ] **Krok 3: Utwórz `src/components/slides/Contact.astro`**

```astro
---
import Slide from '../Slide.astro';
import Logo from '../Logo.astro';
import { FACTS, hasFact, ADDRESS_QUERY } from '../../content/facts';
import type { SiteContent } from '../../content/types';

interface Props { content: SiteContent }
const { content } = Astro.props;

const mapEmbed = `https://maps.google.com/maps?q=${ADDRESS_QUERY}&output=embed`;
const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${ADDRESS_QUERY}`;
const year = new Date().getFullYear();
---
<Slide id="kontakt" variant="navy" waveFrom="white" class="contact">
  <h2 id="kontakt-title">{content.contact.h2}</h2>
  <p class="contact__lead">{content.contact.lead}</p>

  <a class="contact__phone" href={FACTS.phoneHref}>
    <span class="visually-hidden">{content.contact.phoneLabel}: </span>
    {FACTS.phoneDisplay}
  </a>

  <div class="contact__cols">
    <div>
      <h3 class="contact__label">{content.contact.addressLabel}</h3>
      <address>
        {FACTS.name}<br />
        {FACTS.street}<br />
        {FACTS.postalCode} {FACTS.city}
      </address>
      <p class="contact__actions">
        <a href={routeUrl} rel="noopener">{content.contact.routeCta}</a>
        {hasFact(FACTS.facebookUrl) && <a href={FACTS.facebookUrl} rel="noopener">{content.contact.fbLabel}</a>}
      </p>
    </div>

    <div class="contact__map" data-map data-src={mapEmbed}>
      <button type="button" data-map-load>{content.contact.mapCta}</button>
      <p class="contact__map-notice">{content.contact.mapNotice}</p>
    </div>
  </div>

  <footer>
    <Logo variant="white" class="contact__mark" />
    <p>&copy; {year} {FACTS.name}. {content.footer.rights}</p>
  </footer>
</Slide>

<script>
  for (const box of document.querySelectorAll('[data-map]')) {
    box.querySelector('[data-map-load]')?.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = box.dataset.src;
      frame.title = box.querySelector('[data-map-load]').textContent.trim();
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.style.cssText = 'width:100%;height:100%;border:0;display:block';
      box.replaceChildren(frame);
    });
  }
</script>

<style>
  h2 { font-size: var(--step-4); }
  .contact__lead { margin-top: var(--space-2); font-size: var(--step-1); }
  .contact__phone {
    display: inline-block; margin-top: var(--space-2);
    font-size: var(--step-4); font-weight: 200; letter-spacing: -.02em; text-decoration: none;
  }
  .contact__phone:hover { color: var(--sky); }
  .contact__cols { display: grid; gap: var(--space-3); margin-top: var(--space-4); }
  @media (min-width: 60rem) { .contact__cols { grid-template-columns: 1fr 1fr; align-items: start; } }
  .contact__label { font-size: .78rem; letter-spacing: .12em; text-transform: uppercase; opacity: .65; font-weight: 600; }
  address { font-style: normal; margin-top: .5rem; line-height: 1.7; }
  .contact__actions { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
  .contact__actions a { text-underline-offset: .25em; }
  .contact__map {
    aspect-ratio: 16 / 10; background: rgba(255,255,255,.07);
    display: grid; place-content: center; gap: .75rem; text-align: center; padding: var(--space-2);
  }
  .contact__map button {
    background: var(--white); color: var(--navy); border: 0; border-radius: var(--radius-pill);
    padding: .8rem 1.7rem; font: inherit; font-weight: 600; cursor: pointer;
  }
  .contact__map-notice { font-size: .78rem; opacity: .7; max-width: 30ch; margin-inline: auto; }
  footer {
    margin-top: var(--space-5); padding-top: var(--space-2);
    border-top: 1px solid rgba(255,255,255,.18);
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-2);
    font-size: .8rem; opacity: .75; flex-wrap: wrap;
  }
  .contact :global(.contact__mark) { width: 66px; }
</style>
```

- [ ] **Krok 4: Podłącz w trzech stronach, uruchom testy**

```bash
npm run test
```

- [ ] **Krok 5: Sprawdź mapę ręcznie**

W `npm run dev` otwórz slajd Kontakt, w narzędziach sieciowych potwierdź brak żądań do `google.com` przed kliknięciem, kliknij „Pokaż mapę" i potwierdź, że mapa się ładuje i pokazuje właściwy adres.

- [ ] **Krok 6: Commit**

```bash
git add -A
git commit -m "feat: slajd kontaktu z mapą ładowaną na żądanie i stopką"
```

---

### Task 10 — Intro z animowanym logo

**Pliki:**
- Utwórz: `src/components/Intro.astro`
- Modyfikuj: trzy pliki stron
- Modyfikuj: `tests/build-output.test.js`

**Interfejsy:**
- Konsumuje: `Logo.astro` (zadanie 2) — animuje jego `.logo__wave` i `.logo__word` niezależnie.
- Produkuje: `Intro.astro` z propsem `{ label: string }` — nakładka `<div class="intro" hidden>` uruchamiana skryptem.

- [ ] **Krok 1: Napisz test (najpierw test)**

```js
  it('intro startuje ukryte i nie blokuje treści', () => {
    const d = doc(path);
    const intro = d.querySelector('.intro');
    expect(intro).not.toBeNull();
    expect(intro.hasAttribute('hidden')).toBe(true);
    expect(intro.getAttribute('aria-hidden')).toBe('true');
    // treść pierwszego slajdu istnieje w HTML niezależnie od intro
    expect(d.querySelector('#start-title').textContent.length).toBeGreaterThan(10);
  });
```

Atrybut `hidden` w wygenerowanym HTML jest sednem tego testu: intro pojawia się dopiero, gdy skrypt zdecyduje, że ma się pojawić. Bez JavaScriptu i przy `prefers-reduced-motion` użytkownik dostaje od razu treść.

- [ ] **Krok 2: Uruchom test i potwierdź, że nie przechodzi**

```bash
npm run test
```

- [ ] **Krok 3: Utwórz `src/components/Intro.astro`**

```astro
---
import Logo from './Logo.astro';
interface Props { label: string }
const { label } = Astro.props;
---
<div class="intro" hidden aria-hidden="true">
  <div class="intro__mark">
    <Logo variant="navy" />
  </div>
</div>

<script>
  const intro = document.querySelector('.intro');
  if (intro) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = sessionStorage.getItem('aura-intro') === '1';

    if (!reduced && !seen) {
      document.documentElement.classList.add('intro-active');
      intro.hidden = false;
      // wymuszenie przeliczenia stylu przed startem animacji
      void intro.offsetWidth;
      intro.classList.add('is-playing');
      sessionStorage.setItem('aura-intro', '1');

      const finish = () => {
        if (intro.hidden) return;
        intro.hidden = true;
        document.documentElement.classList.remove('intro-active');
        for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
          window.removeEventListener(ev, finish);
        }
      };

      for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
        window.addEventListener(ev, finish, { passive: true });
      }
      setTimeout(finish, 3200);
    }
  }
</script>

<style is:global>
  html.intro-active, html.intro-active body { overflow: hidden; }
</style>

<style>
  .intro {
    position: fixed; inset: 0; z-index: 60;
    background: var(--white);
    display: grid; place-items: center;
  }
  .intro__mark { width: min(46vw, 30rem); }

  .intro :global(.logo__wave) { clip-path: inset(0 100% 0 0); }
  .intro :global(.logo__word) { opacity: 0; transform: translateY(10px); }

  .intro.is-playing :global(.logo__wave) {
    animation: intro-draw 1s cubic-bezier(.62, 0, .3, 1) .15s forwards;
  }
  .intro.is-playing :global(.logo__word) {
    animation: intro-rise .55s ease .95s forwards;
  }
  .intro.is-playing { animation: intro-out .8s cubic-bezier(.7, 0, .2, 1) 2.4s forwards; }

  @keyframes intro-draw { to { clip-path: inset(0 0% 0 0); } }
  @keyframes intro-rise { to { opacity: 1; transform: none; } }
  @keyframes intro-out  { to { opacity: 0; visibility: hidden; } }

  @media (prefers-reduced-motion: reduce) {
    .intro { display: none; }
  }
</style>
```

Animacja `intro-out` wygasza nakładkę po 3,2 s, a skrypt zdejmuje ją z drzewa i przywraca przewijanie. Logo nie „odlatuje w róg" fizycznie — nakładka znika, odsłaniając logo stałej warstwy, które stoi w tym samym miejscu. Efekt dla oka jest ten sam co w prototypie, a kodu jest o połowę mniej.

- [ ] **Krok 4: Podłącz w trzech stronach**

Dodaj `<Intro label={c.chrome.skip} />` jako pierwszy element wewnątrz `<Base>`, przed `<Chrome>`.

- [ ] **Krok 5: Uruchom testy**

```bash
npm run test
```

- [ ] **Krok 6: Sprawdź intro ręcznie**

W `npm run dev`: przy pierwszym wejściu intro się odtwarza; odświeżenie strony w tej samej karcie już go nie pokazuje; nowa karta pokazuje ponownie; kliknięcie albo dowolny klawisz w trakcie natychmiast je zamyka; po włączeniu w systemie ograniczenia animacji intro nie startuje wcale.

W Chrome ograniczenie animacji symulujesz przez DevTools → Rendering → „Emulate CSS media feature prefers-reduced-motion".

- [ ] **Krok 7: Commit**

```bash
git add -A
git commit -m "feat: animowane intro z logo, pomijalne i jednorazowe"
```

---

### Task 11 — Testy dostępności end-to-end

**Pliki:**
- Modyfikuj: `package.json`
- Utwórz: `playwright.config.js`
- Utwórz: `tests/a11y.spec.js`
- Modyfikuj: `.github/workflows/deploy.yml`

**Interfejsy:**
- Konsumuje: zbudowaną stronę serwowaną przez `astro preview`.
- Produkuje: skrypt `npm run test:a11y`.

- [ ] **Krok 1: Zainstaluj Playwright i axe**

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps chromium
```

- [ ] **Krok 2: Dodaj skrypt do `package.json`**

```json
    "test:a11y": "playwright test"
```

- [ ] **Krok 3: Utwórz `playwright.config.js`**

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.js',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run build && npx astro preview --port 4321',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Krok 4: Napisz testy dostępności**

`tests/a11y.spec.js`:

```js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/de/', '/en/'];

for (const path of PAGES) {
  test(`${path} nie ma naruszeń axe (WCAG 2.2 AA)`, async ({ page }) => {
    await page.goto(path);
    // Zdejmij intro, żeby axe badał właściwą treść, a nie nakładkę.
    // Hojny timeout, bo jeśli Escape padnie zanim skrypt intro się wykona,
    // nakładka i tak zgaśnie sama po 3,2 s — test ma nie być chwiejny.
    await page.keyboard.press('Escape');
    await expect(page.locator('.intro')).toBeHidden({ timeout: 6000 });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test(`${path} da się przejść klawiaturą do telefonu`, async ({ page }) => {
    await page.goto(path);
    await page.keyboard.press('Escape');
    let found = false;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const href = await page.evaluate(() => document.activeElement?.getAttribute('href'));
      if (href?.startsWith('tel:')) { found = true; break; }
    }
    expect(found, 'nie dotarto Tabem do numeru telefonu').toBe(true);
  });
}

test('galeria zamyka się Escape i oddaje focus', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('.intro')).toBeHidden({ timeout: 6000 });
  const thumb = page.locator('.gallery__item').first();
  await thumb.click();
  const dialog = page.locator('#apartament dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(thumb).toBeFocused();
});

test('galeria przewija zdjęcia strzałkami', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('.intro')).toBeHidden({ timeout: 6000 });
  await page.locator('.gallery__item').first().click();
  const shown = page.locator('[data-gallery-image]');
  const first = await shown.getAttribute('alt');
  await page.keyboard.press('ArrowRight');
  const second = await shown.getAttribute('alt');
  expect(second, 'strzałka w prawo nie zmieniła zdjęcia').not.toBe(first);
  expect(second?.length ?? 0, 'zdjęcie w podglądzie bez opisu alternatywnego').toBeGreaterThan(10);
  await page.keyboard.press('ArrowLeft');
  expect(await shown.getAttribute('alt')).toBe(first);
});

test('focus nie ucieka poza otwarty dialog galerii', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('.intro')).toBeHidden({ timeout: 6000 });
  await page.locator('.gallery__item').first().click();
  // dwadzieścia tabulacji musi zostawić focus wewnątrz dialogu —
  // natywny showModal() ma to gwarantować, ten test tego pilnuje
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () => document.activeElement?.closest('dialog') !== null
    );
    expect(inside, `focus wyszedł poza dialog po ${i + 1} tabulacjach`).toBe(true);
  }
});

test('mapa ładuje się dopiero po kliknięciu i ma tytuł', async ({ page }) => {
  const googleRequests = [];
  page.on('request', (r) => {
    if (/google\.com|gstatic\.com/.test(r.url())) googleRequests.push(r.url());
  });
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('.intro')).toBeHidden({ timeout: 6000 });
  await page.locator('.dots a[href="#kontakt"]').click();
  await expect(page.locator('#kontakt iframe')).toHaveCount(0);
  expect(googleRequests, 'strona odpytała Google zanim gość kliknął mapę').toEqual([]);

  await page.locator('[data-map-load]').click();
  const frame = page.locator('#kontakt iframe');
  await expect(frame).toHaveCount(1);
  expect((await frame.getAttribute('title'))?.length ?? 0).toBeGreaterThan(3);
  expect(await frame.getAttribute('src')).toContain('Le%C5%9Bna');
});

test('intro nie startuje przy ograniczonych animacjach', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('.intro')).toBeHidden();
  await expect(page.locator('#start-title')).toBeVisible();
  await ctx.close();
});

test('logo intra dolatuje dokładnie na miejsce logo nagłówka', async ({ page }) => {
  // To jest test tej jednej rzeczy, ktora najlatwiej rozjezdza sie miedzy
  // szerokosciami ekranu: koniec animacji musi pokrywac sie z logo naglowka.
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.evaluate(() => sessionStorage.removeItem('aura-intro'));
    await page.reload();

    const boxes = await page.evaluate(async () => {
      const intro = document.querySelector('.intro .logo');
      const chrome = document.querySelector('.chrome__logo .logo, .chrome__logo');
      if (!intro || !chrome) return null;
      // poczekaj az animacje intra dobiegna konca
      await Promise.all(
        intro.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))
      );
      const a = intro.getBoundingClientRect();
      const b = chrome.getBoundingClientRect();
      return { a: { x: a.x, y: a.y, w: a.width }, b: { x: b.x, y: b.y, w: b.width } };
    });

    expect(boxes, `nie znaleziono logo przy szerokosci ${width}`).not.toBeNull();
    const tolerance = 4;
    expect(Math.abs(boxes.a.x - boxes.b.x), `x rozjechane przy ${width}px`).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(boxes.a.y - boxes.b.y), `y rozjechane przy ${width}px`).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(boxes.a.w - boxes.b.w), `szerokosc rozjechana przy ${width}px`).toBeLessThanOrEqual(tolerance);
  }
});

test('każdy slajd jest osiągalny kotwicą', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('.intro')).toBeHidden({ timeout: 6000 });
  for (const id of ['obiekt', 'apartament', 'okolica', 'kontakt']) {
    await page.locator(`.dots a[href="#${id}"]`).click();
    await expect(page.locator(`#${id}`)).toBeInViewport({ ratio: 0.5 });
  }
});
```

- [ ] **Krok 5: Uruchom testy dostępności**

```bash
npm run test:a11y
```

Naruszenia axe napraw u źródła — nie wyciszaj reguł. Najczęstsze przy tym układzie to zbyt niski kontrast białej stałej warstwy na jasnych slajdach (rozwiązanie w zadaniu 12) oraz brak dostępnej nazwy przycisku.

Ten zestaw testów zamyka wszystko, czego nie dało się sprawdzić w poprzednich zadaniach, bo test statycznego HTML nie wykonuje skryptów. Konkretnie: przewijanie slajdów i dowożenie kropkami (zadanie 5), otwieranie galerii, kolejność tabulacji w dialogu, strzałki i powrót focusu na miniaturę (zadanie 8), ładowanie mapy dopiero po kliknięciu wraz z brakiem żądań do Google przed nim (zadanie 9) oraz przebieg intra i pokrycie się końca animacji z logo nagłówka (zadanie 10). Jeśli któryś z tych testów nie przechodzi, to jest realna usterka odłożona z wcześniejszego zadania, a nie usterka testu — napraw komponent.

- [ ] **Krok 6: Dodaj testy dostępności do CI**

W `.github/workflows/deploy.yml`, po kroku `npm run test`:

```yaml
      - run: npx playwright install --with-deps chromium
      - run: npm run test:a11y
```

- [ ] **Krok 7: Commit**

```bash
git add -A
git commit -m "test: testy dostępności axe, klawiatury i ograniczonych animacji"
```

---

### Task 12 — Kontrast stałej warstwy, wydajność, pomiar i wdrożenie

**Pliki:**
- Modyfikuj: `src/components/Chrome.astro`
- Modyfikuj: `src/layouts/Base.astro`
- Utwórz: `docs/DANE-DO-UZUPELNIENIA.md`
- Modyfikuj: `README.md` (utwórz, jeśli nie istnieje)

**Interfejsy:**
- Konsumuje: całość z zadań 1–11.

- [ ] **Krok 1: Napisz test kontrastu stałej warstwy (najpierw test)**

Dodaj do `tests/a11y.spec.js`:

```js
test('stała warstwa jest czytelna także na jasnych slajdach', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('.intro')).toBeHidden({ timeout: 6000 });
  await page.locator('.dots a[href="#okolica"]').click();
  await page.waitForTimeout(600);
  const results = await new AxeBuilder({ page })
    .include('.chrome')
    .withTags(['wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

- [ ] **Krok 2: Uruchom i potwierdź, że nie przechodzi**

```bash
npm run test:a11y -- -g "stała warstwa"
```

Oczekiwane: FAIL na regule `color-contrast` — biały tekst na białym slajdzie.

- [ ] **Krok 3: Spraw, by stała warstwa dopasowywała kolor do slajdu**

W `Chrome.astro` dodaj do bloku `<style>`:

```css
  .chrome[data-on-light] { color: var(--navy); }
  .chrome[data-on-light] .chrome__call { border-color: rgba(4,71,122,.5); }
  .chrome[data-on-light] .chrome__call:hover { background: var(--navy); color: var(--white); }
  .chrome[data-on-light] .chrome__lang-current { background: rgba(4,71,122,.12); }
  .chrome[data-on-light] .chrome__lang a:hover { background: rgba(4,71,122,.08); }
```

i dopisz skrypt na końcu komponentu:

```astro
<script>
  const chrome = document.querySelector('.chrome');
  const LIGHT = new Set(['obiekt', 'okolica']);
  if (chrome) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          chrome.toggleAttribute('data-on-light', LIGHT.has(e.target.id));
        }
      },
      { threshold: 0.55 }
    );
    for (const s of document.querySelectorAll('main section')) io.observe(s);
  }
</script>
```

Zbiór `LIGHT` musi zawierać identyfikatory slajdów o wariancie `white` i `mist`. Jeśli w zadaniach 6–9 zmieniłeś warianty tła, zaktualizuj go.

- [ ] **Krok 4: Uruchom testy dostępności**

```bash
npm run test:a11y
```

Oczekiwane: wszystko na zielono.

- [ ] **Krok 5: Zmierz wagę wyjścia**

```bash
npm run build
du -sh dist
find dist -name '*.avif' -o -name '*.webp' | head -20
ls -la dist/_astro/*.woff2 2>/dev/null || ls -la dist/_astro/ | head
```

Zanotuj rozmiar największego obrazu ładowanego na pierwszym slajdzie. Jeśli wariant AVIF dla 1600 px przekracza 180 KB, dodaj `quality={72}` do komponentu `Picture` w `Hero.astro` i zmierz ponownie.

- [ ] **Krok 6: Zmierz Lighthouse**

```bash
npx astro preview --port 4321 &
npx lighthouse http://localhost:4321/ --preset=desktop --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh-desktop.json
npx lighthouse http://localhost:4321/ --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh-mobile.json
node -e "
for (const f of ['desktop','mobile']) {
  const r = JSON.parse(require('fs').readFileSync('/tmp/lh-'+f+'.json'));
  const c = r.categories;
  console.log(f, Object.keys(c).map(k=>k+': '+Math.round(c[k].score*100)).join(', '));
  console.log('   LCP', r.audits['largest-contentful-paint'].displayValue,
              '| CLS', r.audits['cumulative-layout-shift'].displayValue,
              '| TBT', r.audits['total-blocking-time'].displayValue);
}
"
```

Cele ze specyfikacji: LCP poniżej 1,5 s, CLS równy zero, pierwszy slajd poniżej 300 KB. **Zapisz faktyczne wyniki** — nie deklaruj ich z góry. Jeśli któryś cel nie jest osiągnięty, napraw przyczynę i zmierz ponownie, zanim uznasz zadanie za skończone.

- [ ] **Krok 6a: Kontrole ręczne, których nie da się zautomatyzować**

Specyfikacja wymienia je wprost w sekcji testowania. Wykonaj i zanotuj wynik każdej.

1. **Czytnik ekranu.** Uruchom NVDA (Windows) i przejdź całą stronę polską klawiszem `D` (przeskok po punktach orientacyjnych) oraz `H` (po nagłówkach). Sprawdź, czy każdy slajd jest ogłaszany swoją nazwą, czy kolejność nagłówków jest logiczna i czy galeria po otwarciu ogłasza się jako okno dialogowe.
2. **Brak JavaScriptu.** W DevTools → Settings → Debugger zaznacz „Disable JavaScript", przeładuj stronę. Oczekiwane: cała treść widoczna, intro się nie pojawia, kropki nawigacyjne działają jako zwykłe kotwice, mapa pokazuje przycisk (nieaktywny) zamiast pustego miejsca, telefon działa.
3. **Wąski telefon.** W trybie urządzenia ustaw iPhone SE (375 × 667). Przewiń przez wszystkie slajdy przy widocznym i schowanym pasku adresu. Oczekiwane: żaden slajd nie jest przycięty, pasek z telefonem na dole nie zasłania treści, nie ma przewijania w poziomie.
4. **Walidacja danych strukturalnych.** Wklej treść `dist/index.html` do testu wyników z elementami rozszerzonymi Google (`https://search.google.com/test/rich-results`) i potwierdź, że `LodgingBusiness` jest rozpoznany bez błędów.

- [ ] **Krok 7: Utwórz `docs/DANE-DO-UZUPELNIENIA.md`**

```markdown
# Dane do uzupełnienia przed publikacją

Wartości `null` w `src/content/facts.ts` blokują publikację odpowiednich treści.
Po potwierdzeniu przez właściciela wpisz je i uruchom `npm run test`.

| Pole w `facts.ts` | Co potwierdzić | Co się odblokuje |
|---|---|---|
| `beachDistanceM` | Booking podaje raz 300 m, raz 50 m — jedna liczba do wszystkich miejsc | Konkretna odległość w nagłówku i na liście odległości zamiast „tuż przy plaży" |
| `areaSqm` | Metraż apartamentu | Liczba w bloku statystyk na slajdzie o obiekcie |
| `facebookUrl` | Adres profilu | Link w kontakcie oraz `sameAs` w danych strukturalnych |
| `lighthouseDistance` | Odległość do latarni morskiej | Liczba przy atrakcji |
| `narrowGaugeDistance` | Odległość do kolejki wąskotorowej | Liczba przy atrakcji |
| `oceanariumDistance` | Odległość do oceanarium | Liczba przy atrakcji |

Po uzupełnieniu `beachDistanceM` sprawdź, czy zdanie w `hero.sub` brzmi naturalnie
we wszystkich trzech językach — jest budowane warunkowo.

Odrys logo do SVG wymaga zatwierdzenia przez właściciela w porównaniu
z `public/logo-white.webp`.
```

- [ ] **Krok 8: Utwórz `README.md`**

```markdown
# Aura Niechorze

Statyczna strona apartamentów Aura w Niechorzu. Astro, trzy języki, deploy na GitHub Pages.

## Komendy

| Komenda | Działanie |
|---|---|
| `npm run dev` | Serwer deweloperski na http://localhost:4321 |
| `npm run build` | Build produkcyjny do `dist/` |
| `npm run preview` | Podgląd builda |
| `npm run test` | Build + asercje na wygenerowanym HTML |
| `npm run test:a11y` | Testy dostępności (Playwright + axe) |

## Struktura

- Treść w `src/content/{pl,de,en}.ts` — układ nie zawiera tekstu.
- Fakty o obiekcie w `src/content/facts.ts`. Wartości `null` nie trafiają na stronę
  (patrz `docs/DANE-DO-UZUPELNIENIA.md`).
- Slajdy w `src/components/slides/`, po jednym pliku na slajd.
- Zdjęcia w `src/assets/` — przetwarzane przez `astro:assets`. Nie wrzucaj zdjęć
  do `public/`, bo ominą optymalizację.

## Dokumentacja projektowa

- Specyfikacja: `docs/superpowers/specs/2026-07-25-aura-niechorze-redesign-design.md`
- Plan wdrożenia: `docs/superpowers/plans/2026-07-25-aura-niechorze-redesign.md`
```

- [ ] **Krok 9: Sprawdź, że nie został ślad po React**

```bash
grep -ri "react\|useParallax\|CursorGlow\|tweaks-panel" --include="*.json" --include="*.js" --include="*.jsx" --include="*.astro" --include="*.yml" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist
```

Oczekiwane: brak wyników. Jeśli coś zostało, usuń.

- [ ] **Krok 10: Pełny przebieg testów i commit**

```bash
npm run test && npm run test:a11y
git add -A
git commit -m "feat: kontrast stałej warstwy, dokumentacja i pomiar wydajności"
```

- [ ] **Krok 11: Wdrożenie**

```bash
git push origin main
```

Obserwuj przebieg w GitHub Actions. Po zakończeniu sprawdź na żywo `https://aura-niechorze.pl/`, `https://aura-niechorze.pl/de/` i `https://aura-niechorze.pl/en/`: intro odtwarza się raz, slajdy zatrzymują się poprawnie, telefon działa na telefonie, mapa ładuje się po kliknięciu.

- [ ] **Krok 12: Zgłoś wyniki**

Przedstaw właścicielowi: zmierzone wyniki Lighthouse z kroku 6 (osobno mobile i desktop), wagę strony, oraz listę z `docs/DANE-DO-UZUPELNIENIA.md` jako to, co blokuje pełną treść.

---

## Kolejność i zależności

Zadania 1–5 są ściśle sekwencyjne — każde buduje na strukturze poprzedniego.

Zadania 6, 7, 8 i 9 (slajdy) zależą wyłącznie od zadania 5 i są od siebie niezależne. Można je wykonać równolegle, pod warunkiem że każde dotyka wyłącznie własnych plików komponentów i dopisuje własne testy. Trzy pliki stron modyfikują wszystkie cztery — przy pracy równoległej scalaj je ostrożnie.

Zadanie 10 zależy od zadania 2 (logo z rozdzielonymi elementami fali i napisu) i 5 (stała warstwa).
Zadanie 11 zależy od wszystkich poprzednich.
Zadanie 12 zamyka projekt i zależy od 11.
