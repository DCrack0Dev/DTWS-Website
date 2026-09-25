process.env.CSRF_SECRET = "test-secret-tr4";
const crypto = require("node:crypto");
function getSecret(){return Buffer.from(process.env.CSRF_SECRET ?? "", "utf8");}
function generate(sessionId, ttlMs = 30*60*1000) {
  const expires = Date.now() + ttlMs;
  const payload = `${sessionId}|${expires}|${crypto.randomBytes(8).toString("hex")}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const token = `${Buffer.from(payload, "utf8").toString("base64url")}.${sig}`;
  return { token, expires };
}
function validate(sessionId, token) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  try {
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
    const a = Buffer.from(sigB64, "utf8"); const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const [sid, expiresRaw] = payload.split("|");
    if (sid !== sessionId) return false;
    const exp = Number(expiresRaw);
    if (!Number.isFinite(exp)) return false;
    return exp > Date.now();
  } catch { return false; }
}
const t = generate("session123");
console.log("CSRF_valid", validate("session123", t.token));
console.log("CSRF_wrongSession", validate("other", t.token));
console.log("CSRF_badToken", validate("session123", "fake.aabbccdd"));
console.log("CSRF_headerOk", (() => {
  const req = new Map();
  req.set("x-csrf-token", t.token);
  const headers = { get: (k) => req.has(k) ? req.get(k) : null };
  const header = headers.get("x-csrf-token");
  return validate("session123", header);
})());
// Rate limit
const buckets = new Map();
function rateLimit(key, maxTokens, refillPerMinute) {
  const refillPerMs = refillPerMinute / 60000;
  const now = Date.now();
  let b = buckets.get(key) ?? { tokens: maxTokens, last: now };
  const delta = now - b.last;
  if (delta > 0) { b.tokens = Math.min(maxTokens, b.tokens + delta * refillPerMs); b.last = now; }
  if (b.tokens < 1) { buckets.set(key, b); return { ok:false }; }
  b.tokens -= 1; buckets.set(key, b); return { ok:true, remaining: Math.floor(b.tokens) };
}
let ok = 0, blocked = 0;
for (let i = 0; i < 20; i++) {
  const r = rateLimit("rl_ip1_auth", 10, 10);
  if (r.ok) ok++; else blocked++;
}
console.log("RL_max10_20hits_ok", ok, "blocked", blocked);
