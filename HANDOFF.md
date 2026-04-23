# Session Handoff — Resume Here

**Last updated:** 2026-04-23
**Status:** Deploy pipeline SHIPPED. CAD viewer upload IN PROGRESS (blocked, see below).

> This doc is transient — delete it once you're back on track.

---

## ✅ What's already done (don't redo)

### Automated deploy pipeline (GitHub Actions → VPS)

Every push to `main` now auto-deploys to the VPS. No SSH, no PM2 commands, nothing manual.

- **Workflow**: `.github/workflows/deploy.yml` — triggers on push to `main`, SSHes in, runs `git reset --hard origin/main && npm ci && npm run build && pm2 restart portal`
- **One-time setup doc**: `DEPLOY_SETUP.md` at repo root (for future reference / disaster recovery)
- **GitHub Secrets configured** in the repo:
  - `VPS_HOST` = `160.153.189.109`
  - `VPS_USER` = `wildcard`
  - `VPS_SSH_KEY` = private half of an `ed25519` deploy key (public half is in `~/.ssh/authorized_keys` on the VPS, labeled `github-actions-deploy`)
- **Proven working**: run #2 (`2405782`) went green; site live at https://heuristicalabs.com

**Gotcha already fixed**: first run failed with `remote username contains invalid characters` because a pasted secret had a trailing newline. Workflow now strips whitespace from all secrets before use. Keep that in if refactoring.

---

## 🟡 What's in progress — the CAD viewer upload

### The ask (from the user)

Upload an interactive 3D HTML CAD viewer to the portal so it appears as a page inside an existing project.

- **Project**: User created a project titled **"12x12 HiVibe MagTile CAD Demo"** via the admin UI on production (so the slug lives in the VPS registry at `/var/www/portal-content/registry.json`, NOT in `lib/registry.ts` seed data).
- **Page name** (what appears on the portal): `12x12 HiVibe MagTile CAD Demo` — same as the project name.
- **Thumbnail**: user wants it auto-generated, showing the viewer at the **largest** grid setting (the viewer has 4-tile / 9-tile / **16-tile (4×4)** buttons — 16 is the target).

### The HTML source

Full HTML was pasted in the prior session. It's a Three.js-based interactive viewer with:
- 4×4 grid of v19 MagTile models
- Spread slider, view presets (Iso / Top / Seam / Corner / Center / Thru-Port)
- Tile count selector: 4 / 9 / **16** (default is 4 — need to click the "16" button for the thumbnail shot)
- Loads Three.js from `cdnjs.cloudflare.com` + `cdn.jsdelivr.net` via importmap

The complete HTML is in the prior conversation — search for `<title>HiVibe Floor Assembly — 4 Tiles · Rev 1</title>`. Paste it verbatim when resuming.

### What the portal expects for an interactive HTML viewer

Not a drag-drop upload. The admin UI's file-upload flow assigns `fileType: "file"` to `.html` uploads, which renders as a generic download button (wrong).

For an **interactive iframe viewer**, the registry entry needs `fileType: "viewer"` + `viewerSrc: "/viewers/<filename>.html"` pointing to a file committed in the repo's `public/viewers/` directory. See the existing pattern:

- `lib/registry.ts` → project `hivibe-magtiles` → page `floor-tile-viewer` (fileType `viewer`, viewerSrc `/viewers/floor_tile_viewer.html`)
- Actual file: `public/viewers/floor_tile_viewer.html`
- Thumbnail: `public/thumbnails/floor-tile-viewer.png`
- Server-side renderer: `app/portal/projects/[slug]/[...path]/page.tsx` — the `if (page.fileType === "viewer" && page.viewerSrc)` branch reads the file from `public/` and injects it into a sandboxed iframe via `srcDoc`.

### Where we got stuck

1. **Saving the HTML** — straightforward. Write it to `public/viewers/12x12-hivibe-magtile-cad-demo.html` and commit.
2. **Generating the thumbnail** — requires a headless browser to screenshot the rendered viewer at the 16-tile grid. This sandbox has no chromium/chrome installed (`which chromium google-chrome chrome` all empty). Options:
   - (a) Install puppeteer — auto-downloads ~170 MB chromium. Workable if the sandbox allows it.
   - (b) Do it on the VPS — the VPS is Ubuntu 24.04, probably has `chromium-browser` already or one `apt` away.
   - (c) Ask the user to take a screenshot manually and drop the PNG.
   - Recommendation: try (a) first with a tiny Node script; fall back to (b).
