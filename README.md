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
