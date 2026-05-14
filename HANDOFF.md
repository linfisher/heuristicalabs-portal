# Session Handoff — Resume Here

**Last updated:** 2026-05-14
**HEAD:** `claude/review-session-failure-3rrGx` → PR #4 open against `main`
**`main` HEAD:** `036ce7c` (PR #3 — extremePOV.ai card rebrand)
**Status:** Live homepage healthy. Admin grant cache bug fixed in PR #4, awaiting review/merge.

> Transient doc. Rewrite or delete once you pick up new work.

---

## What happened recently

### Session that produced this branch (`review-session-failure-3rrGx`)

User reported two admin-flow symptoms:

1. After approving a project access request via email, the admin page didn't show the new grant in Current Access.
2. Clicking **Grant Now** with project checkboxes ticked: button stuck ~2s, page scrolled to top, no visible change.

**Root cause:** four grant-mutation routes redirected back to `/portal/admin` without calling `revalidatePath` — Next's Router Cache re-served the stale page. Same rule the project-CRUD routes have followed since Apr 19 (CLAUDE.md critical rule #225782); the grant routes hadn't been brought in line.

**Fix (commit `a7ae456`):** added `revalidatePath("/portal/admin")` + `revalidatePath("/portal")` to:
- `app/portal/admin/direct-grant/route.ts`
- `app/portal/admin/extend/route.ts`
- `app/portal/admin/revoke/route.ts`
- `app/api/access/accept/route.ts`

`deny/route.ts` and the legacy email-invite `grant/route.ts` don't change grants — no fix needed.

PR #4: https://github.com/linfisher/heuristicalabs-portal/pull/4 (no CI configured on PRs; auto-deploy fires on push to `main` only).

### Session before that — the PR #1 incident

PR #1 (`claude/continue-from-handoff-PzhXA`, merged as `1dcb96d`) bundled three things into one PR: HiVibe Temple cushions copy + extremePOV.ai rebrand + tightened mid-feature spacing. Branch was based on stale `main` (~50 commits behind). 3-way merge resolved without textual conflicts but silently overwrote newer homepage structure — production homepage broke.

PR #2 (`cc9d224`) reverted PR #1 → restored `main` to `a6ec73e`.

PR #3 (`036ce7c`) re-applied **only** the extremePOV.ai card rebrand, scoped strictly to card content + the `.mid-feature-mcam` color swap. 4 files, +16/-12. Shipped fine.

### Still unshipped from PR #1's original scope

1. **HiVibe Temple cushions copy** — appending "Featuring inHarmony Vibroacoustic cushions." to the description (was commit `964b64d` inside the reverted PR).
2. **Tighter mid-feature spacing** — padding/gap/margin/aspect-ratio changes. PR #3 explicitly skipped these as too-broad surface area; revisit only if user wants it.

---

## Pro Forma viewer state

Unchanged since the previous handoff. See the original entry below for full detail.

`public/viewers/hivibe-proforma.html`, ~3,800 lines, single self-contained HTML loaded into a sandboxed iframe `allow-scripts allow-same-origin allow-modals allow-downloads` via `srcDoc`. Live at `https://heuristicalabs.com/portal/projects/hivibe-temple/proforma-dashboard`.

All migrations idempotent in `mergeDefaults`:
- `migrated_arena_v1` · `migrated_hvt_variants_v1` · `migrated_magtile_floor_rename_v1` · `migrated_hvt_mat_a_rename_v1` · `migrated_bundle_order_v1` · `migrated_amp_1000w_v1` · `bundle_margin_v2` · `magtile_kit_price_v3`

Saved scenarios in Upstash Redis under `proforma-scenarios:<userId>` (admin-only). Auto-save in `localStorage[hivibe_proforma_v5]`.

---

## Parity check

- Local working tree at branch tip `a7ae456` (HEAD of `claude/review-session-failure-3rrGx`).
- `origin/main` at `036ce7c`. PR #4 not yet merged → VPS production is one commit behind the fix.
- VPS auto-deploys on push to `main` via `.github/workflows/deploy.yml`. Merging PR #4 ships the fix.
- `.registry.json`: 5 active projects (`1-to-1-bet-matching`, `akasha-ai`, `hivibe-temple`, `no-limit-chess`, `sky-combat-aces-video-factory`). Synced via predev hook.

---

## Open data-side items (not bugs)

- **Cushion `first_run_units` short**: bundle demand for 3 Mat variants × 9 cushions × first_run=3 = 81. Current `first_run_units = 36` → ~45 short (visible in Inventory Allocation table). Bump cushion first_run, or trim Mat variant first_run.
- **bb_b first_run slightly short**: HVT MagTile Version + Mat B both consume bb_b.
- **1000W Amplifier defaults are placeholders**: $500 cost, $975 sell, low solo volumes. Tune BOM as desired.

---

## Tiny loose ends

- `app/portal/admin/projects/page-rename/route.ts` — two stray `console.info`/`console.warn` lines from earlier debugging.
- `updateAssumptionDetail()` is confirmed-orphaned (delete candidate).
- `state.investments[].years` field retained on saved states for backwards-compat after amortization was killed.
- `portal.heuristicalabs.com` DNS A record in GoDaddy still exists but nothing answers — user to delete.

---

## Gotchas to remember

- **`revalidatePath` after every grant mutation** (newly enforced by PR #4). If you add another grant-touching route, call `revalidatePath("/portal/admin")` + `revalidatePath("/portal")` before the redirect.
- **`Referrer-Policy: strict-origin-when-cross-origin`** — DO NOT change to `no-referrer`. With `no-referrer`, same-origin form POSTs send `Origin: null` and the CSRF check rejects every admin form.
- **Iframe sandbox is `allow-scripts allow-same-origin allow-modals allow-downloads`** on the proforma + share viewers. The old "allow-scripts only" rule still applies to PDF proxy iframes (PDFProxyIframe) — don't over-broaden them.
- **`window.print()` MUST be called synchronously** inside the click handler. Wrapping in `setTimeout` silently blocks the dialog.
- **Share-link revocation**: deleting `share-token:<jti>` in Upstash kills any in-flight links. Token TTL is set on creation.
- `registry.json` lives at `/var/www/portal-content/registry.json` on the VPS; predev sync pulls it to local `.registry.json`.
- `hello@heuristicalabs.com` is the verified Resend sender. Inbound unprovisioned. Use `ADMIN_EMAIL=linfisher@gmail.com` for actual delivery.
- File-based downloads inside the proforma iframe are blocked by sandbox even with `allow-downloads` — EXPORT JSON uses copy-paste modal with `document.execCommand('copy')`.

---

## Lessons from the PR #1 incident

- **Rebase before branching off stale `main`.** PR #1's branch was 50 commits behind; the 3-way merge silently dropped newer homepage structure. If a dev branch is >5 commits behind, rebase or merge `main` in before opening the PR.
- **Keep PRs surgical.** Bundling 3 unrelated homepage changes (cushions copy + rebrand + spacing) made the breakage hard to isolate and forced a full revert. PR #3's content-only scope shipped cleanly.

---

## Read before touching anything

- `CLAUDE.md` (this directory) — full project architecture, env vars, critical rules
- This file — recent history + open items
- `/Users/linfisher/.claude/projects/-Users-linfisher-src-Heuristica/memory/MEMORY.md` — index + cross-project preferences

---

## Dev server

`preview_start` with config `portal` → localhost:8888. Predev hook auto-pulls VPS state on every start.
