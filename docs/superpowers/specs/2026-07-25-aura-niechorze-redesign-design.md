# Aura Niechorze — przebudowa strony

Data: 2026-07-25
Status: zatwierdzony projekt, gotowy do planu wdrożenia

## Cel

Zastąpić testową stronę React nową witryną apartamentów Aura w Niechorzu. Strona jest wizytówką: sukcesem jest telefon od gościa. Nie ma silnika rezerwacji ani odsyłania do portali.

Wymagania jakościowe: WCAG 2.2 AA, mocne SEO lokalne, wysokie wyniki PageSpeed. Prezentacja w formie pełnoekranowych slajdów zamiast klasycznego przewijania. Na wejściu animowane logo. Kolorystyka wyłącznie z pliku logo — granat i biel.

## Dane obiektu

Źródło: profil Booking.com (`aura-niechorze-apartamenty-przy-plazy`) oraz pliki logo w repozytorium.

| Pole | Wartość |
|---|---|
| Nazwa | Aura Niechorze — apartamenty przy plaży |
| Adres | Leśna 9, 72-350 Niechorze |
| Telefon | +48 576 040 656 |
| Domena | aura-niechorze.pl |
| Typ | apartament dwupoziomowy, 4 osoby |
| Spanie | 1 łóżko podwójne + 1 rozkładana sofa |
| Wyposażenie apartamentu | klimatyzacja, balkon z widokiem na morze, WiFi bezpłatne, TV z kanałami kablowymi, aneks kuchenny, jadalnia, część wypoczynkowa, prywatna łazienka z prysznicem, suszarka do włosów, zestaw kosmetyków, pościel |
| Wyposażenie obiektu | bezpłatny prywatny parking, ogród, taras |
| Zameldowanie | 16:00–21:00 |
| Wymeldowanie | 08:00–10:00 |
| Zwierzęta | akceptowane po uzgodnieniu, możliwa dopłata |
| Palenie | zabronione |
| Imprezy | zabronione |
| Łóżeczko dziecięce | 20 zł za dziecko za noc, wiek 0–3, na życzenie |
| Dodatkowe łóżka | niedostępne |

Odległości: plaża w Niechorzu 50 m (wartość sporna, patrz punkt 2 poniżej), restauracje 200–300 m, stacja kolejowa Niechorze 950 m, plaża Pogorzelica 900 m, plaża Rewal 1,8 km, Kołobrzeg 47 km, lotnisko Szczecin-Goleniów 80 km, lotnisko Heringsdorf 74 km.

Nazewnictwo: konsekwentnie **apartamenty**, nie „pensjonat" — zgodnie z logo i profilem Booking.

### Do uzupełnienia przed publikacją

Te dane trafiają do treści dopiero po potwierdzeniu przez właściciela. Do czasu potwierdzenia nie pojawiają się na stronie w żadnej formie.

1. Metraż apartamentu w m².
2. Odległość do plaży — Booking podaje w opisie 300 m, a w wykazie odległości 50 m. Do wyboru jedna liczba, użyta wszędzie identycznie.
3. Odległości do latarni morskiej w Niechorzu, kolejki wąskotorowej i oceanarium.
4. Adres URL profilu na Facebooku.
5. Współrzędne geograficzne obiektu do JSON-LD i mapy.

## Zakres

W zakresie: przebudowa strony od zera, treść w trzech językach, animowane intro, system slajdów, dostępność, SEO, optymalizacja zdjęć, deploy na GitHub Pages.

Poza zakresem: rezerwacja online, cennik, blog, panel administracyjny, integracja z kalendarzem dostępności, formularz kontaktowy (celem jest telefon).

## Architektura

### Stos

**Astro** w trybie statycznym, bez frameworka UI. Domyślnie zero JavaScriptu; jedyny skrypt to około 2 KB obsługujące intro i wskaźnik aktywnego slajdu.

Wybrany zamiast dwóch alternatyw: pozostania przy React + Vite (koszt hydratacji i protezy w routingu wielojęzycznym przy stronie w istocie statycznej) oraz czystego HTML/CSS/JS (ta sama wydajność, ale obróbkę szesnastu zdjęć 4000 px trzeba by pisać ręcznie). Astro daje `astro:assets`, czyli automatyczny AVIF/WebP z `srcset`, oraz wbudowane i18n z routingiem i `hreflang`.

### Języki i URL-e

- `/` — polski, domyślny
- `/de/` — niemiecki
- `/en/` — angielski

Każda wersja to osobny statyczny plik HTML z pełną treścią. Wzajemne powiązanie przez `hreflang` plus `x-default` wskazujący wersję polską. Na każdej stronie `canonical`.

