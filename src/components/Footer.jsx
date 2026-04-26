export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <span className="footer-logo">Aura Niechorze</span>
        <span className="footer-copy">
          © {new Date().getFullYear()} Ośrodek Wypoczynkowy Aura Niechorze. Wszelkie prawa zastrzeżone.
        </span>
      </div>
    </footer>
  );
}
