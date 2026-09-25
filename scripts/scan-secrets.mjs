import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
const staticDir = join(root, ".next", "static");

const sensitivePatterns = [
  { name: "BREVO_API_KEY", re: /xkeysib-[A-Za-z0-9_-]{20,}/g },
  { name: "TELNYX_API_KEY", re: /\bKEY[0-9A-Z]{8,}[A-Za-z0-9_-]{10,}\b/g },
  { name: "FIREBASE_PRIVATE_KEY_BLOCK", re: /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g },
  { name: "SERVICE_ACCOUNT_JSON", re: /"type"\s*:\s*"service_account"/g },
  { name: "OPENAI_STYLE_KEY", re: /\b(sk-proj-|sk-ant-|sk-or-v1-|sk-[a-zA-Z0-9]{20,})\b/g },
  { name: "TWILIO_AUTH_TOKEN", re: /[0-9a-f]{32}/g },
  { name: "HMAC_HEX_64", re: /\b[a-f0-9]{64}\b/g }
];

const benignWords = new Set([
  "staticchunksmanifest",
  "webpackruntime",
  "self__next_preload",
  "webpackjsonp",
  "__next_require__",
  "intersectionobserver",
  "__webpack_require__",
  "__next_data__",
  "__next_root_layout"
]);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  const entries = readdirSync(dir);
  for (const e of entries) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|cjs|html|css|json)$/.test(e)) out.push(p);
  }
  return out;
}

const files = walk(staticDir);
let found = 0;
for (const f of files) {
  const rel = relative(root, f);
  let content;
  try {
    content = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  const lowerContent = content.toLowerCase();
  for (const pat of sensitivePatterns) {
    const matches = content.match(pat.re);
    if (!matches || matches.length === 0) continue;
    for (const m of matches) {
      const ml = m.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (benignWords.has(ml)) continue;
      if (pat.name === "TWILIO_AUTH_TOKEN") {
        const around = lowerContent.indexOf(ml);
        const snippet = lowerContent.slice(Math.max(0, around - 80), around + 80);
        const keywords = ["auth", "token", "key", "secret", "password", "sid"];
        if (!keywords.some((k) => snippet.includes(k))) continue;
      }
      if (pat.name === "HMAC_HEX_64") {
        const around = lowerContent.indexOf(ml);
        const snippet = lowerContent.slice(Math.max(0, around - 120), around + 120);
        const keywords = ["secret", "hmac", "csrf", "session", "apikey", "apisecret", "private"];
        if (!keywords.some((k) => snippet.includes(k))) continue;
      }
      console.error(`[scan-secrets] LEAK DETECTED in ${rel}: pattern=${pat.name} sample=${m.slice(0, 20)}...`);
      found += 1;
    }
  }
}

if (found > 0) {
  console.error(`[scan-secrets] FAILED: ${found} potential secret occurrences in client bundle. Aborting.`);
  process.exit(1);
}

console.log(`[scan-secrets] OK: scanned ${files.length} files, 0 client-side secret patterns detected.`);
