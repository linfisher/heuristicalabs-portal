# Heuristica Labs — Claude Code Guide

## What this is
The entire Heuristica Labs web presence, in one Next.js 14 app, on one domain (`heuristicalabs.com`). Serves the public marketing site at `/` and the invitation-only password-walled portal at `/portal/**`. Unified on 2026-04-18; domain cutover (apex → this app, subdomain → 301) completed 2026-04-19.

## Stack
- **Framework**: Next.js 14 App Router, TypeScript (strict)
- **Auth**: Clerk v5 (`@clerk/nextjs@^5`) — Google, Apple, magic link
- **Token system**: HMAC-SHA256 JWTs via `jose`, single-use enforcement via Upstash Redis
- **Email**: Resend + React Email templates
- **Content origin**: VPS at `VPS_ORIGIN`, authenticated with `X-Portal-Secret` header
- **Styling**: Tailwind v3 + plain CSS in `app/main-site.css` for the marketing pages
- **Deploy targets**: VPS (PM2, port 3001, primary) and Vercel (secondary)

## Dev Server
Port 8888. Use `preview_start` with the `portal` config, or:
```bash
cd heuristicalabs-portal && npm run dev -- -p 8888
```

## Routes
| Path | What |
|---|---|
| `/` | Public homepage (hero, manifesto, projects, about, contact, footer, lightbox) |
| `/contact.html` | Contact + NDA form (static, supports `?nda=true&project=X`) |
| `/nlc.html`, `/nlc-biz.html`, `/akasha.html` | Static slide decks with scroll-snap |
| `/portal` | Password wall. Admin sees all projects (cards) with inline CRUD and archived section; users see only granted projects |
| `/portal/projects/<slug>` | Project detail: PDF thumbnail grid + admin action bar (Rename / Archive / Delete) |
| `/portal/projects/<slug>/<path>` | PDF viewer (blob-URL iframe) or HTML viewer (CAD) |
| `/portal/admin` | User access grid, grant/revoke, direct grant, project management panel |
| `/portal/support` | Multi-choice support form → emails `ADMIN_EMAIL` via Resend |
| `/portal/request-access` | User requests access to a project (chip-based picker) |
| `/portal/sign-in/[[...sign-in]]` | Clerk SignIn widget |
| `/api/proxy/<slug>/<path>` | Auth-gated PDF byte stream from VPS content origin |
| `/api/support` | Validated support email dispatch |
| `/api/request`, `/api/access/accept`, `/api/access/deny` | Token flows |
| `/portal/admin/projects/{create,rename,archive,restore,delete}` | Project CRUD routes |
| `/portal/admin/{grant,direct-grant,extend,revoke}` | Access grant management |

## Git
- Repo rooted at `heuristicalabs-portal/` — run git commands from there
- Remote: `github.com/linfisher/heuristicalabs-portal` (private)
- Default branch: main

## Environment Variables
All required — `.env.local` is gitignored. See `.env.local.example` for shape.

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `ADMIN_EMAIL` | **Must be `linfisher@gmail.com`** in every environment — local-part match means iCloud/Google variants both work |
| `TOKEN_SECRET` | **Must be >= 32 bytes** — shorter key silently weakens JWTs |
| `UPSTASH_REDIS_REST_URL` | Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash console |
| `RESEND_API_KEY` | resend.com |
| `FROM_EMAIL` | Verified sender address in Resend |
| `VPS_ORIGIN` | e.g. `https://files.heuristicalabs.com` |
| `VPS_SECRET` | Shared secret between portal and VPS nginx |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:8888` in dev, `https://heuristicalabs.com` in prod (post-cutover; never the old subdomain) |

## Auth Model
- Clerk handles identity (session cookies, OAuth)
- Access grants: `ProjectGrant[]` in `user.publicMetadata.projects`
- Each grant: `{ slug: string, expiresAt: number }` where expiresAt is Unix **milliseconds**
- Middleware only guards `/portal/**`. Public pages (`/`, `/*.html`) pass through.
- Admin check: local-part email match against `ADMIN_EMAIL` env var (`lib/auth.ts` → `isAdminEmail`)
- Admin bypasses grant check in middleware AND the `?forbidden=1` page gate

## Token Flow (unchanged)
Flow A (admin-initiated): `/portal/admin` → POST `/portal/admin/grant` → 5 tokens signed + stored → email to admin with 4 accept chips (24h/3d/7d/30d) + 1 deny link → admin clicks chip → `GET /api/access/accept?token=...`

Flow B (user-initiated): User visits `/portal/request-access` → POST `/api/request` → same fan-out.

**Accept handler order (critical):** verifyToken → getUser → updateUserMetadata → deleteToken → deleteGrantGroup → sendEmail → return.
**Deny handler:** verifyToken → deleteToken → deleteGrantGroup → redis.del(reqKey) → sendEmail → return.

