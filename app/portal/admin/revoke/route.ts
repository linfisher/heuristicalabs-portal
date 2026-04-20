import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { clerkClient } from "@/lib/clerk"
import { deleteGrantGroup } from "@/lib/tokens"
import { isAdminEmail } from "@/lib/auth"
import { checkSameOrigin } from "@/lib/csrf"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  // Admin auth check
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const adminUser = await clerkClient.users.getUser(userId)
  if (!isAdminEmail(adminUser.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // CSRF: verify request originates from our app
  if (!checkSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Parse form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const targetUserId = formData.get("userId") as string | null
  const projectSlug = formData.get("projectSlug") as string | null

  if (!targetUserId || !projectSlug) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Fetch target user and update grants
  try {
    const targetUser = await clerkClient.users.getUser(targetUserId)
    const currentGrants =
      (targetUser.publicMetadata?.projects as ProjectGrant[] | undefined) ?? []

    // Filter out the revoked project
    const remaining = currentGrants.filter((g) => g.slug !== projectSlug)

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { projects: remaining },
    })
  } catch {
    redirect("/portal/admin?error=revoke_failed")
  }

  // Invalidate any outstanding invite tokens for this user+project
  await deleteGrantGroup(targetUserId, projectSlug)

  console.info("[admin]", {
    action: "revoke",
    adminUserId: userId,
    targetUserId,
    projectSlug,
    timestamp: new Date().toISOString(),
  })

  redirect("/portal/admin")
}
