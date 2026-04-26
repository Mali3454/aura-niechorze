export function WaveDivider() {
  return (
    <div className="wave-divider" style={{ background: 'var(--navy)' }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" fill="none">
        <path
          d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,80 L0,80 Z"
          fill="var(--cream)"
        />
      </svg>
    </div>
  );
}
