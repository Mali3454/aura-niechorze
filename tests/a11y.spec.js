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
    // nakładka i tak zgaśnie sama (budżet intra to ok. 1,9 s, siatka
    // bezpieczeństwa 2,6 s) — test ma nie być chwiejny.
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

test('zdjęcie tła hero jest wyrenderowane jako tło sekcji, nie w normalnym przepływie', async ({ page }) => {
  // Hero.astro przekazuje klasę "hero" do Slide.astro, ale to Slide.astro
  // renderuje samą <section> — więc sekcja nigdy nie niesie atrybutu scope
  // (data-astro-cid-...) pliku Hero.astro. Selektor `.hero .hero__bg`
  // (z ancestorem) kompilował się do `.hero[data-astro-cid-xxx] .hero__bg`,
  // które nigdy nie pasowało: zdjęcie renderowało się w normalnym przepływie
  // (swoja natywna wysokość, przed blokiem tekstu), zamiast jako
  // position:absolute tło pod spodem. Sprawdzamy geometrię wprost, żeby
  // regresja tej reguły (np. przywrócenie selektora z ancestorem) faktycznie
  // zawaliła test, zamiast tylko sprawdzać obecność klasy CSS.
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('.intro')).toBeHidden({ timeout: 6000 });

  const info = await page.evaluate(() => {
    const section = document.querySelector('#start');
    const img = document.querySelector('.hero__bg');
    const s = section.getBoundingClientRect();
    const i = img.getBoundingClientRect();
    return {
      position: getComputedStyle(img).position,
      section: { top: s.top, left: s.left, width: s.width, height: s.height },
      img: { top: i.top, left: i.left, width: i.width, height: i.height },
    };
  });

  expect(info.position, 'zdjęcie hero nie jest position:absolute — reguła .hero__bg się nie stosuje').toBe('absolute');
  expect(Math.abs(info.img.top - info.section.top), 'góra zdjęcia nie pokrywa się z górą sekcji').toBeLessThanOrEqual(2);
  expect(Math.abs(info.img.left - info.section.left), 'lewa krawędź zdjęcia nie pokrywa się z sekcją').toBeLessThanOrEqual(2);
  expect(Math.abs(info.img.width - info.section.width), 'zdjęcie nie pokrywa szerokości sekcji').toBeLessThanOrEqual(2);
  expect(Math.abs(info.img.height - info.section.height), 'zdjęcie nie pokrywa wysokości sekcji (renderuje się w normalnym przepływie ze swoją natywną wysokością)').toBeLessThanOrEqual(2);
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

// Oba jasne slajdy, nie tylko jeden. Wcześniej test pokrywał wyłącznie
// "okolica" — a błąd znikającego logo siedział tak samo na "obiekt".
const LIGHT_SLIDES = ['obiekt', 'okolica'];

for (const id of LIGHT_SLIDES) {
  test(`stała warstwa jest czytelna tekstowo na jasnym slajdzie #${id}`, async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Escape');
    await expect(page.locator('.intro')).toBeHidden({ timeout: 6000 });
    await page.locator(`.dots a[href="#${id}"]`).click();
    await page.waitForTimeout(600);
    // Najpierw upewnij się, że warstwa faktycznie weszła w tryb jasny — bez
    // tego test mógłby przechodzić, badając warstwę nad ciemnym slajdem.
    await expect(page.locator('.chrome')).toHaveAttribute('data-on-light', '');
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

  test(`znak w nagłówku jest widoczny na jasnym slajdzie #${id}`, async ({ page }) => {
    // Logo to wklejony <svg> z fill="currentColor". axe NIE widzi koloru
    // grafiki wektorowej — reguła color-contrast dotyczy tekstu — więc test
    // kontrastu obok przechodził na zielono, kiedy znak był biały na mgle
    // (~1:1). Dokładnie tak błąd C1 przeżył cztery rundy przeglądu i 121
    // asercji: test napisany na tę klasę błędu nie umiał na nią patrzeć.
    //
    // Mierzymy więc PIKSELE, ale tylko te należące do znaku: robimy dwa zrzuty
    // tego samego wycinka ekranu — ze znakiem i z jego wygaszoną częścią — i
    // liczymy kontrast każdego zmienionego piksela wobec tego, co było pod
    // nim. Naiwne „najciemniejszy do najjaśniejszego w prostokącie logo" tu
    // NIE działa: górny pasek slajdu zdobi granatowa fala (WaveMark), która
    // sama z siebie daje ~10:1 w tym prostokącie i maskuje niewidzialny znak.
    //
    // Mierzymy NAPIS („AURA"), a nie falę znaku — świadomie i z konkretnego
    // powodu. Górne ~64 px obu jasnych slajdów zdobi granatowa fala
    // (WaveMark), a w pozycji zatrzaśniętej przez scroll-snap wypada ona
    // dokładnie na wysokości falki w logo. Falka jest tam granat na granacie,
    // więc pomiar dawałby raz 0, raz 771 pikseli zależnie od tego, czy
    // przewijanie zdążyło się ustabilizować — test byłby chwiejny, a jego
    // wynik i tak mówiłby o dekoracji, nie o znaku. (To nakładanie się
    // dekoracji na falkę logo jest osobną, wcześniejszą sprawą wizualną —
    // opisane w raporcie, nie zamiatane pod ten test.)
    // Napis leży zawsze poniżej pasa, na własnym tle slajdu, i to on ginie
    // przy błędzie C1: mediana 1,12:1 na „obiekt", a na „okolica" napis nie
    // zmienia ANI JEDNEGO piksela.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.keyboard.press('Escape');
    await expect(page.locator('.intro')).toBeHidden({ timeout: 6000 });
    await page.locator(`.dots a[href="#${id}"]`).click();
    await expect(page.locator('.chrome')).toHaveAttribute('data-on-light', '');
    // Czekamy, aż slajd DOJEDZIE do pozycji zatrzaśniętej (górna krawędź
    // sekcji na górze okna), a nie na zgadnięty czas. To nie jest kosmetyka:
    // dopóki przewijanie trwa, granatowa fala dekoracyjna wędruje po
    // wysokości nagłówka i zakrywa napis, więc pomiar mierzyłby chwilowy kadr
    // (obserwowane realnie: raz 0, raz 772 zmienione piksele). Sprawdzenie
    // „scrollTop nie zmienił się przez dwie klatki" tu nie wystarcza —
    // spełnia je też moment TUŻ PO kliknięciu, zanim płynne przewijanie
    // w ogóle ruszy.
    await page.waitForFunction(
      (slideId) => Math.abs(document.getElementById(slideId).getBoundingClientRect().top) < 1,
      id,
      { timeout: 5000 }
    );

    const box = await page.locator('.chrome__logo').boundingBox();
    const clip = {
      x: Math.round(box.x), y: Math.round(box.y),
      width: Math.round(box.width), height: Math.round(box.height),
    };
    const pixels = async () => {
      const { data } = await sharp(await page.screenshot({ clip }))
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      return data;
    };

    for (const part of ['.logo__word']) {
      const target = page.locator(`.chrome__logo ${part}`);
      const withMark = await pixels();
      await target.evaluate((el) => { el.style.opacity = '0'; });
      const withoutMark = await pixels();
      await target.evaluate((el) => { el.style.opacity = ''; });

      const ratios = [];
      for (let i = 0; i < withMark.length; i += 3) {
        const a = [withMark[i], withMark[i + 1], withMark[i + 2]];
        const b = [withoutMark[i], withoutMark[i + 1], withoutMark[i + 2]];
        // próg 30 na sumie różnic kanałów odsiewa szum kompresji/antyaliasingu,
        // a przepuszcza nawet biel na mgle (#FFF vs #EEF3F8 = 36)
        if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 30) {
          ratios.push(contrastRatio(a, b));
        }
      }

      // Znak, którego w ogóle nie widać (biel na bieli slajdu „okolica"), nie
      // zmienia ŻADNEGO piksela — bez tej asercji mediana liczyłaby się z
      // pustki. W poprawnym renderze każda część to ok. 770 pikseli.
      expect(
        ratios.length,
        `${part} na slajdzie #${id} zmienia tylko ${ratios.length} pikseli — znaku praktycznie nie widać`
      ).toBeGreaterThan(300);

      ratios.sort((x, y) => x - y);
      const median = ratios[Math.floor(ratios.length / 2)];
      // 3:1 to próg WCAG 1.4.11 dla grafiki. Poprawny render daje 6,3–9,6:1,
      // wersja z błędem C1 — 1,12:1. Margines jest szeroki w obie strony.
      expect(
        median,
        `mediana kontrastu ${part} wobec tła na slajdzie #${id} = ${median.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(3);
    }
  });
}

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
