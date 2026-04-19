import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { renameSection } from "@/lib/registry"

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
  const oldName = typeof body.oldName === "string" ? body.oldName : ""
  const newName = typeof body.newName === "string" ? body.newName : ""
  if (!slug || !oldName || !newName.trim()) {
    return NextResponse.json({ error: "slug, oldName, newName required" }, { status: 400 })
  }
  try {
    await renameSection(slug, oldName, newName)
    revalidatePath(`/portal/projects/${slug}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rename failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
