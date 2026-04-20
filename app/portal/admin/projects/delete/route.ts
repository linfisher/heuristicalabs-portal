import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { deleteProject } from "@/lib/projects-registry"
import { deleteGrantGroup } from "@/lib/tokens"
import { checkSameOrigin } from "@/lib/csrf"
import type { ProjectGrant } from "@/lib/types"

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

  let slug: unknown
  try {
    ;({ slug } = await request.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (typeof slug !== "string" || !slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 })
  }

  // Cascade: strip grants for this slug from every user so the admin dashboard
  // doesn't show ghost grants pointing at a project that no longer exists.
  let purgedUsers = 0
  try {
    const { data: allUsers } = await clerkClient.users.getUserList({ limit: 500 })
    for (const u of allUsers) {
      const grants = (u.publicMetadata?.projects as ProjectGrant[] | undefined) ?? []
      if (!grants.some((g) => g.slug === slug)) continue
      const remaining = grants.filter((g) => g.slug !== slug)
      await clerkClient.users.updateUserMetadata(u.id, {
        publicMetadata: { projects: remaining },
      })
      await deleteGrantGroup(u.id, slug)
      purgedUsers++
    }
  } catch (err) {
    console.error("[delete-project] grant cascade failed", { slug, err })
  }

  await deleteProject(slug)
  revalidatePath("/portal")
  revalidatePath("/portal/admin")

  console.info("[admin]", {
    action: "delete-project",
    adminUserId: userId,
    slug,
    purgedUsers,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, purgedUsers })
}
