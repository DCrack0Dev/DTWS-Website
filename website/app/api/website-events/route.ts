import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminDb,
  isAdminConfigured,
} from "@website/lib/firebase/admin";
import { WebsiteEventSchema, WebsiteEventTypeSchema } from "@shared/validation/schemas";
import type { LeadId, LeadSource, Uid, UserRole, QuoteId, BookingId, WebsiteEventId } from "@shared/types";

const QUOTE_EVENT_TYPES = new Set(["QUOTE_REQUEST", "QUOTE_ACCEPTED", "QUOTE_REJECTED", "QUOTE_SENT"]);
const BOOKING_EVENT_TYPES = new Set(["BOOKING_REQUEST", "BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"]);

function mapEventTypeToSource(type: string): LeadSource {
  switch (type) {
    case "QUOTE_REQUEST":
      return "WEBSITE_QUOTE";
    case "REGISTRATION":
      return "WEBSITE_REGISTRATION";
    case "APP_REQUEST":
      return "WEBSITE_APP_REQUEST";
    case "CONTACT_REQUEST":
      return "WEBSITE_CONTACT";
    case "BOOKING_REQUEST":
      return "WEBSITE_BOOKING";
    default:
      return "OTHER";
  }
}

function normalizeEmail(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : undefined;
}

