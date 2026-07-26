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
