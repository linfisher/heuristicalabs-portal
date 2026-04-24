import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { moveProject } from "@/lib/projects-registry"
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

  let slug: unknown, direction: unknown
  try {
    ;({ slug, direction } = await request.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (typeof slug !== "string" || !slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 })
  }

  if (direction !== -1 && direction !== 1) {
    return NextResponse.json({ error: "direction must be -1 or 1" }, { status: 400 })
  }

  try {
    await moveProject(slug, direction)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Reorder failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  revalidatePath("/portal")
  revalidatePath("/portal/admin")
  return NextResponse.json({ ok: true })
}
