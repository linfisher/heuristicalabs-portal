# Session Handoff — Resume Here

**Last updated:** 2026-04-25 (end of session 19)
**Status:** All current work shipped + live. Local and VPS at structural + data parity. Nothing blocking.

> This doc is transient — delete or rewrite it once you pick up new work.

---

## Where things stand

### Pro Forma viewer — `https://heuristicalabs.com/portal/projects/hivibe-temple/proforma-dashboard`

This session was almost entirely Pro Forma viewer work. File: `public/viewers/hivibe-proforma.html` — single self-contained HTML loaded into a sandboxed iframe (`allow-scripts allow-same-origin`) by the portal route.

**Solo products** (5 total):
- BridgeBox (group card with Offer A/B/C variants — col 1)
- 1000W Amplifier (NEW — placeholder defaults, primarily a bundle component)
- HiVibe MagTile
- inHarmony Cushion

Layout: 2-col grid at desktop. BridgeBox group card sits in col 1; the four single-solo cards stack in col 2 inside `.solo-col-stack` (a flex container, gap 48px desktop / 28px mobile) so MagTile + Cushion + Amp don't get pushed apart by BridgeBox's height. Mobile collapses to single column.

**Bundles** (5 total, in display order):
1. HVT Experience · Mat A — pairs with BB Offer A · Premium
2. HVT Experience · Mat B — pairs with BB Offer B · Standard
3. HVT Experience · Mat C — pairs with BB Offer C · Value
4. HVT Experience · MagTile Version
5. Amplified & Connected MagTile Kits (renamed from "MagTile Floor Kit (4×4)")

