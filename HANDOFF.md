# Session Handoff — Resume Here

**Last updated:** 2026-04-24
**Status:** All current work shipped. Nothing blocking.

> This doc is transient — delete or rewrite it once you pick up new work.

---

## Where things stand

- **Deploy pipeline**: `.github/workflows/deploy.yml`. Every push to `main` auto-deploys to the VPS via GitHub Actions (git reset → npm ci → next build → pm2 restart). `DEPLOY_SETUP.md` has the one-time setup steps.
- **CAD viewers**: `public/viewers/hivibe-floor-assembly.html` (single Three.js v19 Rev 4 viewer) is shared between two portal projects:
  - `hivibe-magtile-cads` — page `floor-assembly-viewer`
  - `hivibe-temple` — page `floor-tile-viewer` (re-pointed at the same file, old `floor_tile_viewer.html` deleted)
  Thumbnails at `public/thumbnails/hivibe-floor-assembly.png` (auto-generated at 4×4 tile grid).
- **Admin dashboard**: Users list is now a collapsible `<details>` grid sorted by first name, revoked/no-grant users sink to the bottom. Current Access shows one-click duration chips (24h/3d/7d/30d/90d). Project reorder arrows (↑/↓) live on both the admin-dashboard Projects panel AND on every project card on `/portal` home.
- **Contact form**: POSTs to `/api/contact`, Resend sends inquiry to `ADMIN_EMAIL` with reply-to set to visitor. Honeypot + per-IP rate limit (5/hour). Back-to-Home pink button on success.
- **Public homepage**: 6 project blocks (SPLINTR, Extreme Video Factory, HiVibe Temple, NLC, Akasha, 1 TO 1), each with Request NDA + Contact buttons. Old deck HTML pages removed — all decks are behind the portal wall now as PDF pages.

---

## Tiny loose end (optional cleanup)

`app/portal/admin/projects/page-rename/route.ts` has two `console.info`/`console.warn` lines from a debugging session. Harmless but unnecessary now that rename works. Remove if you care about log cleanliness.

---

## Gotchas to remember

- `Referrer-Policy` is `strict-origin-when-cross-origin` (NOT `no-referrer`). With `no-referrer`, same-origin form POSTs send `Origin: null` and the CSRF check rejects every admin form. Don't change it back.
- `registry.json` lives on the VPS at `/var/www/portal-content/registry.json`, not in the repo. Admin UI writes to it via `lib/registry.ts`. To inspect/patch by hand: `ssh heuristica-vps` then edit the JSON (in-memory cache flushes on the next PM2 restart).
- `hello@heuristicalabs.com` is the verified Resend sender (FROM_EMAIL). Inbound to that address routes to Microsoft 365 but the mailbox isn't provisioned — rely on `ADMIN_EMAIL=linfisher@gmail.com` as the actual delivery target (it's the `reply_to` on all system emails and the `to` on contact-form emails).
- `portal.heuristicalabs.com` is retired. DNS A record still exists in GoDaddy but the VPS has no nginx config / SSL cert for it. Delete at your leisure. Never use in new copy.

---

## Read before touching anything

- `CLAUDE.md` (this directory) — full project architecture, env vars, critical rules
- `/Users/linfisher/.claude/projects/-Users-linfisher-src-Heuristica/memory/MEMORY.md` — session log + cross-project preferences

---

## Dev server

`preview_start` with config `portal` → localhost:8888. No manual `npm run dev` needed.
