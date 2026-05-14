# Session Handoff — Resume Here

**Last updated:** 2026-05-14 (post PR #8 merge — favicon + CI)
**`main` HEAD:** see `git log -1 origin/main` — should be the PR #8 merge commit
**Status:** Favicon shipped. CI gate live. Branch protection enforces it. Nothing blocking.

> Transient doc. Rewrite or delete once you pick up new work.

---

## What happened recently

### PR #8 — favicon + CI gate

Two unrelated bits shipped together because they hit the repo in the same session:

1. **Favicon** — `app/icon.tsx` (32×32) + `app/apple-icon.tsx` (180×180). Both generated at edge runtime via `next/og`. Black background, pink "H" using brand pink `#E8147F` (same accent as the OG card). Next 14 App Router picks these up automatically and serves them at `/icon` and `/apple-icon`. No binary assets.
2. **CI workflow** — `.github/workflows/ci.yml` runs `tsc --noEmit` + `next build` on every PR against `main`. Uses placeholder env values so module-load-time reads don't crash; real secrets stay on the VPS / Vercel. **Marked required in branch protection** — `main` cannot accept a red merge, and stale branches force a rebase first (the PR #1 incident specifically).

### PR #5 — admin UX polish (already on `main` before PR #8)

- Chip-level state confirmation when extending grants
- Opt-in user notifications (Notify toggle on grant)
- Archive Users flow (never delete — admin can restore)
- Branded OG share card (`app/opengraph-image.tsx`) with brand-pink/gold/green accent gradient — source of truth for the favicon color too

### PR #4 — admin grant cache + UX (the one before that)

Already documented in the old HANDOFF.md. Two-part fix:
- `revalidatePath` after every grant mutation (direct-grant, extend, revoke, accept) so Router Cache stops serving stale grants
- Grant Access checkboxes pre-check every project the user already has access to
- `force-dynamic` on `/portal/admin` and `/portal`

---

## CI gate — how it actually works

- `.github/workflows/ci.yml` runs on every PR to `main` and on `main` itself.
- Two checks: `npx tsc --noEmit`, then `npm run build`.
- Branch protection rule on `main` (classic UI, not ruleset) requires `Typecheck + build` to pass before merge AND requires the PR branch to be up-to-date with `main`.
- If you ever rename the workflow job, you must also rename the required check in branch protection — otherwise the gate goes inert.
- Vercel preview deploys still run independently — a second free build check on every PR.

---

## Pro Forma viewer state

Unchanged. See previous handoffs / `CLAUDE.md` for full detail.

`public/viewers/hivibe-proforma.html`, ~3,800 lines, single self-contained HTML loaded into a sandboxed iframe `allow-scripts allow-same-origin allow-modals allow-downloads` via `srcDoc`. Live at `https://heuristicalabs.com/portal/projects/hivibe-temple/proforma-dashboard`. All migrations idempotent in `mergeDefaults`. Saved scenarios in Upstash Redis under `proforma-scenarios:<userId>` (admin-only).

---

## Open data-side items (not bugs)

- Cushion `first_run_units` short (~45 units): bundle demand for 3 Mat variants × 9 cushions × first_run=3 = 81; current first_run = 36
- `bb_b` first_run slightly short — HVT MagTile Version + Mat B both consume it
- 1000W Amplifier defaults are placeholders ($500 cost, $975 sell)

---

## Tiny loose ends

- `app/portal/admin/projects/page-rename/route.ts` — two stray `console.info`/`console.warn` lines from earlier debugging
- `updateAssumptionDetail()` is confirmed-orphaned (delete candidate)
- `state.investments[].years` field retained on saved states for backwards-compat
- `portal.heuristicalabs.com` DNS A record in GoDaddy still exists but nothing answers — user to delete

---

## Gotchas to remember

- **`revalidatePath` after every grant mutation** — required for the admin UI to refresh
- **`Referrer-Policy: strict-origin-when-cross-origin`** — never `no-referrer` (breaks CSRF check on same-origin POSTs)
- **Iframe sandbox is context-dependent** — `srcDoc` interactive viewers get `allow-scripts allow-same-origin allow-modals allow-downloads`; PDF proxy iframes stay `allow-scripts` only
- **`window.print()` must be synchronous** in the click handler — `setTimeout` silently blocks
- **Share-link revocation** — delete `share-token:<jti>` in Upstash
- **`registry.json` source of truth** is `/var/www/portal-content/registry.json` on the VPS; predev sync pulls it to local `.registry.json`
- **Resend sender** is `hello@heuristicalabs.com`; admin delivery via `ADMIN_EMAIL=linfisher@gmail.com`
- **CI placeholder envs** in `.github/workflows/ci.yml` are intentionally fake; never paste real secrets there

---

## Read before touching anything

- `CLAUDE.md` — full architecture, env vars, critical rules
- This file — recent history + open items
- `DEPLOY_SETUP.md` — VPS auto-deploy one-time setup

---

## Dev server

`preview_start` with config `portal` → localhost:8888. Predev hook auto-pulls VPS state on every start.
