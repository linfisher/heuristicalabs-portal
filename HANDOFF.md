# Session Handoff — Resume Here

**Last updated:** 2026-05-14 (post PR #5 merge)
**`main` HEAD:** `c494fd3` (PR #5 — admin chip confirmation + Notify + Archive Users + OG share card)
**Status:** All current work shipped + live on VPS. Local and prod at parity. Nothing blocking.

> Transient doc. Rewrite or delete once you pick up new work.

---

## Session interrupted by screenshot-paste crash (2026-05-14)

The previous session ended abruptly when a small screenshot was pasted into Claude Code. **This is a client-side failure**, not a repo issue — the Claude Code CLI/web client OOMs or rejects large pasted images mid-stream. Nothing in this codebase caused it and nothing here can fix it. Workaround: drag-drop the image as a file, or upload it somewhere and link it. Branch `claude/fix-screenshot-crash-eVMhX` is empty and can be deleted.

Whatever you were about to ask after pasting that screenshot is lost — re-state it.

---

## What happened recently

### PR #5 — admin polish + archive + OG (MERGED as `c494fd3`)

Three commits squashed into one merge.

**`dd9d677` — Current Access shows only live grants**
- The admin Current Access list iterated over every grant on the user record, so expired entries still rendered with full Revoke + duration-chip controls. Both call sites in `app/portal/admin/page.tsx` swapped to the existing `liveGrants` filter (same one used for the header count + Grant Access pre-check).

**`46f64fc` — chip-level state confirmation + opt-in notifications**
1. Per-grant "Set to:" duration chips now highlight the chip whose bucket matches the grant's remaining time (smallest ms ≥ remaining renders solid green).
2. Grant Access duration dropdown defaults to the common bucket of all pre-checked live grants when they share one; otherwise 30 days. Used to always default to 24h regardless of state.
3. **Stripped auto-emails** from `/direct-grant`, `/extend`, `/revoke`. Every state change was previously emailing the user — 3 projects granted = 3 emails. Replaced with a single explicit **Notify User** button per user row that POSTs to the new `app/portal/admin/notify/route.ts` and sends ONE summary email listing all live grants + expiries + portal links.
4. New email template: `emails/access-summary.tsx`.
5. Flash banners consolidated — removed `?sent=1` + four verbose error variants. Now: `granted` / `extended` / `notified` (green success) + a single generic error banner that echoes the error code.
6. "How this works" panel rewritten to reflect the silent-update + explicit-notify flow.

> Token-flow emails (`/api/access/accept`, `/api/access/deny`) are untouched — those are user-initiated request flows where the recipient expects an email.

**`0508544` — archive users (never delete) + OG share card**

*Archive users:*
- New `app/portal/admin/users/archive/route.ts` + `restore/route.ts`. Sets/clears `privateMetadata.archivedAt` (Unix ms) on the Clerk user. The record + all historical grants are preserved forever — archiving only hides them from the active list, stats, and grant flows.
- Self-archive guarded.
- Admin page splits `users` → `activeUsers` / `archivedUsers`; only active users participate in the main flow.
- "Archive User" button on every active row; "Restore" per archived row.
- New collapsed "Archived Users" `<details>` section at the bottom, sorted by `archivedAt` desc. Mirrors the archived-projects pattern.
- Total Users stat tile + page header reflect active count; "N archived" suffix on header when archived users exist.
- New `?archived=1` / `?restored=1` flash banners.

*OG / social card:*
- `app/opengraph-image.tsx` — dynamic 1200×630 PNG via `next/og` `ImageResponse`. Dark radial gradient bg, HEURISTICA wordmark, tagline "Venture Studio · Bold Ideas · Real Products", top accent bar in brand colors (pink → gold → green), `heuristicalabs.com` URL bottom right.
- `app/layout.tsx` — `metadataBase` set to `NEXT_PUBLIC_APP_URL` (or apex fallback) so relative image URLs resolve. Default `openGraph` + `twitter` metadata for every route on the domain. Twitter clients fall back to `og:image` automatically when no `twitter-image` is specified.

PR #5 merged via `c494fd3`; VPS auto-deployed via `.github/workflows/deploy.yml` on push to `main`.

### PR #4 — admin grant cache + UX (`8717c31`, prior context)

Two bugs:
1. Four grant-mutation routes redirected back to `/portal/admin` without calling `revalidatePath` — Router Cache re-served stale pages. Same rule project-CRUD routes have followed since Apr 19 was extended to grant routes.
2. Grant Access checkboxes always rendered blank — successful grants looked invisible. Now pre-checked by slug match against live grants.

Shipped fixes: `a7ae456` (revalidatePath on direct-grant / extend / revoke / accept), `7d69439` (`force-dynamic` on `/portal/admin` + `/portal`), `bf00f13` (pre-checked boxes), `315f97c` (docs).

### Earlier — PR #1 incident (still relevant context)

PR #1 merged a stale-base 3-way merge that silently overwrote homepage structure. PR #2 reverted it. PR #3 re-applied only the extremePOV.ai rebrand cleanly. **Two items from PR #1's original scope are still unshipped:**
1. HiVibe Temple cushions copy — append "Featuring inHarmony Vibroacoustic cushions." to description (was `964b64d`).
2. Tighter mid-feature spacing — padding/gap/margin/aspect-ratio. PR #3 skipped these as too-broad; revisit only if user wants it.

---

## Pro Forma viewer state

Unchanged since prior handoffs. `public/viewers/hivibe-proforma.html`, ~3,800 lines, single self-contained HTML loaded into a sandboxed iframe (`allow-scripts allow-same-origin allow-modals allow-downloads`) via `srcDoc`. Live at `https://heuristicalabs.com/portal/projects/hivibe-temple/proforma-dashboard`.

All migrations idempotent in `mergeDefaults`:
`migrated_arena_v1` · `migrated_hvt_variants_v1` · `migrated_magtile_floor_rename_v1` · `migrated_hvt_mat_a_rename_v1` · `migrated_bundle_order_v1` · `migrated_amp_1000w_v1` · `bundle_margin_v2` · `magtile_kit_price_v3`

Saved scenarios in Upstash Redis under `proforma-scenarios:<userId>` (admin-only). Auto-save in `localStorage[hivibe_proforma_v5]`.

---

## Parity check

- `origin/main` at `c494fd3` (PR #5 merge).
- VPS auto-deployed via `.github/workflows/deploy.yml` on push to `main`.
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
- `claude/fix-screenshot-crash-eVMhX` branch is empty after the paste-crash session — safe to delete locally + on origin.

---

## Gotchas to remember

- **Grant mutations are now silent** (PR #5). Use the "Notify User" button to send a single summary email after a batch of changes. Don't re-add per-route auto-emails to `direct-grant` / `extend` / `revoke`.
- **`revalidatePath` after every grant mutation** (PR #4). If you add another grant-touching route, call `revalidatePath("/portal/admin")` + `revalidatePath("/portal")` before the redirect.
- **Archived users are hidden, not deleted.** Use `user.privateMetadata.archivedAt` for the check. Never call `clerkClient.users.deleteUser` — grants and history must survive.
- **OG image is dynamic via `next/og`** at `/opengraph-image`. If you add per-route OG variants, drop another `opengraph-image.tsx` inside the route segment — Next.js handles cascade.
- **`Referrer-Policy: strict-origin-when-cross-origin`** — DO NOT change to `no-referrer`. Same-origin POSTs would send `Origin: null` and the CSRF check would reject every admin form.
- **Iframe sandbox is `allow-scripts allow-same-origin allow-modals allow-downloads`** on the proforma + share viewers. The old "allow-scripts only" rule still applies to PDF proxy iframes (PDFProxyIframe).
- **`window.print()` MUST be called synchronously** inside the click handler. Wrapping in `setTimeout` silently blocks the dialog.
- **Share-link revocation**: deleting `share-token:<jti>` in Upstash kills any in-flight links. Token TTL is set on creation.
- `registry.json` lives at `/var/www/portal-content/registry.json` on the VPS; predev sync pulls it to local `.registry.json`.
- `hello@heuristicalabs.com` is the verified Resend sender. Inbound unprovisioned. Use `ADMIN_EMAIL=linfisher@gmail.com` for actual delivery.
- File-based downloads inside the proforma iframe are blocked by sandbox even with `allow-downloads` — EXPORT JSON uses copy-paste modal with `document.execCommand('copy')`.

---

## Lessons from the PR #1 incident

- **Rebase before branching off stale `main`.** PR #1's branch was 50 commits behind; the 3-way merge silently dropped newer homepage structure. If a dev branch is >5 commits behind, rebase or merge `main` in before opening the PR.
- **Keep PRs surgical.** Bundling 3 unrelated homepage changes (cushions copy + rebrand + spacing) made the breakage hard to isolate and forced a full revert. PR #3's content-only scope shipped cleanly. PR #5 bundled 3 commits but each was within one admin-flow domain — that worked fine.

---

## Read before touching anything

- `CLAUDE.md` (this directory) — full project architecture, env vars, critical rules
- This file — recent history + open items
- `/Users/linfisher/.claude/projects/-Users-linfisher-src-Heuristica/memory/MEMORY.md` — index + cross-project preferences

---

## Dev server

`preview_start` with config `portal` → localhost:8888. Predev hook auto-pulls VPS state on every start.
