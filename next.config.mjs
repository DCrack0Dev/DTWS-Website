/** @type {import('next').NextConfig} */
const nextConfig = {
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
    return [];
  },
  async redirects() {
    return [
      { source: "/admin.html", destination: "/admin", permanent: true },
      { source: "/dashboard.html", destination: "/dashboard/projects", permanent: true },
      { source: "/login.html", destination: "/login", permanent: true },
      { source: "/register.html", destination: "/register", permanent: true },
      { source: "/pricing.html", destination: "/pricing", permanent: true },
      { source: "/portfolio.html", destination: "/portfolio", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
      { source: "/index.html", destination: "/", permanent: true }
    ];
  }
};

export default nextConfig;
