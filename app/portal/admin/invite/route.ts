import { auth } from "@clerk/nextjs/server"
import { isClerkAPIResponseError } from "@clerk/nextjs/errors"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import React from "react"
import { clerkClient } from "@/lib/clerk"
import { getProject } from "@/lib/projects"
import { isAdminEmail } from "@/lib/auth"
import { GRANT_DURATIONS_MS, grantExpiresAt } from "@/lib/durations"
import { checkSameOrigin } from "@/lib/csrf"
import { sendEmail } from "@/lib/email"
import { respondDone, respondFail } from "@/lib/admin-respond"
import { setPendingGrants } from "@/lib/pending-grants"
import UserInviteEmail, { subject } from "@/emails/user-invite"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Admin "Add User": creates a Clerk invitation carrying the grants in its
// publicMetadata (copied onto the account when they sign up), then sends our
// own branded invite email through Resend so the admin copy always goes out.
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
  const email = ((formData.get("email") as string | null) ?? "").trim().toLowerCase()
  const projectSlugs = formData.getAll("projectSlug").filter((s): s is string => typeof s === "string" && s.length > 0)
  const durationMsRaw = formData.get("durationMs") as string | null

  if (!EMAIL_RE.test(email) || projectSlugs.length === 0 || !durationMsRaw) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const durationMs = parseInt(durationMsRaw, 10)
  if (Number.isNaN(durationMs) || !GRANT_DURATIONS_MS.has(durationMs)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 })
  }

  for (const slug of projectSlugs) {
    if (!getProject(slug)) {
      return NextResponse.json({ error: `Unknown project: ${slug}` }, { status: 400 })
    }
  }

  const expiresAt = grantExpiresAt(durationMs)
  const grants: ProjectGrant[] = projectSlugs.map((slug) => ({ slug, expiresAt }))
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://heuristicalabs.com"

  let inviteUrl = ""
  let alreadyExists = false
  try {
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { projects: grants },
      redirectUrl: `${appUrl}/portal/sign-up`,
      notify: false,
    })
    inviteUrl = invitation.url ?? ""
  } catch (err) {
    alreadyExists =
      isClerkAPIResponseError(err) &&
      err.errors.some((e) => e.code === "duplicate_record" || e.code === "form_identifier_exists")
    if (!alreadyExists) console.error("[invite] failed", { email, projectSlugs, err })
  }

  if (alreadyExists) {
    return respondFail(request, "invite_exists", 409)
  }
  if (!inviteUrl) {
    console.error("[invite] invitation created without a URL", { email })
    return respondFail(request, "invite_failed")
  }

  // The dashboard edits an invited person's access here until they sign in.
  try {
    await setPendingGrants(email, grants)
  } catch (err) {
    console.error("[invite] could not store pending grants (invitation still carries them)", { email, err })
  }

  try {
    await sendEmail({
      to: email,
      subject,
      replyTo: process.env.ADMIN_EMAIL,
      react: React.createElement(UserInviteEmail, {
        inviteUrl,
        projects: projectSlugs.map((slug) => ({ name: getProject(slug)?.name ?? slug, expiresAt })),
      }),
    })
  } catch (err) {
    console.error("[invite] invitation created, email failed", { email, err })
    revalidatePath("/portal/admin")
    return respondFail(request, "invite_email_failed", 502)
  }

  console.info("[admin]", {
    action: "invite",
    adminUserId: userId,
    email,
    projectSlugs,
    durationMs,
    timestamp: new Date().toISOString(),
  })

  revalidatePath("/portal/admin")
  return respondDone(request, "/portal/admin?invited=1")
}
