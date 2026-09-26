/** @type {import('next').NextConfig} */
const websiteNextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "http://localhost:3000",
        "https://demitechwebservices.live"
      ]
    }
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "**.gravatar.com" }
    ]
  },
  async rewrites() {
    return [
      { source: "/CTB/:path*", destination: "/legacy-sites/CTB/:path*" },
      { source: "/PP Group/:path*", destination: "/legacy-sites/PP Group/:path*" },
      { source: "/SRK/:path*", destination: "/legacy-sites/SRK/:path*" },
      { source: "/UT Clothing/:path*", destination: "/legacy-sites/UT Clothing/:path*" }
    ];
  },
  async redirects() {
    const optimusUrl = process.env.NEXT_PUBLIC_OPTIMUS_URL || "http://localhost:3001";
    const keep = [
      "/login", "/register", "/unsubscribed", "/quote", "/bookings",
      "/dashboard/projects"
    ];
    const optimusMovedPaths = [
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
    const movedRedirects = optimusMovedPaths.map((p) => ({
      source: `${p}/:path*`,
      destination: `${optimusUrl}${p}/:path*`,
      permanent: true
    })).concat(optimusMovedPaths.filter((p) => !keep.includes(p)).map((p) => ({
      source: p,
      destination: `${optimusUrl}/login`,
      permanent: true
    })));

    return [
      { source: "/admin.html", destination: `${optimusUrl}/login`, permanent: true },
      { source: "/dashboard.html", destination: `${optimusUrl}/login`, permanent: true },
      { source: "/login.html", destination: "/login", permanent: true },
      { source: "/register.html", destination: "/register", permanent: true },
      { source: "/pricing.html", destination: "/pricing", permanent: true },
      { source: "/portfolio.html", destination: "/portfolio", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      ...movedRedirects
    ];
  }
};

export default websiteNextConfig;
