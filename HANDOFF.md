# Session Handoff — Resume Here

**Last updated:** 2026-04-30 (audit catch-up after Sessions 21 + 22 went undocumented)
**HEAD:** `64e1421` (local = VPS, auto-deploy via GitHub Actions runs on every push to main)
**Status:** All current work shipped + live. Local and VPS at parity. Nothing blocking.

> This doc is transient — delete or rewrite it once you pick up new work.

---

## What landed since the last handoff

The previous handoff was end of Session 20 (`29f8521`). Two sessions then ran without a handoff refresh; this doc backfills both plus the catch-up audit done 2026-04-30.

### Session 22 (Apr 29) — biggest changes

**Per-file share links (NEW MAJOR FEATURE)**: admin can mint a share link for any single file from its admin bar.
- Click Share → pick duration (24h / 3d / 7d / 30d) → Generate → Copy
- Recipient opens `/portal/share/<token>` with **no Clerk account required**
- Multi-use within window, can be revoked by deleting the Redis key
- New files: `lib/share-tokens.ts`, `app/portal/admin/share-file/route.ts`, `app/portal/share/[token]/page.tsx`, `components/ShareFileButton.tsx`
- `/api/proxy/[slug]/[...path]` now accepts `?share=<token>` and bypasses Clerk auth when the token's slug+pagePath match. The byte-streaming logic was lifted into a `streamFile()` helper so authed and share paths share lookup/streaming.
- Middleware whitelists `/portal/share/*` (sits next to the existing `/portal/sign-in` whitelist)
- Redis key: `share-token:<jti>` (TTL = duration). Distinct from project access tokens (`token:<jti>`) and grant groups (`grant-group:<userId>:<slug>`).

**Pro Forma cash model rewrite**:
- First Run Order = `proto + inventory + bundle demand` (Y1 solo dropped — those produce mid-year, not pre-built; was inflating Y0 cash by $120k+)
- `y1PrepaidCOGS` only counts the bundle first-run portion; solo Y1 COGS pays during Y1, not prepaid in Y0
- Pre-Revenue CapEx ($150k Arena) shifted from Y0 to Y1 cash per user's accounting
- Pre-revenue capex no longer amortized — full hit Y1 in BOTH cash AND P&L. `amortizedYearExpense()` returns full total in Y1, $0 in Y2/Y3. `state.investments[].years` is retained for backwards-compat but ignored by math.
- Step 3 UI dropped Years + Per Year columns; only Line Item + Total $ remain (header now says "Total $ (Y1 hit)")
- P&L row renamed "Pre-Revenue CapEx (Step 3, Y1 only)"; Y2/Y3 cells render — instead of $0
- Net effect on user state: Y1 EBIT 428k → 328k, Y2/Y3 +50k each. 3-year totals unchanged. Peak unchanged.

**EXPORT PDF button** (Pro Forma toolbar, between IMPORT and RESET):
- Calls `window.print()` synchronously inside the click handler — must NOT be wrapped in `setTimeout` (browsers block print() outside user-gesture context)
- `@media print` rules strip on-screen chrome (toolbar, remove buttons, collapse chevrons, +ADD buttons, BOM toggles); inputs render as flat text
- `print-color-adjust: exact` retains dark theme into the PDF
- `@page letter`, 0.45in margins, `break-inside: avoid` on cards/KPI tiles/tables
- Document title pre-stamped "HiVibe Pro Forma · MM-DD-YYYY" so suggested filename is meaningful

**Iframe sandbox widened** on BOTH project + share viewer pages:
- Was: `allow-scripts allow-same-origin`
- Now: `allow-scripts allow-same-origin allow-modals allow-downloads`
- `allow-modals` is required for `window.print()` dialog. `allow-downloads` future-proofs.

**`components/IframePrintBridge.tsx`** (NEW): client component rendered next to the viewer iframe. Listens for `proforma-print-request` postMessage from inside the iframe and calls `iframe.contentWindow.print()`. Last-resort fallback: prints the parent page itself. Used when in-iframe print is blocked despite the widened sandbox.

### Session 21 (Apr 26 late) — Pro Forma master-analysis fixes

**Tax model**: 21% federal rate on positive EBIT, NEW NET INCOME row in the P&L, post-tax used for the SPV return narrative. ROI label was secretly MoM the whole time — now reads "1.80× MoM · $X 3Y net income".

