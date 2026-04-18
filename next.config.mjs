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
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.heuristicalabs.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; worker-src blob:; frame-src 'self' https://*.clerk.accounts.dev https://*.heuristicalabs.com; connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.heuristicalabs.com https://*.upstash.io https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; img-src 'self' data: https://img.clerk.com https://*.heuristicalabs.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.heuristicalabs.com https://*.clerk.com; font-src https://fonts.gstatic.com https://*.heuristicalabs.com https://*.clerk.com; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
