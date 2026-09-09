# Session Handoff — Resume Here

**Last updated:** 2026-09-09
**HEAD:** `aec5343` (local = VPS = origin/main)
**Status:** All work shipped and live. Auto-deploy repaired and proven. Nothing blocking.

---

## What landed this session

### TireSledz engineering viewer — live behind the client wall
Project `knucklehead-sledz`, page `tiresledz`.
Live at `https://heuristicalabs.com/portal/projects/knucklehead-sledz/tiresledz`.

The deliverable is a 45-file static site (drawings, 3D model, recovery scene, notes), not a
single self-contained HTML file. The existing `viewer` type could not serve it, so a new
**`bundle`** page type was added — see the Bundle section in `CLAUDE.md`.

Content lives at `/var/www/portal-content/projects/knucklehead-sledz/tiresledz/` on the VPS.
Source of truth is `github.com/linfisher/TireSledz` (private, main). Their CI builds and
self-verifies the bundle and publishes it as artifact `tiresledz-bundle`.

**To refresh to a newer build:**

    gh run download <run-id> --repo linfisher/TireSledz --name tiresledz-bundle --dir /tmp/ts
    unzip -q /tmp/ts/*.zip -d /tmp/ts/out
    rsync -az --delete /tmp/ts/out/ heuristica-vps:/var/www/portal-content/projects/knucklehead-sledz/tiresledz/
    scp ops/portal-thumbs/tiresledz-ts100.png heuristica-vps:/var/www/portal-content/projects/knucklehead-sledz/tiresledz/portal-thumb.png

The last line is required: `--delete` wipes the card thumbnail, which is deliberately stored
inside the gated directory rather than in `public/`.

### GitHub Actions auto-deploy repaired
The `github-actions-deploy` key had been removed from the VPS `authorized_keys` (file last
modified Jul 8), so every push since failed at the SSH step and deploys were being done by
hand. A fresh ed25519 key was generated on the VPS, the public half authorized, and the
private half loaded into the `VPS_SSH_KEY` GitHub secret. The private key exists only in
GitHub — it was shredded from both the VPS and the local machine. Proven with three
consecutive green deploys (`0477b15`, `239f491`, `aec5343`).

### CSP fix — glTF embedded textures
`connect-src` did not allow `blob:`. three.js `GLTFLoader` unpacks textures embedded in a
`.glb` into object URLs and **fetches** them, and `fetch()` is governed by `connect-src`, not
`img-src`. Every embedded texture failed with `THREE.GLTFLoader: Couldn't load texture blob:`
and models rendered with base colour only — the TireSledz casualty appeared flat white. Only
reproduces behind the app CSP, so it looked fine on a plain static server.

---

## Open items

- **Homepage redesign is parked** on branch `wip/homepage-halo-oneuforia` (commit `3b809e9`,
  pushed). Adds HALO as the lead project, OneUforia Arthaus, jump chips, and "Why customers
  value it" blocks. **It conflicts with main:** the branch removes the Extreme Video Factory
  card to fold it into HALO as ePOV, while main rebranded that same card to extremePOV.ai in
  May. Needs Lin's call before merging.
- **Upstream TireSledz build has a text defect** — annotation labels render twice, the
  enlarged text over the old small text (`CASUALTY TIRE SECTION`, `PHANTOM = 19.10 MAX
  SECTION ENVELOPE`, the running-surface note). Reproduces from their own CI artifact, so it
  is upstream, not ours. Cosmetic; drawing geometry is correct.
- **Branch protection is being bypassed on pushes to main.** `main` requires the
  "Typecheck + build" check, and admin pushes have been going through with
  "Bypassed rule violations". Decide whether work should go via PR instead.
- **A stray `python -m http.server` is listening on port 8099** on the Mac, predating this
  session, serving a directory containing `projects/`. Not started by this session; left alone.

---

## Read before touching anything

- `CLAUDE.md` (this directory) — architecture, env vars, critical rules
- `/Users/linfisher/.claude/projects/-Users-linfisher-src-Heuristica/memory/MEMORY.md` — index
- The `feedback_*.md` files in that memory directory — working-style rules. Read them at
  session start, not later.
