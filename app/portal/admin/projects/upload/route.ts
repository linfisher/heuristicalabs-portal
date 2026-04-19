import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { addPage, resolveContentRoot, slugify, getProjectBySlug } from "@/lib/registry"
import type { ProjectPage } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

function fileTypeFromName(name: string): "pdf" | "md" | null {
  const lower = name.toLowerCase()
  if (lower.endsWith(".pdf")) return "pdf"
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "md"
  return null
}

function stripExtension(name: string): string {
  return name.replace(/\.(pdf|md|markdown)$/i, "")
}

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

  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 })
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 })

  const project = getProjectBySlug(slug)
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: `File too large (max ${MAX_SIZE_BYTES / 1024 / 1024}MB)` }, { status: 413 })
  }

  const fileType = fileTypeFromName(file.name)
  if (!fileType) {
    return NextResponse.json({ error: "Only PDF and Markdown (.md) files are supported" }, { status: 400 })
  }

  // Derive a URL-safe path from the filename (no extension on disk).
  const baseName = slugify(stripExtension(file.name)) || `file-${Date.now()}`

  // Ensure uniqueness within the project — append -2, -3, ... if taken.
  let pagePath = baseName
  let i = 2
  while (project.pages.some((p) => p.path === pagePath)) {
    pagePath = `${baseName}-${i}`
    i++
  }

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
  }
  try {
    await addPage(slug, page)
  } catch (err) {
    // Roll back the file if registry write fails.
    try { await fs.rm(filePath, { force: true }) } catch {}
    const message = err instanceof Error ? err.message : "Failed to add page"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, page })
}
