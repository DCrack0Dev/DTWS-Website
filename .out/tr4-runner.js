const crypto = require("node:crypto");
process.env.CSRF_SECRET = "test-secret-tr4";
process.env.WEBHOOK_HMAC_SECRET = "webhook-secret-tr4";
process.env.BUDGET_AI_LIMIT_USD = "10";
process.env.BUDGET_EMAIL_LIMIT_USD = "0";
process.env.BUDGET_VOICE_LIMIT_USD = "5";
process.env.BUDGET_WHATSAPP_LIMIT_USD = "5";
process.env.BUDGET_TOTAL_LIMIT_USD = "25";

async function main() {
  const { generateCsrfToken, validateCsrfToken, validateHeaderCsrf } = require("./lib/security/csrf.ts");
  // CSRF
  const t = generateCsrfToken("session123");
  console.log("TR_CSRF_valid=", validateCsrfToken("session123", t.token));
  console.log("TR_CSRF_wrongSession=", validateCsrfToken("otherSession", t.token));
  console.log("TR_CSRF_tampered=", validateCsrfToken("session123", "badtoken.aabbcc"));
  const fakeReq = { headers: new Map() };
  fakeReq.headers.set("x-csrf-token", t.token);
  fakeReq.headers.get = (k) => (fakeReq.headers.has(k) ? fakeReq.headers.get(k) : null);
  console.log("TR_CSRF_headerOk=", validateHeaderCsrf(fakeReq, "session123"));

  // Rate limit
  const { rateLimitCheck, pruneBucketsForTest } = require("./lib/security/rate-limit.ts");
  pruneBucketsForTest();
  let ok = 0;
  let blocked = 0;
  for (let i = 0; i < 20; i++) {
    const r = rateLimitCheck("/api/auth/login", ["ip-1"], { maxTokens: 10, refillPerMinute: 10 });
    if (r.ok) ok++; else blocked++;
  }
  console.log("TR_RL_20hits_max10_ok=", ok, "blocked=", blocked);

  // Trigger emergency stop writes audit & emergencyStop
  const { triggerEmergencyStop, getSystemMode, setMode } = require("./lib/security/modes.ts");
  const stopR = await triggerEmergencyStop({ uid: "SYSTEM" }, { reason: "TR4 test" });
  console.log("TR_EMSTOP_result=", JSON.stringify(stopR));
  const modeAfter = await getSystemMode();
  console.log("TR_EMSTOP_mode_emergencyStop=", modeAfter.emergencyStop);

  // Tool middleware deny on outbound + emergency_stop true (TR-4.2)
  const { toolMiddleware } = require("./lib/tools/middleware.ts");
  const toolR = await toolMiddleware({
    actor: { uid: "AI", role: null },
    origin: "CAMPAIGN",
    channel: "EMAIL",
    outbound: true,
    estimatedDollars: 0.01,
    leadId: "L_TR42",
    tool: "sendEmail",
    recipientEmail: "noone@example.com"
  });
  console.log("TR42_denyCode=", toolR.ok && !toolR.allowed ? toolR.denyCode : "FAIL");

  // Budget TR-4.3: AI limit $10, used $9, add $2 → not allowed when stopAtBudget
  const { incrementAndCheck } = require("./lib/budgets/engine.ts");
  await incrementAndCheck({ uid: "u1", role: "admin" }, "AI", 9, { context: "TR43-prime" });
  const r2 = await incrementAndCheck({ uid: "u1", role: "admin" }, "AI", 2, { context: "TR43-over" });
  console.log("TR43_over_budget_allowed=", r2.allowed, "denyReason=", r2.denyReason ?? "none");
}

main().catch((e) => { console.error("ERR", e); process.exit(1); });
