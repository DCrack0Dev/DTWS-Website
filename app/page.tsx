import Link from "next/link";
import MarketingLayout from "@/components/ui/MarketingLayout";

export default function HomePage() {
  return (
    <MarketingLayout>
      <section className="hero">
        <div className="grid-bg"></div>
        <div className="hero-glow"></div>
        <div className="hero-inner">
          <div className="hero-eyebrow fade-up d1">Durban-Based · Serving SA Wide</div>
          <h1 className="hero-headline fade-up d2">
            We Build the Web.<br />
            <span className="gold">You Grow</span> the Business.
            <span className="line2">DemiTech Web Services</span>
          </h1>
          <p className="hero-sub fade-up d3 sa-only-text">
            Professional websites, web apps, and mobile apps — priced for South
            African businesses that are serious about growth. No agency markups.
            No shortcuts.
          </p>
          <div className="hero-ctas fade-up d4">
            <Link href="/pricing" className="btn btn-gold">View Pricing</Link>
            <Link href="/portfolio" className="btn btn-outline">View Portfolio</Link>
            <Link href="/contact" className="btn btn-outline">Contact Me</Link>
          </div>
          <div className="hero-stats fade-up d5">
            <div className="stat">
              <div className="stat-num">7–21</div>
              <div className="stat-label">Day Delivery</div>
            </div>
            <div className="stat">
              <div className="stat-num" data-price="1500" data-format="k">
                R1.5K
              </div>
              <div className="stat-label">Starting Price</div>
            </div>
            <div className="stat">
              <div className="stat-num">SA</div>
              <div className="stat-label">Wide Reach</div>
            </div>
            <div className="stat">
              <div className="stat-num">100%</div>
              <div className="stat-label">Custom Built</div>
            </div>
          </div>
        </div>
      </section>

      <section className="founder-section">
        <div className="founder-inner">
          <div className="founder-visual">
            <div className="founder-frame">
              <span>👨🏾‍💻</span>
              <div className="founder-corner fc-tl"></div>
              <div className="founder-corner fc-tr"></div>
              <div className="founder-corner fc-bl"></div>
              <div className="founder-corner fc-br"></div>
              <div className="founder-quote">Founder · Tebogo</div>
            </div>
          </div>
          <div className="founder-text">
            <span className="section-tag">// About the Founder</span>
            <h2 className="section-title">
              Built by someone who <span className="gold">understands</span> your business
            </h2>
            <div className="divider"></div>
            <blockquote>
              "My name is Tebogo, founder of DemiTech Web Services. I specialise
              in building modern websites, web applications, and mobile apps that
              help businesses grow and stand out online."
            </blockquote>
            <p style={{ color: "var(--muted)", fontSize: ".9rem", lineHeight: 1.8 }}>
              We help startups, small businesses, and growing brands get
              high-quality digital solutions without the high agency costs. When
              you work with DemiTech, you work directly with the person building
              your product — no middlemen, no miscommunication.
            </p>
            <ul className="founder-points">
              <li>We focus on speed, simplicity, and results</li>
              <li>We work closely with clients to understand their exact needs</li>
              <li>We deliver clean, scalable, and user-friendly solutions</li>
              <li>Milestone payments — you only pay for completed work</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="services-section">
        <div className="container text-center">
          <span className="section-tag">// What We Do</span>
          <h2 className="section-title">
            Services built for <span className="gold">real growth</span>
          </h2>
          <div className="divider divider-center"></div>
          <p className="section-desc">
            From a clean landing page to a full-scale web application — every
            solution is custom-built for your business goals.
          </p>
        </div>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">🌐</div>
            <div className="service-num">01</div>
            <h3>Website Development</h3>
            <p>
              Custom-designed websites that look professional, load fast, and
              convert visitors into customers. From single landing pages to full
              multi-page business sites — built to represent your brand properly.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">⚙️</div>
            <div className="service-num">02</div>
            <h3>Web App Development</h3>
            <p>
              Custom web applications with user dashboards, booking systems,
              admin panels, and real-time features. Whether it&apos;s an internal
              tool or a full SaaS product — we build software that works.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">📱</div>
            <div className="service-num">03</div>
            <h3>Mobile App Development</h3>
            <p>
              iOS and Android applications built for real users. From simple
              utilities to complex platforms with payments, GPS, real-time data,
              and push notifications — we develop apps that deliver results.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">🔍</div>
            <div className="service-num">04</div>
            <h3>SEO & Digital Marketing</h3>
            <p>
              Get found on Google and grow your customer base online. We handle
              SEO setup, monthly management, social media strategy, and paid
              advertising — so you can focus on running your business.
            </p>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "3rem 5% 0" }}>
          <Link href="/pricing" className="btn btn-gold">See All Pricing</Link>
          &nbsp;&nbsp;
          <Link href="/contact" className="btn btn-outline">Start a Project</Link>
        </div>
      </section>

      <section style={{ padding: "5rem 5%", background: "var(--bg2)", borderTop: "1px solid var(--border)" }}>
        <div className="container text-center">
          <span className="section-tag">// Why DemiTech</span>
          <h2 className="section-title">
            Affordable doesn&apos;t mean <span className="gold">cheap</span>
          </h2>
          <div className="divider divider-center"></div>
          <p className="section-desc" style={{ margin: "0 auto 3rem" }}>
            We run lean so you pay less. Direct access, no agency bloat, SA-market
            pricing, and milestone payments that protect you every step of the way.
          </p>
        </div>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "1.5rem"
          }}
          className="why-strip"
        >
          <div style={{ textAlign: "center", padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: ".75rem" }}>🏗️</div>
            <h4 style={{ fontSize: ".9rem", marginBottom: ".4rem" }}>Lean Team</h4>
            <p style={{ fontSize: ".8rem", color: "var(--muted)" }}>
              No office overheads. Savings passed directly to you.
            </p>
          </div>
          <div style={{ textAlign: "center", padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: ".75rem" }}>🤝</div>
            <h4 style={{ fontSize: ".9rem", marginBottom: ".4rem" }}>Direct Access</h4>
            <p style={{ fontSize: ".8rem", color: "var(--muted)" }}>
              You work with the builder — no middlemen, no delays.
            </p>
          </div>
          <div style={{ textAlign: "center", padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: ".75rem" }} data-flag="">
              🇿🇦
            </div>
            <h4 style={{ fontSize: ".9rem", marginBottom: ".4rem" }}>Local Pricing</h4>
            <p style={{ fontSize: ".8rem", color: "var(--muted)" }} className="sa-only-text">
              Priced in rands, designed for South African business reality.
            </p>
          </div>
          <div style={{ textAlign: "center", padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: ".75rem" }}>💳</div>
            <h4 style={{ fontSize: ".9rem", marginBottom: ".4rem" }}>Milestone Payments</h4>
            <p style={{ fontSize: ".8rem", color: "var(--muted)" }}>
              Pay in stages — only when work is done and approved.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: "5rem 5%", textAlign: "center" }}>
        <div className="container">
          <span className="section-tag">// Ready to Start?</span>
          <h2 className="section-title">
            Let&apos;s build something <span className="gold">powerful</span>
          </h2>
          <div className="divider divider-center"></div>
          <p className="section-desc" style={{ margin: "0 auto 2.5rem" }}>
            Tell us about your project and receive a free quote within 24 hours.
            No obligation, no pressure.
          </p>
          <Link href="/contact" className="btn btn-gold">Get a Free Quote</Link>
          &nbsp;&nbsp;
          <a href="https://wa.me/27650241517" className="btn btn-outline">
            💬 WhatsApp Us
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}
