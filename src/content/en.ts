import type { SiteContent } from './types';
import { FACTS, hasFact } from './facts';

const beach = hasFact(FACTS.beachDistanceM)
  ? `${FACTS.beachDistanceM} m from the sea`
  : 'right by the beach';

export const en: SiteContent = {
  lang: 'en',
  htmlLang: 'en-GB',
  meta: {
    title: 'Aura Niechorze — apartments by the beach',
    description:
      'Two-level apartment for 4 guests in Niechorze on the Polish Baltic coast, right by the beach in a pine forest. Sea-view balcony, air conditioning, free parking.',
    ogAlt: 'The Aura apartment building in Niechorze at dusk, lit balconies against pine trees',
  },
  chrome: {
    skip: 'Skip to content',
    callLabel: 'Call',
    langLabel: 'Language',
    langNames: { pl: 'Polski', de: 'Deutsch', en: 'English' },
    navLabel: 'Section navigation',
    slideNames: ['Home', 'The property', 'The apartment', 'The area', 'Contact'],
  },
  hero: {
    h1: 'Apartments by the beach in Niechorze',
    sub: `A two-level apartment for four — ${beach}, in a pine forest.`,
    cta: 'Call us',
    scrollHint: 'Scroll for more',
  },
  about: {
    h2: 'The property',
    lead: 'Quiet, green and close to the sea.',
    body:
      'Aura is a small building of apartments in Niechorze, Poland, on the edge of a pine forest a short walk from the Baltic Sea. Each apartment has two levels, its own balcony facing the sea and air conditioning. There is a garden, a terrace and free parking — you leave the car at the door on arrival and have no reason to touch it again until you go home.',
    stats: [
      { value: `${FACTS.guests}`, label: 'guests' },
      { value: '950 m', label: 'to the railway station' },
      { value: '200 m', label: 'to restaurants' },
    ],
  },
  apartment: {
    h2: 'The apartment',
    lead: 'This holiday apartment in Niechorze has two levels: a mezzanine bedroom, a kitchenette and a full bathroom.',
    amenities: [
      'Air conditioning',
      'Balcony facing the sea',
      'Free WiFi',
      'TV with cable channels',
      'Kitchenette',
      'Dining area',
      'Seating area',
      'Private bathroom with shower',
      'Hair dryer',
      'Toiletries',
      'Bed linen and towels',
    ],
    rules: [
      `Check-in ${FACTS.checkinFrom}–${FACTS.checkinTo}`,
      `Check-out ${FACTS.checkoutFrom}–${FACTS.checkoutTo}`,
      'Pets by arrangement',
      'Non-smoking property',
      `Cot ${FACTS.cribPrice} per night`,
    ],
    gallery: {
      open: 'Enlarge photo',
      close: 'Close',
      prev: 'Previous photo',
      next: 'Next photo',
      label: 'Gallery of the apartment interior',
    },
  },
  area: {
    h2: 'The area',
    lead: 'The sea starts behind the dunes, with the whole Baltic coast around you.',
    distancesLabel: 'Distances',
    distances: [
      { name: 'Niechorze beach', value: 'next door' },
      { name: 'Restaurants', value: '200–300 m' },
      { name: 'Niechorze railway station', value: '950 m' },
      { name: 'Pogorzelica beach', value: '900 m' },
      { name: 'Rewal beach', value: '1.8 km' },
      { name: 'Kołobrzeg', value: '47 km' },
      { name: 'Szczecin-Goleniów Airport', value: '80 km' },
    ],
    attractions: [
      { name: 'Niechorze lighthouse', text: 'A brick tower from 1866 with a viewing terrace high above the cliff.' },
      { name: 'Narrow-gauge railway', text: 'A heritage train that runs along the coast between the seaside villages.' },
      { name: 'Oceanarium', text: 'A marine exhibition in Niechorze — a good plan for a rainy afternoon.' },
    ],
  },
  contact: {
    h2: 'Contact',
    lead: 'Call us and ask which dates are free.',
    phoneLabel: 'Phone',
    addressLabel: 'Address',
    mapCta: 'Show map',
    mapNotice: 'The map only loads from Google servers after you click.',
    routeCta: 'Get directions',
    fbLabel: 'Facebook',
  },
  footer: { rights: 'All rights reserved.' },
  alts: {
    budynek: 'The Aura apartment building at dusk, lit balconies against the pine forest',
    salon: 'Living room with a navy sofa and a tall sloping window looking into the pines',
    salonStol: 'The dining end of the living room with a round wooden table and black chairs',
    aneks: 'Kitchenette with fitted cupboards, a fridge and a worktop',
    salonZGory: 'View down from the mezzanine over the living room, sofa and stairs',
    sypialnia: 'Mezzanine bedroom with a double bed and a navy bedspread',
    sypialniaOkno: 'Mezzanine bedroom with a large roof window',
    lazienka: 'Bathroom with a basin, mirror and shower enclosure in navy tiles',
    kosmetyki: 'Close-up of the house Aura toiletries by the shower',
  },
};
