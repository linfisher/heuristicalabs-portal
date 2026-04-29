import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { getProjectBySlug } from "@/lib/registry"
import { signShareToken } from "@/lib/share-tokens"
import { VALID_DURATIONS_MS } from "@/lib/durations"
import { checkSameOrigin } from "@/lib/csrf"

export const dynamic = "force-dynamic"

// POST /portal/admin/share-file
// Body: { slug, pagePath, durationMs }
// Returns: { url, expiresAt }
export async function POST(request: Request) {
  if (!checkSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await clerkClient.users.getUser(userId)
  const email = user.primaryEmailAddress?.emailAddress ?? ""
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: { slug?: unknown; pagePath?: unknown; durationMs?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { slug, pagePath, durationMs } = body
  if (typeof slug !== "string" || !slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 })
  }
  if (typeof pagePath !== "string" || !pagePath) {
    return NextResponse.json({ error: "Missing pagePath" }, { status: 400 })
  }
  if (typeof durationMs !== "number" || !VALID_DURATIONS_MS.has(durationMs as never)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 })
  }

  const project = getProjectBySlug(slug)
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }
  const page = project.pages.find((p) => p.path === pagePath)
  if (!page) {
    return NextResponse.json({ error: "File not found in project" }, { status: 404 })
  }

  const { token, expiresAt } = await signShareToken(slug, pagePath, durationMs)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
  const shareUrl = `${appUrl.replace(/\/+$/, "")}/portal/share/${token}`

  return NextResponse.json({ url: shareUrl, expiresAt })
}
