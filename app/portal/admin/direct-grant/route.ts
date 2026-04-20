import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import React from "react"
import { clerkClient } from "@/lib/clerk"
import { getProject } from "@/lib/projects"
import { deleteGrantGroup } from "@/lib/tokens"
import { isAdminEmail } from "@/lib/auth"
import { VALID_DURATIONS_MS } from "@/lib/durations"
import { checkSameOrigin } from "@/lib/csrf"
import { sendEmail } from "@/lib/email"
import GrantConfirmationEmail, { subject as confirmationSubject } from "@/emails/grant-confirmation"
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

  let targetEmail: string | undefined
  let targetName: string | undefined
  let expiresAt = 0

  try {
    const targetUser = await clerkClient.users.getUser(targetUserId)
    targetEmail = targetUser.primaryEmailAddress?.emailAddress
    targetName =
      [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") ||
      targetEmail?.split("@")[0] ||
      "there"

    const currentGrants =
      (targetUser.publicMetadata?.projects as ProjectGrant[] | undefined) ?? []

    expiresAt = Date.now() + durationMs
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

  // Background notification email — one per project. Don't block the redirect
  // or unwind the grant if Resend flakes; just log and move on.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://heuristicalabs.com"
  if (targetEmail) {
    for (const slug of projectSlugs) {
      const project = getProject(slug)
      if (!project) continue
      try {
        await sendEmail({
          to: targetEmail,
          subject: confirmationSubject(project.name),
          react: React.createElement(GrantConfirmationEmail, {
            userName: targetName ?? "there",
            projectName: project.name,
            expiresAt,
            projectUrl: `${appUrl}/portal/projects/${slug}`,
          }),
        })
      } catch (err) {
        console.error("[direct-grant] notification email failed", { slug, targetEmail, err })
      }
    }
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
