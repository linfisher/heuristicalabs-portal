import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import React from "react"
import { clerkClient } from "@/lib/clerk"
import { getProject } from "@/lib/projects"
import { grantsFromMetadata, isAdminEmail } from "@/lib/auth"
import { checkSameOrigin } from "@/lib/csrf"
import { sendEmail } from "@/lib/email"
import { getStoredPendingGrants } from "@/lib/pending-grants"
import UserInviteEmail, { subject } from "@/emails/user-invite"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Resend a pending invite. Clerk invitations cannot be re-sent, so a new one
// is created with the person's current grants, then the old one is revoked,
// then the branded invite email goes out again with the new link.
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

  let invitationId = ""
  try {
    const body = (await request.json()) as { invitationId?: unknown }
    invitationId = typeof body.invitationId === "string" ? body.invitationId : ""
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  if (!invitationId) {
    return NextResponse.json({ error: "Missing invitationId" }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://heuristicalabs.com"
  let email = ""

  try {
    const { data } = await clerkClient.invitations.getInvitationList({ status: "pending", limit: 100 })
    const old = data.find((i) => i.id === invitationId)
    if (!old) {
      return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
    }
    email = old.emailAddress
    const grants = (await getStoredPendingGrants(email)) ?? grantsFromMetadata(old.publicMetadata)

    // New invitation first (ignoreExisting lets it coexist with the old one),
    // old one revoked only after that succeeds — a failure never loses the invite.
    const fresh = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { projects: grants },
      redirectUrl: `${appUrl}/portal/sign-up`,
      notify: false,
      ignoreExisting: true,
    })
    if (!fresh.url) throw new Error("Invitation created without a URL")
    await clerkClient.invitations.revokeInvitation(old.id)

    await sendEmail({
      to: email,
      subject,
      replyTo: process.env.ADMIN_EMAIL,
      react: React.createElement(UserInviteEmail, {
        inviteUrl: fresh.url,
        projects: grants.map((g) => ({ name: getProject(g.slug)?.name ?? g.slug, expiresAt: g.expiresAt })),
      }),
    })
  } catch (err) {
    console.error("[invite-resend] failed", { invitationId, email, err })
    revalidatePath("/portal/admin")
    return NextResponse.json({ error: "resend_failed" }, { status: 500 })
  }

  console.info("[admin]", {
    action: "invite-resend",
    adminUserId: userId,
    email,
    timestamp: new Date().toISOString(),
  })

  revalidatePath("/portal/admin")
  return NextResponse.json({ ok: true })
}