Treść w `src/content/pl.ts`, `de.ts`, `en.ts` o identycznej strukturze. Układ nie zawiera tekstu — dopisanie języka to jeden nowy plik i jedna nowa strona.

### Struktura plików

```
src/
  layouts/Base.astro          <head>, meta, hreflang, JSON-LD, OG
  pages/index.astro           slajdy złożone z treści PL
  pages/de/index.astro
  pages/en/index.astro
  components/
    Slide.astro               wspólna ramka slajdu: sekcja, snap, nagłówek
    Intro.astro               animowane logo
    SlideNav.astro            boczne kropki, nawigacja kotwicami
    Gallery.astro             siatka miniatur + dialog powiększenia
    LangSwitch.astro
    WaveMark.astro            fala z logo jako motyw graficzny
  content/pl.ts | de.ts | en.ts
  styles/tokens.css           kolory, typografia, odstępy
  assets/                     zdjęcia przetwarzane przez astro:assets
public/                       logo SVG, favicon, CNAME, robots.txt
```

Każdy slajd dostaje treść przez propsy i nie wie nic o pozostałych. Zmiana kolejności slajdów to przestawienie linii w `index.astro`.

### Deploy

Istniejący workflow GitHub Actions zostaje, zmienia się komenda budowania. Katalog wyjściowy `dist/`. Domena i `CNAME` bez zmian.

Do usunięcia: cały obecny `src/` (React, `useParallax`, `useRevealOnScroll`, `useHeroCanvas`, `CursorGlow`, `WaveDivider`), `tweaks-panel.jsx`, zależności React, oraz zacommitowany katalog `dist/` — build powstaje w Actions i nie należy do repozytorium.

## System wizualny

### Kolory

Zmierzone bezpośrednio z plików logo.

| Rola | Hex | Pochodzenie |
|---|---|---|
| Granat marki | `#04477A` | fala i wordmark w `logo-white.webp` |
| Granat głęboki | `#024076` | tło `logo-dark.webp` |
| Biel | `#FFFFFF` | tło logo |
| Mgła | `#EEF3F8` | granat rozbielony, tła naprzemienne |
| Błękit akcentu | `#8FC4E8` | linki i stany na granacie |

Granat `#04477A` na bieli i biel na tym granacie dają kontrast **9,5:1**, czyli WCAG AAA w obie strony, także dla drobnego tekstu. Błękit akcentu na granacie daje 5,05:1 — AA dla tekstu, AAA dla dużego.

Paleta jest wyłącznie niebiesko-biała. Piaskowy beż sugerowany przez zdjęcia wnętrz został świadomie odrzucony — ciepło wnosi drewno na fotografiach, interfejs zostaje chłodny.

Rytm tł kolejnych slajdów: zdjęcie z granatowym przyciemnieniem → biel → mgła → granat → zdjęcie.

### Typografia

**Outfit** — jedyny krój na stronie, grubości 200, 300 i 600. Geometryczny, szeroki, o okrągłym rysunku; nagłówki w grubości 200 z ujemnym światłem międzyliterowym, treść w 300, elementy interaktywne w 600.

Serifowe „AURA" w logo pozostaje nietknięte i celowo kontrastuje z bezszeryfową resztą — logo dzięki temu wyraźniej odcina się od treści.

Font hostowany lokalnie jako woff2, subset `latin` + `latin-ext` (polskie znaki diakrytyczne, niemieckie umlauty), `font-display: swap`, `preload` na odmianę używaną w nagłówku hero. Brak połączeń do Google Fonts — oszczędza 200–400 ms w ścieżce krytycznej i eliminuje przekazywanie adresów IP odwiedzających do zewnętrznego podmiotu.

### Język formalny

Duże odstępy, cienkie linie rozdzielające, przyciski w formie pigułek, wielkie liczby jako element graficzny, zdjęcia na całą szerokość bez ramek i cieni. Fala z logo jest jedynym motywem ozdobnym i występuje w trzech miejscach: przy wyjściu z intro, jako subtelny separator na styku slajdów i jako sygnatura w stopce.

### Logo

Logo źródłowe to raster `logo-white.webp`. Zostanie odrysowane do SVG (fala i wordmark jako dwie osobne ścieżki), co daje ostrość na każdym ekranie i około 3 KB zamiast kilkunastu. **Odrys wymaga zatwierdzenia przez właściciela w porównaniu z oryginałem** — kształty muszą pozostać identyczne. Do czasu zatwierdzenia obowiązuje wariant rastrowy z przezroczystością wyciętą z oryginału.

Warianty: granatowy na jasnych tłach, biały na granacie i na zdjęciach.

## Intro

