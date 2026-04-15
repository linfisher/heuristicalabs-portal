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
