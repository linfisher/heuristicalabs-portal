# Session Handoff — Resume Here

**Last updated:** 2026-04-26 (end of session 20)
**HEAD:** `29f8521`
**Status:** All current work shipped + live. Local and VPS at structural + data parity. Nothing blocking.

> This doc is transient — delete or rewrite it once you pick up new work.

---

## Where things stand

The Pro Forma viewer (`public/viewers/hivibe-proforma.html`, ~3,600 lines, single self-contained HTML loaded into a sandboxed iframe `allow-scripts allow-same-origin` via `srcDoc`) saw heavy iteration this session. Live at `https://heuristicalabs.com/portal/projects/hivibe-temple/proforma-dashboard`.

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
- Row 2: Gross Revenue + EBIT per year (3 year columns)
- Row 3: 3-Year Gross Profit · 3-Year EBIT · **3Y Peak Cash Demand** (red, deepest cumulative cash trough)
- Row 4 (full-width green-bordered): **SPV Ask · Use of Proceeds**
  - Top to bottom: `Peak (red, computed) + Contingency (gold, editable, default $279,352) = Capital Raise Target (green, computed)`
  - 3Y Return on Capital + cover ratio shown in detail line + use-of-proceeds prose alongside

### Solo Rollup + Bundles Rollup
3-year breakdown panels styled like the KPI Gross-Revenue+EBIT block. 3 year columns (Y1/Y2/Y3), each with per-product rows (units + revenue), then year subtotals. `table-layout: fixed`, locked widths (unit 38px / revenue 78px) so every year renders identical.

### Inventory Allocation (NEW this session)
Single consolidated table after the Solo Rollup. Replaced the per-card "Proto Allocation" / "First-Run Allocation" rows that were confusing.

| SKU | For Dev / Proto | Used by Bundles | Available for Solo |
|---|---:|---:|---:|

Color-coded columns (gold proto, purple bundle, green solo). SHORT alert appears inline when bundle production demand exceeds first-run inventory. TOTAL row at the bottom.

### Cumulative Cash chart + explainer (NEW this session)
Above the SVG chart there's now a "How to read this chart" card explaining what Cash Position means: Y0 dip = capital deployment, operating cash flow refills the balance, deepest trough = Peak Cash Need, crossing above 0 = break-even, anything above = retained operating profit. Same `rgba(255,255,255,0.05)` tint as the zebra rows so it groups visually.

### Editable everywhere — latest update wins
Pro Forma table (Step 5) units columns are editable inputs. Edit either the cards above OR the proforma table; both surfaces sync via `updateSoloDerivedDisplay` / `updateBundleDerivedDisplay` (which now also reset card input values from state when state changes elsewhere). Focused input is preserved during refresh so the user's typing isn't clobbered.

### Money input formatting
Every dollar input is `type="text" inputmode="numeric"` running through `readMoneyInput(t)` — strips commas on read, formats with commas on display, restores cursor at end. Pro Forma units same treatment (was `type="number"`, switched because of input quirks).

### Per-card collapse carets
Every solo + bundle + BridgeBox group card has a chevron toggle in the header. Click → toggles body, persists to `localStorage[hivibe_proforma_collapsed:<id>]`. Closed cards stay closed across reload.

### Zebra rows
OPEX, Pro Forma, BOM, rollup tables, and Inventory Allocation get `rgba(255,255,255,0.05)` tint on every other row. Visible at a glance, subtle on the dark ground.

