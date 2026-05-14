import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { checkSameOrigin } from "@/lib/csrf"

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

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const targetUserId = formData.get("userId") as string | null

  if (!targetUserId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  // Self-archive guard
  if (targetUserId === userId) {
    redirect("/portal/admin?error=cannot_archive_self")
  }

  try {
    const targetUser = await clerkClient.users.getUser(targetUserId)
    const currentPrivate = (targetUser.privateMetadata ?? {}) as Record<string, unknown>
    await clerkClient.users.updateUserMetadata(targetUserId, {
      privateMetadata: { ...currentPrivate, archivedAt: Date.now() },
    })
  } catch {
    redirect("/portal/admin?error=archive_failed")
  }

  console.info("[admin]", {
    action: "user-archive",
    adminUserId: userId,
    targetUserId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath("/portal/admin")
  redirect("/portal/admin?archived=1")
}
