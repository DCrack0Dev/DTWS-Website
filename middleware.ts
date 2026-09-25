import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  decodeHintedRole,
  looksLikeSessionCookie
} from "@/lib/auth/session-edge";

const PUBLIC_PATHS = new Set([
  "/",
  "/pricing",
  "/portfolio",
  "/contact",
  "/login",
  "/register",
  "/unsubscribed",
  "/quote",
  "/bookings"
]);

const DASHBOARD_ADMIN_PATHS = ["/dashboard/command", "/admin"];

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/api/auth/logout",
    "/api/leads/:path*",
    "/api/email/:path*",
    "/api/whatsapp/:path*",
    "/api/calls/:path*",
    "/api/quotes/:path*",
    "/api/bookings/:path*",
    "/api/ai/:path*",
    "/api/system/:path*",
    "/api/budgets/:path*",
    "/api/settings/:path*",
    "/api/audit/:path*"
  ]
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isProtectedPage =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const rawCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = decodeHintedRole(rawCookie);
  const hasSession = looksLikeSessionCookie(rawCookie) || Boolean(session);
  const isAdminSession = session?.adminClaims || session?.role === "admin";

  if (isAuthPage) {
    if (hasSession) {
      const dest = isAdminSession ? "/dashboard/command" : "/dashboard/projects";
      const u = req.nextUrl.clone();
      u.pathname = dest;
      return NextResponse.redirect(u);
    }
    return NextResponse.next();
  }

  if (isProtectedPage) {
    if (!hasSession) {
      const u = req.nextUrl.clone();
      u.pathname = "/login";
      u.searchParams.set("next", pathname);
      return NextResponse.redirect(u);
    }
    const needsAdmin = DASHBOARD_ADMIN_PATHS.some((p) => pathname.startsWith(p));
    if (needsAdmin && !isAdminSession) {
      const u = req.nextUrl.clone();
      u.pathname = "/dashboard/projects";
      return NextResponse.redirect(u);
    }
    return NextResponse.next();
  }

  if (isApi) {
    const protectAdminApi =
      pathname.startsWith("/api/leads") ||
      pathname.startsWith("/api/email") ||
      pathname.startsWith("/api/whatsapp") ||
      pathname.startsWith("/api/calls") ||
      pathname.startsWith("/api/quotes") ||
      pathname.startsWith("/api/bookings") ||
      pathname.startsWith("/api/ai") ||
      pathname.startsWith("/api/system") ||
      pathname.startsWith("/api/budgets") ||
      pathname.startsWith("/api/settings") ||
      pathname.startsWith("/api/audit");
    if (protectAdminApi) {
      if (!hasSession) {
        return NextResponse.json(
          { ok: false, error: "unauthenticated" },
          { status: 401 }
        );
      }
      const requireAdminAll =
        pathname.startsWith("/api/system") ||
        pathname.startsWith("/api/settings") ||
        pathname.startsWith("/api/audit") ||
        pathname.startsWith("/api/email/send") ||
        pathname.startsWith("/api/calls/initiate") ||
        pathname.startsWith("/api/whatsapp/send");
      if (requireAdminAll && !isAdminSession) {
        return NextResponse.json(
          { ok: false, error: "forbidden_admin" },
          { status: 403 }
        );
      }
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-auth-role", session?.role ?? "client");
      requestHeaders.set("x-auth-admin", isAdminSession ? "1" : "0");
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

void PUBLIC_PATHS;
