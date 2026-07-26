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
