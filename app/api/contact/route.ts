import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import React from "react"
import { sendEmail } from "@/lib/email"
import ContactInquiryEmail, { subject as inquirySubject } from "@/emails/contact-inquiry"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Reasonable caps so a bot can't post a novel
const MAX_NAME = 120
const MAX_COMPANY = 120
const MAX_EMAIL = 200
const MAX_PROJECT = 80
const MAX_MESSAGE = 5000

// Rate-limit: 5 submissions per IP per hour
const RATE_LIMIT_COUNT = 5
const RATE_LIMIT_WINDOW_S = 3600

const VALID_PROJECTS = new Set([
  "SPLINTR",
  "Extreme Video Factory",
  "HiVibe Temple",
  "No Limit Chess",
  "Akasha Ai",
  "1 TO 1",
  "General",
])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]!.trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  const b = body as Record<string, unknown>

  // Honeypot — real users never fill a hidden field
  if (typeof b.website === "string" && b.website.trim() !== "") {
    // Pretend success so bots can't tune their behavior
    return NextResponse.json({ ok: true })
  }

  const mode = b.mode === "nda" ? "nda" : "contact"
  const name = typeof b.name === "string" ? b.name.trim() : ""
  const email = typeof b.email === "string" ? b.email.trim() : ""
  const company = typeof b.company === "string" ? b.company.trim() : ""
  const project = typeof b.project === "string" ? b.project.trim() : ""
  const message = typeof b.message === "string" ? b.message.trim() : ""

  if (!name || name.length > MAX_NAME) {
    return NextResponse.json({ error: "Name required" }, { status: 400 })
  }
  if (!email || !EMAIL_RE.test(email) || email.length > MAX_EMAIL) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }
  if (company.length > MAX_COMPANY) {
    return NextResponse.json({ error: "Company too long" }, { status: 400 })
  }
  if (!project || !VALID_PROJECTS.has(project) || project.length > MAX_PROJECT) {
    return NextResponse.json({ error: "Select a valid project" }, { status: 400 })
  }
  if (!message || message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Message required" }, { status: 400 })
  }

  // Rate limit per IP
  const ip = clientIp(request)
  const rateKey = `contact-rl:${ip}`
  try {
    const redis = getRedis()
    const count = await redis.incr(rateKey)
    if (count === 1) await redis.expire(rateKey, RATE_LIMIT_WINDOW_S)
    if (count > RATE_LIMIT_COUNT) {
      return NextResponse.json(
        { error: "Too many submissions. Try again later." },
        { status: 429 },
      )
    }
  } catch (err) {
    // Don't fail closed on Redis hiccup — log and continue
    console.error("[contact] redis rate-limit error", err)
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error("[contact] ADMIN_EMAIL not set")
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  try {
    await sendEmail({
      to: adminEmail,
      subject: inquirySubject(project, mode),
      react: React.createElement(ContactInquiryEmail, {
        mode,
        project,
        name,
        email,
        company: company || undefined,
        message,
        submittedAt: new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC",
      }),
      replyTo: email,
    })
  } catch (err) {
    console.error("[contact] send failed", err)
    return NextResponse.json({ error: "Could not send. Please try emailing us directly." }, { status: 502 })
  }

  console.info("[contact]", {
    action: "submit",
    mode,
    project,
    ip,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
