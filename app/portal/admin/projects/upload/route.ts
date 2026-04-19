import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import fs from "node:fs/promises"
import path from "node:path"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { addPage, removePage, resolveContentRoot, slugify, getProjectBySlug } from "@/lib/registry"
import { fileTypeFromName, mimeTypeFromName, stripExtension } from "@/lib/file-type"
import type { ProjectPage } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

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

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 })
  }

  const slug = String(form.get("slug") ?? "")
  const file = form.get("file")
  const customTitle = String(form.get("title") ?? "").trim()
  const overwrite = String(form.get("overwrite") ?? "") === "1"

  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 })
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 })

  const project = getProjectBySlug(slug)
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: `File too large (max ${MAX_SIZE_BYTES / 1024 / 1024}MB)` }, { status: 413 })
  }

  const fileType = fileTypeFromName(file.name)
  const mime = mimeTypeFromName(file.name)

  // Derive a URL-safe path from the filename (no extension on disk).
  const baseName = slugify(stripExtension(file.name)) || `file-${Date.now()}`

  // Duplicate handling: if the baseName is already taken and overwrite isn't
  // requested, respond 409 so the client can show the overwrite dialog.
  const existing = project.pages.find((p) => p.path === baseName)
  if (existing && !overwrite) {
    return NextResponse.json(
      { error: "duplicate", existingTitle: existing.title, existingPath: existing.path },
      { status: 409 }
    )
  }

  // If overwriting, delete the old page (and its on-disk file) first.
  if (existing && overwrite) {
    await removePage(slug, existing.path)
  }

  const pagePath = baseName

  // Write to disk.
  const projectDir = path.join(resolveContentRoot(), "projects", slug)
  await fs.mkdir(projectDir, { recursive: true })
  const filePath = path.join(projectDir, pagePath)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  // Append to registry.
  const page: ProjectPage = {
    path: pagePath,
    title: customTitle || stripExtension(file.name),
    fileType,
    createdAt: Date.now(),
    mimeType: mime,
    originalName: file.name,
  }
  try {
    await addPage(slug, page)
  } catch (err) {
    try { await fs.rm(filePath, { force: true }) } catch {}
    const message = err instanceof Error ? err.message : "Failed to add page"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  revalidatePath(`/portal/projects/${slug}`)
  revalidatePath(`/portal`)

  return NextResponse.json({ ok: true, page })
}
