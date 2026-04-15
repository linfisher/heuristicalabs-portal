import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { clerkClient } from "@/lib/clerk"
import { deleteGrantGroup } from "@/lib/tokens"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Admin auth check
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const adminUser = await clerkClient.users.getUser(userId)
  if (adminUser.primaryEmailAddress?.emailAddress !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // CSRF: verify request originates from our app
  const origin = request.headers.get("origin")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  if (origin && appUrl && !origin.startsWith(appUrl)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Parse form data
  const formData = await request.formData()
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

  redirect("/portal/admin")
}
