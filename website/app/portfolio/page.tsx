import MarketingLayout from "@website/components/ui/MarketingLayout";
import Link from "next/link";

const PORTFOLIO_CASES = [
  {
    name: "CTB Barbershop",
    url: "/CTB/",
    description:
      "Modern barbershop marketing site with gallery, team, services, and booking-ready design.",
    tag: "Website"
  },
  {
    name: "PP Group Properties",
    url: "/PP%20Group/",
    description:
      "Property agency multi-page site with agent bios, featured properties, and contact funnel.",
    tag: "Website"
  },
  {
    name: "SRK Consulting",
    url: "/SRK/",
    description:
      "Professional landing page for consulting services with lead capture and conversion focus.",
    tag: "Landing Page"
  },
  {
    name: "UT Clothing",
    url: "/UT%20Clothing/",
    description:
      "Fashion brand landing page with editorial feel, product showcase, and Instagram-style layout.",
    tag: "Website"
  }
];

export const metadata = {
  title: "Portfolio"
};

export default function PortfolioPage() {
  return (
    <MarketingLayout>
      <section className="page-hero">
        <div className="grid-bg"></div>
        <div className="page-hero-inner fade-up d1">
          <span className="section-tag">// Selected Work</span>
          <h1 className="section-title">
            Built for <span className="gold">Real Brands</span>
          </h1>
          <div className="divider divider-center"></div>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            A quick sample of sites and experiences we&apos;ve shipped for clients
            across South Africa.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: "4rem 5%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: "2rem"
          }}
        >
          {PORTFOLIO_CASES.map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="service-card"
              style={{
                cursor: "pointer",
                transition: "transform .2s ease, border-color .2s ease"
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "1rem",
                  color: "var(--gold)"
                }}
              >
                ✦
              </div>
              <div className="service-num">{c.tag}</div>
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <div style={{ marginTop: "1rem", color: "var(--gold)" }}>
                Visit site →
              </div>
            </a>
          ))}
        </div>
        <div style={{ textAlign: "center", padding: "4rem 0 0" }}>
          <Link href="/contact" className="btn btn-gold">
            Start Your Project
          </Link>
          &nbsp;&nbsp;
          <Link href="/pricing" className="btn btn-outline">
            View Pricing
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
