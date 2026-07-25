import type { SiteContent } from './types';
import { FACTS, hasFact } from './facts';

const beach = hasFact(FACTS.beachDistanceM)
  ? `${FACTS.beachDistanceM} metrów od morza`
  : 'tuż przy plaży';

export const pl: SiteContent = {
  lang: 'pl',
  htmlLang: 'pl-PL',
  meta: {
    // nazwa obiektu ma być bajtowo identyczna wszędzie — jedno źródło prawdy
    title: FACTS.name,
    description:
      'Dwupoziomowy apartament dla 4 osób w Niechorzu, tuż przy plaży, w sosnowym lesie. Balkon z widokiem na morze, klimatyzacja, bezpłatny parking.',
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
