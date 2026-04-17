# Heuristica Labs Portal — Claude Code Guide

## What this is
Zero-trust, invitation-only content gateway at `portal.heuristicalabs.com`. Authenticated users request access; admin approves by clicking a duration chip in an email. Access grants live in Clerk publicMetadata. Content is served from a VPS behind a shared-secret header.

## Stack
- **Framework**: Next.js 14 App Router, TypeScript (strict)
- **Auth**: Clerk v5 (`@clerk/nextjs@^5`) — Google, Apple, magic link
- **Token system**: HMAC-SHA256 JWTs via `jose`, single-use enforcement via Upstash Redis
- **Email**: Resend + React Email templates
- **Content origin**: VPS at `VPS_ORIGIN`, authenticated with `X-Portal-Secret` header
- **Deploy target**: Vercel

## Dev Server
Port 8888. Use `preview_start` with the `portal` config, or:
```bash
cd heuristicalabs-portal && npm run dev -- -p 8888
```

## Git
- Repo rooted at `heuristicalabs-portal/` — run git commands from there
- Remote: `github.com/linfisher/heuristicalabs-portal` (private)
- Default branch: main
- Initial commit: `b5f02cd` (Apr 15 2026)

## Environment Variables
All required — `.env.local` is gitignored. See `.env.local.example` for shape.

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `ADMIN_EMAIL` | **Must be set** — missing = admin gate fails open (security hole) |
| `TOKEN_SECRET` | **Must be >= 32 bytes** — shorter key silently weakens JWTs |
| `UPSTASH_REDIS_REST_URL` | Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash console |
| `RESEND_API_KEY` | resend.com |
| `FROM_EMAIL` | Verified sender address in Resend |
| `VPS_ORIGIN` | e.g. `https://files.heuristicalabs.com` |
| `VPS_SECRET` | Shared secret between portal and VPS nginx |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://portal.heuristicalabs.com` — used in token email links |

## Auth Model
- Clerk handles identity (session cookies, OAuth)
- Access grants: `ProjectGrant[]` in `user.publicMetadata.projects`
- Each grant: `{ slug: string, expiresAt: number }` where expiresAt is Unix **milliseconds**
- Middleware reads grants on every `/portal/projects/{slug}/**` request
- Admin check: compare `user.primaryEmailAddress?.emailAddress` to `ADMIN_EMAIL` env var

## Token Flow
Two flows, same token primitives:

**Flow A (admin-initiated):** `/portal/admin` → POST `/portal/admin/grant` → 5 tokens signed + stored → email to admin with 4 accept chips (24h/3d/7d/30d) + 1 deny link → admin clicks chip → `GET /api/access/accept?token=...`

**Flow B (user-initiated):** User visits `/portal/request-access` → POST `/api/request` → 5 tokens signed + stored → email to admin with same chips → admin clicks chip → `GET /api/access/accept?token=...`

**Accept handler order (important):** verifyToken → getUser → updateUserMetadata → deleteToken → deleteGrantGroup → sendEmail → return success

**Deny handler:** verifyToken → deleteToken → deleteGrantGroup → redis.del(reqKey) → sendEmail → return

## Redis Key Patterns
| Key | Purpose |
|---|---|
| `token:{jti}` | Single-use marker; DEL'd on accept/deny |
| `grant-group:{userId}:{slug}` | List of all jtis in a batch; DEL'd to invalidate siblings |
| `req:{userId}:{slug}` | Rate-limit key; 24h TTL; set AFTER successful email send |

## Deploy
- **Production URL**: `https://heuristicalabs-portal.vercel.app` (also aliased to `https://portal.heuristicalabs.com` once DNS is configured)
- **Vercel project**: `prj_T5ygb9NCxS6fps0bNcpSO79tyla4`, org `team_FIncNAODrsR9mRTLcUs1z68W`
- **Deploy command**: `cd heuristicalabs-portal && vercel deploy --prod --yes`
- **Critical**: All 11 env vars must be set in Vercel dashboard before the site works — missing Clerk keys cause `MIDDLEWARE_INVOCATION_FAILED` 500 on every request

## Admin System
- **Admin detection**: local-part email match — `email.split("@")[0] === ADMIN_EMAIL.split("@")[0]`
  - This means `linfisher@gmail.com` and `linfisher@icloud.com` both match `ADMIN_EMAIL=linfisher@gmail.com`
  - Implemented in `lib/auth.ts` (`isAdminEmail`) and inline in `middleware.ts`
- **Admin bypass**: Middleware skips grant check for admins on all `/portal/projects/**` routes
- **Admin nav link**: Barely visible `Admin` text link in portal nav — only renders for admin users (color `#444444`)
- **Direct grant**: `POST /portal/admin/direct-grant` — grants access without sending email
- **Extend/restore**: `POST /portal/admin/extend` — updates `expiresAt` on existing grant (works on expired too)

