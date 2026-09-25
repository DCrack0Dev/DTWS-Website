"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useFirebase } from "@/components/providers/FirebaseClientProvider";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/contact", label: "Contact" }
];

function useThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const key = "dtws-theme";
    const existing = (globalThis.localStorage?.getItem(key) === "light") ? "light" : "dark";
    setTheme(existing);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "light") root.dataset.theme = "light";
    else delete root.dataset.theme;
    globalThis.localStorage?.setItem("dtws-theme", theme);
    document.cookie = `dtws-theme=${theme}; path=/; max-age=604800; SameSite=Lax`;
  }, [theme, mounted]);
  return {
    theme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    mounted
  };
}

export default function MarketingNavbar() {
  const pathname = usePathname();
  const { profile, signOut } = useFirebase();
  const { theme, toggle, mounted } = useThemeToggle();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demitech-logo.svg" alt="DemiTech Web Services Logo" />
          </Link>
          <div className="nav-right">
            <ul className="nav-links">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={pathname === l.href ? "active" : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li id="nav-auth-link">
                {profile ? (
                  profile.role === "admin" ? (
                    <Link href="/dashboard/command" className="nav-cta">
                      Command Center
                    </Link>
                  ) : (
                    <Link href="/dashboard/projects" className="nav-cta">
                      Dashboard
                    </Link>
                  )
                ) : (
                  <Link href="/login" className="nav-cta">
                    Login
                  </Link>
                )}
              </li>
              {profile && (
                <li>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      window.location.href = "/";
                    }}
                    className="nav-cta"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    Logout
                  </button>
                </li>
              )}
            </ul>
            <button
              id="themeToggle"
              className="theme-toggle"
              type="button"
              aria-label="Toggle theme"
              aria-pressed={theme === "light" ? "true" : "false"}
              onClick={toggle}
            >
              <span className="theme-toggle-track" aria-hidden={true}>
                <span className="theme-toggle-thumb"></span>
              </span>
              <span className="theme-toggle-label" data-theme-toggle-label="">
                {mounted && theme === "light" ? "Dark" : "Light"}
              </span>
            </button>
            <button
              id="navToggle"
              className="nav-toggle"
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen ? "true" : "false"}
              onClick={() => setMobileOpen(true)}
            >
              <span className="nav-toggle-icon"></span>
            </button>
          </div>
        </div>
      </nav>

      <div id="mobileNav" className={`mobile-nav ${mobileOpen ? "active" : ""}`}>
        <div className="mobile-nav-inner">
          <div className="mobile-nav-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demitech-logo.svg" alt="DemiTech Logo" />
            <button
              id="closeNav"
              className="close-nav"
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
            >
              ×
            </button>
          </div>
          <ul className="mobile-nav-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={pathname === l.href ? "active" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li id="mobile-nav-auth-link">
              {profile ? (
                profile.role === "admin" ? (
                  <Link href="/dashboard/command" onClick={() => setMobileOpen(false)}>
                    Command Center
                  </Link>
                ) : (
                  <Link href="/dashboard/projects" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                )
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
              )}
            </li>
            <li>
              <Link href="/contact" className="mobile-cta" onClick={() => setMobileOpen(false)}>
                Get a Quote
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <Script src="/tracker.js" strategy="afterInteractive" />
      <Script src="/currency.js" strategy="afterInteractive" />
    </>
  );
}
