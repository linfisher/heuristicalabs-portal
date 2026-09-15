import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { isAdminEmail } from "@/lib/auth"
import { kv } from "@/lib/kv"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Saved Pro Forma scenarios live in the server-side store (lib/kv.ts) so they
// sync across every browser instead of being trapped in per-domain
// localStorage. One key per Clerk user; admin's set is the canonical "house"
// set used inside the SPV deck.
//
// Shape of stored value: { [name: string]: { state: <state-snapshot>, savedAt: <ms> } }
const KEY_PREFIX = "proforma-scenarios:"

function getStore() {
  return kv
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
    const raw = await getStore().get(KEY_PREFIX + userId)
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
    const existing = await getStore().get(key)
    const scenarios = existing && typeof existing === "object" ? existing as Record<string, unknown> : {}
    scenarios[name] = { state: body.state, savedAt: Date.now() }
    await getStore().set(key, scenarios)
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
    const existing = await getStore().get(key)
    const scenarios = existing && typeof existing === "object" ? existing as Record<string, unknown> : {}
    delete scenarios[name]
    await getStore().set(key, scenarios)
    return NextResponse.json({ ok: true, scenarios })
  } catch (err) {
    console.error("[proforma-scenarios] DELETE failed:", err)
    return NextResponse.json({ error: "redis_failed" }, { status: 500 })
  }
}
