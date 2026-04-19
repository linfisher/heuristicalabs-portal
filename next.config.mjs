/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production"

// Next.js dev HMR + React Refresh need `unsafe-eval`. Production stays strict.
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  isDev && "'unsafe-eval'",
  "https://clerk.com",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  "https://*.heuristicalabs.com",
  "https://cdnjs.cloudflare.com",
  "https://cdn.jsdelivr.net",
].filter(Boolean).join(" ")

// Embed sources admins may add via "Add Link": YouTube, Google Drive, Dropbox, Vimeo
const embedFrameSrc = [
  "https://www.youtube.com",
  "https://youtube.com",
  "https://www.youtube-nocookie.com",
  "https://drive.google.com",
  "https://docs.google.com",
  "https://www.dropbox.com",
  "https://player.vimeo.com",
].join(" ")

const embedImgSrc = [
  "https://i.ytimg.com",
  "https://yt3.ggpht.com",
  "https://lh3.googleusercontent.com",
  "https://i.vimeocdn.com",
].join(" ")

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "worker-src blob:",
  `frame-src 'self' blob: https://*.clerk.accounts.dev https://*.heuristicalabs.com ${embedFrameSrc}`,
  "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.heuristicalabs.com https://*.upstash.io https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  `img-src 'self' data: blob: https://img.clerk.com https://*.heuristicalabs.com ${embedImgSrc}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.heuristicalabs.com https://*.clerk.com",
  "font-src 'self' data: https://fonts.gstatic.com https://*.heuristicalabs.com https://*.clerk.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

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
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ]
  },
}

export default nextConfig
