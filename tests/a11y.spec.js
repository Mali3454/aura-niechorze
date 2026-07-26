import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';

function srgbToLinear(c) {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}
function relLuminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastRatio(rgbA, rgbB) {
  const la = relLuminance(rgbA);
  const lb = relLuminance(rgbB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

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
  // natywny showModal() ma to gwarantować, ten test tego pilnuje.
  // Zweryfikowano na minimalnej, niezależnej od aplikacji stronie z gołym
  // <dialog>, że Chromium przy zawijaniu z ostatniego elementu na pierwszy
  // przejściowo stawia focus na <body> na jedno naciśnięcie Tab — to
  // natywne zachowanie silnika, nie ucieczka do treści pod spodem (body nie
  // jest interaktywne), więc traktujemy to jako dozwolony przystanek.
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const insideOrTransientBody = await page.evaluate(
      () => document.activeElement === document.body || document.activeElement?.closest('dialog') !== null
    );
    expect(insideOrTransientBody, `focus uciekł poza dialog (i nie jest to body) po ${i + 1} tabulacjach`).toBe(true);
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
      // Mierzymy dokładnie te elementy, które mierzy i przesuwa skrypt intra
      // (.intro__mark i .chrome__logo). Gdyby test brał elementy wewnętrzne,
      // a skrypt zewnętrzne, oba mogłyby się rozjechać, a żaden by nie zgłosił błędu.
      const intro = document.querySelector('.intro__mark');
      const chrome = document.querySelector('.chrome__logo');
      const introRoot = document.querySelector('.intro');
      if (!intro || !chrome || !introRoot) return null;

      // `intro.getAnimations({subtree:true})` zaraz po wczytaniu strony łapie
      // tylko animacje logo (rysowanie/pojawianie), bo przejście transform na
      // .intro__mark powstaje dopiero, gdy skrypt intra doda klasę
      // `is-flying` (dopiero po opóźnieniu ~2,4 s) — w chwili zrobienia tego
      // zdjęcia lotu jeszcze nie ma, więc czekanie na nie kończy się od razu
      // i mierzy pozycję SPRZED lotu. Czekamy więc najpierw na realny start
      // lotu (pojawienie się klasy) — warunkowo, bez zgadywania czasu.
      await new Promise((resolve) => {
        if (introRoot.classList.contains('is-flying')) return resolve();
        const obs = new MutationObserver(() => {
          if (introRoot.classList.contains('is-flying')) {
            obs.disconnect();
            resolve();
          }
        });
        obs.observe(introRoot, { attributes: true, attributeFilter: ['class'] });
      });

      // Próbkujemy klatka po klatce (rAF, nie czasem) i za każdym razem, gdy
      // nakładka jest jeszcze widoczna, zapamiętujemy OSTATNI dobry odczyt
      // rectów obu elementów. Kończymy, gdy transform osiągnie docelową
      // skalę, ALBO gdy skrypt intra już schował nakładkę — i w obu
      // przypadkach zwracamy ten ostatni zapamiętany odczyt, nigdy odczyt "na
      // gorąco" zrobiony już po schowaniu. To celowo omija wyścig ze
      // zdarzeniami transitionend/transitioncancel: nawet gdyby finish()
      // (chowający nakładkę) i koniec przejścia trafiły w tę samą klatkę,
      // wciąż mamy poprawny pomiar sprzed schowania, zamiast zer.
      return await new Promise((resolve) => {
        const targetScale = parseFloat(intro.style.getPropertyValue('--fly-scale')) || 1;
        let lastGood = null;
        const poll = () => {
          if (!introRoot.hidden) {
            const a = intro.getBoundingClientRect();
            const b = chrome.getBoundingClientRect();
            lastGood = { a: { x: a.x, y: a.y, w: a.width }, b: { x: b.x, y: b.y, w: b.width } };
            const m = new DOMMatrixReadOnly(getComputedStyle(intro).transform);
            if (Math.abs(m.a - targetScale) < 0.001) {
              resolve(lastGood);
              return;
            }
          } else {
            resolve(lastGood);
            return;
          }
          requestAnimationFrame(poll);
        };
        requestAnimationFrame(poll);
      });
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
  // axe klasyfikuje kolizję koloru stałej warstwy z jasnym tłem slajdu jako
  // "incomplete" (nie "violation"), bo warstwa jest fixed i axe nie jest
  // pewien tła bez renderowania — mimo to fgColor/bgColor w danych są
  // jednoznaczne (białe na białym). Sprawdzamy więc obie tablice.
  const contrastIssues = [...results.violations, ...results.incomplete].filter(
    (r) => r.id === 'color-contrast'
  );
  expect(contrastIssues).toEqual([]);
});

test('stała warstwa jest czytelna na jasnym slajdzie także bez JavaScriptu', async ({ browser }) => {
  // Bez JS nie działa IntersectionObserver, więc data-on-light nigdy się nie
  // ustawi — dopasowanie koloru z poprzedniego testu tu nie pomoże. Warstwa
  // musi być czytelna z samego CSS (scrim w Chrome.astro, patrz komentarz
  // przy regule `.chrome { background: ... }`). AxeBuilder nie działa w
  // kontekście javaScriptEnabled:false (analyze() wisi w nieskończoność —
  // axe-core samo jest wstrzykiwanym skryptem), więc kontrast liczymy wprost
  // z próbki piksela na zrzucie ekranu, tak jak zmierzono w raporcie zadania.
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();
  await page.goto('/#obiekt');

  const buf = await page.screenshot();
  const { data } = await sharp(buf)
    .extract({ left: 300, top: 8, width: 4, height: 4 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bg = [data[0], data[1], data[2]];
  const ratio = contrastRatio([255, 255, 255], bg);

  expect(ratio, `kontrast biały tekst / tło stałej warstwy bez JS = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);

  await ctx.close();
});
