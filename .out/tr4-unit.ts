process.env.BUDGET_AI_LIMIT_USD = "10";
process.env.BUDGET_EMAIL_LIMIT_USD = "0";
process.env.BUDGET_VOICE_LIMIT_USD = "5";
process.env.BUDGET_WHATSAPP_LIMIT_USD = "5";
process.env.BUDGET_TOTAL_LIMIT_USD = "25";
process.env.CSRF_SECRET = "tr4-csrf-secret";

import {
  _setAdminStubsForTesting,
  _clearAdminStubsForTesting,
} from "../lib/firebase/admin.ts";
import type { FirestoreStubShape } from "./stubs/firestore-memory";
import { buildMemoryFirestore } from "./stubs/firestore-memory";
import { triggerEmergencyStop, setMode, resumeSystem } from "../lib/security/modes";
import { getSystemMode } from "../lib/security/modes";
import { incrementAndCheck, setBudgetLimit } from "../lib/budgets/engine";
import { toolMiddleware } from "../lib/tools/middleware";
import { seedFirebase } from "../lib/firebase/seed";

const fs = buildMemoryFirestore();
_setAdminStubsForTesting({
  app: {} as any,
  auth: {} as any,
  db: fs as unknown as any,
  storage: {} as any,
});

async function seed() {
  await seedFirebase({ mode: "DEV_ONLY" });
}

async function run() {
  await seed();

  console.log("TR-4.1 triggerEmergencyStop");
  // First create 2 followups (PENDING / SCHEDULED) and 1 WON to see only right ones cancelled
  const coll = fs.collection("followups");
  await coll.doc("F1").create({
    status: "PENDING",
    leadId: "L1",
    createdAt: new Date().toISOString(),
    channel: "EMAIL",
  } as any);
  await coll.doc("F2").create({
    status: "SCHEDULED",
    leadId: "L2",
    createdAt: new Date().toISOString(),
    channel: "WHATSAPP",
  } as any);
  await coll.doc("F3").create({
    status: "COMPLETED",
    leadId: "L3",
    createdAt: new Date().toISOString(),
    channel: "EMAIL",
  } as any);
  const stopR = await triggerEmergencyStop(
    { uid: "admin-1" as any, role: "admin" },
    { reason: "TR-4.1 unit" }
  );
  console.log("  emstop cancelledFollowups=", stopR.cancelledFollowups);
  const f1 = (await coll.doc("F1").get()).data() as any;
  const f2 = (await coll.doc("F2").get()).data() as any;
  const f3 = (await coll.doc("F3").get()).data() as any;
  console.log(
    "  F1.status=",
    f1.status,
    "F2.status=",
    f2.status,
    "F3.status=",
    f3.status
  );
  const mode = await getSystemMode();
  console.log("  emergencyStop flag=", mode.emergencyStop, " mode=", mode.mode);
  const auditSnap = await fs.collection("audit_logs").orderBy("ts", "desc").limit(20).get();
  const auditEvents = auditSnap.docs.map((d: any) => (d.data() as any).event);
  console.log("  audit count=", auditSnap.size, "events includes EMERGENCY_STOP?", auditEvents.includes("EMERGENCY_STOP"));

  console.log("\nTR-4.2 toolMiddleware with emergencyStop=true + outbound=true");
  const toolR = await toolMiddleware({
    actor: { uid: "AI" as any, role: null },
    origin: "CAMPAIGN",
    channel: "EMAIL",
    outbound: true,
    estimatedDollars: 0.01,
    estimatedMessages: 1,
    leadId: "L_42" as any,
    tool: "sendEmail",
    recipientEmail: "some@example.com",
  });
  console.log(
    "  ok=", toolR.ok, "allowed=", toolR.allowed,
    "denyCode=", toolR.denyCode ?? "none"
  );

  console.log("\nTR-4.3 budget AI over limit");
  await resumeSystem({ uid: "admin-1" as any, role: "admin" });
  // Prime: AI $9 used
  await incrementAndCheck(
    { uid: "u1" as any, role: "admin" },
    "AI",
    9,
    { context: "TR-4.3 prime" }
  );
  // Now $2 should cross $10 limit
  const budR = await incrementAndCheck(
    { uid: "u1" as any, role: "admin" },
    "AI",
    2,
    { context: "TR-4.3 over" }
  );
  console.log(
    "  prime $9 + add $2 => allowed=", budR.allowed,
    "denyReason=", budR.denyReason ?? "none",
    "totalUsedAfter=", budR.totalUsedAfter
  );

  console.log("\nTR-4.4 mode changes + budget changes write audit logs");
  // Mode change
  await setMode({ uid: "u1" as any, role: "admin" }, "HUMAN", "TR-4.4 mode unit");
  await setBudgetLimit(
    { uid: "u1" as any, role: "admin" },
    "VOICE",
    { limitDollars: 42, stopAtBudget: true }
  );
  const allAudit = await fs.collection("audit_logs").orderBy("ts", "asc").get();
  const allEvents = allAudit.docs.map((d: any) => (d.data() as any).event as string);
  console.log(
    "  audit contains MODE_CHANGE?", allEvents.includes("MODE_CHANGE"),
    "  audit contains SETTINGS_UPDATE?", allEvents.includes("SETTINGS_UPDATE")
  );

  _clearAdminStubsForTesting();
  console.log("\nTR-4 suite done");
}

run().catch((err) => {
  console.error("TR-4 FAIL", err);
  process.exit(1);
});
