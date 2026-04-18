import { NextResponse } from "next/server"
import { verifyToken, deleteGrantGroup } from "@/lib/tokens"
import { clerkClient } from "@/lib/clerk"
import { sendEmail } from "@/lib/email"
import { getProject } from "@/lib/projects"
import { DURATIONS, VALID_DURATIONS_MS } from "@/lib/durations"
import type { ProjectGrant } from "@/lib/types"
import GrantConfirmationEmail from "@/emails/grant-confirmation"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function htmlPage(body: string, status: number = 200): NextResponse {
  return new NextResponse(`<html><body style="font-family: sans-serif; padding: 40px; background: #0a0a0a; color: #e5e7eb;">${body}</body></html>`, {
    status,
    headers: { "Content-Type": "text/html" },
  })
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return htmlPage("<h1 style=\"color: #E8147F;\">Error</h1><p>Missing token.</p>", 400)
  }

  let payload: Awaited<ReturnType<typeof verifyToken>>
  try {
    payload = await verifyToken(token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const status = msg.includes("already been used") || msg.includes("expired") ? 410 : 400
    return htmlPage(`<h1 style="color: #E8147F;">Error</h1><p>${escHtml(msg)}</p>`, status)
  }

  if (payload.type !== "accept") {
    return htmlPage("<h1 style=\"color: #E8147F;\">Error</h1><p>Invalid token type.</p>", 400)
  }

  if (!VALID_DURATIONS_MS.has(payload.accessDurationMs)) {
    return htmlPage("<h1 style=\"color: #E8147F;\">Error</h1><p>Invalid duration.</p>", 400)
  }

  let user: Awaited<ReturnType<typeof clerkClient.users.getUser>>
  try {
    user = await clerkClient.users.getUser(payload.userId)
  } catch (err) {
    console.error("[accept] failed to load user from Clerk", err)
    return htmlPage("<h1 style=\"color: #E8147F;\">Error</h1><p>Failed to load user. Please try again later or contact support.</p>", 500)
  }

  const existingGrants = (user.publicMetadata?.projects ?? []) as ProjectGrant[]
  const filtered = existingGrants.filter((g) => g.slug !== payload.projectSlug)
  const expiresAt = Date.now() + payload.accessDurationMs
  const updatedGrants: ProjectGrant[] = [...filtered, { slug: payload.projectSlug, expiresAt }]

  await deleteGrantGroup(payload.userId, payload.projectSlug)

  try {
    await clerkClient.users.updateUserMetadata(payload.userId, {
      publicMetadata: { projects: updatedGrants },
    })
  } catch {
    return htmlPage("<h1 style=\"color: #E8147F;\">Error</h1><p>Failed to apply access grant. Please try again later or contact support.</p>", 500)
  }

  const projectName = getProject(payload.projectSlug)?.name ?? payload.projectSlug
  const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/projects/${payload.projectSlug}?welcome=1`
  const userEmail = user.primaryEmailAddress?.emailAddress

  if (userEmail) {
    try {
      await sendEmail({
        to: userEmail,
        subject: `You now have access to ${projectName}`,
        react: GrantConfirmationEmail({
          userName: user.firstName ?? userEmail,
          projectName,
          expiresAt,
          projectUrl,
        }),
      })
    } catch (err) {
      console.error("[accept] failed to send confirmation email", err)
    }
  } else {
    console.error("[accept] user has no primary email; skipping confirmation email", payload.userId)
  }

  const durationLabel = DURATIONS.find((d) => d.ms === payload.accessDurationMs)?.label ?? `${payload.accessDurationMs}ms`
  const expiresAtStr = new Date(expiresAt).toLocaleString()
  const recipientLabel = userEmail ?? payload.userId

  return htmlPage(`
    <h1 style="color: #E8147F;">Access Granted</h1>
    <p>${escHtml(recipientLabel)} now has access to ${escHtml(projectName)}.</p>
    <p>Duration: ${durationLabel}</p>
    <p>Expires: ${expiresAtStr}</p>
    <p style="color: #9ca3af;">A confirmation email has been sent to the user.</p>
  `)
}
