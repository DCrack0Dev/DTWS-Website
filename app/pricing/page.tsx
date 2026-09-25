import MarketingLayout from "@/components/ui/MarketingLayout";
import OrderModalHydrator from "@/components/ui/OrderModalHydrator";

const PRICE_CATEGORIES = [
  {
    title: "🌐 Website Development",
    items: [
      {
        title: "Landing Page (1 Page)",
        desc: "A single, focused page built to convert visitors into leads. Perfect for launches, promos, or a simple business presence.",
        range: "R1,500 – R5,000",
        min: 1500,
        max: 5000,
        amount: 1500,
        category: "website"
      },
      {
        title: "Basic Website (3–5 Pages)",
        desc: "Multi-page site covering Home, About, Services, Gallery, and Contact. Clean, professional, and mobile-ready.",
        range: "R3,000 – R10,000",
        min: 3000,
        max: 10000,
        amount: 3000,
        category: "website"
      },
      {
        title: "Business Website (5–10 Pages)",
        desc: "A comprehensive site with custom layout, blog section, team profiles, testimonials, and full SEO optimisation.",
        range: "R5,000 – R15,000",
        min: 5000,
        max: 15000,
        amount: 5000,
        category: "website"
      },
      {
        title: "Professional Website (Custom Design)",
        desc: "Fully bespoke design from scratch — no templates. Includes UX planning, wireframes, custom animations, and pixel-perfect execution.",
        range: "R10,000 – R30,000",
        min: 10000,
        max: 30000,
        amount: 10000,
        category: "website"
      },
      {
        title: "E-commerce Website (Online Store)",
        desc: "Full online store with product listings, shopping cart, PayFast/Stripe payments, inventory, discount codes, and order tracking.",
        range: "R10,000 – R40,000",
        min: 10000,
        max: 40000,
        amount: 10000,
        category: "ecommerce"
      }
    ]
  },
  {
    title: "⚙️ Web App Development",
    items: [
      {
        title: "Basic Web App",
        desc: "Custom web applications with user authentication, dashboards, and core features — booking systems, client portals, internal tools.",
        range: "R10,000 – R30,000",
        min: 10000,
        max: 30000,
        amount: 10000,
        category: "webapp"
      },
      {
        title: "Advanced Web App",
        desc: "Complex, scalable platforms — multi-tenant SaaS, advanced integrations, real-time features, payment processing, multi-role systems.",
        range: "R30,000 – R100,000",
        min: 30000,
        max: 100000,
        amount: 30000,
        category: "webapp"
      }
    ]
  },
  {
    title: "📱 Mobile App Development",
    items: [
      {
        title: "Basic Mobile App",
        desc: "iOS + Android app with core features, user accounts, push notifications, and one primary workflow (MVP).",
        range: "R20,000 – R60,000",
        min: 20000,
        max: 60000,
        amount: 20000,
        category: "mobile"
      },
      {
        title: "Advanced Mobile App",
        desc: "Cross-platform production app with GPS/camera/payments, offline support, backend, admin dashboard, and App Store launch support.",
        range: "R60,000 – R200,000",
        min: 60000,
        max: 200000,
        amount: 60000,
        category: "mobile"
      }
    ]
  },
  {
    title: "🔍 SEO & Digital Marketing",
    items: [
      {
        title: "SEO Setup (Once-off)",
        desc: "On-page SEO, Google Search Console, sitemap, schema, analytics, local SEO, and keyword strategy session.",
        range: "R2,500 – R7,500",
        min: 2500,
        max: 7500,
        amount: 2500,
        category: "seo"
      },
      {
        title: "Monthly SEO Management",
        desc: "Ongoing on-page + content + link strategy, monthly reporting, and conversion optimisation.",
        range: "R1,500 – R4,500 / month",
        min: 1500,
        max: 4500,
        amount: 1500,
        category: "seo"
      },
      {
        title: "Paid Ads (Monthly Retainer)",
        desc: "Google / Meta / LinkedIn ads campaign management, creative, A/B testing, and weekly reporting.",
        range: "R3,000 – R10,000 / month",
        min: 3000,
        max: 10000,
        amount: 3000,
        category: "ads"
      }
    ]
  }
];

export const metadata = {
  title: "Pricing"
};

export default function PricingPage() {
  return (
    <MarketingLayout>
      <section className="page-hero">
        <div className="grid-bg"></div>
        <div className="page-hero-inner fade-up d1">
          <span className="section-tag">// Transparent Pricing</span>
          <h1 className="section-title">
            Affordable for <span className="gold">Growing Businesses</span>
          </h1>
          <div className="divider divider-center"></div>
          <p className="section-desc sa-only-text" style={{ margin: "0 auto" }}>
            Every service is priced to give South African businesses real value
            — professional quality without the agency price tag.
          </p>
        </div>
      </section>

      <div className="pricing-intro">
        <p>
          ⚡ <strong style={{ color: "var(--gold)" }}>
            Affordable solutions designed for growing businesses.
          </strong>{" "}
          Pricing may vary depending on project complexity, number of pages, and
          required features. Contact us for a free, no-obligation custom quote.
        </p>
      </div>

      <section className="pricing-section">
        <div className="pricing-inner">
          {PRICE_CATEGORIES.map((cat) => (
            <div key={cat.title} className="pricing-category">
              <div className="cat-title">{cat.title}</div>
              <div className="price-grid">
                {cat.items.map((it) => (
                  <div key={it.title} className="price-item">
                    <h4>{it.title}</h4>
                    <p>{it.desc}</p>
                    <div
                      className="price-tag"
                      data-price-min={it.min}
                      data-price-max={it.max}
                    >
                      {it.range}
                    </div>
                    <button
                      className="btn-order"
                      data-order={it.title}
                      data-amount={it.amount}
                      data-category={it.category}
                      type="button"
                    >
                      Order Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <OrderModalHydrator />
    </MarketingLayout>
  );
}