## PDF Proxy Architecture
All content is served as PDFs through an auth-gated proxy route:
- **Proxy route**: `GET /api/proxy/[slug]/[...path]` — verifies Clerk auth + grant, then fetches from VPS
- **VPS request**: `fetch(VPS_ORIGIN + vpsPath + "/" + filePath, { headers: { "X-Portal-Secret": VPS_SECRET } })`
- **File paths**: No `.pdf` extension — VPS serves files by exact path name
- **Viewer**: PDF rendered in `<iframe>` on `/portal/projects/[slug]/[...path]/page.tsx`
- **Thumbnails**: `components/PDFThumbnail.tsx` — client component, uses pdfjs-dist v5 to render page 1 to canvas
  - Worker: copied to `public/pdf.worker.min.mjs`, served as static file
  - v5 API: `page.render({ canvasContext, viewport, canvas })` — `canvas` property is required in v5

## VPS Content Setup
Content origin: VPS at `VPS_ORIGIN` env var, protected with `X-Portal-Secret` header.

Directory structure on VPS:
```
/var/www/portal-content/
  projects/
    hivibe-temple/          # 10 files, no extensions
      kit-the-model
      floor-tile-bom
      floor-tile-schematic-1 through -8
    bridgebox/              # 7 files, no extensions
      comparison
      schematic-offer-a/b/c
      parts-offer-a/b/c
```

nginx config (e.g. `/etc/nginx/sites-available/portal-content`):
```nginx
server {
    listen 80;
    server_name files.heuristicalabs.com;
    root /var/www/portal-content;
    location /projects/ {
        if ($http_x_portal_secret != "YOUR_VPS_SECRET") { return 403; }
        add_header Content-Disposition "inline";
        add_header Cache-Control "private, no-store";
        try_files $uri =404;
    }
}
```

Upload files with no extension:
```bash
scp ~/Downloads/kit-the-model.pdf heuristica-vps:/var/www/portal-content/projects/hivibe-temple/kit-the-model
```

## Projects Registry
Defined in `lib/projects.ts`. Current projects:
- `hivibe-temple` — HiVibe Kit model + VibroMag Floor Tile BOM + 8 schematics (10 pages)
- `bridgebox` — Offer comparison + 3 schematics + 3 parts lists (7 pages)

## Adding a New Project
Edit `lib/projects.ts` — add an entry to the `PROJECTS` array. Each entry needs `slug`, `name`, `description`, `vpsPath`, and `pages[]`. Pages are served at `/portal/projects/{slug}/{path}`. The `path` value must match exactly what's available on the VPS. Middleware grant-check uses the slug.

## Key Files
| File | Purpose |
|---|---|
| `middleware.ts` | Single chokepoint — all `/portal/**` auth + grant checks |
| `lib/tokens.ts` | signToken, verifyToken, deleteToken, deleteGrantGroup, storeGrantGroup |
| `lib/projects.ts` | PROJECTS registry — add new projects here |
| `lib/vps.ts` | fetchPage — proxies content from VPS with X-Portal-Secret header |
| `lib/types.ts` | ProjectGrant, AccessToken, Project, ProjectPage types |
| `app/portal/admin/page.tsx` | Admin dashboard — user list + grant/revoke forms |
| `emails/grant-invite.tsx` | Email to admin with duration chips |
| `emails/access-request.tsx` | Email to admin when user self-requests |
| `emails/grant-confirmation.tsx` | Email to user when access is granted |
| `emails/access-denied.tsx` | Email to user when request is denied |

## Critical Rules (learned from audit)

**Never skip these:**
1. `auth()` from `@clerk/nextjs/server` MUST be awaited in every server component and route handler
2. `ADMIN_EMAIL` env var MUST be set in production — unset = any user with no email gets admin access
3. `storeGrantGroup` takes a plain `string[]` — do NOT `JSON.stringify` it (Upstash auto-serializes)
4. `deleteGrantGroup` must be called on BOTH accept AND deny paths (sibling invalidation)
5. Rate-limit key `req:{userId}:{slug}` must be set AFTER successful email send, not before
6. iframe sandbox must be `allow-scripts` only — never add `allow-same-origin` (defeats sandbox)
7. Use `user.primaryEmailAddress?.emailAddress` — NOT `user.emailAddresses[0]`

**Middleware bypass rule:**
The `?forbidden=1` bypass in middleware is ONLY for the exact project slug path (`/portal/projects/{slug}`). Sub-pages (`/portal/projects/{slug}/content-page`) are never bypassed.

## Common Pitfalls
- `request.json()` needs try/catch — malformed body returns 500 not 400 without it
- `createSecretKey` comes from Node `crypto`, NOT from `jose`
- `verifyToken` fails closed when Redis is down (correct behavior, but blocks all token flows)
- Clerk `getUserList` returns `{ data, totalCount }` in v5 — not a direct array
- `redirect()` from `next/navigation` throws `NEXT_REDIRECT` — don't catch it accidentally
