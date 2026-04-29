import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { clerkClient } from "@/lib/clerk"
import { getProject, getProjectPage } from "@/lib/projects"
import { getProjectBySlug, resolveContentRoot } from "@/lib/registry"
import { isAdminEmail } from "@/lib/auth"
import { VPS_SECRET_HEADER } from "@/lib/constants"
import { verifyShareToken } from "@/lib/share-tokens"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: { slug: string; path: string[] } }
) {
  const { slug, path: pathSegments } = params
  const filePath = pathSegments.join("/")

  // Path traversal guard
  if (!filePath || filePath.includes("..") || filePath.startsWith("/") || filePath.startsWith(".")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  // Path A: share-link bypass. ?share=<jwt> grants anonymous access to one
  // specific file when the token's slug + pagePath match this request.
  const shareTokenParam = new URL(request.url).searchParams.get("share")
  if (shareTokenParam) {
    let shareTokenPayload
    try {
      shareTokenPayload = await verifyShareToken(shareTokenParam)
    } catch {
      return NextResponse.json({ error: "Invalid or expired share link" }, { status: 403 })
    }
    if (shareTokenPayload.slug !== slug || shareTokenPayload.pagePath !== filePath) {
      return NextResponse.json({ error: "Share link does not authorize this file" }, { status: 403 })
    }
    const stored = getProjectBySlug(slug)
    if (!stored) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const page = stored.pages.find((p) => p.path === filePath)
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return await streamFile({ slug, vpsPath: stored.vpsPath, filePath, page })
  }

  // Path B: standard Clerk-authed access (admin or grant-bearing user).
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
    ? { slug: stored.slug, name: stored.name, description: stored.description ?? "", vpsPath: stored.vpsPath, pages: stored.pages }
    : getProject(slug)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const page = admin ? project.pages.find((p) => p.path === filePath) : getProjectPage(slug, filePath)
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!admin) {
    const grants = (user.publicMetadata?.projects ?? []) as ProjectGrant[]
    const validGrant = grants.find((g) => g.slug === slug && g.expiresAt > Date.now())
    if (!validGrant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return await streamFile({ slug, vpsPath: project.vpsPath, filePath, page })
}

// Stream the requested file: local content root first (covers fresh uploads
// in dev and VPS), then fall back to the VPS content origin. Same byte path
// for share-link viewers and Clerk-authed users.
async function streamFile({
  slug,
  vpsPath,
  filePath,
  page,
}: {
  slug: string
  vpsPath: string
  filePath: string
  page: { fileType: string; mimeType?: string }
}) {
  let contentType: string
  if (page.mimeType) {
    contentType = page.mimeType
  } else if (page.fileType === "pdf") {
    contentType = "application/pdf"
  } else if (page.fileType === "md") {
    contentType = "text/markdown; charset=utf-8"
  } else {
    contentType = "application/octet-stream"
  }

  try {
    const localPath = path.join(resolveContentRoot(), "projects", slug, filePath)
    const buffer = await readFile(localPath)
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      },
    })
  } catch {
    // fall through to VPS fetch
  }

  if (!process.env.VPS_ORIGIN) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
  const origin = process.env.VPS_ORIGIN.trim()
  const secret = (process.env.VPS_SECRET ?? "").trim()
  const url = `${origin}${vpsPath}/${filePath}`

  let vpsResponse: Response
  try {
    vpsResponse = await fetch(url, {
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

  return new Response(vpsResponse.body, {
    status: 200,
    headers: {
      "Content-Type": page.fileType === "pdf" ? "application/pdf" : (vpsResponse.headers.get("Content-Type") ?? "application/octet-stream"),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
    },
  })
}
