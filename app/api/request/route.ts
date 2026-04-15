import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { Redis } from "@upstash/redis"
import { decodeJwt } from "jose"
import { clerkClient } from "@/lib/clerk"
import { sendEmail } from "@/lib/email"
import { getProject } from "@/lib/projects"
import { signToken, storeGrantGroup } from "@/lib/tokens"
import AccessRequestEmail from "@/emails/access-request"

export const dynamic = "force-dynamic"

const DURATIONS = [
  { label: "24 hrs", ms: 86400000 },
  { label: "3 days", ms: 259200000 },
  { label: "7 days", ms: 604800000 },
  { label: "30 days", ms: 2592000000 },
]

export async function POST(request: Request): Promise<NextResponse> {
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

  const user = await clerkClient.users.getUser(userId)
  const userEmail = user.emailAddresses[0]?.emailAddress
  if (!userEmail) {
    return NextResponse.json({ error: "No email address found for user." }, { status: 400 })
  }
  const userName = user.firstName ?? userEmail

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  const reqKey = `req:${userId}:${projectSlug}`
  const acquired = await redis.set(reqKey, "1", { ex: 86400, nx: true })
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
            email: userEmail,
            accessDurationMs: d.ms,
          },
          259200000
        )
      )
    )

    const denyToken = await signToken(
      {
        type: "deny",
        userId,
        projectSlug,
        email: userEmail,
        accessDurationMs: 0,
      },
      259200000
    )

    const allJtis = [t24, t3d, t7d, t30d, denyToken].map(
      (tok) => decodeJwt(tok).jti as string
    )
    await storeGrantGroup(userId, projectSlug, allJtis, 259200)

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
