import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = process.argv.slice(2).filter(Boolean);
if (roots.length === 0) {
  console.error("usage: node scripts/rewrite-imports.mjs <rootDir> <rootDir2> ...");
  process.exit(1);
}

function walk(dir, out = []) {
  const entries = readdirSync(dir);
  for (const e of entries) {
    if (e === ".next" || e === "node_modules") continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(e)) out.push(p);
  }
  return out;
}

/**
 * @param {string} root
 * @param {string} path
 */
function determineScope(root, path) {
  const rel = relative(root, path).replace(/\\/g, "/");
  if (rel.startsWith("website/") || root.endsWith("website") || rel.startsWith("/website/")) return "website";
  if (rel.startsWith("optimus/") || root.endsWith("optimus") || rel.startsWith("/optimus/")) return "optimus";
  if (rel.startsWith("shared/") || root.endsWith("shared") || rel.startsWith("/shared/")) return "shared";
  return null;
}

function replace(content, scope) {
  const prefix = scope === "optimus" ? "@optimus" : scope === "website" ? "@website" : "@shared";
  let out = content;

  // Regular imports: from "@/X/" -> from "@scope/X/"
  out = out.replace(/from\s+"@\/components\//g, `from "${prefix}/components/`);
  out = out.replace(/from\s+'@\/components\//g, `from '${prefix}/components/`);
  out = out.replace(/from\s+"@\/lib\//g, `from "${prefix}/lib/`);
  out = out.replace(/from\s+'@\/lib\//g, `from '${prefix}/lib/`);
  out = out.replace(/from\s+"@\/app\//g, `from "${prefix}/app/`);
  out = out.replace(/from\s+'@\/app\//g, `from '${prefix}/app/`);

  // Cross-boundary moves: if website imports "@website/lib/types" or "@website/lib/validation/schemas" or "@website/auth/session-edge" / "@website/security/*", use shared instead.
  if (scope === "website" || scope === "optimus") {
    out = out.replace(/from\s+"@website\/lib\/types(\/[^"]*)?"/g, (m, p1 = "") => `from "@shared/types${p1}"`);
    out = out.replace(/from\s+'@website\/lib\/types(\/[^']*)?'/g, (m, p1 = "") => `from '@shared/types${p1}'`);
    out = out.replace(/from\s+"@optimus\/lib\/types(\/[^"]*)?"/g, (m, p1 = "") => `from "@shared/types${p1}"`);
    out = out.replace(/from\s+'@optimus\/lib\/types(\/[^']*)?'/g, (m, p1 = "") => `from '@shared/types${p1}'`);

    out = out.replace(/from\s+"@website\/lib\/validation(\/[^"]*)?"/g, (m, p1 = "") => `from "@shared/validation${p1}"`);
    out = out.replace(/from\s+'@website\/lib\/validation(\/[^']*)?'/g, (m, p1 = "") => `from '@shared/validation${p1}'`);
    out = out.replace(/from\s+"@optimus\/lib\/validation(\/[^"]*)?"/g, (m, p1 = "") => `from "@shared/validation${p1}"`);
    out = out.replace(/from\s+'@optimus\/lib\/validation(\/[^']*)?'/g, (m, p1 = "") => `from '@shared/validation${p1}'`);

    out = out.replace(/from\s+"@website\/lib\/auth\/session-edge"/g, `from "@shared/auth/session-edge"`);
    out = out.replace(/from\s+'@website\/lib\/auth\/session-edge'/g, `from '@shared/auth/session-edge'`);
    out = out.replace(/from\s+"@optimus\/lib\/auth\/session-edge"/g, `from "@shared/auth/session-edge"`);
    out = out.replace(/from\s+'@optimus\/lib\/auth\/session-edge'/g, `from '@shared/auth/session-edge'`);

    out = out.replace(/from\s+"@website\/lib\/security\/csrf\.ts?"/g, `from "@shared/security/csrf"`);
    out = out.replace(/from\s+'@website\/lib\/security\/csrf\.ts?'/g, `from '@shared/security/csrf'`);
    out = out.replace(/from\s+"@optimus\/lib\/security\/csrf\.ts?"/g, `from "@shared/security/csrf"`);
    out = out.replace(/from\s+'@optimus\/lib\/security\/csrf\.ts?'/g, `from '@shared/security/csrf'`);

    out = out.replace(/from\s+"@website\/lib\/security\/rate-limit\.ts?"/g, `from "@shared/security/rate-limit"`);
    out = out.replace(/from\s+'@website\/lib\/security\/rate-limit\.ts?'/g, `from '@shared/security/rate-limit'`);
    out = out.replace(/from\s+"@optimus\/lib\/security\/rate-limit\.ts?"/g, `from "@shared/security/rate-limit"`);
    out = out.replace(/from\s+'@optimus\/lib\/security\/rate-limit\.ts?'/g, `from '@shared/security/rate-limit'`);

    // Dynamic imports: import("@/lib/types") etc.
    out = out.replace(/import\("@\/lib\/types"\)/g, `import("@shared/types")`);
    out = out.replace(/import\('@\/lib\/types'\)/g, `import('@shared/types')`);
    out = out.replace(/import\("(@website|@optimus)\/lib\/types"\)/g, `import("@shared/types")`);
    out = out.replace(/import\('(@website|@optimus)\/lib\/types'\)/g, `import('@shared/types')`);
  }

  // Keep direct shared/@/@website/@optimus aliases unchanged.
  return out;
}

let changed = 0;
let total = 0;
for (const root of roots) {
  const files = walk(root);
  for (const f of files) {
    total += 1;
    let c;
    try {
      c = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    const scope = determineScope(root, f) ?? (root.includes("optimus") ? "optimus" : root.includes("website") ? "website" : root.includes("shared") ? "shared" : null);
    if (!scope) continue;
    const c2 = replace(c, scope);
    if (c2 !== c) {
      writeFileSync(f, c2, "utf8");
      changed += 1;
    }
  }
}

console.log(`[rewrite-imports] OK: scanned=${total} changed=${changed}`);
