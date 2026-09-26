"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MarketingNavbar from "@website/components/ui/MarketingNavbar";
import { useFirebase } from "@website/components/providers/FirebaseClientProvider";

export default function LoginPageClient() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { signInEmail, initialising, profile } = useFirebase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialising) return;
    if (profile) {
      router.replace(next ?? "/dashboard/projects");
    }
  }, [profile, initialising, next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInEmail(email, password);
      router.replace(next ?? "/dashboard/projects");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (initialising) {
    return (
      <main className="min-h-screen">
        <MarketingNavbarSkeleton />
        <div style={{ height: 240 }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <MarketingNavbar />
      <section className="auth-section">
        <div className="auth-container fade-up d1">
          <span className="section-tag">// Welcome Back</span>
          <h1 className="section-title">
            Client <span className="gold">Portal</span>
          </h1>
          <div className="divider"></div>
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-gold btn-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "🚀 Secure Login"}
            </button>
            <p className="auth-toggle">
              Don&apos;t have an account?{" "}
              <Link href="/register">Create one</Link>
            </p>
            {error && (
              <div className="auth-error" style={{ display: "block" }}>
                {error}
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

function MarketingNavbarSkeleton() {
  return (
    <nav className="navbar" style={{ visibility: "hidden" }}>
      <div className="nav-inner h-16"></div>
    </nav>
  );
}
