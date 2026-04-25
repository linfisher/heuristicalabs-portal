import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { Redis } from "@upstash/redis"
import { isAdminEmail } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Saved Pro Forma scenarios live in Upstash Redis so they sync across every
// browser (VPS prod, local dev, mobile, whatever) instead of being trapped in
// per-domain localStorage. One key per Clerk user; admin's set is the canonical
// "house" set used inside the SPV deck.
//
// Shape of stored value: { [name: string]: { state: <state-snapshot>, savedAt: <ms> } }
const KEY_PREFIX = "proforma-scenarios:"

let _redis: Redis | null = null
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

async function requireUser() {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  if (!user) return null
  const email = user.primaryEmailAddress?.emailAddress
  if (!isAdminEmail(email)) return null
  return userId
}

// GET /api/proforma-scenarios → all scenarios for the current user
export async function GET() {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  try {
    const raw = await getRedis().get(KEY_PREFIX + userId)
    const scenarios = raw && typeof raw === "object" ? raw : {}
    return NextResponse.json({ scenarios })
  } catch (err) {
    console.error("[proforma-scenarios] GET failed:", err)
    return NextResponse.json({ error: "redis_failed" }, { status: 500 })
  }
}

// POST /api/proforma-scenarios { name, state } → upsert one scenario by name
export async function POST(req: Request) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let body: { name?: string; state?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const name = (body.name ?? "").toString().trim().slice(0, 200)
  if (!name) return NextResponse.json({ error: "missing_name" }, { status: 400 })
  if (!body.state || typeof body.state !== "object") {
    return NextResponse.json({ error: "missing_state" }, { status: 400 })
  }

  try {
    const key = KEY_PREFIX + userId
    const existing = await getRedis().get(key)
    const scenarios = existing && typeof existing === "object" ? existing as Record<string, unknown> : {}
    scenarios[name] = { state: body.state, savedAt: Date.now() }
    await getRedis().set(key, scenarios)
    return NextResponse.json({ ok: true, scenarios })
  } catch (err) {
    console.error("[proforma-scenarios] POST failed:", err)
    return NextResponse.json({ error: "redis_failed" }, { status: 500 })
  }
}

// DELETE /api/proforma-scenarios?name=foo → remove one scenario by name
export async function DELETE(req: Request) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const name = (url.searchParams.get("name") ?? "").trim()
  if (!name) return NextResponse.json({ error: "missing_name" }, { status: 400 })

  try {
    const key = KEY_PREFIX + userId
    const existing = await getRedis().get(key)
    const scenarios = existing && typeof existing === "object" ? existing as Record<string, unknown> : {}
    delete scenarios[name]
    await getRedis().set(key, scenarios)
    return NextResponse.json({ ok: true, scenarios })
  } catch (err) {
    console.error("[proforma-scenarios] DELETE failed:", err)
    return NextResponse.json({ error: "redis_failed" }, { status: 500 })
  }
}