Layout: 2-col grid. Mat A/B/C sit in `.bundle-col-left` (gold accent, 16px tight gap — versions of the same product). MagTile Version + Amplified Kits sit in `.bundle-col-right` (purple accent #8b4ac4, 48px gap — different products). Driven by `data-bundle-col="left|right"` attribute on each card.

**Tile size dropdown** on bundle component rows: when the magtile component is present, a `<select>` shows 5 standard floor sizes (2×2 / 3×3 / 4×4 / 5×5 / 6×6) labeled with their physical dimensions in feet (each MagTile is 6'×6', so 4×4 is 24'×24'). Earlier 7×7–11×11 buttons removed. Custom qty values render as "Custom · N tiles" in the select.

**KPI dashboard rows**:
- Row 1 (3 cards): Prototype Build · First Production Run · **CapEx for Community Tech Stack · Arena** (renamed from "Pre-Revenue Capital")
- Row 2: Gross Revenue + EBIT per year (3 year columns)
- Row 3 (3 cards): 3-Year Gross Profit · 3-Year EBIT · **3Y Peak Cash Demand** (renamed from "Target Cash Raise" — now read-only, shows the deepest cumulative cash trough)
- Row 4 (full-width green-bordered card): **SPV Ask · Use of Proceeds**
  - Reads top-to-bottom as the math: `Peak (red) + Contingency (gold, editable) = Capital Raise Target (green, computed)`
  - Default contingency `$279,352` so the default Ask lands at ~$750K against the typical ~$470K peak
  - Use-of-proceeds prose alongside the figure; refreshes live as the contingency input changes
  - Stat line: `Peak need: $X · Total Ask: $Y · Z.ZZ× cover`

**Solo Rollup + Bundles Rollup panels** (below the solo grid + bundle grid respectively): consolidated 3-year breakdown styled like the Gross Revenue + EBIT KPI panel. Each year column lists every product with units + revenue, then year subtotals (Solo/Bundle Revenue + Gross Profit). Rollup tables now use `table-layout: fixed` with locked widths for unit (48px) and revenue (92px) columns — every year renders identically regardless of how many digits the numbers happen to use.

**Money input formatting**: every dollar input is `type="text" inputmode="numeric"` and runs through `readMoneyInput(t)` on each keystroke — strips commas, saves the raw integer to state, reformats with commas in place, restores cursor at end of string. Applies to: solo Unit COGS / Sell Price, BOM cost, bundle Sell Price, OPEX y1/y2/y3, Pre-Revenue Capital total, Contingency Cushion.

**Proto allocation row semantics**: prototypes are dev/testing inventory and never sold solo. The display now shows `proto_units used · 0 solo` (instead of `0 used · X solo`). Only goes negative (`SHORT`) when bundle proto demand exceeds the proto_units a solo has ordered.

**EXPORT / IMPORT JSON**: file-download was silently blocked by the iframe sandbox. Replaced with a copy-paste modal that surfaces the JSON in a textarea — `document.execCommand('copy')` works inside sandboxed iframes where the modern Clipboard API is policy-blocked. IMPORT accepts paste, validates JSON, runs `mergeDefaults`, replaces state.

**SAVE MODEL / LOAD MODEL — server-side via Upstash Redis**: was browser-only localStorage; now stored in Redis under `proforma-scenarios:<userId>`. Same scenarios visible across every browser/device the admin signs in from. `app/api/proforma-scenarios/route.ts` handles GET/POST/DELETE. Auto-migration on first load pushes any pre-existing localStorage scenarios up and clears the local key. Auto-save (`hivibe_proforma_v5`) is intentionally still browser-local.

**Migrations** (all idempotent, run from `mergeDefaults`):
- `migrated_arena_v1` — moves Arena from OPEX into `state.investments[]` if state predates the split
- `migrated_hvt_variants_v1` — adds Mat B + Mat C bundles
- `migrated_magtile_floor_rename_v1` — renames "MagTile Floor Kit (4×4)" → "Amplified & Connected MagTile Kits"
- `migrated_hvt_mat_a_rename_v1` — renames "HVT Experience · Mat Version" → "HVT Experience · Mat A"
- `migrated_bundle_order_v1` — reorders bundles so Mat A/B/C are contiguous at the front
- `migrated_amp_1000w_v1` — injects 1000W Amplifier solo right after BridgeBox group

### Auto VPS-to-local sync — NEW infrastructure

`scripts/sync-from-vps.sh` runs as a `predev` npm script before `npm run dev`. Pulls:
- `/var/www/portal-content/registry.json` → local `.registry.json` (gitignored)
- `/var/www/portal/public/thumbnails/` → local `public/thumbnails/` (gitignored via path)

Means: any admin action you do on VPS (create project, organize sections, upload files, generate thumbnails) shows up on local on the next `npm run dev` restart. Fail-soft: if SSH is unreachable, leaves existing local copy intact and continues. Skip explicitly with `SKIP_VPS_SYNC=1 npm run dev`. Lives at `scripts/sync-from-vps.sh`.

### CAD viewers (unchanged)
- `public/viewers/hivibe-floor-assembly.html` (Three.js v19 Rev 4 MagTile floor) — shared by `hivibe-magtile-cads` and `hivibe-temple` projects
- Thumbnail: `public/thumbnails/hivibe-floor-assembly.png`

### Admin dashboard / portal (unchanged this session)
- Users list collapsible `<details>` grid, sorted by first name
- Current Access duration chips (24h / 3d / 7d / 30d / 90d)
- Project reorder arrows on `/portal/admin` and on each project card on `/portal` home

### Contact form (unchanged)
POSTs to `/api/contact`, Resend sends inquiry to `ADMIN_EMAIL` with reply-to set to visitor. Honeypot + per-IP rate limit (5/hour).

### Public homepage (unchanged)
6 project blocks (SPLINTR, Extreme Video Factory, HiVibe Temple, NLC, Akasha, 1 TO 1). All deck HTML pages removed; decks live behind the portal wall as PDF pages.

---

## Parity check (as of 2026-04-25, end of session)

- VPS git HEAD: `d5af7bb` · local HEAD: `d5af7bb` · matched
- `public/viewers/hivibe-proforma.html`: 3,502 lines on VPS = 3,502 lines on local
- `.registry.json`: 6 projects · synced via `npm run dev` predev hook
- `public/thumbnails/`: 2 files · synced via predev hook
- `proforma-scenarios:<userId>` lives in Upstash Redis · single source for VPS + local

---

## Open data-side items (not bugs)

- **Cushion first-run inventory short**: with three Mat variants × 9 cushions × `first_run_units=3` per bundle, total bundle first-run cushion demand = 81. Solo `cushion.first_run_units=36` → SKU-short alert fires. Bump cushion `first_run_units` to ~120, OR trim each Mat variant's `first_run_units` from 3 to 1.
- **bb_b first-run slightly short**: HVT MagTile Version + Mat B both consume bb_b → demand exceeds supply. Bump bb_b `first_run_units` from 5 to 8.
- **1000W Amplifier defaults are placeholders**: $500 cost, $1,200 sell, low solo volumes. Wire it into bundles via the component dropdown when ready, then tune the BOM and prices.

---

## Tiny loose ends (optional cleanup)

- `app/portal/admin/projects/page-rename/route.ts` — two stray `console.info`/`console.warn` lines from earlier debugging.
- `renderAssumptions()` / `updateAssumptionDetail()` in the Pro Forma viewer — orphaned (no longer called; their target DOM element was removed). `state.assumptions.y0_opex_burn_ratio` still drives `cashFlowYear(0)` from its 0.5 default but is no longer editable in the UI.

---

## Gotchas to remember

- `Referrer-Policy` is `strict-origin-when-cross-origin` (NOT `no-referrer`). With `no-referrer`, same-origin form POSTs send `Origin: null` and the CSRF check rejects every admin form. Don't change it back.
- `registry.json` lives on the VPS at `/var/www/portal-content/registry.json`, not in the repo. The predev sync script pulls a copy to `<cwd>/.registry.json` (gitignored). Authoritative copy is the VPS one.
- `hello@heuristicalabs.com` is the verified Resend sender (FROM_EMAIL). Inbound is unprovisioned — rely on `ADMIN_EMAIL=linfisher@gmail.com` as the actual delivery target.
- `portal.heuristicalabs.com` is retired. DNS A record still exists in GoDaddy but no nginx config / SSL cert for it on the VPS.
- Pro Forma viewer auto-saves every keystroke to `hivibe_proforma_v5` in localStorage. Named SAVE MODEL snapshots are server-side in Upstash Redis (`proforma-scenarios:<userId>`). RESET DEFAULTS only clears the auto-save key — doesn't wipe saved scenarios.
- The viewer iframe's sandbox is `allow-scripts allow-same-origin` — this allows fetch with cookies (so the SAVE/LOAD API works) and localStorage (so auto-save works). Don't tighten without rewiring the SAVE/LOAD API auth path.

---

## Read before touching anything

- `CLAUDE.md` (this directory) — full project architecture, env vars, critical rules
- `/Users/linfisher/.claude/projects/-Users-linfisher-src-Heuristica/memory/MEMORY.md` — session log + cross-project preferences

---

## Dev server

`preview_start` with config `portal` → localhost:8888. The `predev` hook auto-pulls VPS state on every start. No manual `npm run dev` needed.
