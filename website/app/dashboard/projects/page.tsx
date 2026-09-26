"use client";

import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot
} from "firebase/firestore";
import { useFirebase, useFirebaseUser } from "@website/components/providers/FirebaseClientProvider";
import { getFirebaseClientDb } from "@website/lib/firebase/client";

type OrderDocData = {
  service?: string;
  orderStatus?: string;
  milestone?: number;
  paidAmount?: number;
  userId?: string;
};

type OrderDoc = OrderDocData & { id: string };

export default function ClientDashboardPage() {
  const { user, profile, initialising, isAdmin } = useFirebaseUser();
  const { signOut } = useFirebase();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(100);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [withdrawForm, setWithdrawForm] = useState({
    accHolder: "",
    accNumber: "",
    bankName: "",
    branchCode: ""
  });
  const [busy, setBusy] = useState<"deposit" | "withdraw" | null>(null);
  const refreshCounter = useRef(0);

  useEffect(() => {
    if (initialising) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, initialising, router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      // wallet.js getWallet
      const getWallet = (globalThis as unknown as { getWallet?: (uid: string) => Promise<{ balance: number } | null> }).getWallet;
      if (getWallet) {
        try {
          const w = await getWallet(user.uid);
          if (!cancelled) setWalletBalance(w?.balance ?? 0);
        } catch (err) {
          console.error("wallet load err", err);
        }
      }
      try {
        const db = getFirebaseClientDb();
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(q);
        const docs: OrderDoc[] = [];
        snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data() as OrderDocData;
          docs.push({ id: d.id, ...data });
        });
        if (!cancelled) setOrders(docs);
      } catch (err) {
        console.error("orders load err", err);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, refreshCounter.current, initialising]);

  const activeProjects = useMemo(
    () => orders.filter((o) => o.orderStatus !== "archived").length,
    [orders]
  );
  const totalInvested = useMemo(
    () => orders.reduce((acc, o) => acc + (o.paidAmount ?? 0), 0),
    [orders]
  );
  const displayName =
    profile?.displayName ?? profile?.email?.split("@")[0] ?? "Client";
  const initials = displayName.charAt(0).toUpperCase();

  async function handleDepositSubmit() {
    if (!user) return;
    setBusy("deposit");
    try {
      const initiateDeposit = (globalThis as unknown as {
        initiateDeposit?: (uid: string, amount: number) => Promise<boolean>;
      }).initiateDeposit;
      if (initiateDeposit) {
        const ok = await initiateDeposit(user.uid, Number(depositAmount));
        if (ok) {
          setDepositModalOpen(false);
          refreshCounter.current += 1;
        }
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleWithdrawSubmit() {
    if (!user) return;
    setBusy("withdraw");
    try {
      const initiateWithdrawal = (globalThis as unknown as {
        initiateWithdrawal?: (
          uid: string,
          amount: number,
          bankData: {
            account_holder: string;
            account_number: string;
            bank_name: string;
            bank_code: string;
            account_type: string;
          }
        ) => Promise<boolean>;
      }).initiateWithdrawal;
      if (initiateWithdrawal) {
        const bankData = {
          account_holder: withdrawForm.accHolder,
          account_number: withdrawForm.accNumber,
          bank_name: withdrawForm.bankName,
          bank_code: withdrawForm.branchCode || "000000",
          account_type: "1"
        };
        const ok = await initiateWithdrawal(
          user.uid,
          Number(withdrawAmount),
          bankData
        );
        if (ok) {
          setWithdrawModalOpen(false);
          setWithdrawAmount(0);
          setWithdrawForm({
            accHolder: "",
            accNumber: "",
            bankName: "",
            branchCode: ""
          });
          refreshCounter.current += 1;
        }
      }
    } finally {
      setBusy(null);
    }
  }

  if (initialising || !user) {
    return (
      <div className="min-h-screen bg-bg-500">
        <div className="dash-top-nav h-16 w-full border-b border-border" />
      </div>
    );
  }

  return (
    <>
      <Script src="/currency.js" strategy="beforeInteractive" />
      <Script src="/payfast.js" strategy="beforeInteractive" />
      <Script src="/wallet.js" strategy="beforeInteractive" />

      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      <div
        className="dash-layout"
        style={{
          "--dash-bg": "#0a0a0a",
          "--dash-sidebar": "#000",
          "--dash-card": "#0a0a0a",
          "--dash-border": "rgba(255,255,255,0.08)",
          "--dash-gold": "#D4A017",
          "--dash-text": "#ffffff",
          "--dash-muted": "#888888"
        } as React.CSSProperties}
      >
        <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demitech-logo.svg" alt="D" className="sidebar-logo" />
            <nav className="sidebar-nav">
              <ul>
                <li>
                  <a href="#" className="active" title="Overview">📊</a>
                </li>
                <li>
                  <Link href="/pricing" title="New Order">🛍️</Link>
                </li>
                <li>
                  <Link href="/contact" title="Support">💬</Link>
                </li>
              </ul>
            </nav>
          </div>
          <nav className="sidebar-nav" style={{ marginBottom: "1.5rem" }}>
            <ul>
              <li>
                <button
                  type="button"
                  title="Logout"
                  style={{
                    fontSize: "1.4rem",
                    color: "#ff6b6b",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    width: 50,
                    height: 50,
                    borderRadius: 12
                  }}
                  onClick={async () => {
                    await signOut();
                    router.replace("/");
                  }}
                >
                  🚪
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="dash-container">
          <header className="dash-top-nav">
            <div className="nav-left">
              <button
                type="button"
                className="hamburger"
                onClick={() => setSidebarOpen((s) => !s)}
              >
                ☰
              </button>
              <ul className="horizontal-menu">
                <li><a href="#" className="active">Overview</a></li>
                <li><Link href="/pricing">New Order</Link></li>
                <li><Link href="/contact">Support</Link></li>
              </ul>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--dash-muted)"
                }}
              >
                {displayName}
              </span>
              <div
                style={{
                  width: 30,
                  height: 30,
                  background: "var(--dash-gold)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "0.75rem"
                }}
              >
                {initials}
              </div>
            </div>
          </header>

          <main className="dash-main">
            <header>
              <h2>Welcome, {displayName}!</h2>
              <p style={{ color: "var(--dash-muted)", fontSize: "0.9rem" }}>
                Here is what&apos;s happening with your projects.
              </p>
            </header>

            <div className="dash-stat-grid">
              <div className="dash-section stat-card">
                <h5>Wallet Balance</h5>
                <div className="val">
                  R{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setDepositModalOpen(true)}
                    style={{
                      flex: 1,
                      background: "var(--dash-gold)",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: 4,
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      color: "#000"
                    }}
                  >
                    + Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawModalOpen(true)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "1px solid var(--dash-gold)",
                      padding: "5px 10px",
                      borderRadius: 4,
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      color: "var(--dash-gold)"
                    }}
                  >
                    ↑ Withdraw
                  </button>
                </div>
              </div>
              <div className="dash-section stat-card">
                <h5>Active Projects</h5>
                <div className="val">{activeProjects}</div>
              </div>
              <div className="dash-section stat-card">
                <h5>Total Invested</h5>
                <div className="val">R{totalInvested.toLocaleString()}</div>
              </div>
            </div>

            <div
              className="dash-section"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              <h4
                style={{
                  margin: "0 0 1.5rem 0",
                  fontFamily: "var(--font-head)",
                  fontSize: "1.1rem"
                }}
              >
                Active Roadmap
              </h4>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {orders.length === 0 ? (
                  <p style={{ color: "var(--dash-muted)", textAlign: "center", padding: "3rem" }}>
                    No active projects yet.{" "}
                    <Link href="/pricing" style={{ color: "var(--dash-gold)" }}>
                      Start one here!
                    </Link>
                  </p>
                ) : (
                  orders.map((o) => {
                    const milestoneProgress =
                      o.milestone === 1
                        ? "Phase 1: Deposit"
                        : o.milestone === 2
                          ? "Phase 2: Build"
                          : o.milestone === 3
                            ? "Phase 3: Review"
                            : "Phase 4: Live";
                    const statusClass =
                      o.orderStatus === "completed" ? "status-completed" : "status-active";
                    return (
                      <div key={o.id} className="order-card">
                        <div className="order-info">
                          <h4>{o.service ?? "Project"}</h4>
                          <p>
                            {milestoneProgress} · Ref: {o.id.slice(0, 6)}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span className={`status-pill ${statusClass}`}>
                            {o.orderStatus ?? "active"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {depositModalOpen && (
        <div
          className="sidebar-overlay"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000
          }}
          onClick={() => setDepositModalOpen(false)}
        >
          <div
            className="dash-section"
            style={{ width: 300, background: "var(--dash-sidebar)", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDepositModalOpen(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "none",
                border: "none",
                color: "var(--dash-muted)",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
            <h4 style={{ marginTop: 0 }}>Deposit Funds</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--dash-muted)" }}>
              Enter amount to add to your wallet.
            </p>
            <div style={{ margin: "1.5rem 0" }}>
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "var(--dash-muted)",
                  display: "block",
                  marginBottom: 5
                }}
              >
                Amount (ZAR)
              </label>
              <input
                type="number"
                min={10}
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: 10,
                  background: "var(--dash-bg)",
                  border: "1px solid var(--dash-border)",
                  color: "white",
                  borderRadius: 8
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleDepositSubmit}
              disabled={busy === "deposit"}
              style={{
                width: "100%",
                padding: 12,
                background: "var(--dash-gold)",
                border: "none",
                borderRadius: 8,
                fontWeight: "bold",
                cursor: busy === "deposit" ? "progress" : "pointer"
              }}
            >
              {busy === "deposit" ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        </div>
      )}

      {withdrawModalOpen && (
        <div
          className="sidebar-overlay"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000
          }}
          onClick={() => setWithdrawModalOpen(false)}
        >
          <div
            className="dash-section"
            style={{ width: 350, background: "var(--dash-sidebar)", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setWithdrawModalOpen(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "none",
                border: "none",
                color: "var(--dash-muted)",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
            <h4 style={{ marginTop: 0 }}>Withdraw Funds</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--dash-muted)" }}>
              Submit a request to withdraw your balance.
            </p>
            <div style={{ margin: "1rem 0" }}>
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "var(--dash-muted)",
                  display: "block",
                  marginBottom: 5
                }}
              >
                Amount (ZAR)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: 10,
                  background: "var(--dash-bg)",
                  border: "1px solid var(--dash-border)",
                  color: "white",
                  borderRadius: 8
                }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                margin: "1rem 0"
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.6rem",
                    color: "var(--dash-muted)",
                    display: "block",
                    marginBottom: 5
                  }}
                >
                  Account Holder
                </label>
                <input
                  type="text"
                  value={withdrawForm.accHolder}
                  onChange={(e) =>
                    setWithdrawForm((s) => ({ ...s, accHolder: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    background: "var(--dash-bg)",
                    border: "1px solid var(--dash-border)",
                    color: "white",
                    borderRadius: 6
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.6rem",
                    color: "var(--dash-muted)",
                    display: "block",
                    marginBottom: 5
                  }}
                >
                  Account Number
                </label>
                <input
                  type="text"
                  value={withdrawForm.accNumber}
                  onChange={(e) =>
                    setWithdrawForm((s) => ({ ...s, accNumber: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    background: "var(--dash-bg)",
                    border: "1px solid var(--dash-border)",
                    color: "white",
                    borderRadius: 6
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                margin: "1rem 0"
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.6rem",
                    color: "var(--dash-muted)",
                    display: "block",
                    marginBottom: 5
                  }}
                >
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Capitec"
                  value={withdrawForm.bankName}
                  onChange={(e) =>
                    setWithdrawForm((s) => ({ ...s, bankName: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    background: "var(--dash-bg)",
                    border: "1px solid var(--dash-border)",
                    color: "white",
                    borderRadius: 6
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.6rem",
                    color: "var(--dash-muted)",
                    display: "block",
                    marginBottom: 5
                  }}
                >
                  Branch Code
                </label>
                <input
                  type="text"
                  value={withdrawForm.branchCode}
                  onChange={(e) =>
                    setWithdrawForm((s) => ({ ...s, branchCode: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    background: "var(--dash-bg)",
                    border: "1px solid var(--dash-border)",
                    color: "white",
                    borderRadius: 6
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleWithdrawSubmit}
              disabled={busy === "withdraw"}
              style={{
                width: "100%",
                padding: 12,
                background: "var(--dash-gold)",
                border: "none",
                borderRadius: 8,
                fontWeight: "bold",
                cursor: busy === "withdraw" ? "progress" : "pointer"
              }}
            >
              {busy === "withdraw"
                ? "Processing Instant Payout..."
                : "Confirm Instant Withdrawal"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
