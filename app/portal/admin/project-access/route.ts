import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { deleteGrantGroup } from "@/lib/tokens"
import { VALID_DURATIONS_MS } from "@/lib/durations"
import { checkSameOrigin } from "@/lib/csrf"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Inline project-access mutations for the project page drawer.
// Returns JSON rather than redirecting.
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = await clerkClient.users.getUser(userId)
  if (!isAdminEmail(admin.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!checkSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const action = body.action
  const targetUserId = typeof body.userId === "string" ? body.userId : ""
  const projectSlug = typeof body.projectSlug === "string" ? body.projectSlug : ""
  if (!targetUserId || !projectSlug) {
    return NextResponse.json({ error: "userId and projectSlug required" }, { status: 400 })
  }

  try {
    const targetUser = await clerkClient.users.getUser(targetUserId)
    const current = (targetUser.publicMetadata?.projects as ProjectGrant[] | undefined) ?? []

    if (action === "revoke") {
      const remaining = current.filter((g) => g.slug !== projectSlug)
      await clerkClient.users.updateUserMetadata(targetUserId, {
        publicMetadata: { projects: remaining },
      })
      await deleteGrantGroup(targetUserId, projectSlug)
      console.info("[admin]", { action: "revoke", adminUserId: userId, targetUserId, projectSlug, timestamp: new Date().toISOString() })
    } else if (action === "extend") {
      const durationMs = Number(body.durationMs)
      if (!Number.isFinite(durationMs) || !VALID_DURATIONS_MS.has(durationMs)) {
        return NextResponse.json({ error: "Invalid duration" }, { status: 400 })
      }
      const updated: ProjectGrant = { slug: projectSlug, expiresAt: Date.now() + durationMs }
      const next = [...current.filter((g) => g.slug !== projectSlug), updated]
      await clerkClient.users.updateUserMetadata(targetUserId, {
        publicMetadata: { projects: next },
      })
      console.info("[admin]", { action: "extend", adminUserId: userId, targetUserId, projectSlug, durationMs, timestamp: new Date().toISOString() })
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    revalidatePath(`/portal/projects/${projectSlug}`)
    revalidatePath("/portal/admin")
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
