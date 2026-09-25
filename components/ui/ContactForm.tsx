"use client";

import { useState } from "react";

export default function ContactForm() {
  const [state, setState] = useState<{
    name: string;
    email: string;
    phone: string;
    company: string;
    service: string;
    budget: string;
    message: string;
  }>({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "Website",
    budget: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  function update<K extends keyof typeof state>(k: K, v: typeof state[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/website-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact_request",
          payload: state,
          idempotencyKey:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        })
      });
      if (!res.ok) throw new Error("bad status");
      setStatus("ok");
      setState({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: "Website",
        budget: "",
        message: ""
      });
    } catch {
      setStatus("err");
    }
  }

  return (
    <form onSubmit={onSubmit} className="auth-form" style={{ width: "100%" }}>
      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          required
          value={state.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="John Doe"
        />
      </div>
      <div className="form-group">
        <label>Email Address</label>
        <input
          type="email"
          required
          value={state.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="form-group">
        <label>Phone / WhatsApp</label>
        <input
          type="tel"
          value={state.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="065 000 0000"
        />
      </div>
      <div className="form-group">
        <label>Company</label>
        <input
          type="text"
          value={state.company}
          onChange={(e) => update("company", e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="form-group">
        <label>Service</label>
        <select
          value={state.service}
          onChange={(e) => update("service", e.target.value)}
        >
          <option>Website</option>
          <option>Web App</option>
          <option>Mobile App</option>
          <option>SEO / Marketing</option>
          <option>Other</option>
        </select>
      </div>
      <div className="form-group">
        <label>Budget Range</label>
        <input
          type="text"
          value={state.budget}
          onChange={(e) => update("budget", e.target.value)}
          placeholder="e.g. R5k – R15k"
        />
      </div>
      <div className="form-group">
        <label>Tell us about your project</label>
        <textarea
          required
          rows={5}
          value={state.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="What are you trying to build?"
          style={{
            width: "100%",
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            color: "inherit",
            fontFamily: "inherit"
          }}
        />
      </div>
      <button
        type="submit"
        className="btn btn-gold btn-full"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending..." : "Send Message →"}
      </button>
      {status === "ok" && (
        <p style={{ color: "var(--gold)", marginTop: "1rem", textAlign: "center" }}>
          ✅ Thanks — we&apos;ll be in touch within 24 hours.
        </p>
      )}
      {status === "err" && (
        <p style={{ color: "#ff7878", marginTop: "1rem", textAlign: "center" }}>
          Something went wrong. Please WhatsApp us instead.
        </p>
      )}
    </form>
  );
}