3. **Registering the page in the VPS registry** — the new project was admin-UI-created in production, so its slug + entry live in `/var/www/portal-content/registry.json` on the VPS. Need to either:
   - SSH in and patch that JSON file manually to add a new page entry to the right project (look up slug by name `12x12 HiVibe MagTile CAD Demo`), OR
   - Extend `lib/projects-registry.ts` with a helper, call it from a one-shot script, OR
   - Add a small admin route that creates `viewer`-type pages (future-proof but scope creep).

### TODO list (in progress state when session ended)

```
[in_progress] Save HTML to /public/viewers/12x12-hivibe-magtile-cad-demo.html
[pending]     Generate thumbnail at 4×4 tile layout via headless Chrome
[pending]     Commit HTML + thumbnail, push to main (auto-deploys)
[pending]     Help user patch VPS registry.json to register the viewer page
```

---

## 📋 Suggested path to resume

1. **Re-paste the HTML** from the prior session (it was in the user's message starting with `<!DOCTYPE html>` and titled `HiVibe Floor Assembly — 4 Tiles · Rev 1`). Save it to `public/viewers/12x12-hivibe-magtile-cad-demo.html`.

2. **Generate the thumbnail**. Quick plan:
   ```bash
   cd /home/user/heuristicalabs-portal
   npm install --save-dev puppeteer
   ```
   Then a Node script that:
   - Launches puppeteer at 1600×1000 viewport
   - Opens the local HTML via `file://`
   - Waits for Three.js scene to render (~2s)
   - Clicks the `button[data-count="16"]` to switch to 4×4
   - Waits another 1.5s for tiles to lay out + animations to settle
   - Screenshots to `public/thumbnails/12x12-hivibe-magtile-cad-demo.png` (target ~800×500 or similar aspect)
   - Uninstall puppeteer after (`npm uninstall puppeteer`) to keep repo light.

3. **Commit + push** to `main`:
   ```
   git add public/viewers/12x12-hivibe-magtile-cad-demo.html public/thumbnails/12x12-hivibe-magtile-cad-demo.png
   git commit -m "Add 12x12 HiVibe MagTile CAD Demo viewer + thumbnail"
   git push origin main
   ```
   Pipeline auto-deploys. Watch at https://github.com/linfisher/heuristicalabs-portal/actions

4. **Patch the VPS registry** to register the page. Need the user to run ONE ssh command (they already have SSH working: `ssh wildcard@160.153.189.109`). Rough shape:
   ```bash
   ssh wildcard@160.153.189.109
   sudo nano /var/www/portal-content/registry.json
   # Find the project entry with name "12x12 HiVibe MagTile CAD Demo"
   # Add to its "pages" array:
   #   {
   #     "path": "12x12-hivibe-magtile-cad-demo",
   #     "title": "12x12 HiVibe MagTile CAD Demo",
   #     "fileType": "viewer",
   #     "viewerSrc": "/viewers/12x12-hivibe-magtile-cad-demo.html",
   #     "thumbnailSrc": "/thumbnails/12x12-hivibe-magtile-cad-demo.png",
   #     "createdAt": <current unix ms>,
   #     "updatedAt": <current unix ms>
   #   }
   ```
   Better: script the patch with `jq` so there's no manual JSON editing risk. The user isn't a coder — be gentle, offer a single copy-paste command.

5. **Verify** by opening the project page on https://heuristicalabs.com/portal, logging in, and clicking the new viewer card. If the thumbnail is blank or the viewer doesn't load, check the iframe sandbox CSP (`next.config.mjs` has `script-src` for `cdn.jsdelivr.net` and `cdnjs.cloudflare.com` already — should work).

---

## 🧠 Project-specific things to remember

- **User is not a coder.** Give plain-English instructions, one step at a time, with copy-paste code blocks. Never dump git commands at them without explaining what happens.
- **Designated branch per harness rules**: `claude/setup-deploy-pipeline-pj7YV` was the original dev branch — already merged to `main`. For this continuation, ask before creating a new branch; the deploy pipeline just needs pushes to `main`.
- **VPS details**: `ssh wildcard@160.153.189.109`, app at `/var/www/portal`, registry at `/var/www/portal-content/registry.json`, PM2 process named `portal`.
- **Read `CLAUDE.md` first** — comprehensive project overview, especially:
  - File Uploads section (Phase 2) for how drag-drop works today
  - Registry section for how `registry.json` is the single source of truth
  - PDF Proxy Architecture for how auth-gated content streams from VPS
- **CSP + viewer HTML**: the existing `floor_tile_viewer.html` works fine, so the CSP is already permissive enough for Three.js viewers. Don't touch `next.config.mjs` unless the new viewer uses a different CDN.
