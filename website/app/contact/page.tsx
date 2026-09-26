import MarketingLayout from "@website/components/ui/MarketingLayout";
import ContactForm from "@website/components/ui/ContactForm";

export const metadata = {
  title: "Contact"
};

export default function ContactPage() {
  return (
    <MarketingLayout>
      <section className="page-hero">
        <div className="grid-bg"></div>
        <div className="page-hero-inner fade-up d1">
          <span className="section-tag">// Let&apos;s Talk</span>
          <h1 className="section-title">
            Tell us about your <span className="gold">Project</span>
          </h1>
          <div className="divider divider-center"></div>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            Free, no-obligation quote within 24 hours.
          </p>
        </div>
      </section>
      <section
        className="container"
        style={{ padding: "3rem 5% 5rem" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            maxWidth: 1100,
            margin: "0 auto"
          }}
          className="contact-grid"
        >
          <div>
            <h2 className="section-title" style={{ fontSize: "1.8rem" }}>
              Contact <span className="gold">Details</span>
            </h2>
            <div className="divider"></div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: "1.5rem", color: "var(--muted)", lineHeight: 2 }}>
              <li>📞 <a href="tel:+27650241517" style={{ color: "inherit" }}>065 024 1517</a></li>
              <li>✉️ <a href="mailto:demitechwebservices@gmail.com" style={{ color: "inherit" }}>demitechwebservices@gmail.com</a></li>
              <li>📍 Durban, KwaZulu-Natal</li>
              <li>🕒 Mon–Sun · 24 Hour Support</li>
              <li>💬 <a href="https://wa.me/27650241517" target="_blank" rel="noreferrer" style={{ color: "inherit" }}>WhatsApp Tebogo directly</a></li>
            </ul>
          </div>
          <ContactForm />
        </div>
      </section>
    </MarketingLayout>
  );
}
