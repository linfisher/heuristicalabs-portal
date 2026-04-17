import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { clerkClient } from "@/lib/clerk"
import { getProject } from "@/lib/projects"
import { deleteGrantGroup } from "@/lib/tokens"
import { isAdminEmail } from "@/lib/auth"
import { VALID_DURATIONS_MS } from "@/lib/durations"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const adminUser = await clerkClient.users.getUser(userId)
  if (!isAdminEmail(adminUser.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const origin = request.headers.get("origin")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!origin || !appUrl || origin.replace(/\/$/, "") !== appUrl.replace(/\/$/, "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const targetUserId = formData.get("userId") as string | null
  const projectSlug = formData.get("projectSlug") as string | null
  const durationMsRaw = formData.get("durationMs") as string | null

  if (!targetUserId || !projectSlug || !durationMsRaw) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const durationMs = parseInt(durationMsRaw, 10)
  if (Number.isNaN(durationMs) || !VALID_DURATIONS_MS.has(durationMs)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 })
  }

  if (!getProject(projectSlug)) {
    return NextResponse.json({ error: "Unknown project" }, { status: 400 })
  }

  try {
    const targetUser = await clerkClient.users.getUser(targetUserId)
    const currentGrants =
      (targetUser.publicMetadata?.projects as ProjectGrant[] | undefined) ?? []

    const newGrant: ProjectGrant = {
      slug: projectSlug,
      expiresAt: Date.now() + durationMs,
    }

    const updated = [
      ...currentGrants.filter((g) => g.slug !== projectSlug),
      newGrant,
    ]

    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { projects: updated },
    })

    // Invalidate any pending email-based grant tokens for this project
    await deleteGrantGroup(targetUserId, projectSlug)
  } catch {
    redirect("/portal/admin?error=grant_failed")
  }

  console.info("[admin]", {
    action: "direct-grant",
    adminUserId: userId,
    targetUserId,
    projectSlug,
    durationMs,
    timestamp: new Date().toISOString(),
  })

  redirect("/portal/admin?granted=1")
}
