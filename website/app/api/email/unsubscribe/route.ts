import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { getAdminDb, isAdminConfigured } from "@website/lib/firebase/admin";
import type { LeadId, SuppressionId, Uid } from "@shared/types";

const HMAC_SECRET = process.env.WEBHOOK_HMAC_SECRET ?? "";

function verifyUnsubscribeToken(token: string, leadId: string): boolean {
  if (!HMAC_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(leadId)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

function writeAuditInline(db: ReturnType<typeof getAdminDb>, fields: {
  actorUid: string;
  event: string;
  detail: string;
  leadId?: string | null;
  data?: Record<string, unknown>;
  ip?: string | null;
  ua?: string | null;
}) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return db.collection("audit").doc(id).create({
    id,
    actorUid: fields.actorUid as Uid,
    actorRole: null,
    event: fields.event,
    detail: fields.detail,
    leadId: fields.leadId ?? null,
    origin: "website",
    ip: fields.ip ?? null,
    ua: fields.ua ?? null,
    createdAt: Date.now(),
    data: fields.data ?? null
  }).catch(() => {});
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const leadIdParam = searchParams.get("leadId");
    const email = searchParams.get("email");
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const ua = req.headers.get("user-agent") ?? null;

    if (!token || !leadIdParam) {
      return NextResponse.redirect(new URL("/unsubscribed?error=invalid_token", req.url));
    }

    if (!isAdminConfigured()) {
      return NextResponse.redirect(new URL("/unsubscribed?error=not_configured", req.url));
    }

    const db = getAdminDb();

    if (!verifyUnsubscribeToken(token, leadIdParam)) {
      await writeAuditInline(db, {
        actorUid: "CUSTOMER",
        event: "SUPPRESSION_ADD",
        detail: `Invalid unsubscribe token for lead ${leadIdParam}`,
        leadId: leadIdParam as LeadId,
        data: { token: token.slice(0, 10) + "..." },
        ip,
        ua,
      });
      return NextResponse.redirect(new URL("/unsubscribed?error=invalid_token", req.url));
    }

    const suppressionId = (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    ) as SuppressionId;

    await db.collection("suppressions").doc(suppressionId).create({
      id: suppressionId,
      email: email?.toLowerCase() ?? null,
      phoneE164: null,
      channel: "EMAIL",
      reason: "UNSUBSCRIBE",
      leadId: leadIdParam as LeadId,
      sourceEventId: null,
      note: "Unsubscribed via email link",
      suppressedAt: Date.now(),
      createdAt: Date.now(),
    });

    await db.collection("leads").doc(leadIdParam).set(
      {
        marketingUnsubscribed: true,
        marketingUnsubscribedAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    await writeAuditInline(db, {
      actorUid: "CUSTOMER",
      event: "SUPPRESSION_ADD",
      detail: `Lead ${leadIdParam} unsubscribed via email`,
      leadId: leadIdParam as LeadId,
      data: { suppressionId, channel: "EMAIL", reason: "UNSUBSCRIBE" },
      ip,
      ua,
    });

    return NextResponse.redirect(new URL("/unsubscribed?success=true", req.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unsubscribe error:", err);
    return NextResponse.redirect(new URL(`/unsubscribed?error=${encodeURIComponent(message)}`, req.url));
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";