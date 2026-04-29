import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import type { ProjectGrant } from "@/lib/types"

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl

  // /portal/sign-in/** — always public
  if (pathname.startsWith("/portal/sign-in")) {
    return NextResponse.next()
  }

  // /portal/share/** — public, gated by share token in URL (route validates)
  if (pathname.startsWith("/portal/share/")) {
    return NextResponse.next()
  }

  // /api/access/** — public (routes validate their own tokens)
  if (pathname.startsWith("/api/access/")) {
    return NextResponse.next()
  }

  const { userId } = await auth()

  // /api/request/** — authenticated users only
  if (pathname.startsWith("/api/request/")) {
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // All /portal/** routes below require authentication
  if (pathname === "/portal" || pathname.startsWith("/portal/")) {
    if (!userId) {
      const returnUrl = req.nextUrl.pathname + req.nextUrl.search
      const signInUrl = new URL("/portal/sign-in", req.url)
      signInUrl.searchParams.set("redirect_url", returnUrl)
      return NextResponse.redirect(signInUrl)
    }

    // /portal/admin and /portal/admin/** — admin only
    if (pathname === "/portal/admin" || pathname.startsWith("/portal/admin/")) {
      const user = await clerkClient.users.getUser(userId)
      const email = user.primaryEmailAddress?.emailAddress ?? ""
      if (!isAdminEmail(email)) {
        const portalUrl = new URL("/portal", req.url)
        portalUrl.searchParams.set("error", "forbidden")
        return NextResponse.redirect(portalUrl)
      }
      return NextResponse.next()
    }

    // /portal/request-access — any authenticated user
    if (pathname.startsWith("/portal/request-access")) {
      return NextResponse.next()
    }

    // /portal/projects/{slug}/** — grant check (admin bypasses)
    // If already rendering the forbidden page (forbidden=1 param), pass through
    // to avoid an infinite redirect loop.
    const projectsMatch = pathname.match(/^\/portal\/projects\/([^/]+)/)
    if (projectsMatch) {
      const slug = projectsMatch[1]
      if (pathname === `/portal/projects/${slug}` && req.nextUrl.searchParams.get("forbidden") === "1") {
        return NextResponse.next()
      }
      const user = await clerkClient.users.getUser(userId)
      const email = user.primaryEmailAddress?.emailAddress ?? ""

      // Admin has access to all projects
      if (isAdminEmail(email)) {
        return NextResponse.next()
      }

      const grants = Array.isArray(user.publicMetadata?.projects)
        ? (user.publicMetadata.projects as ProjectGrant[])
        : []
      const validGrant = grants.find(
        (g) => g.slug === slug && g.expiresAt > Date.now()
      )
      if (!validGrant) {
        const forbiddenUrl = new URL(`/portal/projects/${slug}`, req.url)
        forbiddenUrl.searchParams.set("forbidden", "1")
        return NextResponse.redirect(forbiddenUrl)
      }
      return NextResponse.next()
    }

    // All other /portal/** routes — authenticated, pass through
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
