import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { addPage, slugify, getProjectBySlug } from "@/lib/registry"
import { detectEmbed } from "@/lib/url-embed"
import { checkSameOrigin } from "@/lib/csrf"
import type { ProjectPage } from "@/lib/types"

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
  const url = typeof body.url === "string" ? body.url.trim() : ""
  const title = typeof body.title === "string" ? body.title.trim() : ""

  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 })
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 })
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 })

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return NextResponse.json({ error: "URL must be http or https" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  const project = getProjectBySlug(slug)
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

  const embed = detectEmbed(url)

  // Path slug derived from title, ensure unique within project.
  const baseName = slugify(title) || `link-${Date.now()}`
  let pagePath = baseName
  let i = 2
  while (project.pages.some((p) => p.path === pagePath)) {
    pagePath = `${baseName}-${i}`
    i++
  }

  const page: ProjectPage = {
    path: pagePath,
    title,
    fileType: embed.embedUrl ? "embed" : "link",
    createdAt: Date.now(),
    externalUrl: url,
    embedSource: embed.source,
    ...(embed.embedUrl ? { embedUrl: embed.embedUrl } : {}),
  }

  try {
    await addPage(slug, page)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add link"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  revalidatePath(`/portal/projects/${slug}`)
  revalidatePath(`/portal`)

  return NextResponse.json({ ok: true, page })
}
