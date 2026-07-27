export const FACTS = {
  name: 'Aura Niechorze — apartamenty przy plaży',
  street: 'Leśna 9',
  postalCode: '72-350',
  city: 'Niechorze',
  region: 'zachodniopomorskie',
  country: 'PL',
  phoneHref: 'tel:+48576040656',
  phoneDisplay: '+48 576 040 656',
  emailHref: 'mailto:aura.niechorze@gmail.com',
  emailDisplay: 'aura.niechorze@gmail.com',
  guests: 4,
  checkinFrom: '16:00',
  checkinTo: '21:00',
  checkoutFrom: '08:00',
  checkoutTo: '10:00',
  cribPrice: '30 zł',

  // === DANE NIEPOTWIERDZONE — nie publikować dopóki są null ===
  areaSqm: null as number | null,
  beachDistanceM: 50 as number | null,
  facebookUrl: 'https://www.facebook.com/profile.php?id=61592126218435' as string | null,
  lighthouseDistance: null as string | null,
  narrowGaugeDistance: null as string | null,
  oceanariumDistance: null as string | null,
} as const;

export function hasFact<T>(value: T | null): value is T {
  return value !== null && value !== undefined;
}

export const ADDRESS_QUERY = encodeURIComponent(
  `${FACTS.street}, ${FACTS.postalCode} ${FACTS.city}`
);
