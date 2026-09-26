import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  decodeHintedRole,
  looksLikeSessionCookie
} from "@shared/auth/session-edge";

export const WEBSITE_SESSION_COOKIE_NAME = SESSION_COOKIE_NAME;
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

const OPTIMUS_PATHS_PREFIXES = [
  "/admin",
  "/dashboard/command",
  "/dashboard/optimus",
  "/dashboard/ai",
  "/dashboard/email",
  "/dashboard/calls",
  "/dashboard/whatsapp",
  "/dashboard/leads",
  "/dashboard/quotes",
  "/dashboard/bookings",
  "/dashboard/analytics",
  "/dashboard/settings"
];

const OPTIMUS_APIS_PREFIXES = [
  "/api/leads",
  "/api/calls",
  "/api/whatsapp",
  "/api/ai",
  "/api/system",
  "/api/budgets",
  "/api/settings",
  "/api/audit",
  "/api/optimus",
  "/api/stt",
  "/api/tts",
  "/api/jobs",
  "/api/emails"
];

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/api/auth/logout",
    "/api/email/:path*",
    "/api/quotes/:path*",
    "/api/bookings/:path*",
    "/api/website-events/:path*",
    "/api/leads/:path*",
    "/api/calls/:path*",
    "/api/whatsapp/:path*",
    "/api/ai/:path*",
    "/api/system/:path*",
    "/api/budgets/:path*",
    "/api/settings/:path*",
    "/api/audit/:path*"
  ]
};

function optimusOrigin(req: NextRequest): string {
  const env = req.headers.get("x-optimus-url") || process.env.NEXT_PUBLIC_OPTIMUS_URL;
  return env ? env.replace(/\/$/, "") : "http://localhost:3001";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isAdminPage = pathname.startsWith("/admin");
  const rawCookie = req.cookies.get(WEBSITE_SESSION_COOKIE_NAME)?.value ?? null;
  const session = decodeHintedRole(rawCookie);
  const hasSession = looksLikeSessionCookie(rawCookie) || Boolean(session);
  const isAdminSession = session?.adminClaims || session?.role === "admin";

  const isOptimusUi =
    isAdminPage ||
    OPTIMUS_PATHS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isOptimusApi =
    isApi &&
    (pathname.startsWith("/api/email/send") ||
      OPTIMUS_APIS_PREFIXES.some((p) => pathname.startsWith(p)));

  if (isOptimusUi || isOptimusApi) {
    const dest = new URL(`${optimusOrigin(req)}${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(dest, 308);
  }

  if (isAuthPage) {
    if (hasSession) {
      const dest = isAdminSession
        ? `${optimusOrigin(req)}/login?skip=1`
        : "/dashboard/projects";
      const u = req.nextUrl.clone();
      if (dest.startsWith("http")) {
        return NextResponse.redirect(dest, 307);
      }
      u.pathname = dest;
      return NextResponse.redirect(u, 307);
    }
    return NextResponse.next();
  }

  if (isDashboardPage) {
    if (pathname !== "/dashboard/projects" && !pathname.startsWith("/dashboard/projects/")) {
      const dest = new URL(`${optimusOrigin(req)}${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(dest, 308);
    }
    if (!hasSession) {
      const u = req.nextUrl.clone();
      u.pathname = "/login";
      u.searchParams.set("next", pathname);
      return NextResponse.redirect(u, 307);
    }
    return NextResponse.next();
  }

  if (isApi) {
    const websiteProtected =
      pathname.startsWith("/api/email/send") ||
      pathname.startsWith("/api/quotes/manage") ||
      pathname.startsWith("/api/bookings/manage") ||
      OPTIMUS_APIS_PREFIXES.some((p) => pathname.startsWith(p));
    if (websiteProtected) {
      const dest = new URL(`${optimusOrigin(req)}${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(dest, 308);
    }
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-auth-role", session?.role ?? (hasSession ? "client" : "public"));
    requestHeaders.set("x-auth-admin", isAdminSession ? "1" : "0");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

void PUBLIC_PATHS;