**Use of Proceeds restructured**: `First-Run Inventory + Pre-Revenue CapEx + Y0 Burn = Peak + Contingency = Ask`. "Tune the Peak" hint card lists Y0-cash-out levers (burn ratio, bundle first-run, Y1 solo sales, capex).

**Model Assumptions section** between Step 4 and Step 5: editable Y0 burn ratio + tax rate. `renderAssumptions` was previously dead code, resurrected.

**Per-solo Inventory field**: extra units beyond Y1 sales + bundle demand, sized by user (safety stock / demos / buffer). New cyan Inventory column in First Run Order panel between Y1 Solo and Bundle Demand. Folds into `computedFirstRun` so Y0 cash grows with it. Default 0; backfilled on older saved states.

**KPI year block**: now shows **Gross Profit** instead of EBIT (label + value). EBIT already lives in the Pro Forma table; KPI now pairs cleanly with GM% as the unit-economics view.

**Cash flow fixes**: Y0 stopped double-charging proto (already in `totalFirstRunCost`). Y1 cash adds back COGS prepaid in Y0's first-run inventory so Y1 only pays for new production beyond the first batch. Cash break-even label on the 3Y Peak Cash Demand KPI ("Y2, month 6").

**Margin migration v2 + v3**: 50% auto-reset for BB Offer A/B/C + MagTile Kits (computes COGS from user's actual components, not defaults). v2 was wrong about MagTile Kits (assumed 16-magtile defaults but real state runs 9-magtile + amp_1000w, ~79% margin); v3 detects v2-clobbered states (sell == 2× current COGS) and restores user's price. **Bundle auto-pricing removed entirely** — bundle margin depends on whatever components a user composes; "50% target" is the wrong heuristic and won't run again.

**Misc**: First Run Order panel uses BridgeBox prefix on grouped variants. SHORT badge tooltip removed from Inventory Allocation (panel is now derived — no shortfall possible by construction). Negative-input clamping on solo + bundle numeric fields. Dead code dropped: `totalYearAmortized`, `updateAssumptionDetail`, dead vars in `renderSoloFields`.

---

## Pro Forma viewer state (current)

`public/viewers/hivibe-proforma.html`, ~3,800 lines, single self-contained HTML loaded into a sandboxed iframe `allow-scripts allow-same-origin allow-modals allow-downloads` via `srcDoc`. Live at `https://heuristicalabs.com/portal/projects/hivibe-temple/proforma-dashboard`.

### Solo products (6 total)
- BridgeBox Offer A / B / C (group card, gold-bordered, col 1 of solo grid)
- 1000W Amplifier
- HiVibe MagTile
- inHarmony Cushion

Layout: 2-col grid at desktop. BridgeBox group card sits in col 1; the four single-solo cards stack in col 2 inside `.solo-col-stack` (flex container) so they pack tight regardless of BridgeBox's height. Mobile (≤850px) collapses to single column.

### Bundles (5 total, in display order)
1. HVT Experience · Mat A — pairs with BB Offer A (gold left col)
2. HVT Experience · Mat B — pairs with BB Offer B (gold left col)
3. HVT Experience · Mat C — pairs with BB Offer C (gold left col)
4. HVT Experience · MagTile Version (purple right col)
5. Amplified & Connected MagTile Kits — uses 9 magtile + 1 amp_1000w (purple right col, renamed from "MagTile Floor Kit (4×4)")

Mat variants stacked tight with 16px gap (versions of the same product, gold accent). MagTile + Amplified Kits stacked with 48px gap (different products, purple accent #8b4ac4).

### KPI dashboard (top of page)
- Row 1: Prototype Build · First Production Run · CapEx for Community Tech Stack · Arena
- Row 2: Gross Revenue + **Gross Profit** per year (3 year columns)
- Row 3: 3-Year Gross Profit · 3-Year EBIT · **3Y Peak Cash Demand** (red, deepest cumulative cash trough, with "Y2, month 6" cash break-even label)
- Row 4 (full-width green-bordered): **SPV Ask · Use of Proceeds**
  - Top to bottom: `Peak (red, computed) + Contingency (gold, editable, default $279,352) = Capital Raise Target (green, computed)`
  - 3Y Return on Capital + cover ratio shown in detail line
  - Use-of-proceeds prose: First-Run Inventory + Pre-Revenue CapEx + Y0 Burn = Peak; + Contingency = Ask
  - "Tune the Peak" hint card listing Y0-cash levers

### Model Assumptions (between Step 4 and Step 5)
Editable: Y0 burn ratio, federal tax rate. Drives `cashFlowYear(0)` and the new NET INCOME row in the P&L.

### Solo Rollup + Bundles Rollup
3-year breakdown panels styled like the KPI block. 3 year columns (Y1/Y2/Y3), each with per-product rows (units + revenue), then year subtotals. `table-layout: fixed`, locked widths (unit 38px / revenue 78px) so every year renders identical.

### Inventory Allocation
Single consolidated table after Solo Rollup. Replaced the per-card "Proto Allocation" / "First-Run Allocation" rows.

| SKU | For Dev / Proto | Used by Bundles | Available for Solo |
|---|---:|---:|---:|

Color-coded columns (gold proto, purple bundle, green solo). SHORT alert appears inline when bundle production demand exceeds first-run inventory. TOTAL row at the bottom.

### Cumulative Cash chart + explainer
Above the SVG chart there's a "How to read this chart" card explaining Cash Position: Y0 dip = capital deployment, operating cash flow refills the balance, deepest trough = Peak Cash Need, crossing above 0 = break-even. Same `rgba(255,255,255,0.05)` tint as the zebra rows.

### Editable everywhere
Pro Forma table (Step 5) units columns are editable inputs. Edit either the cards above OR the proforma table; both surfaces sync via `updateSoloDerivedDisplay` / `updateBundleDerivedDisplay` (which also reset card input values from state when state changes elsewhere). Focused input is preserved during refresh.

### Money input formatting
Every dollar input is `type="text" inputmode="numeric"` running through `readMoneyInput(t)` — strips commas on read, formats with commas on display, restores cursor at end. Pro Forma units same treatment.

### Per-card collapse carets
Every solo + bundle + BridgeBox group card has a chevron toggle. Click → toggles body, persists to `localStorage[hivibe_proforma_collapsed:<id>]`. Closed cards stay closed across reload.

### Zebra rows
OPEX, Pro Forma, BOM, rollup tables, and Inventory Allocation get `rgba(255,255,255,0.05)` tint on every other row.

### Allocation logic
- **Proto:** when `proto_units = 0`, never show SHORT (user's explicit rule). When `proto_units > 0` AND bundle proto demand exceeds inventory, fire SHORT.
- **First-Run:** "used" capped at inventory (you can't consume more than you ordered). When bundle demand > inventory, SHORT shows separately as "⚠ N short" with explicit demand: "X ordered · Y needed by bundles · ⚠ Z short". Lives only in Inventory Allocation table; per-card alloc rows are gone.

### OPEX sort
OPEX table + Pro Forma OPEX rows sort by 3-year total descending (Salaries usually top, Fulfillment bottom). Original indices preserved in `data-opex` so input handlers still resolve correctly.

### Saved scenarios — Upstash Redis (server-side)
SAVE MODEL / LOAD MODEL scenarios under `proforma-scenarios:<userId>`. `app/api/proforma-scenarios/route.ts` (GET / POST / DELETE, admin-only). Scenarios sync across every browser/device the admin uses. One-time migration on first viewer load pushes any pre-existing localStorage scenarios up and clears the local key.

### Auto VPS-to-local sync
`scripts/sync-from-vps.sh` runs as `predev` before every `npm run dev`. Pulls registry.json + thumbnails/ from VPS over SSH. Means admin actions on VPS show up locally on next dev restart. Fail-soft on offline. Skip with `SKIP_VPS_SYNC=1`.

### Migrations (all idempotent, in `mergeDefaults`)
- `migrated_arena_v1` — moves Arena from OPEX → `state.investments[]`
- `migrated_hvt_variants_v1` — adds Mat B + Mat C bundles
- `migrated_magtile_floor_rename_v1` — renames Floor Kit → Amplified & Connected MagTile Kits
- `migrated_hvt_mat_a_rename_v1` — renames Mat Version → Mat A
- `migrated_bundle_order_v1` — Mat A/B/C contiguous at the front
- `migrated_amp_1000w_v1` — injects 1000W Amplifier solo
- `bundle_margin_v2` — 50% margin auto-reset for BB A/B/C + MagTile Kits (Session 21)
- `magtile_kit_price_v3` — restores user's MagTile Kits price after v2 over-corrected (Session 21)

---

## Parity check (end of catch-up audit, 2026-04-30)

- VPS git HEAD = local HEAD = `64e1421`
- VPS `pm2 status portal`: online, 24h uptime
- `.registry.json`: 5 active projects (`1-to-1-bet-matching`, `akasha-ai`, `hivibe-temple`, `no-limit-chess`, `sky-combat-aces-video-factory`), synced via predev hook
- `public/thumbnails/`: 2 files (hivibe-floor-assembly.png, hivibe-proforma.png)
- Saved scenarios: Upstash Redis (single source for VPS + local)
- Production: `https://heuristicalabs.com` apex 200, `/portal` 307 to sign-in, `/portal/share/<token>` route live (returns 200 even with invalid token, error rendered in page)

---

## Open data-side items (not bugs)

- **Cushion `first_run_units` short**: with 3 Mat variants × 9 cushions × first_run=3 per bundle, total bundle first-run cushion demand = 81. Cushion `first_run_units = 36` in user's state → ~45 short (visible in Inventory Allocation table). Bump cushion first_run to ~120, OR trim each Mat variant's first_run from 3 to 1.
- **bb_b first_run slightly short**: HVT MagTile Version + Mat B both consume bb_b. Bump bb_b first_run if you want to clear the SHORT alert.
- **1000W Amplifier defaults are placeholders**: $500 cost, $975 sell (user adjusted from $1,200), low solo volumes. Wire it deeper into bundles / tune BOM as desired.

---

## Tiny loose ends (optional)

- `app/portal/admin/projects/page-rename/route.ts` — two stray `console.info`/`console.warn` lines from earlier debugging (pre-Session 21).
- `renderAssumptions()` was resurrected in Session 21; `updateAssumptionDetail()` is now confirmed-orphaned (delete candidate). `state.assumptions.y0_opex_burn_ratio` IS now editable in the Model Assumptions section.
- `state.investments[].years` field is retained on saved states for backwards-compat after `a7da4d8` killed amortization. Could be cleaned up in a future migration.
- `portal.heuristicalabs.com` DNS A record in GoDaddy still exists but nothing answers — user to delete.

---

## Gotchas to remember

- **`Referrer-Policy: strict-origin-when-cross-origin`** — DO NOT change to `no-referrer`. With `no-referrer`, same-origin form POSTs send `Origin: null` and the CSRF check rejects every admin form.
- **Iframe sandbox is now `allow-scripts allow-same-origin allow-modals allow-downloads`** on the proforma + share viewers. `allow-modals` is required for `window.print()` dialog. The old "allow-scripts only" rule applies to PDF proxy iframes (PDFProxyIframe, line ~290 of project page) — they still use just `allow-scripts`. Don't over-broaden them.
- **`window.print()` MUST be called synchronously** inside the click handler. Wrapping in `setTimeout` silently blocks the dialog (browsers require user-gesture context). `IframePrintBridge` is the postMessage fallback if in-iframe print is blocked.
- **Share-link revocation**: deleting `share-token:<jti>` in Upstash kills any in-flight links. Token TTL is set on creation; expired tokens 404 the share page automatically.
- `registry.json` is on the VPS at `/var/www/portal-content/registry.json`. The predev sync pulls it to local `<cwd>/.registry.json` (gitignored).
- `hello@heuristicalabs.com` is the verified Resend sender (FROM_EMAIL); inbound is unprovisioned. Rely on `ADMIN_EMAIL=linfisher@gmail.com` for actual delivery.
- Pro Forma viewer auto-saves to `localStorage[hivibe_proforma_v5]`. Named SAVE MODEL snapshots are server-side (Upstash). RESET DEFAULTS only clears the auto-save key.
- File-based downloads inside the proforma iframe are blocked by sandbox even with `allow-downloads` (browser policy on `srcDoc`-loaded sandbox iframes) — EXPORT JSON uses a copy-paste modal with `document.execCommand('copy')`. EXPORT PDF works because print() is a different code path.

---

## Read before touching anything

- `CLAUDE.md` (this directory) — full project architecture, env vars, critical rules
- `/Users/linfisher/.claude/projects/-Users-linfisher-src-Heuristica/memory/MEMORY.md` — index + cross-project preferences
- `/Users/linfisher/.claude/projects/-Users-linfisher-src-Heuristica/memory/session_log.md` — full session history (extracted from MEMORY.md after it grew over the size cap)

---

## Dev server

`preview_start` with config `portal` → localhost:8888. Predev hook auto-pulls VPS state on every start.
