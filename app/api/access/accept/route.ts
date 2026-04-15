import { NextResponse } from "next/server"
import { verifyToken, deleteToken, deleteGrantGroup } from "@/lib/tokens"
import { clerkClient } from "@/lib/clerk"
import { sendEmail } from "@/lib/email"
import { getProject } from "@/lib/projects"
import type { ProjectGrant } from "@/lib/types"
import GrantConfirmationEmail from "@/emails/grant-confirmation"

export const dynamic = "force-dynamic"

const DURATIONS = [
  { label: "24 hrs", ms: 86400000 },
  { label: "3 days", ms: 259200000 },
  { label: "7 days", ms: 604800000 },
  { label: "30 days", ms: 2592000000 },
]

function htmlPage(body: string): NextResponse {
  return new NextResponse(`<html><body style="font-family: sans-serif; padding: 40px; background: #0a0a0a; color: #e5e7eb;">${body}</body></html>`, {
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
    return htmlPage("<h1 style=\"color: #E8147F;\">Error</h1><p>Missing token.</p>")
  }

  let payload: Awaited<ReturnType<typeof verifyToken>>
  try {
    payload = await verifyToken(token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return htmlPage(`<h1 style="color: #E8147F;">Error</h1><p>${escHtml(msg)}</p>`)
  }

  if (payload.type !== "accept") {
    return htmlPage("<h1 style=\"color: #E8147F;\">Error</h1><p>Invalid token type.</p>")
  }

  const user = await clerkClient.users.getUser(payload.userId)
  const existingGrants = (user.publicMetadata?.projects ?? []) as ProjectGrant[]
  const filtered = existingGrants.filter((g) => g.slug !== payload.projectSlug)
  const expiresAt = Date.now() + payload.accessDurationMs
  const updatedGrants: ProjectGrant[] = [...filtered, { slug: payload.projectSlug, expiresAt }]

  try {
    await clerkClient.users.updateUserMetadata(payload.userId, {
      publicMetadata: { projects: updatedGrants },
    })
  } catch {
    return htmlPage("<h1 style=\"color: #E8147F;\">Error</h1><p>Failed to apply access grant. Please try again later or contact support.</p>")
  }

  await deleteToken(payload.jti)
  await deleteGrantGroup(payload.userId, payload.projectSlug)

  const projectName = getProject(payload.projectSlug)?.name ?? payload.projectSlug
  const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/projects/${payload.projectSlug}?welcome=1`

  await sendEmail({
    to: payload.email,
    subject: `You now have access to ${projectName}`,
    react: GrantConfirmationEmail({
      userName: user.firstName ?? payload.email,
      projectName,
      expiresAt,
      projectUrl,
    }),
  })

  const durationLabel = DURATIONS.find((d) => d.ms === payload.accessDurationMs)?.label ?? `${payload.accessDurationMs}ms`
  const expiresAtStr = new Date(expiresAt).toLocaleString()

  return htmlPage(`
    <h1 style="color: #E8147F;">Access Granted</h1>
    <p>${escHtml(payload.email)} now has access to ${escHtml(projectName)}.</p>
    <p>Duration: ${durationLabel}</p>
    <p>Expires: ${expiresAtStr}</p>
    <p style="color: #9ca3af;">A confirmation email has been sent to the user.</p>
  `)
}
