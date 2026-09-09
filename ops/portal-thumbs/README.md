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

## tiresledz-ts100.png
Card image for `knucklehead-sledz` / page `tiresledz`. Side elevation from the
TS-100 sheet on the drawing's own blueprint ground. 850x1100 to match the
card's 8.5:11 box exactly, so it is never cropped. Carries no third-party
branding, unlike renders that include the wrecker (Matt's Off-Road Recovery).

Re-upload after a bundle swap:

    scp ops/portal-thumbs/tiresledz-ts100.png \
      heuristica-vps:/var/www/portal-content/projects/knucklehead-sledz/tiresledz/portal-thumb.png