function normalizePhone(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return undefined;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

function splitName(raw: unknown): { firstName?: string; lastName?: string } {
  if (typeof raw !== "string") return {};
  const parts = raw.trim().split(/\s+/);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function dedupeKey(contact: { email?: string; phoneE164?: string }): string | null {
  if (contact.email) return `email:${contact.email}`;
  if (contact.phoneE164) return `phone:${contact.phoneE164}`;
  return null;
}

type FirestoreLike = ReturnType<typeof getAdminDb>;

async function getOrCreateLeadForWebsiteEvent(db: FirestoreLike, p: Record<string, unknown>, type: string, now: number): Promise<{ id: LeadId; created: boolean } | null> {
  const nameSplit = splitName(p.name ?? p.firstName);
  const firstName = (p.firstName as string | undefined)?.trim() || nameSplit.firstName;
  const lastName = (p.lastName as string | undefined)?.trim() || nameSplit.lastName;
  const company = (p.company as string | undefined)?.trim() || undefined;
  const email = normalizeEmail(p.email);
  const phoneE164 = normalizePhone(p.phone ?? p.whatsapp ?? p.phoneE164);
  const serviceRaw = (p.service as string | undefined)?.toUpperCase().replace(/[\s-]+/g, "_");
  const servicesInterested =
    serviceRaw &&
    ["WEBSITE", "WEB_APP", "MOBILE_APP", "SEO", "BOOKING_SYSTEM", "CRM_DASHBOARD", "ECOMMERCE", "CUSTOM"].includes(
      serviceRaw
    )
      ? [serviceRaw]
      : [];
  const contact = { email, phoneE164 };
  const key = dedupeKey(contact);
  if (!key) return null;
  const source = mapEventTypeToSource(type);
  const coll = db.collection("leads");
  const existingSnap = await (async () => {
    if (email) {
      const s = await coll.where("email", "==", email).limit(1).get();
      if (!s.empty) return s;
    }
    if (phoneE164) {
      const s = await coll.where("phoneE164", "==", phoneE164).limit(1).get();
      if (!s.empty) return s;
    }
    return null;
  })();
  if (existingSnap && !existingSnap.empty) {
    const doc = existingSnap.docs[0]!;
    const id = doc.id as LeadId;
    const data = doc.data() as Partial<{ sources?: LeadSource[]; servicesInterested?: string[]; lastContactAt?: number; updatedAt?: number }>;
    const patch: Partial<{ sources?: LeadSource[]; servicesInterested?: string[]; lastContactAt: number; updatedAt: number }> = {
      lastContactAt: now,
      updatedAt: now
    };
    if (source) {
      const merged = new Set(data?.sources ?? []);
      merged.add(source);
      patch.sources = [...merged];
    }
    if (servicesInterested.length) {
      const merged = new Set([...(data?.servicesInterested ?? []), ...servicesInterested]);
      patch.servicesInterested = [...merged];
    }
    if (company) (patch as any).company = company;
    if (firstName) (patch as any).firstName = firstName;
    if (lastName) (patch as any).lastName = lastName;
    await coll.doc(id).set(patch, { merge: true });
    const timelineRef = coll.doc(id).collection("timeline");
    const tlId = (now.toString(36) + Math.random().toString(36).slice(2, 8)) as any;
    await timelineRef.doc(tlId).create({
      id: tlId,
      type: "website_event",
      summary: `Website event ${type}`,
      at: now,
      data: { source: "website", eventType: type }
    });
    return { id, created: false };
  }
  const id = (now.toString(36) + Math.random().toString(36).slice(2, 8)) as LeadId;
  await coll.doc(id).create({
    id,
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    company: company ?? null,
    email: email ?? null,
    phoneE164: phoneE164 ?? null,
    status: "NEW",
    pipelineStage: "OUTREACH_PENDING",
    source,
    sources: [source],
    servicesInterested,
    createdAt: now,
    updatedAt: now,
    lastContactAt: now,
    ownerUid: null,
    assigneeUid: null,
    tags: [],
    origin: "WEBSITE"
  });
  const tlId = (now.toString(36) + Math.random().toString(36).slice(2, 8)) as any;
  await coll.doc(id).collection("timeline").doc(tlId).create({
    id: tlId,
    type: "website_event",
    summary: `Lead created from website event ${type}`,
    at: now,
    data: { source: "website", eventType: type }
  });
  return { id, created: true };
}

async function enqueuePendingAI(db: FirestoreLike, params: { leadId: LeadId; trigger: string; idempotencyKey: string; payload: Record<string, unknown>; now: number }): Promise<void> {
  const coll = db.collection("ai_queue");
  const existing = await coll.where("idempotencyKey", "==", params.idempotencyKey).limit(1).get();
  if (!existing.empty) return;
  const id = (params.now.toString(36) + Math.random().toString(36).slice(2, 10)) as any;
  await coll.doc(id).create({
    id,
    leadId: params.leadId,
    status: "PENDING",
    origin: "website",
    trigger: params.trigger,
    idempotencyKey: params.idempotencyKey,
    payload: params.payload,
    attempts: 0,
    lastError: null,
    runAfter: params.now,
    createdAt: params.now,
    updatedAt: params.now
  });
}

function saveQuoteSubmission(db: FirestoreLike, payload: Record<string, unknown>, leadId: LeadId | null, now: number): QuoteId | null {
  if (!QUOTE_EVENT_TYPES.has(String(payload.event ?? ""))) return null;
  const id = (now.toString(36) + Math.random().toString(36).slice(2, 8)) as QuoteId;
  const data = {
    id,
    leadId,
    customerEmail: normalizeEmail(payload.email) ?? normalizeEmail(payload.customerEmail) ?? null,
    customerName: (payload.customerName as string | undefined)?.trim() ?? (payload.name as string | undefined)?.trim() ?? null,
    status: "DRAFT" as const,
    lineItems: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    currency: "ZAR",
    note: (payload.message as string | undefined)?.trim() ?? null,
    source: "WEBSITE",
    origin: "website",
    createdAt: now,
    updatedAt: now
  };
  db.collection("quotes").doc(id).create(data).catch(() => {});
  return id;
}

function saveBookingSubmission(db: FirestoreLike, payload: Record<string, unknown>, leadId: LeadId | null, now: number): BookingId | null {
  if (!BOOKING_EVENT_TYPES.has(String(payload.event ?? ""))) return null;
  const rawWhen = (payload.when as string | number | undefined) ?? (payload.startAt as string | number | undefined);
  const startAt = typeof rawWhen === "number" ? rawWhen : rawWhen ? new Date(String(rawWhen)).getTime() : null;
  const id = (now.toString(36) + Math.random().toString(36).slice(2, 8)) as BookingId;
  const data = {
    id,
    leadId,
    title: (payload.title as string | undefined)?.trim() ?? "Website booking",
    startAt: startAt ?? now + 24 * 60 * 60 * 1000,
    endAt: (startAt ?? now + 24 * 60 * 60 * 1000) + 60 * 60 * 1000,
    customerEmail: normalizeEmail(payload.email) ?? normalizeEmail(payload.customerEmail) ?? null,
    customerPhone: normalizePhone(payload.phone ?? payload.customerPhone ?? payload.whatsapp) ?? null,
    status: "REQUESTED" as const,
    source: "WEBSITE",
    origin: "website",
    createdAt: now,
    updatedAt: now
  };
  db.collection("bookings").doc(id).create(data).catch(() => {});
  return id;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = WebsiteEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { type, payload, idempotencyKey, sessionId, visitorId, userId, url, referrer, userAgent } = parsed.data;
    if (!isAdminConfigured()) {
      return NextResponse.json({ ok: true, received: type, dev: true });
    }
    const db = getAdminDb();
    if (idempotencyKey) {
      const existing = await db
        .collection("website_events")
        .where("idempotencyKey", "==", idempotencyKey)
        .where("createdAt", ">=", Date.now() - 24 * 60 * 60 * 1000)
        .limit(1)
        .get();
      if (!existing.empty) {
        return NextResponse.json({ ok: true, received: type, duplicate: true });
      }
    }
    const now = Date.now();
    const leadGeneratingSources = new Set<LeadSource>([
      "WEBSITE_QUOTE",
      "WEBSITE_REGISTRATION",
      "WEBSITE_APP_REQUEST",
      "WEBSITE_CONTACT",
      "WEBSITE_BOOKING"
    ]);
    const shouldCreateLead = leadGeneratingSources.has(mapEventTypeToSource(type));
    const p = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    let leadId: LeadId | null = null;
    let leadCreated = false;
    if (shouldCreateLead) {
      const res = await getOrCreateLeadForWebsiteEvent(db, p, type, now);
      if (res) {
        leadId = res.id;
        leadCreated = res.created;
      }
    }
    const websiteEventId = (now.toString(36) + Math.random().toString(36).slice(2, 10)) as WebsiteEventId;
    const websiteEventDoc = {
      id: websiteEventId,
      type: type as z.infer<typeof WebsiteEventTypeSchema>,
      sessionId: sessionId ?? null,
      visitorId: visitorId ?? null,
      userId: userId ? (userId as Uid) : null,
      leadId,
      idempotencyKey: idempotencyKey ?? null,
      url: url ?? null,
      referrer: referrer ?? null,
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        null,
      userAgent: userAgent ?? req.headers.get("user-agent") ?? null,
      payload: p,
      origin: "website",
      createdAt: now
    };
    await db.collection("website_events").doc(websiteEventId).create(websiteEventDoc);

    const quoteId = saveQuoteSubmission(db, p, leadId, now);
    const bookingId = saveBookingSubmission(db, p, leadId, now);

    if (leadId && leadCreated) {
      await enqueuePendingAI(db, {
        leadId,
        trigger: `website_event:${type}`,
        idempotencyKey: `ai-${websiteEventId}`,
        payload: { websiteEventId, type, leadId, leadCreated, quoteId, bookingId },
        now
      });
    }

    const auditDocId = now.toString(36) + Math.random().toString(36).slice(2, 8);
    db.collection("audit")
      .doc(auditDocId)
      .create({
        id: auditDocId,
        actorUid: "SYSTEM" as Uid,
        actorRole: null as UserRole | null,
        event: "LEAD_CREATE",
        detail: `website_event ${type}${leadId ? ` -> lead ${leadId}` : ""}`,
        leadId: leadId ?? null,
        origin: "website",
        ip: websiteEventDoc.ip,
        ua: websiteEventDoc.userAgent,
        createdAt: now,
        data: { websiteEventId, type, leadCreated, quoteId, bookingId }
      })
      .catch(() => {});

    return NextResponse.json(
      { ok: true, received: type, leadId, leadCreated, quoteId, bookingId },
      { status: 202 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("api/website-events err", err);
    return NextResponse.json(
      { ok: false, error: "server_error", detail: message },
      { status: 500 }
    );
  }
}
