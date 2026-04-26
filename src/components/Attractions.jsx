const ATTRACTIONS = [
  'Latarnia morska w Niechorzu — zabytek klasy 1, 45 m wysokości',
  'Klifowe plaże i czyste morze z Błękitną Flagą',
  'Ścieżki rowerowe i szlaki piesze wzdłuż wybrzeża',
  'Rybołówstwo i sporty wodne',
  'Park Miniatur Latarni Morskich',
  'Rezerwat przyrody — tereny zielone tuż przy ośrodku',
  'Świnoujście — 60 km · Kołobrzeg — 35 km',
];

export function Attractions() {
  return (
    <section className="attractions">
      <div className="attractions-inner">
        <div className="attractions-left">
          <p className="section-eyebrow reveal">Okolica</p>
          <h2 className="section-title reveal reveal-delay-1">
            Niechorze<br /><em>i okolice</em>
          </h2>
          <p className="section-body reveal reveal-delay-2">
            Niechorze to jedno z najpiękniejszych miejsc polskiego Wybrzeża.
            Latarnia morska, klifowe plaże i malownicze lasy tworzą idealne tło
            na wypoczynek o każdej porze roku.
          </p>
          <ul className="attractions-list reveal reveal-delay-3">
            {ATTRACTIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="attractions-right reveal">
          <img
            src={`${import.meta.env.BASE_URL}niechorze-2.webp`}
            alt="Latarnia morska nad morzem"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
