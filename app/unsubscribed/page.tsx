import { Suspense } from "react";
import UnsubscribedContent from "./unsubscribed-content";

export default function UnsubscribedPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "4rem" }}>Loading…</div>}>
      <UnsubscribedContent />
    </Suspense>
  );
}