import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { Redis } from "@upstash/redis"
import { decodeJwt } from "jose"
import { clerkClient } from "@/lib/clerk"
import { sendEmail } from "@/lib/email"
import { getProject } from "@/lib/projects"
import { signToken, storeGrantGroup } from "@/lib/tokens"
import { DURATIONS, RATE_LIMIT_WINDOW_S, TOKEN_LINK_TTL_MS } from "@/lib/durations"
import AccessRequestEmail from "@/emails/access-request"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let projectSlug: unknown
  let message: unknown
  try {
    ;({ projectSlug, message } = await request.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (typeof projectSlug !== "string" || !projectSlug) {
    return NextResponse.json({ error: "Invalid project." }, { status: 400 })
  }

  const safeMessage =
    typeof message === "string" ? message.trim().slice(0, 2000) : undefined

  if (!getProject(projectSlug)) {
    return NextResponse.json({ error: "Invalid project." }, { status: 400 })
  }

  let user
  try {
    user = await clerkClient.users.getUser(userId)
  } catch (err) {
    console.error("[request] clerk getUser failed", err)
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 })
  }
  const userEmail = user.primaryEmailAddress?.emailAddress
  if (!userEmail) {
    return NextResponse.json({ error: "No email address found for user." }, { status: 400 })
  }
  const userName = user.firstName ?? userEmail

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  // Global per-user rate limit: max 5 access requests per hour across all projects
  try {
    const globalKey = `req-global:${userId}`
    const count = await redis.incr(globalKey)
    if (count === 1) await redis.expire(globalKey, 3600)
    if (count > 5) {
      return NextResponse.json(
        { error: "Too many access requests. Please wait." },
        { status: 429 }
      )
    }
  } catch (err) {
    console.error("[request] redis global rate-limit failed", err)
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  const reqKey = `req:${userId}:${projectSlug}`
  let acquired
  try {
    acquired = await redis.set(reqKey, "1", { ex: RATE_LIMIT_WINDOW_S, nx: true })
  } catch (err) {
    console.error("[request] redis set failed", err)
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
  if (acquired === null) {
    return NextResponse.json(
      { error: "You have already requested access to this project. Please wait before requesting again." },
      { status: 429 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  try {
    const [t24, t3d, t7d, t30d] = await Promise.all(
      DURATIONS.map((d) =>
        signToken(
          {
            type: "accept",
            userId,
            projectSlug,
            accessDurationMs: d.ms,
          },
          TOKEN_LINK_TTL_MS
        )
      )
    ) as [string, string, string, string]

    const denyToken = await signToken(
      {
        type: "deny",
        userId,
        projectSlug,
        accessDurationMs: 0,
      },
      TOKEN_LINK_TTL_MS
    )

    const allJtis = [t24, t3d, t7d, t30d, denyToken].map(
      (tok) => decodeJwt(tok).jti as string
    )
    await storeGrantGroup(userId, projectSlug, allJtis, TOKEN_LINK_TTL_MS / 1000)

    const projectName = getProject(projectSlug)?.name ?? projectSlug

    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: `[${projectName}] access request from ${userName}`,
      react: AccessRequestEmail({
        requesterName: userName,
        requesterEmail: userEmail,
        requesterClerkId: userId,
        projectName,
        message: safeMessage,
        tokens: {
          h24: `${appUrl}/api/access/accept?token=${t24}`,
          d3:  `${appUrl}/api/access/accept?token=${t3d}`,
          d7:  `${appUrl}/api/access/accept?token=${t7d}`,
          d30: `${appUrl}/api/access/accept?token=${t30d}`,
        },
        denyUrl: `${appUrl}/api/access/deny?token=${denyToken}`,
      }),
    })
  } catch (err) {
    await redis.del(reqKey)
    console.error("[request] failed after acquiring rate-limit key", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
