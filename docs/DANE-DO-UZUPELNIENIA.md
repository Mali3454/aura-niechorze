# Dane do uzupełnienia przed publikacją

Wartości `null` w `src/content/facts.ts` blokują publikację odpowiednich treści.
Po potwierdzeniu przez właściciela wpisz je i uruchom `npm run test`.

Każdy wiersz poniżej opisuje efekt, który naprawdę nastąpi po wpisaniu wartości.
Pilnuje tego test „dane niepotwierdzone są podłączone, a nie martwe"
(`tests/build-output.test.js`) — pole zadeklarowane w `facts.ts`, ale przez nikogo
nieczytane, wywala build. Wcześniej cztery z sześciu pól były martwe: właściciel
mógł zmierzyć metraż i trzy odległości, wpisać je, zobaczyć zielone testy i żadnej
zmiany na stronie.

| Pole w `facts.ts` | Typ | Co potwierdzić | Co się odblokuje |
|---|---|---|---|
| `beachDistanceM` | liczba (metry) | ✅ Potwierdzone: 50 m | Na liście odległości (slajd „Okolica") wiersz „Plaża w Niechorzu — 50 m", statystyka „50 m / do plaży" na slajdzie „O obiekcie" i zdanie pod nagłówkiem startowym „50 metrów od morza". |
| `areaSqm` | liczba (m²) | Metraż apartamentu | Na slajdzie „O obiekcie" **dochodzi czwarta statystyka**: „X m² / powierzchni" (odpowiednio „Wohnfläche", „of floor space"). |
| `facebookUrl` | pełny adres URL | Adres profilu | W sekcji „Kontakt" **pojawia się link** „Facebook" obok „Wyznacz trasę", a w danych strukturalnych JSON-LD dochodzi pole `sameAs`. |
| `lighthouseDistance` | tekst, np. `'1,2 km'` | Odległość do latarni morskiej | Na slajdzie „Okolica", pod nazwą atrakcji „Latarnia morska w Niechorzu", **pojawia się wiersz z odległością**. |
| `narrowGaugeDistance` | tekst, np. `'950 m'` | Odległość do przystanku kolejki wąskotorowej | To samo przy atrakcji „Kolejka wąskotorowa". |
| `oceanariumDistance` | tekst, np. `'400 m'` | Odległość do oceanarium | To samo przy atrakcji „Oceanarium". |

Trzy pola `*Distance` są tekstem, a nie liczbą, bo jednostka bywa różna
(metry przy bliskich, kilometry przy dalszych) — wpisz gotowy napis dokładnie
w takiej formie, w jakiej ma się pokazać. Napis jest ten sam we wszystkich trzech
językach; jeśli po niemiecku i angielsku ma wyglądać inaczej (np. `1.2 km`
zamiast `1,2 km`), trzeba to najpierw rozdzielić w `src/content/*.ts`.

Po uzupełnieniu `beachDistanceM` sprawdź, czy zdanie w `hero.sub` brzmi naturalnie
we wszystkich trzech językach — jest budowane warunkowo. Sam nagłówek i zdanie
wprowadzające celowo zostają opisowe niezależnie od liczby; ich brzmienie to
osobna decyzja właściciela.

Odrys logo do SVG wymaga zatwierdzenia przez właściciela w porównaniu
z `public/logo-white.webp`.
