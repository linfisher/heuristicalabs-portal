import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import React from "react"
import { clerkClient } from "@/lib/clerk"
import { getProject } from "@/lib/projects"
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

  let targetEmail: string | undefined
  let targetName: string | undefined
  const expiresAt = Date.now() + durationMs

  try {
    const targetUser = await clerkClient.users.getUser(targetUserId)
    targetEmail = targetUser.primaryEmailAddress?.emailAddress
    targetName =
      [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") ||
      targetEmail?.split("@")[0] ||
      "there"

    const currentGrants =
      (targetUser.publicMetadata?.projects as ProjectGrant[] | undefined) ?? []

    const updated: ProjectGrant[] = [
      ...currentGrants.filter((g) => g.slug !== projectSlug),
      { slug: projectSlug, expiresAt },
    ]

    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { projects: updated },
    })
  } catch {
    redirect("/portal/admin?error=extend_failed")
  }

  // Background notification — best effort, never blocks the redirect
  if (targetEmail) {
    const project = getProject(projectSlug)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://heuristicalabs.com"
    if (project) {
      try {
        await sendEmail({
          to: targetEmail,
          subject: confirmationSubject(project.name),
          react: React.createElement(GrantConfirmationEmail, {
            userName: targetName ?? "there",
            projectName: project.name,
            expiresAt,
            projectUrl: `${appUrl}/portal/projects/${projectSlug}`,
          }),
        })
      } catch (err) {
        console.error("[extend] notification email failed", { projectSlug, targetEmail, err })
      }
    }
  }

  console.info("[admin]", {
    action: "extend",
    adminUserId: userId,
    targetUserId,
    projectSlug,
    durationMs,
    timestamp: new Date().toISOString(),
  })

  redirect("/portal/admin?extended=1")
}
