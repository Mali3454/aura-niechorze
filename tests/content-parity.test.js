import { describe, it, expect } from 'vitest';
import { pl } from '../src/content/pl.ts';
import { de } from '../src/content/de.ts';
import { en } from '../src/content/en.ts';
import { FACTS } from '../src/content/facts.ts';

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
    ]
      .join(' ')
      .toLowerCase()
      // wyjątek: cena łóżeczka jest podana w złotych także po niemiecku
      // i angielsku — „zł” to symbol waluty, nie nieprzetłumaczony tekst
      .replaceAll(FACTS.cribPrice.toLowerCase(), '');
    // wyjątek: nazwy własne Leśna i Kołobrzeg zostają w oryginale, więc
    // sprawdzamy tylko teksty interfejsu, gdzie nazw własnych nie ma
    for (const ch of suspicious) {
      expect(texts, `podejrzany polski znak "${ch}" w wersji ${_}`).not.toContain(ch);
    }
  });
});
