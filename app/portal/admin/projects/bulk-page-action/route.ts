import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { removePage, setPageSection, getProjectBySlug } from "@/lib/registry"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await clerkClient.users.getUser(userId)
  if (!isAdminEmail(user.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const origin = request.headers.get("origin")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!origin || !appUrl || origin.replace(/\/$/, "") !== appUrl.replace(/\/$/, "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const slug = typeof body.slug === "string" ? body.slug : ""
  const action = body.action
  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p): p is string => typeof p === "string" && p.length > 0)
    : []

  if (!slug || paths.length === 0) {
    return NextResponse.json({ error: "slug and paths[] required" }, { status: 400 })
  }
  if (!getProjectBySlug(slug)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const results = { succeeded: 0, failed: 0, errors: [] as string[] }

  if (action === "delete") {
    for (const p of paths) {
      try {
        await removePage(slug, p)
        results.succeeded++
      } catch (err) {
        results.failed++
        results.errors.push(`${p}: ${err instanceof Error ? err.message : "delete failed"}`)
      }
    }
  } else if (action === "move") {
    const raw = body.section
    const section = raw === null || raw === "" ? null : typeof raw === "string" ? raw : undefined
    if (section === undefined) {
      return NextResponse.json({ error: "section required for move action" }, { status: 400 })
    }
    for (const p of paths) {
      try {
        await setPageSection(slug, p, section)
        results.succeeded++
      } catch (err) {
        results.failed++
        results.errors.push(`${p}: ${err instanceof Error ? err.message : "move failed"}`)
      }
    }
  } else {
    return NextResponse.json({ error: "action must be 'delete' or 'move'" }, { status: 400 })
  }

  revalidatePath(`/portal/projects/${slug}`)
  console.info("[admin]", {
    action: `bulk-${action}`,
    adminUserId: userId,
    slug,
    count: paths.length,
    succeeded: results.succeeded,
    failed: results.failed,
    timestamp: new Date().toISOString(),
  })
  return NextResponse.json({ ok: true, ...results })
}
