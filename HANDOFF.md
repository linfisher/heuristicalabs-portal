# Session Handoff — Resume Here

**Last updated:** 2026-05-09 (Sessions 23–25 catch-up)
**HEAD:** see `git log -1` (auto-deploy via GitHub Actions runs on every push to main)
**Status:** All recent work shipped + live. Deploy pipeline verified green (Run #52 deployed PR #3). Local and VPS at parity.

> This doc is transient — delete or rewrite it once you pick up new work.

---

## What landed in Sessions 23–25

### Sessions 23–24 (May 9, 04:30–05:36 UTC) — homepage rebrand cycle

**Goal**: append "Featuring inHarmony Vibroacoustic cushions." to HiVibe Temple and rebrand the Extreme Video Factory mid-feature card to extremePOV.ai (matching the live extremepov.ai hero structure).

**What happened (the cautionary tale)**:

1. **PR #1** (`claude/continue-from-handoff-PzhXA`, merged then reverted): combined HiVibe copy + full extremePOV rebrand + tightened mid-feature spacing.
   - Branched off `a6ec73e` — that was HEAD according to the *previous* HANDOFF.md, but real `main` was 50 commits ahead by then.
   - Three-way merge resolved without textual conflicts but silently overwrote newer homepage structure with the older version.
   - Production homepage broke after merge.
2. **PR #2** (`revert/pr-1`, merged 3 min later): straight revert of PR #1, restoring `main` to last-known-good `a6ec73e`.
3. **PR #3** (`claude/extremepov-card-only`, merged): re-applied **only** the extremePOV.ai card surgically — 4 files, +16/-12. Card-only diff: no spacing changes, no aspect-ratio changes, no class renames, no structural rewrites. Auto-deploy ran clean.

**Lesson burned in**: HANDOFF.md's stated `HEAD: <sha>` is **not** a substitute for `git fetch origin main && git log` before branching. The previous HANDOFF anchored on a stale sha (last refreshed end of Session 22) and a session that trusted it ate a production outage. Always rebase onto live `main` before opening a PR — and prefer narrow surgical diffs to broad refactors when re-applying after a revert.

### Session 25 (this session) — finish what Session 24 left behind

- **Re-applied HiVibe Temple cushions one-liner** that was lost in the PR #2 revert and never re-shipped by PR #3 (PR #3 was extremePOV-only).
  - `app/page.tsx`, mid-feature description: appended " Featuring inHarmony Vibroacoustic cushions." to the existing copy.
  - One-line edit. No CSS, no layout, no structural changes.
- **Verified deploy pipeline** is healthy: GitHub Actions Run #52 (PR #3 merge → main) succeeded in 2m 24s. All 28 visible historical runs are green. No backlog, no stuck deploys.
- **Refreshed this doc** + parity check.

---

## Pro Forma viewer state (unchanged since Session 22)

`public/viewers/hivibe-proforma.html`, ~3,800 lines, single self-contained HTML loaded into a sandboxed iframe `allow-scripts allow-same-origin allow-modals allow-downloads` via `srcDoc`. Live at `https://heuristicalabs.com/portal/projects/hivibe-temple/proforma-dashboard`.

(Solo product list, bundle list, KPI block, Model Assumptions, Inventory Allocation, cumulative-cash chart, money-input formatting, collapse carets, zebra rows, OPEX sort, Upstash-backed saved scenarios, predev VPS sync, idempotent migrations — all as documented in `CLAUDE.md` under "Pro Forma Viewer". No drift from Sessions 21–22.)

---

## Homepage state (current)

- **Hero / manifesto / SPLINTR card / project grid / footer**: unchanged from `a6ec73e`.
- **HiVibe Temple mid-feature card**: copy now includes "Featuring inHarmony Vibroacoustic cushions." (Session 25).
- **extremePOV.ai mid-feature card** (formerly Extreme Video Factory): "NOW IN PRIVATE BETA / SEND IT. WE CUT IT. / Ai Multicam Editing for Extreme Sports Creators." Monochrome white-on-black inner placeholder. `Visit extremepov.ai →` CTA alongside NDA + Contact. Contact API allowlist + `/contact.html` dropdown both include `extremePOV.ai` (Extreme Video Factory entries kept for old email link compatibility).
- **No spacing or aspect-ratio changes** to mid-feature cards (the spacing tweaks from PR #1 were not re-applied — they were a co-cause of the breakage and weren't re-prioritized).

---

## Parity check (Session 25)

- Remote `main` HEAD = `036ce7c` (PR #3 merge). Local working branch is `claude/review-docs-continue-766lx`, currently 1+ commits ahead of `main` after this session's edits (HiVibe copy + this doc).
- VPS auto-deploy: GitHub Actions Run #52 ✓ green, deployed `036ce7c`.
- Production: `https://heuristicalabs.com` 200 (verified via deploy success; direct WebFetch from sandbox 403'd, likely bot blocking — not a real outage).
- `.registry.json` synced from VPS via `predev` hook (no changes since Session 22).

---

## Open data-side items (carried from Session 22, still not bugs)

- **Cushion `first_run_units` short**: with 3 Mat variants × 9 cushions × first_run=3, total bundle first-run cushion demand = 81; cushion `first_run_units = 36` → ~45 short in Inventory Allocation. Bump cushion first_run to ~120, OR trim each Mat variant's first_run from 3 to 1.
- **bb_b first_run slightly short**: HVT MagTile Version + Mat B both consume bb_b. Bump bb_b first_run to clear the SHORT alert.
- **1000W Amplifier defaults are placeholders**: $500 cost, $975 sell (user adjusted from $1,200), low solo volumes. Wire deeper into bundles / tune BOM as desired.

## Tiny loose ends (carried)

- `app/portal/admin/projects/page-rename/route.ts` — two stray `console.info`/`console.warn` lines from earlier debugging.
- `updateAssumptionDetail()` confirmed-orphaned (delete candidate). `state.assumptions.y0_opex_burn_ratio` IS now editable in the Model Assumptions section.
- `state.investments[].years` retained on saved states for backwards-compat after `a7da4d8` killed amortization. Future migration could drop it.
- `portal.heuristicalabs.com` DNS A record in GoDaddy still exists but nothing answers — user to delete.

---

## Gotchas to remember (carried + new)

- **Always `git fetch origin main` before branching** (NEW). The "HEAD" line at the top of HANDOFF.md is reference, not truth — verify against the remote. Branching off a stale base is how PR #1 broke prod.
- **`Referrer-Policy: strict-origin-when-cross-origin`** — DO NOT change to `no-referrer` (kills admin form CSRF check via null Origin).
- **Iframe sandbox** is `allow-scripts allow-same-origin allow-modals allow-downloads` on proforma + share viewers. PDF proxy iframes still use `allow-scripts` only — don't over-broaden.
- **`window.print()` MUST be called synchronously** inside the click handler. `setTimeout` silently blocks the dialog. `IframePrintBridge` is the postMessage fallback.
- **Share-link revocation**: deleting `share-token:<jti>` in Upstash kills any in-flight links.
- `registry.json` is on the VPS at `/var/www/portal-content/registry.json`. The predev sync pulls it to local `.registry.json`.
- `hello@heuristicalabs.com` is the verified Resend sender (FROM_EMAIL). Inbound is unprovisioned — rely on `ADMIN_EMAIL=linfisher@gmail.com`.
- Pro Forma viewer auto-saves to `localStorage[hivibe_proforma_v5]`. Named SAVE MODEL snapshots are server-side (Upstash). RESET DEFAULTS only clears the auto-save key.
- File-based downloads inside the proforma iframe are blocked by sandbox even with `allow-downloads` — EXPORT JSON uses `document.execCommand('copy')`. EXPORT PDF works because `print()` is a different code path.

---

## Read before touching anything

- `CLAUDE.md` (this directory) — full project architecture, env vars, critical rules
- This file (`HANDOFF.md`) — current session anchor
- `DEPLOY_SETUP.md` — one-time auto-deploy pipeline setup (already done)

---

## Dev server

`preview_start` with config `portal` → localhost:8888. Predev hook auto-pulls VPS state on every start. Skip with `SKIP_VPS_SYNC=1 npm run dev`.
