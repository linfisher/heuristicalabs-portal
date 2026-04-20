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
  const expected = appUrl.replace(/\/$/, "")

  const origin = request.headers.get("origin")
  if (origin) {
    return origin.replace(/\/$/, "") === expected
  }

  const referer = request.headers.get("referer")
  if (referer) {
    try {
      return new URL(referer).origin === expected
    } catch {
      return false
    }
  }

  return false
}
