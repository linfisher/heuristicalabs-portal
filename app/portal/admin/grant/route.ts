import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { decodeJwt } from "jose"
import { clerkClient } from "@/lib/clerk"
import { signToken, storeGrantGroup, deleteGrantGroup } from "@/lib/tokens"
import { sendEmail } from "@/lib/email"
import { getProject } from "@/lib/projects"
import { isAdminEmail } from "@/lib/auth"
import { DURATIONS, TOKEN_LINK_TTL_MS } from "@/lib/durations"
import GrantInviteEmail, { subject } from "@/emails/grant-invite"
import React from "react"

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
  const origin = request.headers.get("origin")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!origin || !appUrl || origin.replace(/\/$/, "") !== appUrl.replace(/\/$/, "")) {
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
  const projectSlugs = formData.getAll("projectSlug").filter((s): s is string => typeof s === "string" && s.length > 0)

  if (!targetUserId || projectSlugs.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Validate all projects
  for (const slug of projectSlugs) {
    if (!getProject(slug)) {
      return NextResponse.json({ error: `Unknown project: ${slug}` }, { status: 400 })
    }
  }

  // Look up target user
  const targetUser = await clerkClient.users.getUser(targetUserId)
  const targetUserEmail = targetUser.primaryEmailAddress?.emailAddress
  if (!targetUserEmail) {
    return NextResponse.json({ error: "Target user has no email address" }, { status: 400 })
  }
  const targetUserName = targetUser.firstName ?? targetUserEmail

  // For each project: sign tokens, store group, send email
  for (const projectSlug of projectSlugs) {
    const project = getProject(projectSlug)
    if (!project) continue

    const tokenStrings = await Promise.all(
      DURATIONS.map((d) =>
        signToken(
          { type: "accept", userId: targetUserId, projectSlug, accessDurationMs: d.ms },
          TOKEN_LINK_TTL_MS
        )
      )
    )
    const denyTokenString = await signToken(
      { type: "deny", userId: targetUserId, projectSlug, accessDurationMs: 0 },
      TOKEN_LINK_TTL_MS
    )
    const acceptJtis = tokenStrings.map((t) => decodeJwt(t).jti as string)
    const denyJti = decodeJwt(denyTokenString).jti as string
    await storeGrantGroup(targetUserId, projectSlug, [...acceptJtis, denyJti], TOKEN_LINK_TTL_MS / 1000)

    const [h24Token, d3Token, d7Token, d30Token] = tokenStrings
    const tokens = {
      h24: `${appUrl}/api/access/accept?token=${h24Token}`,
      d3:  `${appUrl}/api/access/accept?token=${d3Token}`,
      d7:  `${appUrl}/api/access/accept?token=${d7Token}`,
      d30: `${appUrl}/api/access/accept?token=${d30Token}`,
    }
    const denyUrl = `${appUrl}/api/access/deny?token=${denyTokenString}`

    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL!,
        subject: subject(project.name),
        react: React.createElement(GrantInviteEmail, {
          userName: targetUserName,
          userEmail: targetUserEmail,
          projectName: project.name,
          projectDescription: project.description,
          tokens,
          denyUrl,
        }),
      })
    } catch {
      await deleteGrantGroup(targetUserId, projectSlug)
      redirect("/portal/admin?error=email_failed")
    }

    console.info("[admin]", {
      action: "grant",
      adminUserId: userId,
      targetUserId,
      projectSlug,
      timestamp: new Date().toISOString(),
    })
  }

  redirect("/portal/admin?sent=1")
}