## Redis Key Patterns
| Key | Purpose |
|---|---|
| `token:{jti}` | Single-use marker; DEL'd on accept/deny |
| `grant-group:{userId}:{slug}` | List of all jtis in a batch; DEL'd to invalidate siblings |
| `req:{userId}:{slug}` | Rate-limit key; 24h TTL; set AFTER successful email send |

## Deploy
- **Primary production URL**: `https://heuristicalabs.com` (VPS PM2, port 3001; nginx reverse-proxies from apex). `www.heuristicalabs.com` also serves here.
- **Old subdomain**: `https://portal.heuristicalabs.com/*` 301-redirects to `https://heuristicalabs.com/*`. Kept for ~24h as safety net; will be removed.
- **Vercel (secondary)**: `https://heuristicalabs-portal.vercel.app` — kept as a preview deploy.
- **VPS deploy**: `ssh heuristica-vps "cd /var/www/portal && git pull && npm ci --prefer-offline && npm run build && pm2 restart portal --update-env && pm2 status"`
- **Vercel deploy**: use Vercel MCP. When editing env vars via CLI, use `printf` (not `echo`) to avoid trailing `\n` in values.
- **Critical**: All env vars must be set in both Vercel and VPS `.env.local` — missing Clerk keys cause `MIDDLEWARE_INVOCATION_FAILED` 500 on every request.
- **Clerk Allowed Origins** (prod instance): set via `PATCH https://api.clerk.com/v1/instance` with `allowed_origins`. Current list includes apex, www, portal subdomain, Vercel URL, `localhost:8888`. Run from VPS so prod key never transits to chat.

## Registry (project data)
- `registry.json` on disk — single source of truth for projects
- **VPS path**: `/var/www/portal-content/registry.json` (auto-detected when writable)
- **Dev path**: `<cwd>/.registry.json` (gitignored, auto-seeded from code on first load)
- Override with `REGISTRY_PATH` env var
- Atomic writes via temp file + rename; in-memory cache invalidated on write
- `lib/registry.ts` owns this. `lib/projects.ts` exposes user-facing read helpers. `lib/projects-registry.ts` is a thin facade for backward-compat with admin routes.

## Admin UX Rules
- **Uniform treatment**: all projects behave the same — static seed data and user-created projects are indistinguishable after seed. Rename, Archive, Delete available on every project.
- **Slug is permanent**: rename changes display name only. Slug = URL = identity.
- **Archive**: hides from users, keeps files on disk, admin can restore.
- **Delete**: wipes the project from registry AND deletes files at `/var/www/portal-content/projects/<slug>/`. Irreversible. Confirm dialog required.
- **Archived projects**: admin can view + restore from both `/portal` home (collapsed section) and `/portal/admin`.

## File Uploads (Phase 2 — shipped Apr 19, 2026)
- **Drag-drop zone + Choose Files + "+ Add Link"** on every project detail page (admin only).
- **Accepts any file type** up to **250 MB**. Server limit: `MAX_SIZE_BYTES` in upload route. VPS nginx `client_max_body_size` must be 260m+ (set via `/etc/nginx/conf.d/upload-size.conf`).
- **File type detection**: `lib/file-type.ts` maps extensions → `pdf`, `md`, `image`, `video`, `audio`, or `file`.
- **Viewers**: pdf → PDFProxyIframe (blob URL), md → marked + DOMPurify, image/video/audio → native tags via proxy, file → download button. See `app/portal/projects/[slug]/[...path]/page.tsx`.
- **Link embeds**: `lib/url-embed.ts` auto-detects YouTube / Drive / Dropbox / Vimeo, stores an iframe-ready `embedUrl`. Generic URLs become external-open links.
- **Color chips** per file type on project cards: PDF pink, MD yellow, IMAGE teal, VIDEO purple, AUDIO orange, FILE gray, plus provider colors (YouTube red, Drive teal, Dropbox blue, Vimeo cyan).
- **Sort**: pages sorted by `createdAt` DESC on the project page — newest first.
- **Duplicate handling**: server returns 409 with `existingTitle`/`existingPath` if slugified path collides; client shows a confirm modal (Skip/Overwrite). Modal requires explicit button click — backdrop click disabled.
- **Failure UX**: persistent `ErrorPanel` with per-file reasons + Dismiss button; never auto-reloads on failure. Auto-reload only runs when everything succeeded.
- **revalidatePath on EVERY mutation**: create/rename/archive/restore/delete project + upload/add-link/page-delete/page-rename. Without this, Next.js Router Cache keeps stale pages until a hard refresh.

