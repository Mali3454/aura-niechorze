import { useHeroCanvas } from '../hooks/useHeroCanvas';

export function Hero() {
  const canvasRef = useHeroCanvas();

  return (
    <section className="hero">
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="hero-bg" />
      <div className="hero-grain" />
      <div className="hero-line" />

      <svg className="hero-waves" viewBox="0 0 1440 180" preserveAspectRatio="none" fill="none">
        <path d="M0,90 C240,140 480,40 720,90 C960,140 1200,40 1440,90 L1440,180 L0,180 Z" fill="rgba(255,255,255,0.08)" />
        <path d="M0,120 C360,60 720,160 1080,100 C1260,70 1380,130 1440,110 L1440,180 L0,180 Z" fill="rgba(255,255,255,0.04)" />
      </svg>

      <div className="hero-content">
        <p className="hero-eyebrow">Niechorze · Pomorze Zachodnie</p>
        <h1 className="hero-title">Aura<br /><em>Niechorze</em></h1>
        <p className="hero-subtitle">Wypoczynek nad Bałtykiem</p>
        <div className="hero-divider" />
        <p className="hero-desc">
          Wyjątkowe miejsce na mapie polskiego wybrzeża — gdzie szelest fal
          i zapach morskiej bryzy tworzą idealną atmosferę do odpoczynku.
        </p>
      </div>

      <div className="hero-scroll">
        <span>Odkryj</span>
        <div className="scroll-line" />
      </div>
    </section>
  );
}