### Allocation logic (FIXED this session)
- **Proto:** when `proto_units = 0`, never show SHORT (user's explicit rule — they intentionally chose 0). When `proto_units > 0` AND bundle proto demand exceeds inventory, fire SHORT.
- **First-Run:** "used" capped at inventory (you can't consume more than you ordered). When bundle demand > inventory, SHORT shows separately as "⚠ N short" with explicit demand: "X ordered · Y needed by bundles · ⚠ Z short". This semantics now lives only in the Inventory Allocation table; per-card alloc rows are gone.

### OPEX sort
OPEX table + Pro Forma OPEX rows now sort by 3-year total descending (Salaries usually top, Fulfillment bottom). Original indices preserved in `data-opex` so input handlers still resolve correctly.

### Saved scenarios — Upstash Redis (server-side)
`SAVE MODEL / LOAD MODEL` scenarios live in Upstash under `proforma-scenarios:<userId>`. `app/api/proforma-scenarios/route.ts` (GET / POST / DELETE, admin-only). Scenarios sync across every browser/device the admin uses. One-time migration on first viewer load pushes any pre-existing localStorage scenarios up and clears the local key.

### Auto VPS-to-local sync
`scripts/sync-from-vps.sh` runs as `predev` before every `npm run dev`. Pulls registry.json + thumbnails/ from VPS over SSH. Means admin actions on VPS show up locally on next dev restart. Fail-soft on offline. Skip with `SKIP_VPS_SYNC=1`.

### Migrations (all idempotent, in `mergeDefaults`)
- `migrated_arena_v1` — moves Arena from OPEX → `state.investments[]`
- `migrated_hvt_variants_v1` — adds Mat B + Mat C bundles
- `migrated_magtile_floor_rename_v1` — renames Floor Kit → Amplified & Connected MagTile Kits
- `migrated_hvt_mat_a_rename_v1` — renames Mat Version → Mat A
- `migrated_bundle_order_v1` — Mat A/B/C contiguous at the front
- `migrated_amp_1000w_v1` — injects 1000W Amplifier solo

---

## Parity check (end of session 20)

- VPS git HEAD = local HEAD = `29f8521`
- `.registry.json`: 6 projects, synced via predev hook
- `public/thumbnails/`: 2 files, synced via predev hook
- Saved scenarios: Upstash Redis (single source for VPS + local)
- User's actual VPS data state (peak ~$485k, contingency $250k, ask ~$735k) loaded into local `hivibe_proforma_v5` for matching previews

---

## Open data-side items (not bugs)

- **Cushion `first_run_units` short**: with 3 Mat variants × 9 cushions × first_run=3 per bundle, total bundle first-run cushion demand = 81. Cushion `first_run_units = 36` in user's state → ~45 short (visible in Inventory Allocation table). Bump cushion first_run to ~120, OR trim each Mat variant's first_run from 3 to 1.
- **bb_b first_run slightly short**: HVT MagTile Version + Mat B both consume bb_b. Bump bb_b first_run if you want to clear the SHORT alert.
- **1000W Amplifier defaults are placeholders**: $500 cost, $975 sell (user adjusted from $1,200), low solo volumes. Wire it deeper into bundles / tune BOM as desired.

---

## Commits this session (newest first, all on `main`)

```
29f8521 Pro Forma: replace per-card alloc rows with Inventory Allocation
        summary + revert Y1 proto-subtract (was causing typing bug)
906d43f Pro Forma: tighter columns + cash chart explainer + Y1 proto-
        subtract wiring (later reverted in 29f8521)
04d17a4 Pro Forma: tighter columns + brighter zebra + clearer SHORT alert
f4af47d Pro Forma: allocation fix + editable proforma units + zebra +
        collapse carets
364cb75 Docs: refresh CLAUDE.md + HANDOFF.md for session 19
```

---

## Tiny loose ends (optional)

- `app/portal/admin/projects/page-rename/route.ts` — two stray `console.info`/`console.warn` lines from earlier debugging.
- `renderAssumptions()` / `updateAssumptionDetail()` in the Pro Forma viewer are orphaned (never called, target DOM removed). `state.assumptions.y0_opex_burn_ratio` still drives `cashFlowYear(0)` from its 0.5 default but isn't editable in the UI.

---

## Gotchas to remember

- `Referrer-Policy` is `strict-origin-when-cross-origin` — DO NOT change to `no-referrer`. With `no-referrer`, same-origin form POSTs send `Origin: null` and the CSRF check rejects every admin form.
- `registry.json` is on the VPS at `/var/www/portal-content/registry.json`. The predev sync pulls it to local `<cwd>/.registry.json` (gitignored).
- `hello@heuristicalabs.com` is the verified Resend sender (FROM_EMAIL); inbound is unprovisioned. Rely on `ADMIN_EMAIL=linfisher@gmail.com` for actual delivery.
- `portal.heuristicalabs.com` is retired. DNS A record still in GoDaddy but no nginx/SSL on the VPS.
- Pro Forma viewer auto-saves to `localStorage[hivibe_proforma_v5]`. Named SAVE MODEL snapshots are server-side (Upstash). RESET DEFAULTS only clears the auto-save key.
- The viewer iframe sandbox is `allow-scripts allow-same-origin` — required for fetch with cookies (scenarios API) and localStorage (auto-save).
- File-based downloads inside the viewer iframe are blocked by sandbox — EXPORT JSON uses a copy-paste modal with `document.execCommand('copy')` instead.

---

## Read before touching anything

- `CLAUDE.md` (this directory) — full project architecture, env vars, critical rules
- `/Users/linfisher/.claude/projects/-Users-linfisher-src-Heuristica/memory/MEMORY.md` — session log + cross-project preferences

---

## Dev server

`preview_start` with config `portal` → localhost:8888. Predev hook auto-pulls VPS state on every start.
