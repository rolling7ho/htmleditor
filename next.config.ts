import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const lifecycleEvent = process.env.npm_lifecycle_event;
if (lifecycleEvent === "dev" || lifecycleEvent === "start") {
  console.log(`
\x1b[36m  ╭──────────────────────────────────────╮
  │                                      │
  │    ✏  \x1b[1mHTML Article Editor\x1b[22m\x1b[36m           │
  │                                      │
  │    \x1b[33m<write>\x1b[36m your story here \x1b[33m</write>\x1b[36m  │
  │                                      │
  ╰──────────────────────────────────────╯\x1b[0m
`);
}

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'",
      isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data: blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self'",
      "frame-src 'self'",
      "child-src 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), clipboard-read=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compiler: {
    removeConsole: !isDev,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
