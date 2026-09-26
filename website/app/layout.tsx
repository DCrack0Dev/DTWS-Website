import type { Metadata } from "next";
import { FirebaseClientProvider } from "@website/components/providers/FirebaseClientProvider";
import "./globals.css";

const cinzelVariable = "--font-cinzel";
const ralewayVariable = "--font-raleway";

export const metadata: Metadata = {
  title: {
    default: "DemiTech Web Services",
    template: "%s | DemiTech Web Services"
  },
  description:
    "DemiTech Web Services — custom websites, apps and automation.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "DemiTech Web Services",
    description: "Custom websites, apps and automation.",
    type: "website"
  },
  icons: {
    icon: "/demitech-logo.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${cinzelVariable} ${ralewayVariable}`}
    >
      <body className="bg-bg-500 text-neutral-100 min-h-screen">
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
      </body>
    </html>
  );
}
