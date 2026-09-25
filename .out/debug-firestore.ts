import { buildMemoryFirestore } from "./stubs/firestore-memory";
const fs = buildMemoryFirestore();
async function run() {
  await fs.collection("settings").doc("system").set({ mode: "AI" });
  const ref = fs.doc("settings/system");
  const snap = await ref.get();
  console.log("typeof snap.data =", typeof snap.data);
  console.log("typeof snap.get =", typeof snap.get);
  console.log("snap.exists", snap.exists);
  console.log("snap.data()", snap.data());
  // Also test tx.get
  await fs.runTransaction(async (tx: any) => {
    const tsnap = await tx.get(ref);
    console.log("typeof tx.get().data =", typeof tsnap.data);
    console.log("tx.get().data()", tsnap.data());
    // test second call
    const tsnap2 = await tx.get(ref);
    console.log("typeof 2nd tx.get().data =", typeof tsnap2.data);
  });
}
run().catch((e) => console.error("FAIL", e, e.stack));
