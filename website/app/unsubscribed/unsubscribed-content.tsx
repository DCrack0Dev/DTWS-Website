"use client";

import { useSearchParams } from "next/navigation";
import MarketingLayout from "@website/components/ui/MarketingLayout";

export default function UnsubscribedContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");

  if (success) {
    return (
      <MarketingLayout>
        <div className="auth-card" style={{ maxWidth: 500, margin: "4rem auto", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
          <h1 className="section-title" style={{ marginBottom: "1rem" }}>
            You&apos;ve been unsubscribed
          </h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            You will no longer receive marketing emails from DemiTech Web Services.
            If this was a mistake, you can <a href="/contact" style={{ color: "var(--gold)" }}>contact us</a> to resubscribe.
          </p>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className="auth-card" style={{ maxWidth: 500, margin: "4rem auto", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div>
        <h1 className="section-title" style={{ marginBottom: "1rem" }}>
          Unsubscribe failed
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          {error === "invalid_token"
            ? "The unsubscribe link is invalid or has expired."
            : error === "not_configured"
            ? "The system is not configured properly. Please try again later."
            : "Something went wrong. Please try again or contact us."}
        </p>
        <a href="/contact" className="btn btn-gold" style={{ marginTop: "1rem", display: "inline-block" }}>
          Contact Support
        </a>
      </div>
    </MarketingLayout>
  );
}