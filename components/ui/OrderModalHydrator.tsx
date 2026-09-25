"use client";

import Script from "next/script";
import { useEffect } from "react";

export default function OrderModalHydrator() {
  useEffect(() => {
    return;
  }, []);
  return (
    <>
      <Script src="/order-modal.js" strategy="afterInteractive" />
      <Script src="/payfast.js" strategy="afterInteractive" />
    </>
  );
}
