import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import { verifyToken, deleteGrantGroup } from "@/lib/tokens"
import { clerkClient } from "@/lib/clerk"
import { sendEmail } from "@/lib/email"
import { getProject } from "@/lib/projects"
import AccessDeniedEmail from "@/emails/access-denied"

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
    return htmlPage("<h1 style=\"color: #F5C418;\">Error</h1><p>Missing token.</p>", 400)
  }

  let payload: Awaited<ReturnType<typeof verifyToken>>
  try {
    payload = await verifyToken(token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const status = msg.includes("already been used") || msg.includes("expired") ? 410 : 400
    return htmlPage(`<h1 style="color: #F5C418;">Error</h1><p>${escHtml(msg)}</p>`, status)
  }

  if (payload.type !== "deny") {
    return htmlPage("<h1 style=\"color: #F5C418;\">Error</h1><p>Invalid token type.</p>", 400)
  }

  try {
    const projectName = getProject(payload.projectSlug)?.name ?? payload.projectSlug

    let user: Awaited<ReturnType<typeof clerkClient.users.getUser>> | null = null
    try {
      user = await clerkClient.users.getUser(payload.userId)
    } catch (err) {
      console.error("[deny] failed to load user from Clerk", err)
    }

    await deleteGrantGroup(payload.userId, payload.projectSlug)

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    await redis.del(`req:${payload.userId}:${payload.projectSlug}`)

    const userEmail = user?.primaryEmailAddress?.emailAddress

    if (user && userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: `Your request for ${projectName} access`,
          react: AccessDeniedEmail({
            userName: user.firstName ?? userEmail,
            projectName,
          }),
        })
      } catch (err) {
        console.error("[deny] failed to send denial email", err)
      }
    } else {
      console.error("[deny] skipping denial email — user or email unavailable", payload.userId)
    }

    const recipientLabel = userEmail ?? payload.userId

    return htmlPage(`
      <h1 style="color: #F5C418;">Request Denied</h1>
      <p>${escHtml(recipientLabel)} has been notified that their request for ${escHtml(projectName)} was not approved.</p>
    `)
  } catch (err) {
    console.error("[deny] handler failed", err)
    return htmlPage("<h1 style=\"color: #F5C418;\">Error</h1><p>Failed to process the denial. Please try again later or contact support.</p>", 500)
  }
}
