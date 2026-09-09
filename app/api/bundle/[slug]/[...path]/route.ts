import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { clerkClient } from "@/lib/clerk"
import { getProject } from "@/lib/projects"
import { getProjectBySlug, resolveContentRoot } from "@/lib/registry"
import { isAdminEmail } from "@/lib/auth"
import { mimeTypeFromName } from "@/lib/file-type"
import { VPS_SECRET_HEADER } from "@/lib/constants"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"

// Serves every file inside a "bundle" page — a self-contained static site
// (entry HTML plus its own JS/CSS/fonts/models) stored under the project's
// content directory on the VPS.
//
// Distinct from /api/proxy, which resolves ONE registered page per request.
// A bundle registers a single page whose `path` is the directory, and this
// route serves any file beneath it, so relative asset requests from inside
// the bundle resolve without each file needing a registry entry.
//
// Auth is identical to the proxy: admin, or a live grant for the slug.
// There is deliberately no share-token path here.
export async function GET(
  request: Request,
  { params }: { params: { slug: string; path: string[] } }
) {
  const { slug, path: pathSegments } = params
  const filePath = pathSegments.join("/")

  // Path traversal guard — mirrors the proxy. Reject anything that could
  // climb out of the project's content directory.
  if (
    !filePath ||
    filePath.includes("..") ||
    filePath.startsWith("/") ||
    filePath.startsWith(".") ||
    pathSegments.some((seg) => seg === "" || seg === "." || seg === "..")
  ) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let user
  try {
    user = await clerkClient.users.getUser(userId)
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 })
  }
  const email = user.primaryEmailAddress?.emailAddress ?? ""
  const admin = isAdminEmail(email)

  const stored = admin ? getProjectBySlug(slug) : undefined
  const project = stored
    ? { slug: stored.slug, vpsPath: stored.vpsPath, pages: stored.pages }
    : getProject(slug)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // The owning page is the bundle whose directory prefixes this request.
  const bundle = project.pages.find(
    (p) => p.fileType === "bundle" && (filePath === p.path || filePath.startsWith(`${p.path}/`))
  )
  if (!bundle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!admin) {
    const grants = (user.publicMetadata?.projects ?? []) as ProjectGrant[]
    const validGrant = grants.find((g) => g.slug === slug && g.expiresAt > Date.now())
    if (!validGrant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const contentType = mimeTypeFromName(filePath)
  const headers = {
    "Content-Type": contentType,
    "Content-Disposition": "inline",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    // Framed by the project page on the same origin.
    "X-Frame-Options": "SAMEORIGIN",
  }

  // Local content root first (dev + VPS-local), then the VPS content origin.
  try {
    const localPath = path.join(resolveContentRoot(), "projects", slug, filePath)
    const buffer = await readFile(localPath)
    return new Response(buffer, { status: 200, headers })
  } catch {
    // fall through to VPS fetch
  }

  if (!process.env.VPS_ORIGIN) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
  const origin = process.env.VPS_ORIGIN.trim()
  const secret = (process.env.VPS_SECRET ?? "").trim()

  let vpsResponse: Response
  try {
    vpsResponse = await fetch(`${origin}${project.vpsPath}/${filePath}`, {
      headers: { [VPS_SECRET_HEADER]: secret },
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    return NextResponse.json({ error: "Could not reach content server" }, { status: 502 })
  }

  if (vpsResponse.status === 404) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
  if (!vpsResponse.ok) {
    return NextResponse.json({ error: "Content unavailable" }, { status: 502 })
  }

  // Trust our own extension map over whatever nginx guessed.
  return new Response(vpsResponse.body, { status: 200, headers })
}
