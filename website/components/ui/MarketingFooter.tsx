import Link from "next/link";

export default function MarketingFooter() {
  return (
    <>
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/demitech-logo.svg" alt="DemiTech Logo" />
              <p className="sa-only-text">
                Professional digital solutions for South African businesses.
                Based in Durban, serving clients nationwide.
              </p>
              <div className="footer-tagline">Built Local. Built to Grow.</div>
            </div>
            <div className="footer-col">
              <h5>Services</h5>
              <ul>
                <li><Link href="/pricing">Website Development</Link></li>
                <li><Link href="/pricing">Web App Development</Link></li>
                <li><Link href="/pricing">Mobile Apps</Link></li>
                <li><Link href="/pricing">SEO & Marketing</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Pages</h5>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/portfolio">Portfolio</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Contact</h5>
              <ul>
                <li><a href="tel:+27650241517">065 024 1517</a></li>
                <li>
                  <a href="mailto:demitechwebservices@gmail.com">
                    demitechwebservices@gmail.com
                  </a>
                </li>
                <li><a href="#">Durban, KwaZulu-Natal</a></li>
                <li><a href="#">Mon–Sun: 24 Hours</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 DemiTech Web Services. All rights reserved.</p>
            <span className="gold-text">Built Local. Built to Grow.</span>
          </div>
        </div>
      </footer>
      <a
        href="https://wa.me/27650241517"
        className="wa-float"
        target="blank"
        title="Chat on WhatsApp"
      >
        💬
      </a>
    </>
  );
}
