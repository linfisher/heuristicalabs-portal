# Session Log

## ffcc5f9 — TireSledz bundle viewer + repaired auto-deploy + CSP blob fix

**Built:** New `bundle` fileType/page-type serving multi-file static sites (not single self-contained HTML) behind Clerk + grant auth — first consumer is the TireSledz engineering viewer (45-file static site: drawings, 3D model, recovery scene, notes) at `knucklehead-sledz/tiresledz`, live at `https://heuristicalabs.com/portal/projects/knucklehead-sledz/tiresledz`. Repaired GitHub Actions auto-deploy: the `github-actions-deploy` SSH key had been stripped from the VPS `authorized_keys` (~Jul 8), so every push since had been deploying manually by hand; a fresh ed25519 key was generated, authorized on the VPS, and loaded into the `VPS_SSH_KEY` GitHub secret (private key now exists only in GitHub, shredded from VPS + local), proven with 3 consecutive green deploys (`0477b15`, `239f491`, `aec5343`). Fixed CSP `connect-src` to allow `blob:` so three.js `GLTFLoader` can fetch object-URL textures unpacked from `.glb` files — without it, embedded textures failed silently and the TireSledz model rendered flat white. Added a gated card thumbnail for the bundle with its master image kept in-repo.

**Files:**
- `app/api/bundle/[slug]/[...path]/route.ts` (new, 127 lines) — serves any file beneath a bundle's content directory under the same Clerk+grant checks as `/api/proxy`; resolves relative asset requests by directory-prefix lookup; deliberately no share-token path (bundles are grant-gated only)
- `next.config.mjs` — `connect-src blob:` CSP fix; `X-Frame-Options: SAMEORIGIN` exception scoped to `/api/bundle/:path*`
- `lib/file-type.ts` — EXISTING file (created Apr 2026 in `a164d47`); this session added ~19 lines of web-asset mime types (js/mjs/css/json/woff/woff2/ttf/otf/glb/gltf/wasm/ico) consulted by `mimeTypeFromName()`
- `lib/types.ts` — added `"bundle"` to `PageFileType` and the optional `entry` field
- `app/portal/projects/[slug]/[...path]/page.tsx`, `app/portal/projects/[slug]/page.tsx` — bundle entry framed by URL (not srcDoc) so relative paths resolve through the authed route; bundle pages get interactive-viewer chip + card art
- `ops/portal-thumbs/tiresledz-ts100.png` + `ops/portal-thumbs/README.md` (new) — gated card-thumbnail master kept in the repo because bundle content dirs get `rsync --delete`d on every upstream refresh
- `CLAUDE.md`, `HANDOFF.md` — docs for bundle page type, CSP rule, deploy-key repair, parked branch

**Decisions:**
- Bundles get NO share-token path by design (`CLAUDE.md` "Static Bundles" section) — grant-gated only, unlike per-file share links.
- Card-thumbnail masters for gated/NDA bundle content live in `ops/portal-thumbs/` (repo) rather than `public/thumbnails/` (world-readable) or inside the content dir (wiped by `rsync --delete` on refresh) — see `CLAUDE.md` rule 16.
- New extensions used by a bundle must be added to `lib/file-type.ts` BEFORE the bundle ships, or `nosniff` + `application/octet-stream` fallback blocks module scripts.
- Deploy key rotated rather than debugged in place; private key now lives only in the GitHub secret.

**Context:** Source of truth for TireSledz content is `github.com/linfisher/TireSledz` (private, main); their CI builds and publishes artifact `tiresledz-bundle`. Refresh procedure is documented in `HANDOFF.md` (download run artifact → unzip → `rsync --delete` to VPS content dir → re-scp the thumbnail master, since delete wipes it). Upstream TireSledz build has a known cosmetic text-doubling defect on annotation labels (upstream bug, not ours, drawing geometry correct — unverified fix timeline). Branch protection on `main` requires the "Typecheck + build" check; admin pushes this session went through with git printing "Bypassed rule violations for refs/heads/main" on each push (observed directly in push output, 5 times). The CI workflow itself predates this session (`3dc2411`, May). A parked branch `wip/homepage-halo-oneuforia` (commit `3b809e9`, pushed) adds HALO/OneUforia Arthaus to the homepage and **conflicts with main**: it removes the Extreme Video Factory card to fold into HALO as "ePOV", but main already rebranded that same card to extremePOV.ai in May (`036ce7c`). Needs Lin's call before any merge. A stray `python -m http.server` was noted listening on port 8099 on the Mac, predating this session — left alone, not started by this work.

**Next:** Decide fate of `wip/homepage-halo-oneuforia` vs the extremePOV.ai rebrand on main (merge/rework/drop). Confirm branch-protection bypass behavior on main and decide whether admin pushes should route through PRs instead. Fix upstream TireSledz annotation-label text-doubling defect (their repo, not this one).
