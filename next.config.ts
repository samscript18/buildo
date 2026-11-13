import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["three"],
  serverExternalPackages: ["mongoose"],
  poweredByHeader: false,
  async headers() {
    return [
      ...[
        "/dashboard/:path*",
        "/studio/:path*",
        "/projects/:path*",
        "/assets/:path*",
        "/settings/:path*",
        "/admin/:path*",
        "/login",
        "/register",
        "/api/:path*",
      ].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
