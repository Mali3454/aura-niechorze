function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.1 11.07 19.79 19.79 0 01.07 2.38 2 2 0 012.05.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function ContactItem({ icon, label, children }) {
  return (
    <div className="contact-item">
      <div className="contact-icon">{icon}</div>
      <div>
        <div className="contact-label">{label}</div>
        <div className="contact-value">{children}</div>
      </div>
    </div>
  );
}

export function Contact() {
  return (
    <section className="contact">
      <div className="contact-inner container">
        <div>
          <p className="section-eyebrow reveal">Kontakt</p>
          <h2 className="section-title reveal reveal-delay-1">
            Skontaktuj się<br /><em>z nami</em>
          </h2>
          <p className="section-body reveal reveal-delay-2">
            Chętnie odpowiemy na pytania dotyczące oferty i rezerwacji.
          </p>
        </div>
        <div className="contact-items reveal reveal-delay-3">
          <ContactItem icon={<LocationIcon />} label="Adres">
            ul. Leśna 9<br />72-350 Niechorze
          </ContactItem>
          <ContactItem icon={<PhoneIcon />} label="Telefon">
            <a href="tel:+48576040656">+48 576 040 656</a>
          </ContactItem>
          <ContactItem icon={<EmailIcon />} label="E-mail">
            <a href="mailto:aura.niechorze@gmail.com">aura.niechorze@gmail.com</a>
          </ContactItem>
        </div>
      </div>
    </section>
  );
}
