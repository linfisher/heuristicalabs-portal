import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { clerkClient } from "@/lib/clerk"
import { getProject } from "@/lib/projects"
import { deleteGrantGroup } from "@/lib/tokens"
import { isAdminEmail } from "@/lib/auth"
import { VALID_DURATIONS_MS } from "@/lib/durations"
import { checkSameOrigin } from "@/lib/csrf"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const adminUser = await clerkClient.users.getUser(userId)
  const adminEmail = adminUser.primaryEmailAddress?.emailAddress
  if (!isAdminEmail(adminEmail)) {
    console.warn("[direct-grant] admin check failed", {
      userId,
      email: adminEmail,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    })
    return NextResponse.json({ error: "Forbidden: not admin" }, { status: 403 })
  }

  if (!checkSameOrigin(request)) {
    console.warn("[direct-grant] csrf check failed", {
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      host: request.headers.get("host"),
      xForwardedHost: request.headers.get("x-forwarded-host"),
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    })
    return NextResponse.json({ error: "Forbidden: csrf" }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const targetUserId = formData.get("userId") as string | null
  const projectSlugs = formData.getAll("projectSlug").filter((s): s is string => typeof s === "string" && s.length > 0)
  const durationMsRaw = formData.get("durationMs") as string | null

  if (!targetUserId || projectSlugs.length === 0 || !durationMsRaw) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const durationMs = parseInt(durationMsRaw, 10)
  if (Number.isNaN(durationMs) || !VALID_DURATIONS_MS.has(durationMs)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 })
  }

  for (const slug of projectSlugs) {
    if (!getProject(slug)) {
      return NextResponse.json({ error: `Unknown project: ${slug}` }, { status: 400 })
    }
  }

  try {
    const targetUser = await clerkClient.users.getUser(targetUserId)
    const currentGrants =
      (targetUser.publicMetadata?.projects as ProjectGrant[] | undefined) ?? []

    const expiresAt = Date.now() + durationMs
    const slugSet = new Set(projectSlugs)
    const updated: ProjectGrant[] = [
      ...currentGrants.filter((g) => !slugSet.has(g.slug)),
      ...projectSlugs.map((slug) => ({ slug, expiresAt })),
    ]

    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { projects: updated },
    })

    // Invalidate any pending email-based grant tokens for these projects
    for (const slug of projectSlugs) {
      await deleteGrantGroup(targetUserId, slug)
    }
  } catch {
    redirect("/portal/admin?error=grant_failed")
  }

  console.info("[admin]", {
    action: "direct-grant",
    adminUserId: userId,
    targetUserId,
    projectSlugs,
    durationMs,
    timestamp: new Date().toISOString(),
  })

  redirect("/portal/admin?granted=1")
}
