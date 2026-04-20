/**
 * Same-origin check for state-changing routes.
 *
 * Browsers send `Origin` for fetch() POST and most form submissions, but a
 * handful of cases (Safari for some same-origin form submits, navigation form
 * submits in older Chromiums, certain extension/proxy setups) omit it. When
 * Origin is absent, fall back to Referer — that header is sent for nearly all
 * navigations and form posts, so it provides a reliable second source.
 *
 * Either header MUST resolve to NEXT_PUBLIC_APP_URL's origin. If both are
 * missing or neither matches, the request is rejected.
 */
export function checkSameOrigin(request: Request): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return false

  const allowed = new Set<string>()
  try {
    const base = new URL(appUrl)
    allowed.add(base.origin)
    if (base.hostname.startsWith("www.")) {
      allowed.add(`${base.protocol}//${base.hostname.slice(4)}`)
    } else {
      allowed.add(`${base.protocol}//www.${base.hostname}`)
    }
  } catch {
    return false
  }

  const origin = request.headers.get("origin")
  if (origin) {
    return allowed.has(origin.replace(/\/$/, ""))
  }

  const referer = request.headers.get("referer")
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin)
    } catch {
      return false
    }
  }

  return false
}
