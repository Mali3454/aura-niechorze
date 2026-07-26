import type { SiteContent } from './types';
import { FACTS, hasFact } from './facts';

const beach = hasFact(FACTS.beachDistanceM)
  ? `${FACTS.beachDistanceM} Meter bis zum Meer`
  : 'direkt am Strand';

const petsPolicy = 'Haustiere nach Absprache';

export const de: SiteContent = {
  lang: 'de',
  htmlLang: 'de-DE',
  meta: {
    title: 'Aura Niechorze — Ferienapartments am Strand',
    description:
      'Maisonette-Apartment für 4 Personen in Niechorze an der polnischen Ostsee, direkt am Strand im Kiefernwald. Balkon mit Meerblick, Klimaanlage, Parkplatz.',
    ogAlt: 'Das Apartmenthaus Aura in Niechorze in der Abenddämmerung, beleuchtete Balkone vor Kiefern',
  },
  chrome: {
    skip: 'Zum Inhalt springen',
    callLabel: 'Anrufen',
    langLabel: 'Sprache',
    langNames: { pl: 'Polski', de: 'Deutsch', en: 'English' },
    navLabel: 'Navigation durch die Abschnitte',
    slideNames: ['Start', 'Unterkunft', 'Apartment', 'Umgebung', 'Kontakt'],
  },
  hero: {
    h1: 'Ferienapartments am Strand in Niechorze',
    sub: `Maisonette-Apartment für vier Personen — ${beach}, im Kiefernwald.`,
    cta: 'Anrufen',
    scrollHint: 'Weiterscrollen',
  },
  about: {
    h2: 'Die Unterkunft',
    lead: 'Ruhig, grün und nah am Meer.',
    body:
      'Aura ist eine kleine Unterkunft in Niechorze an der Ostsee, am Rand eines Kiefernwaldes und wenige Schritte vom Wasser entfernt. Jede Wohnung hat zwei Ebenen, einen eigenen Balkon mit Meerblick und eine Klimaanlage. Dazu Garten, Terrasse und ein kostenfreier Parkplatz — das Auto stellen Sie bei der Ankunft ab und brauchen es bis zur Abreise nicht mehr.',
    stats: [
      { value: `${FACTS.guests}`, label: 'Personen' },
      { value: '950 m', label: 'zum Bahnhof' },
      { value: '200 m', label: 'zu Restaurants' },
      ...(hasFact(FACTS.areaSqm) ? [{ value: `${FACTS.areaSqm} m²`, label: 'Wohnfläche' }] : []),
    ],
  },
  apartment: {
    h2: 'Das Apartment',
    lead: 'Die Ferienwohnung in Niechorze hat zwei Ebenen: Schlafzimmer auf der Galerie, Küchenzeile und ein eigenes Bad.',
    amenities: [
      'Klimaanlage',
      'Balkon mit Meerblick',
      'Kostenfreies WLAN',
      'Fernseher mit Kabelprogrammen',
      'Küchenzeile',
      'Essbereich',
      'Sitzbereich',
      'Eigenes Bad mit Dusche',
      'Haartrockner',
      'Pflegeprodukte',
      'Bettwäsche und Handtücher',
    ],
    rules: [
      `Anreise ${FACTS.checkinFrom}–${FACTS.checkinTo} Uhr`,
      `Abreise ${FACTS.checkoutFrom}–${FACTS.checkoutTo} Uhr`,
      petsPolicy,
      'Nichtraucherunterkunft',
      `Kinderbett ${FACTS.cribPrice} pro Nacht`,
    ],
    petsPolicy,
    gallery: {
      open: 'Foto vergrößern',
      close: 'Schließen',
      prev: 'Vorheriges Foto',
      next: 'Nächstes Foto',
      label: 'Galerie der Innenräume',
    },
  },
  area: {
    h2: 'Umgebung',
    lead: 'Das Meer beginnt hinter den Dünen, ringsum liegt die ganze Ostseeküste.',
    distancesLabel: 'Entfernungen',
    distances: [
      // Siehe pl.ts: unbestätigte Entfernung, deshalb keine Zeile.
      ...(hasFact(FACTS.beachDistanceM)
        ? [{ name: 'Strand in Niechorze', value: `${FACTS.beachDistanceM} m` }]
        : []),
      { name: 'Restaurants', value: '200–300 m' },
      { name: 'Bahnhof Niechorze', value: '950 m' },
      { name: 'Strand Pogorzelica', value: '900 m' },
      { name: 'Strand Rewal', value: '1,8 km' },
      { name: 'Kołobrzeg (Kolberg)', value: '47 km' },
      { name: 'Flughafen Szczecin-Goleniów', value: '80 km' },
    ],
    attractions: [
      { name: 'Leuchtturm von Niechorze', text: 'Backsteinturm von 1866 mit Aussichtsplattform hoch über der Steilküste.', ...(hasFact(FACTS.lighthouseDistance) ? { distance: FACTS.lighthouseDistance } : {}) },
      { name: 'Schmalspurbahn', text: 'Historischer Zug, der entlang der Küste zwischen den Ostseeorten verkehrt.', ...(hasFact(FACTS.narrowGaugeDistance) ? { distance: FACTS.narrowGaugeDistance } : {}) },
      { name: 'Oceanarium', text: 'Meeresausstellung in Niechorze — eine gute Idee für einen verregneten Nachmittag.', ...(hasFact(FACTS.oceanariumDistance) ? { distance: FACTS.oceanariumDistance } : {}) },
    ],
  },
  contact: {
    h2: 'Kontakt',
    lead: 'Rufen Sie an und fragen Sie nach freien Terminen.',
    phoneLabel: 'Telefon',
    addressLabel: 'Adresse',
    mapCta: 'Karte anzeigen',
    mapNotice: 'Die Karte wird erst nach dem Klick von den Servern von Google geladen.',
    routeCta: 'Route planen',
    fbLabel: 'Facebook',
  },
  footer: { rights: 'Alle Rechte vorbehalten.' },
  alts: {
    budynek: 'Das Apartmenthaus Aura in der Abenddämmerung, beleuchtete Balkone vor dem Kiefernwald',
    salon: 'Wohnraum mit dunkelblauem Sofa und hohem schrägem Fenster mit Blick in die Kiefern',
    salonStol: 'Essbereich des Wohnraums mit rundem Holztisch und schwarzen Stühlen',
    aneks: 'Küchenzeile mit durchgehenden Schränken, Kühlschrank und Arbeitsplatte',
    salonZGory: 'Blick von der Galerie hinunter auf Wohnraum, Sofa und Treppe',
    sypialnia: 'Schlafzimmer auf der Galerie mit Doppelbett und dunkelblauer Tagesdecke',
    sypialniaOkno: 'Schlafzimmer auf der Galerie mit großem Dachfenster',
    lazienka: 'Bad mit Waschbecken, Spiegel und Duschkabine in dunkelblauen Fliesen',
    kosmetyki: 'Nahaufnahme der hauseigenen Aura-Pflegeprodukte an der Dusche',
  },
};
