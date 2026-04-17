/** @type {import('next').NextConfig} */
const nextConfig = {
  // Portal content pages render VPS-sourced HTML in sandboxed iframes.
  // The portal shell itself does not embed external iframes.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-XSS-Protection", value: "0" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev; frame-src 'self'; connect-src 'self' https://*.clerk.accounts.dev https://*.upstash.io; img-src 'self' data: https://img.clerk.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
