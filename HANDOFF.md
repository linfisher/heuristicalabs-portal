# Session Handoff — Resume Here

**Last updated:** 2026-09-14
**HEAD:** `be40bb4` (origin/main; deployed to the VPS by GitHub Actions)
**Status:** All work shipped and live. Nothing blocking.

---

## What landed 2026-09-14

### EDE X OMAN — two HTML pages posted, with thumbnails
- `ede-oman-fee-model` and `ede-oman-team-brief-slides`, `fileType: "html"`, files in
  `/var/www/portal-content/projects/ede-x-oman/` (no extension), rendered via `fetchPage` +
  `srcDoc` sandbox `allow-scripts`.
- The 2.5 MB `EDE-Oman-Team-Brief.html` (a Claude Design canvas export) was NOT posted: it
  loads React/Babel from unpkg, which the portal CSP blocks, so it renders blank. The Slides
  file carries the same 12 slides.
- **Gated HTML thumbnails (#10):** thumbnail lives beside the page as `<path>.thumb.png`;
  `thumbnailSrc` = `/api/proxy/<slug>/<path>?thumb=1` (same auth as the page). Masters in
  `ops/portal-thumbs/`. Lin's rule: every new portal file ships with a thumbnail.

### Admin grants — real errors logged (#10)
`grant_failed` was Upstash: the database was deleted by Upstash for inactivity (REST host
NXDOMAIN). direct-grant / extend / revoke now log the underlying error, and token cleanup
can no longer fail a grant Clerk already saved. The dashboard's "0 active" was genuine: all
90-day grants from May 14 expired Aug 12.

### Infinity access duration (#11, shipped in #12)
Stored as `expiresAt = NEVER_EXPIRES_AT` (9999-12-31) so every access gate is unchanged;
displays check `isNeverExpiring()`. Grants only (`GRANT_DURATIONS_MS`); share links and
emailed approval links keep `VALID_DURATIONS_MS`.

### Add User invites + admin copy on all email (#12)
Admin dashboard **+ Add User**: email + projects + duration → Clerk invitation with grants in
`publicMetadata` (`notify: false`) + branded `emails/user-invite.tsx` via Resend. Invitees land
on the new public `/portal/sign-up` (`<SignUp />` consumes `__clerk_ticket`). `sendEmail` BCCs
`ADMIN_EMAIL` on every email to someone else.

### Upstash retired — on-disk store (#13)
`lib/kv.ts` replaces every Redis call (get, set ex/nx, del, incr, expire): in-memory in the
single PM2 fork process, persisted atomically to `/var/www/portal-content/kv.json`. Pro Forma
scenarios saved before 2026-09-14 were lost with the Upstash database.

### Projects page redesign (#14)
`/portal` cards rotate three brand-pink tones (tinted background, top edge, pink document
chip, matching Open Project button); quieter opt-in admin bar (`variant="quiet"`) on those
cards only. Approved by Lin from a rendered mockup. Third tone changed from light pink to deep pink
`#6E0A3F` in #16 at Lin's request.

### Admin dashboard saves in place (#16)
No more redirect-to-top flash messages. Grant Access autosaves (tick grants, untick revokes,
length change re-applies; Grant Now removed). Set to chips, Revoke, Notify, Archive, Restore
and Add User show a visible press → working → done/failed state and call `router.refresh()`.
Admin routes answer `Accept: application/json` with JSON (`lib/admin-respond.ts`).

### Invited users are editable rows + review fixes + zero-downtime deploy (#17)
- Pending invitations get a full user row with a **Not signed in yet** tag. Their access lives
  in the store under `invite-grants:<email>` (addressed as `invite:<email>`) and is applied to
  their Clerk account on first `/portal` visit (`lib/pending-grants.ts`).
- From a read-only code review: Resend Invite creates before revoking; per-user grant lock
  (`lib/grant-lock.ts`); `lib/kv.ts` state on `globalThis`, commit-after-write, copy-on-get
  (18 standalone tests); row open state survives saves.
- **Deploy** now builds into `.next-build` beside the live app, reinstalls only when
  `package-lock.json` changes, swaps, restarts with PM2 timestamps, health-checks `:3001` and
  rolls back on failure. First run (#17) added zero "Cannot find module" errors.
- `@upstash/redis` removed.

---

## Open items

- **Robot deploy key vs the SCA rule.** `github-actions-deploy` is authorized on the VPS
  (re-added 2026-09-09 for this repo's auto-deploy). The SCA project removed robot keys on
  2026-07-08 so only Lin's Mac deploys. Lin has not decided keep vs remove.
- **New Mac.** The VPS authorizes `linfisher@MBPro-M5Ultra` (rotated 2026-09-12). SCA's
  `CLAUDE.md` still names the old M1 key; a separate SCA session was started to fix that doc.
- **Add User:** first real invite sent 2026-09-15 02:55Z (ameenthemachine@gmail.com, Infinity,
  3 projects) and pending in Clerk. Not yet accepted, so the `/portal/sign-up` ticket flow and
  first-visit grant claim are unproven in production — watch `[invite]` lines in PM2 logs.
- **Admin dashboard not browser-tested by Claude** (needs Lin's login). Autosave, invited rows
  and button states were verified by typecheck, build and code review only.
- **Pushing workflow changes:** the `gh` token on the M5 lacks `workflow` scope; push branches
  that touch `.github/workflows/` over SSH (`git push git@github.com:linfisher/heuristicalabs-portal.git <branch>`).
- **Merging from Claude sessions:** the auto-mode safety classifier refuses `gh pr merge` as
  "Merge Without Review" unless a written review of the diff appears right before the merge.
  Pattern that works: CI green → write the review → comment it on the PR → merge on Lin's go.
- **Registry edits made directly on the VPS need `pm2 restart portal`.** `lib/registry.ts`
  caches the file in memory and never re-reads it; an admin action before the restart would
  also overwrite the edit from the stale cache.
- **Homepage redesign parked** on `wip/homepage-halo-oneuforia` (`db39db9`, rebased onto
  `bda9564` on 2026-09-10). It now keeps the extremePOV.ai chip alongside HALO, so the old
  conflict note in its commit message looks resolved. Not deployed; needs Lin's review.
- **Upstream TireSledz text defect** (annotation labels drawn twice) — their repo, cosmetic.

---

## TireSledz bundle refresh

    gh run download <run-id> --repo linfisher/TireSledz --name tiresledz-bundle --dir /tmp/ts
    unzip -q /tmp/ts/*.zip -d /tmp/ts/out
    rsync -az --delete /tmp/ts/out/ heuristica-vps:/var/www/portal-content/projects/knucklehead-sledz/tiresledz/
    scp ops/portal-thumbs/tiresledz-ts200.png heuristica-vps:/var/www/portal-content/projects/knucklehead-sledz/tiresledz/portal-thumb.png

The last line is required: `--delete` wipes the card thumbnail.

---

## Read before touching anything

- `CLAUDE.md` (this directory) — architecture, env vars, critical rules
- `/Users/linfisher/.claude/projects/-Users-linfisher-SRC-Heuristica/memory/MEMORY.md` — index
  of Lin's working-style rules (executive-summary replies, do it don't ask, thumbnail on every
  file, copy Lin on every email). Read them at session start.
