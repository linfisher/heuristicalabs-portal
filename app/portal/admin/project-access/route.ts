import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { deleteGrantGroup } from "@/lib/tokens"
import { GRANT_DURATIONS_MS, grantExpiresAt } from "@/lib/durations"
import { checkSameOrigin } from "@/lib/csrf"
import { withUserGrantLock } from "@/lib/grant-lock"
import { INVITE_TARGET_PREFIX, currentPendingGrants, setPendingGrants } from "@/lib/pending-grants"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Inline project-access mutations for the admin dashboard and the project page drawer.
// userId is a Clerk user id, or "invite:<email>" for someone invited who has
// not signed in yet (their grants are kept in the store until first visit).
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

  let durationMs = 0
  if (action === "extend") {
    durationMs = Number(body.durationMs)
    if (!Number.isFinite(durationMs) || !GRANT_DURATIONS_MS.has(durationMs)) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 })
    }
  } else if (action !== "revoke") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }

  function applyChange(current: ProjectGrant[]): ProjectGrant[] {
    const others = current.filter((g) => g.slug !== projectSlug)
    return action === "extend"
      ? [...others, { slug: projectSlug, expiresAt: grantExpiresAt(durationMs) }]
      : others
  }

  const invitedEmail = targetUserId.startsWith(INVITE_TARGET_PREFIX)
    ? targetUserId.slice(INVITE_TARGET_PREFIX.length).toLowerCase()
    : null

  try {
    await withUserGrantLock(targetUserId, async () => {
      if (invitedEmail) {
        const current = await currentPendingGrants(invitedEmail)
        if (current === null) throw new Error("No pending invite for this email")
        await setPendingGrants(invitedEmail, applyChange(current))
        return
      }
      const targetUser = await clerkClient.users.getUser(targetUserId)
      const current = (targetUser.publicMetadata?.projects as ProjectGrant[] | undefined) ?? []
      await clerkClient.users.updateUserMetadata(targetUserId, {
        publicMetadata: { projects: applyChange(current) },
      })
    })
  } catch (err) {
    console.error("[project-access] failed", { action, targetUserId, projectSlug, err })
    const message = err instanceof Error ? err.message : "Action failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  if (action === "revoke" && !invitedEmail) {
    // Access is already removed in Clerk; a store hiccup here must not report the revoke as failed.
    try {
      await deleteGrantGroup(targetUserId, projectSlug)
    } catch (err) {
      console.error("[project-access] access removed, token cleanup failed", { targetUserId, projectSlug, err })
    }
  }
  console.info("[admin]", {
    action,
    adminUserId: userId,
    targetUserId,
    projectSlug,
    ...(action === "extend" ? { durationMs } : {}),
    timestamp: new Date().toISOString(),
  })

  revalidatePath(`/portal/projects/${projectSlug}`)
  revalidatePath("/portal/admin")
  return NextResponse.json({ ok: true })
}
