import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { renamePage } from "@/lib/registry"
import { checkSameOrigin } from "@/lib/csrf"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await clerkClient.users.getUser(userId)
  if (!isAdminEmail(user.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!checkSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const slug = typeof body.slug === "string" ? body.slug : ""
  const pagePath = typeof body.pagePath === "string" ? body.pagePath : ""
  const title = typeof body.title === "string" ? body.title : ""

  if (!slug || !pagePath || !title.trim()) {
    return NextResponse.json({ error: "slug, pagePath, and title are required" }, { status: 400 })
  }

  try {
    await renamePage(slug, pagePath, title)
    revalidatePath(`/portal/projects/${slug}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rename failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
