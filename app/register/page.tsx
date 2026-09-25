"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MarketingNavbar from "@/components/ui/MarketingNavbar";
import { useFirebase } from "@/components/providers/FirebaseClientProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { signUpEmail, initialising, profile } = useFirebase();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    company: "",
    phone: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialising) return;
    if (profile) {
      const t = profile.role === "admin" ? "/dashboard/command" : "/dashboard/projects";
      router.replace(t);
    }
  }, [profile, initialising, router]);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      const profileRes = await signUpEmail(form.email, form.password, {
        displayName: form.name,
        company: form.company,
        phone: form.phone
      });
      const target =
        profileRes.role === "admin" ? "/dashboard/command" : "/dashboard/projects";
      router.replace(target);
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <MarketingNavbar />
      <section className="auth-section">
        <div className="auth-container fade-up d1">
          <span className="section-tag">// Create Account</span>
          <h1 className="section-title">
            Join <span className="gold">DemiTech</span>
          </h1>
          <div className="divider"></div>
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                placeholder="Optional"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone / WhatsApp</label>
              <input
                type="tel"
                placeholder="Optional"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
              />
            </div>
            <button className="btn btn-gold btn-full" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account →"}
            </button>
            <p className="auth-toggle">
              Already have an account? <Link href="/login">Login</Link>
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
