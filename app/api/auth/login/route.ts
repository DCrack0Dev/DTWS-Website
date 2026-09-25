import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin";
import {
  createSessionCookie,
  setSessionCookieUsingStore,
  SESSION_DURATION_MS
} from "@/lib/auth/session";

const BodySchema = z.object({
  idToken: z.string().min(1).max(4096),
  remember: z.boolean().optional().default(false)
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parse = BodySchema.safeParse(raw);
    if (!parse.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_body", issues: parse.error.issues },
        { status: 400 }
      );
    }
    const { idToken, remember } = parse.data;
    const store = cookies();

    let uid: string | null = null;
    let email: string | null = null;

    if (isAdminConfigured()) {
      try {
        const auth = getAdminAuth();
        const decoded = await auth.verifyIdToken(idToken, true);
        uid = decoded.uid;
        email = decoded.email ?? null;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
          { ok: false, error: "invalid_id_token", detail: message },
          { status: 401 }
        );
      }
    }

    const sessionRes = await createSessionCookie(idToken, remember);
    setSessionCookieUsingStore(store, sessionRes.cookie, remember);

    const headers = new Headers();
    headers.set("Cache-Control", "no-store");

    const expiresMs = remember ? 30 * 24 * 60 * 60 * 1000 : SESSION_DURATION_MS;
    return NextResponse.json(
      {
        ok: true,
        uid: uid ?? "local_only",
        email,
        role: sessionRes.role,
        cookieSet: true,
        expiresAt: Date.now() + expiresMs
      },
      { status: 200, headers }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: "internal", detail: process.env.NODE_ENV === "production" ? undefined : message },
      { status: 500 }
    );
  }
}
