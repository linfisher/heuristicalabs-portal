import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { clerkClient } from "@/lib/clerk"
import { sendEmail } from "@/lib/email"
import { checkSameOrigin } from "@/lib/csrf"
import SupportRequestEmail from "@/emails/support-request"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const ALLOWED_CATEGORIES = [
  "Access — I can't open a project",
  "Access — I need more time on a grant",
  "Access — I want a different project",
  "File or viewer won't load",
  "Bug report",
  "Other",
] as const

const ALLOWED_URGENCIES = ["Low", "Normal", "Urgent"] as const
const ALLOWED_CONTACT_PREFS = ["Email", "Call me"] as const

const MAX_MESSAGE_CHARS = 1500

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const category = String(body.category ?? "")
  const urgency = String(body.urgency ?? "")
  const projectSlug = typeof body.projectSlug === "string" ? body.projectSlug : ""
  const contactPreference = String(body.contactPreference ?? "")
  const message = typeof body.message === "string" ? body.message : ""
  const pageUrl = typeof body.pageUrl === "string" ? body.pageUrl : ""

  if (!ALLOWED_CATEGORIES.includes(category as (typeof ALLOWED_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 })
  }
  if (!ALLOWED_URGENCIES.includes(urgency as (typeof ALLOWED_URGENCIES)[number])) {
    return NextResponse.json({ error: "Invalid urgency" }, { status: 400 })
  }
  if (!ALLOWED_CONTACT_PREFS.includes(contactPreference as (typeof ALLOWED_CONTACT_PREFS)[number])) {
    return NextResponse.json({ error: "Invalid contact preference" }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 })
  }

  let fromEmail = ""
  let fromName = ""
  try {
    const user = await clerkClient.users.getUser(userId)
    fromEmail = user.primaryEmailAddress?.emailAddress ?? ""
    fromName = [user.firstName, user.lastName].filter(Boolean).join(" ") || fromEmail
  } catch {
    return NextResponse.json({ error: "Could not read user info" }, { status: 500 })
  }

  const recipient = process.env.ADMIN_EMAIL ?? "linfisher@gmail.com"

  try {
    await sendEmail({
      to: recipient,
      subject: `[Portal Support] ${category}${urgency === "Urgent" ? " — URGENT" : ""}`,
      react: SupportRequestEmail({
        fromEmail,
        fromName,
        category,
        urgency,
        projectSlug,
        contactPreference,
        message,
        pageUrl,
      }),
    })
  } catch {
    return NextResponse.json({ error: "Failed to send support email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
