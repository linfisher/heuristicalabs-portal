import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import React from "react"
import { clerkClient } from "@/lib/clerk"
import { getProject } from "@/lib/projects"
import { isAdminEmail } from "@/lib/auth"
import { checkSameOrigin } from "@/lib/csrf"
import { sendEmail } from "@/lib/email"
import AccessSummaryEmail, { subject as summarySubject } from "@/emails/access-summary"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const adminUser = await clerkClient.users.getUser(userId)
  if (!isAdminEmail(adminUser.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!checkSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const targetUserId = formData.get("userId") as string | null

  if (!targetUserId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  let targetEmail: string | undefined
  let targetName = "there"
  let liveGrants: ProjectGrant[] = []

  try {
    const targetUser = await clerkClient.users.getUser(targetUserId)
    targetEmail = targetUser.primaryEmailAddress?.emailAddress
    targetName =
      [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") ||
      targetEmail?.split("@")[0] ||
      "there"

    const now = Date.now()
    const grants =
      (targetUser.publicMetadata?.projects as ProjectGrant[] | undefined) ?? []
    liveGrants = grants.filter((g) => g.expiresAt > now)
  } catch {
    redirect("/portal/admin?error=notify_failed")
  }

  if (!targetEmail) {
    redirect("/portal/admin?error=notify_no_email")
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://heuristicalabs.com"
  const projects = liveGrants
    .map((g) => {
      const p = getProject(g.slug)
      if (!p) return null
      return {
        name: p.name,
        expiresAt: g.expiresAt,
        url: `${appUrl}/portal/projects/${g.slug}`,
      }
    })
    .filter((p): p is { name: string; expiresAt: number; url: string } => p !== null)

  try {
    await sendEmail({
      to: targetEmail,
      subject: summarySubject,
      react: React.createElement(AccessSummaryEmail, {
        userName: targetName,
        projects,
        portalUrl: `${appUrl}/portal`,
      }),
    })
  } catch (err) {
    console.error("[notify] email send failed", { targetEmail, err })
    redirect("/portal/admin?error=notify_failed")
  }

  console.info("[admin]", {
    action: "notify",
    adminUserId: userId,
    targetUserId,
    projectCount: projects.length,
    timestamp: new Date().toISOString(),
  })

  revalidatePath("/portal/admin")
  redirect("/portal/admin?notified=1")
}
