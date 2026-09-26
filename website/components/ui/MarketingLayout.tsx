import MarketingNavbar from "@website/components/ui/MarketingNavbar";
import MarketingFooter from "@website/components/ui/MarketingFooter";
import { Suspense } from "react";

export default function MarketingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<nav className="navbar h-16 bg-bg-500"></nav>}>
        <MarketingNavbar />
      </Suspense>
      {children}
      <MarketingFooter />
    </>
  );
}