Wariant „rysowana fala", zatwierdzony na żywym prototypie.

Przebieg:

1. Białe tło, na środku granatowe logo.
2. Fala odsłania się od lewej do prawej przez 1 s (`clip-path`, krzywa `cubic-bezier(.62,0,.3,1)`).
3. Po 0,95 s pod falą pojawia się wordmark „AURA" — wypłynięcie z dołu, 0,55 s.
4. Pauza.
5. Od 2,1 s całe logo zmniejsza się i odjeżdża do lewego górnego rogu, gdzie zostaje jako stałe logo nagłówka.
6. Równolegle wypływa pierwszy slajd: zdjęcie budynku, przycisk telefonu, nagłówek, strzałka w dół.

Łączny czas do pełnej widoczności treści: około 3,5 s.

Zasady, bez których intro nie wchodzi na produkcję:

- Intro jest wyłącznie nakładką nad gotowym DOM-em. Treść strony istnieje i jest renderowana od pierwszej klatki — intro nie może opóźniać LCP.
- Pomijalne kliknięciem, dotknięciem, dowolnym klawiszem i przewinięciem.
- Odtwarzane raz na sesję (`sessionStorage`). Powrót na stronę w tej samej sesji pokazuje od razu pierwszy slajd.
- Przy `prefers-reduced-motion: reduce` intro nie uruchamia się w ogóle.
- Bez JavaScriptu intro się nie pojawia, a strona działa normalnie.

## Slajdy

Stała warstwa nad wszystkimi slajdami: logo w lewym górnym rogu, przełącznik PL/DE/EN, przycisk telefonu `+48 576 040 656` w prawym górnym rogu, pionowy pasek kropek nawigacyjnych przy prawej krawędzi. Na ekranach dotykowych przycisk telefonu przenosi się do stałego paska przy dolnej krawędzi.

Przewijanie: `scroll-snap-type: y mandatory` na kontenerze, `scroll-snap-align: start` na sekcjach. Zachowanie identyczne na desktopie i na urządzeniach dotykowych. Wysokość slajdu w `dvh`, nie `vh` — inaczej pasek adresu przeglądarki mobilnej rozjeżdża układ.

### 1. Otwarcie

Tło: zdjęcie budynku o zmierzchu (`IMG-20260709-WA0023`) z granatowym przyciemnieniem gradientowym. Nagłówek `h1`: „Apartamenty przy plaży w Niechorzu". Podtytuł o bliskości morza i lasu. Przycisk „Zadzwoń". Strzałka sygnalizująca kolejne slajdy.

### 2. O obiekcie

Tło mgliste. Po lewej tekst, po prawej zdjęcie salonu ze skośnym oknem (`20260718_133223`). Treść: apartament dwupoziomowy dla czterech osób, bezpłatny prywatny parking, ogród i taras, balkon z widokiem na morze, klimatyzacja. Trzy liczby wyróżnione typograficznie: odległość do plaży, liczba osób, odległość do stacji.

### 3. Apartament

Tło granatowe. Galeria wnętrz w siatce: sypialnia na antresoli, salon, aneks kuchenny, łazienka. Kliknięcie otwiera `<dialog>` z powiększeniem, nawigacją strzałkami i zamykaniem klawiszem Escape. Obok lista wyposażenia z ikonami. Pod spodem zasady pobytu jednym wierszem: godziny zameldowania i wymeldowania, zwierzęta po uzgodnieniu, obiekt bez palenia, łóżeczko dziecięce.

### 4. Okolica

Tło białe. Odległości przedstawione jako czytelna oś. Trzy atrakcje z krótkim opisem: latarnia morska w Niechorzu, kolejka wąskotorowa, oceanarium — z odległościami po ich potwierdzeniu.

### 5. Kontakt

Tło granatowe z falą z logo. Duży, klikalny numer telefonu jako element główny. Adres Leśna 9, 72-350 Niechorze. Link do Facebooka. Mapa osadzona dopiero po kliknięciu w statyczny podgląd. Przycisk „Wyznacz trasę". Stopka.

Cennika nie ma na żadnym slajdzie — decyzja świadoma.

## Dostępność

Podstawą jest wybór natywnego `scroll-snap` zamiast przechwytywania zdarzeń przewijania. Strzałki, PageUp, PageDown, Home, End, Tab i wyszukiwanie w stronie działają bez dodatkowego kodu.

