import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { checkSameOrigin } from "@/lib/csrf"
import { readFields, respondDone, respondFail } from "@/lib/admin-respond"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const adminUser = await clerkClient.users.getUser(userId)
  if (!isAdminEmail(adminUser.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!checkSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const fields = await readFields(request)
  if (!fields) {
    console.warn("[user-restore] unreadable request body", { contentType: request.headers.get("content-type") })
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const targetUserId = fields.userId ?? ""

  if (!targetUserId) {
    console.warn("[user-restore] missing userId", { fields: Object.keys(fields) })
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const targetUser = await clerkClient.users.getUser(targetUserId)
    const currentPrivate = (targetUser.privateMetadata ?? {}) as Record<string, unknown>
    const { archivedAt: _unused, ...rest } = currentPrivate
    await clerkClient.users.updateUserMetadata(targetUserId, {
      privateMetadata: rest,
    })
  } catch (err) {
    console.error("[user-restore] failed", { targetUserId, err })
    return respondFail(request, "restore_failed")
  }

  console.info("[admin]", {
    action: "user-restore",
    adminUserId: userId,
    targetUserId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath("/portal/admin")
  return respondDone(request, "/portal/admin?restored=1")
}
