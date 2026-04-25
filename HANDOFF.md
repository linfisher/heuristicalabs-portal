# Session Handoff — Resume Here

**Last updated:** 2026-04-25
**Status:** All current work shipped + live. Nothing blocking.

> This doc is transient — delete or rewrite it once you pick up new work.

---

## Where things stand

- **Pro Forma viewer (HiVibe Temple → `/portal/projects/hivibe-temple/proforma-dashboard`)**:
  - Now models **Pre-Revenue Capital** as a separate STEP 3 section. Capital lines (e.g. Arena Integration $370k) are amortized evenly across N years instead of slamming Y1 OPEX. EBIT subtracts amortized capital alongside OPEX; cash flow Y0 lump-sums the full capital and Y1+ adds the amortized expense back so the cumulative cash chart doesn't double-count.
  - One-time migration `migrated_arena_v1` auto-moves any user's pre-existing Arena OPEX line into `state.investments[]` preserving total spend.
  - KPI row 1 grew to 3-col: Prototype Build / First Production Run / Pre-Revenue Capital. SPV card relabeled **Target Cash Raise** with refined explanation.
  - **SAVE MODEL / LOAD MODEL** named scenarios in the toolbar. localStorage key `hivibe_proforma_scenarios_v1`, independent from the auto-save key (`hivibe_proforma_v5`). Newest-first list, per-row delete, Enter saves / Esc cancels.
  - Per-card year breakdown: solo / group-solo / bundle cards each show Y1/Y2/Y3 units + revenue + GP individually, GP turns red when negative.
  - OPEX table wrapper switched to `overflow-x:auto` so Y2/Y3 columns scroll inside the wrapper instead of clipping at desktop widths.
  - Emoji warn/check glyphs in the KPI "X SKUs short" line replaced with `[!]` and plain text (project NO-EMOJIS rule).
  - File: `public/viewers/hivibe-proforma.html` · last commit `6c2e586`.
- **Deploy pipeline**: `.github/workflows/deploy.yml`. Every push to `main` auto-deploys to the VPS (git reset → npm ci → next build → pm2 restart). `DEPLOY_SETUP.md` has the one-time setup.
- **CAD viewers**: `public/viewers/hivibe-floor-assembly.html` (single Three.js v19 Rev 4 viewer) is shared between two portal projects:
  - `hivibe-magtile-cads` — page `floor-assembly-viewer`
  - `hivibe-temple` — page `floor-tile-viewer`
  Thumbnails at `public/thumbnails/hivibe-floor-assembly.png`.
- **Admin dashboard**: Users list is a collapsible `<details>` grid sorted by first name, revoked / no-grant users sink to the bottom. Current Access shows one-click duration chips (24h/3d/7d/30d/90d). Project reorder arrows (↑/↓) live both on `/portal/admin` Projects panel AND on every project card on `/portal` home.
- **Contact form**: POSTs to `/api/contact`, Resend sends inquiry to `ADMIN_EMAIL` with reply-to set to visitor. Honeypot + per-IP rate limit (5/hour). Back-to-Home pink button on success.
- **Public homepage**: 6 project blocks (SPLINTR, Extreme Video Factory, HiVibe Temple, NLC, Akasha, 1 TO 1), each with Request NDA + Contact buttons. All deck HTML pages removed — decks live behind the portal wall as PDF pages now.

---

## Tiny loose ends (optional cleanup)

- `app/portal/admin/projects/page-rename/route.ts` has two `console.info`/`console.warn` lines from a debugging session. Harmless; remove if you care about log cleanliness.
- `renderAssumptions()` and `updateAssumptionDetail()` in `public/viewers/hivibe-proforma.html` are now orphaned (no longer called from `render()`, and the `assumptionsBlock` DOM element they target was removed when STEP 3 was repurposed for Pre-Revenue Capital). They don't crash because nothing calls them, but they're dead code. The `state.assumptions.y0_opex_burn_ratio` field they used to expose is still consumed by `cashFlowYear(0)` from its 0.5 default — just no longer editable in the UI.

---

## Gotchas to remember

- `Referrer-Policy` is `strict-origin-when-cross-origin` (NOT `no-referrer`). With `no-referrer`, same-origin form POSTs send `Origin: null` and the CSRF check rejects every admin form. Don't change it back.
- `registry.json` lives on the VPS at `/var/www/portal-content/registry.json`, not in the repo. Admin UI writes to it via `lib/registry.ts`. To inspect/patch by hand: `ssh heuristica-vps` then edit the JSON (in-memory cache flushes on the next PM2 restart).
- `hello@heuristicalabs.com` is the verified Resend sender (FROM_EMAIL). Inbound to that address routes to Microsoft 365 but the mailbox isn't provisioned — rely on `ADMIN_EMAIL=linfisher@gmail.com` as the actual delivery target (it's the `reply_to` on all system emails and the `to` on contact-form emails).
- `portal.heuristicalabs.com` is retired. DNS A record still exists in GoDaddy but the VPS has no nginx config / SSL cert for it. Delete at your leisure. Never use in new copy.
- Pro Forma viewer auto-saves on every keystroke to `hivibe_proforma_v5` in localStorage. Named SAVE MODEL snapshots go to `hivibe_proforma_scenarios_v1` — they're independent. RESET DEFAULTS only clears the auto-save key.

---

## Read before touching anything

- `CLAUDE.md` (this directory) — full project architecture, env vars, critical rules
- `/Users/linfisher/.claude/projects/-Users-linfisher-src-Heuristica/memory/MEMORY.md` — session log + cross-project preferences

---

## Dev server

`preview_start` with config `portal` → localhost:8888. No manual `npm run dev` needed.