- Każdy slajd to `<section aria-labelledby="…">` z prawdziwym nagłówkiem. Dokładnie jedno `h1` (hero), po jednym `h2` na pozostałe slajdy.
- Kropki nawigacyjne to `<nav>` z odnośnikami kotwiczącymi — działają przy wyłączonym JavaScripcie, mają widoczny wskaźnik focusu.
- Odnośnik „przejdź do treści" jako pierwszy element w kolejności tabulacji.
- Galeria: `<dialog>` z pułapką focusu, zamykanie klawiszem Escape, opisowe `aria-label` na przyciskach nawigacji, powrót focusu na miniaturę po zamknięciu.
- Każde zdjęcie ma opisowy `alt` w trzech językach, opisujący scenę.
- `prefers-reduced-motion: reduce` wyłącza intro, przejścia i płynne przewijanie.
- Cele dotykowe minimum 24×24 px, przycisk telefonu istotnie większy.
- Atrybut `lang` zgodny z wersją językową.
- Nic nie odtwarza się automatycznie poza intro, które jest pomijalne i jednorazowe.

## SEO

- Trzy statyczne pliki HTML z pełną treścią w źródle.
- `hreflang` między wersjami, `x-default` na polską, `canonical` na każdej.
- JSON-LD typu `LodgingBusiness`: nazwa, adres, współrzędne, telefon, `checkinTime`, `checkoutTime`, `petsAllowed`, `amenityFeature`, `image`, `numberOfRooms`.
- `sitemap.xml` i `robots.txt`.
- Open Graph i Twitter Card ze zdjęciem budynku.
- Nazwa, adres i telefon w identycznym brzmieniu co na Booking.com i w wizytówce Google. Niespójność tych trzech danych jest częstą przyczyną słabej widoczności lokalnej.
- Treść pisana pod realne frazy: „apartamenty Niechorze", „nocleg przy plaży Niechorze", „apartament dla 4 osób nad morzem", z odpowiednikami niemieckimi i angielskimi.

## Wydajność

Zdjęcia stanowią cały budżet strony. Materiał źródłowy to szesnaście plików WebP o szerokości 4000 px i wadze 130–500 KB każdy.

- `astro:assets` generuje AVIF z zapasowym WebP w kilku szerokościach, z `srcset`, `sizes` oraz wpisanymi `width` i `height` — dzięki czemu CLS wynosi zero.
- Ładowane jest wyłącznie zdjęcie pierwszego slajdu (`fetchpriority="high"`), pozostałe leniwie.
- Font: trzy grubości Outfit, woff2, subset, `preload` na jedną odmianę.
- Zero JavaScriptu frameworka. Skrypt strony około 2 KB.
- Mapa Google ładowana dopiero po interakcji.

Cele: LCP poniżej 1,5 s, CLS równy zero, waga pierwszego slajdu poniżej 300 KB. Wyniki zostaną zmierzone Lighthouse po wdrożeniu i przedstawione; deklaracja wyniku z góry nie zastępuje pomiaru.

## Testowanie

- Budowanie przechodzi bez ostrzeżeń, trzy strony powstają.
- Nawigacja wyłącznie klawiaturą przez wszystkie slajdy i galerię, w każdej wersji językowej.
- Weryfikacja czytnikiem ekranu kolejności nagłówków i etykiet slajdów.
- Kontrast sprawdzony narzędziem, nie na oko.
- Lighthouse na urządzeniu mobilnym i desktopie, wszystkie cztery kategorie.
- Walidacja JSON-LD w teście wyników z elementami rozszerzonymi Google.
- Sprawdzenie `hreflang` pod kątem wzajemności odnośników.
- Zachowanie przy wyłączonym JavaScripcie: strona czytelna, nawigacja kotwicami działa.
- Zachowanie przy `prefers-reduced-motion`.
- Układ na wąskim telefonie z widocznym i schowanym paskiem adresu.

## Decyzje odrzucone

| Rozważane | Powód odrzucenia |
|---|---|
| React + Vite z prerenderingiem | Koszt hydratacji i obejścia routingu wielojęzycznego przy stronie statycznej |
| Czysty HTML/CSS/JS | Ta sama wydajność, ale ręczna obróbka zdjęć i brak i18n |
| Przechwytywanie scrolla w JS | Łamie klawiaturę, wyszukiwanie w stronie i czytniki ekranu |
| Osobny układ przewijany na telefonie | Dwa układy do utrzymania |
| Cormorant Garamond w nagłówkach | Właściciel wybrał stylistykę nowoczesną, bezszeryfową |
| Beżowy kolor uzupełniający | Paleta ma pochodzić wyłącznie z logo |
| Cennik na stronie | Decyzja właściciela |
| Podstrony na typy apartamentów | Jeden typ apartamentu |
| Formularz kontaktowy | Celem jest telefon |
| Google Fonts z CDN | Opóźnienie w ścieżce krytycznej i przekazywanie IP do zewnętrznego podmiotu |
