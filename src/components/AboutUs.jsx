export function AboutUs() {
  return (
    <section className="about">
      <div className="about-inner container">
        <div className="about-image reveal">
          <img
            src={`${import.meta.env.BASE_URL}niechorze-1.webp`}
            alt="Plaża nad Bałtykiem"
            loading="lazy"
          />
          <div className="about-badge">
            <span className="about-badge-num">200m</span>
            <span className="about-badge-label">od plaży</span>
          </div>
        </div>
        <div>
          <p className="section-eyebrow reveal reveal-delay-1">O Nas</p>
          <h2 className="section-title reveal reveal-delay-2">
            Miejsce stworzone<br /><em>dla Twojego spokoju</em>
          </h2>
          <p className="section-body reveal reveal-delay-3">
            Ośrodek wypoczynkowy Aura Niechorze to rodzinne miejsce na samym sercu
            polskiego wybrzeża. Oferujemy komfortowe zakwaterowanie, bliskość plaży
            i niezapomniane chwile z dala od zgiełku codzienności.
            <br /><br />
            Położenie w Niechorzu — tuż przy słynnej latarni morskiej — zapewnia
            niepowtarzalny klimat i wyjątkowe widoki na Morze Bałtyckie.
            Zaledwie <strong>200 metrów od plaży</strong> — morze jest tu
            na wyciągnięcie ręki.
          </p>
        </div>
      </div>
    </section>
  );
}
