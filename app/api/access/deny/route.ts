import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import { verifyToken, deleteToken, deleteGrantGroup } from "@/lib/tokens"
import { clerkClient } from "@/lib/clerk"
import { sendEmail } from "@/lib/email"
import { getProject } from "@/lib/projects"
import AccessDeniedEmail from "@/emails/access-denied"

export const dynamic = "force-dynamic"

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
    return htmlPage("<h1 style=\"color: #F5C418;\">Error</h1><p>Missing token.</p>")
  }

  let payload: Awaited<ReturnType<typeof verifyToken>>
  try {
    payload = await verifyToken(token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return htmlPage(`<h1 style="color: #F5C418;">Error</h1><p>${escHtml(msg)}</p>`)
  }

  if (payload.type !== "deny") {
    return htmlPage("<h1 style=\"color: #F5C418;\">Error</h1><p>Invalid token type.</p>")
  }

  try {
    await deleteToken(payload.jti)
    await deleteGrantGroup(payload.userId, payload.projectSlug)

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    await redis.del(`req:${payload.userId}:${payload.projectSlug}`)

    const projectName = getProject(payload.projectSlug)?.name ?? payload.projectSlug
    const user = await clerkClient.users.getUser(payload.userId)

    await sendEmail({
      to: payload.email,
      subject: `Your request for ${projectName} access`,
      react: AccessDeniedEmail({
        userName: user.firstName ?? payload.email,
        projectName,
      }),
    })

    return htmlPage(`
      <h1 style="color: #F5C418;">Request Denied</h1>
      <p>${escHtml(payload.email)} has been notified that their request for ${escHtml(projectName)} was not approved.</p>
    `)
  } catch {
    return htmlPage("<h1 style=\"color: #F5C418;\">Error</h1><p>Failed to process the denial. Please try again later or contact support.</p>")
  }
}
