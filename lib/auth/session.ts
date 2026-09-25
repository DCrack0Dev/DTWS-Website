import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin";
import type { Uid, UserRole } from "@/lib/types";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  encodeHintedRole,
  stripRolePrefix
} from "@/lib/auth/session-edge";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  SESSION_REMEMBER_MS
} from "@/lib/auth/session-edge";

function getCookieHeaderOptionsSameSite() {
  const secure = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/"
  };
}

export async function createSessionCookie(idToken: string, remember = false): Promise<{ cookie: string; role: UserRole }> {
  let role: UserRole = "client";
  if (isAdminConfigured()) {
    const auth = getAdminAuth();
    try {
      const decoded = await auth.verifyIdToken(idToken, true);
      if (decoded.admin === true) role = "admin";
      const fbRole = decoded.role as UserRole | undefined;
      if (fbRole === "admin" || fbRole === "staff" || fbRole === "agent" || fbRole === "client") role = fbRole;
      try {
        const db = getAdminDb();
        const snap = await db.collection("profiles").doc(decoded.uid).get();
        if (snap.exists) {
          const data = snap.data() as { role?: unknown } | undefined;
          const candidate = data?.role as UserRole | undefined;
          if (
            candidate === "admin" ||
            candidate === "staff" ||
            candidate === "agent" ||
            candidate === "client"
          ) {
            role = candidate;
          }
        }
      } catch {
        // ignore profile fetch error; use claim
      }
    } catch {
      // fall through to dev fallback
    }
  }
  let raw: string;
  if (!isAdminConfigured()) {
    const REQUIRED_CHAR = (process.env.SESSION_SECRET?.length ?? 0) + role.length;
    raw = `dev_${idToken.slice(0, 32)}_${REQUIRED_CHAR}`;
  } else {
    const auth = getAdminAuth();
    const duration = remember ? SESSION_REMEMBER_MS : SESSION_DURATION_MS;
    raw = await auth.createSessionCookie(idToken, { expiresIn: duration });
  }
  return { cookie: encodeHintedRole(raw, role), role };
}

export type VerifiedSession = {
  uid: Uid;
  email: string | null;
  role: UserRole;
  adminClaims: boolean;
};

export async function verifySessionCookie(
  cookieValue: string
): Promise<VerifiedSession | null> {
  if (!cookieValue) return null;
  const raw = stripRolePrefix(cookieValue);
  if (!raw) return null;
  if (!isAdminConfigured()) {
    if (raw.startsWith("dev_")) {
      return {
        uid: "dev_local" as Uid,
        email: null,
        role: cookieValue.startsWith("role_admin:") ? "admin" : "client",
        adminClaims: cookieValue.startsWith("role_admin:")
      };
    }
    return null;
  }
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(raw, true);
    const db = getAdminDb();
    const profile = await db.collection("profiles").doc(decoded.uid).get();
    let role: UserRole = "client";
    const fbRole = decoded.role as UserRole | undefined;
    if (fbRole === "admin" || fbRole === "staff" || fbRole === "agent" || fbRole === "client") role = fbRole;
    if (profile.exists) {
      const data = profile.data() as { role?: unknown } | undefined;
      const candidate = data?.role as UserRole | undefined;
      if (
        candidate === "admin" ||
        candidate === "staff" ||
        candidate === "agent" ||
        candidate === "client"
      ) {
        role = candidate;
      }
    }
    return {
      uid: decoded.uid as Uid,
      email: decoded.email ?? null,
      role,
      adminClaims: Boolean(decoded.admin) || role === "admin"
    };
  } catch {
    return null;
  }
}

export function setSessionCookieUsingStore(
  store: {
    set: (
      name: string,
      value: string,
      options?: {
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: "strict" | "lax" | "none";
        path?: string;
        expires?: Date;
        maxAge?: number;
      }
    ) => void;
  },
  sessionCookie: string,
  remember = false
): void {
  const duration = remember ? SESSION_REMEMBER_MS : SESSION_DURATION_MS;
  const opts = getCookieHeaderOptionsSameSite();
  store.set(SESSION_COOKIE_NAME, sessionCookie, {
    ...opts,
    expires: new Date(Date.now() + duration),
    maxAge: Math.floor(duration / 1000)
  });
}

export function clearSessionCookieUsingStore(store: {
  set: (
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "strict" | "lax" | "none";
      path?: string;
      expires?: Date;
      maxAge?: number;
    }
  ) => void;
}): void {
  const opts = getCookieHeaderOptionsSameSite();
  store.set(SESSION_COOKIE_NAME, "", { ...opts, expires: new Date(0), maxAge: 0 });
}

export function getSessionCookieValue(
  store: ReadonlyRequestCookies
): string | undefined {
  return store.get(SESSION_COOKIE_NAME)?.value;
}
// re-export here for one-stop import convenience
export {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  SESSION_REMEMBER_MS
} from "./session-edge";
