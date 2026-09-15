# Portal card thumbnails (masters)

Card images for portal pages whose artwork must NOT be publicly reachable.

`public/thumbnails/` is served by Next to anyone who knows the URL, which is
fine for our own projects but not for client work under NDA. Those images live
in the project's gated content directory on the VPS instead, and the page's
`thumbnailSrc` points at the authed `/api/bundle/...` route, so the card image
is only served to a signed-in user with a grant.

The masters are kept here because that content directory is overwritten
wholesale whenever the upstream team ships a new bundle (`rsync --delete`),
which deletes the thumbnail along with everything else.

## tiresledz-ts200.png
Card image for `knucklehead-sledz` / page `tiresledz`. Side elevation from the
TS-200 sheet on the drawing's own blueprint ground. (Replaced the TS-100 version
on 2026-09-10 when upstream archived the steel TS-100/TS-100T skid — the card must
not advertise a discontinued variant.) 850x1100 to match the
card's 8.5:11 box exactly, so it is never cropped. Carries no third-party
branding, unlike renders that include the wrecker (Matt's Off-Road Recovery).

Re-upload after a bundle swap:

    scp ops/portal-thumbs/tiresledz-ts200.png \
      heuristica-vps:/var/www/portal-content/projects/knucklehead-sledz/tiresledz/portal-thumb.png

## HTML pages (fileType "html")
A single-file HTML page's thumbnail sits beside it in the content directory as
`<path>.thumb.png`, and the page's `thumbnailSrc` is
`/api/proxy/<slug>/<path>?thumb=1` — served under the same auth as the page.
Every new portal page gets a thumbnail; none ship without one.

- `ede-oman-fee-model.png` — `ede-x-oman` / `ede-oman-fee-model`. Headless Chrome
  render of the page at 1275x1650, scaled to 850x1100.
- `ede-oman-team-brief-slides.png` — `ede-x-oman` / `ede-oman-team-brief-slides`.
  Title slide, cropped to the slide area, 850x1100.

Upload:

    scp ops/portal-thumbs/ede-oman-fee-model.png \
      heuristica-vps:/var/www/portal-content/projects/ede-x-oman/ede-oman-fee-model.thumb.png
    scp ops/portal-thumbs/ede-oman-team-brief-slides.png \
      heuristica-vps:/var/www/portal-content/projects/ede-x-oman/ede-oman-team-brief-slides.thumb.png