## PDF Proxy Architecture
- Proxy route: `GET /api/proxy/[slug]/[...path]` — verifies Clerk auth + grant (admin bypasses), fetches from VPS
- VPS request: `fetch(VPS_ORIGIN + vpsPath + "/" + filePath, { headers: { "X-Portal-Secret": VPS_SECRET } })`
- File paths on VPS: no `.pdf` extension — VPS serves files by exact path name
- Viewer: `components/PDFProxyIframe.tsx` — client component that fetches via the proxy, creates a blob URL, renders in `<iframe>`. Bypasses the app's `X-Frame-Options: DENY` header.
- Thumbnails: `components/PDFThumbnail.tsx` — loads pdfjs-dist + worker from `cdn.jsdelivr.net` via `webpackIgnore` dynamic import. Webpack has a long-standing ESM interop bug with pdfjs-dist that breaks local imports; CDN sidesteps it. Version pinned to `5.6.205`.

## VPS Content Setup
Directory structure on VPS:
```
/var/www/portal-content/
  registry.json            # project registry
  projects/
    hivibe-temple/         # PDFs, no extensions
    bridgebox/             # PDFs, no extensions
    hivibe-magtiles/       # (CAD viewer data if needed)
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
scp ~/Downloads/file.pdf heuristica-vps:/var/www/portal-content/projects/<slug>/<path-no-ext>
```

## Key Files
| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout, ClerkProvider, Exo 2 font |
| `app/page.tsx` | Public homepage (imports `main-site.css`) |
| `app/main-site.css` | All main-site styles (ported from old Vite site; plain CSS) |
| `components/MainSiteEffects.tsx` | Scroll reveal, nav glass, lightbox, stat counter, swipe-to-back |
| `app/portal/layout.tsx` | Portal nav shell; authed links gated behind `userId` |
| `app/portal/page.tsx` | Portal home — admin sees all projects with CRUD cards; users see granted only |
| `app/portal/projects/[slug]/page.tsx` | Project detail with thumbnails + admin action bar |
| `app/portal/projects/[slug]/[...path]/page.tsx` | PDF/HTML/viewer routing |
| `app/portal/admin/page.tsx` | Admin dashboard — users grid + `AdminProjectsPanel` |
| `components/AdminProjectsPanel.tsx` | Admin dashboard projects table with rename/archive/restore/delete + confirm modal |
| `components/ProjectAdminActions.tsx` | Per-card/per-detail admin action bar (shared) |
| `components/AddProjectButton.tsx` | "+ Add Project" button + modal |
| `components/SupportForm.tsx` | Chip-based multi-choice support form |
| `components/RequestAccessForm.tsx` | Chip-based project-access request form |
| `middleware.ts` | Single chokepoint — all `/portal/**` auth + grant checks |
| `lib/registry.ts` | JSON-on-disk project store, atomic writes, in-memory cache |
| `lib/projects.ts` | Read helpers for active projects |
| `lib/projects-registry.ts` | Admin facade over registry (create/rename/archive/restore/delete) |
| `lib/tokens.ts` | signToken, verifyToken, deleteToken, deleteGrantGroup, storeGrantGroup |
| `lib/vps.ts` | fetchPage — proxies HTML/JSON content from VPS |
| `lib/types.ts` | ProjectGrant, AccessToken, Project, ProjectPage types |
| `emails/*.tsx` | Resend React Email templates |
| `next.config.mjs` | CSP with `unsafe-eval` in dev only; allows cdn.jsdelivr.net and cdnjs |

## Critical Rules (learned from audit)

1. `auth()` from `@clerk/nextjs/server` MUST be awaited in every server component and route handler
2. `ADMIN_EMAIL` env var MUST be set in every environment — unset = any user with no email gets admin access
3. `storeGrantGroup` takes a plain `string[]` — do NOT `JSON.stringify` it (Upstash auto-serializes)
4. `deleteGrantGroup` must be called on BOTH accept AND deny paths (sibling invalidation)
5. Rate-limit key `req:{userId}:{slug}` must be set AFTER successful email send, not before
6. iframe sandbox must be `allow-scripts` only — never add `allow-same-origin` (defeats sandbox)
7. Use `user.primaryEmailAddress?.emailAddress` — NOT `user.emailAddresses[0]`
8. Middleware bypass rule: the `?forbidden=1` bypass in middleware is ONLY for the exact project slug path (`/portal/projects/{slug}`). Sub-pages are never bypassed.
9. CSP `unsafe-eval` MUST be dev-only — production stays strict
10. pdfjs-dist MUST be loaded from CDN via `webpackIgnore` — direct webpack imports break with `Object.defineProperty called on non-object`

## Common Pitfalls
- `request.json()` needs try/catch — malformed body returns 500 not 400 without it
- `createSecretKey` comes from Node `crypto`, NOT from `jose`
- `verifyToken` fails closed when Redis is down (correct behavior, but blocks all token flows)
- Clerk `getUserList` returns `{ data, totalCount }` in v5 — not a direct array
- `redirect()` from `next/navigation` throws `NEXT_REDIRECT` — don't catch it accidentally
- Importing `lib/projects.ts` (fs-backed) into a client component breaks the client bundle — server-side only
