import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { clerkClient } from "@/lib/clerk"
import { getProject, getProjectPage } from "@/lib/projects"
import { isAdminEmail } from "@/lib/auth"
import { VPS_SECRET_HEADER } from "@/lib/constants"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: { slug: string; path: string[] } }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug, path: pathSegments } = params
  const filePath = pathSegments.join("/")

  // Path traversal guard
  if (!filePath || filePath.includes("..") || filePath.startsWith("/") || filePath.startsWith(".")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  // Validate project and page exist in registry
  const project = getProject(slug)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const page = getProjectPage(slug, filePath)
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Auth check: admin bypasses grant check; regular users need a valid grant
  let user
  try {
    user = await clerkClient.users.getUser(userId)
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 })
  }
  const email = user.primaryEmailAddress?.emailAddress ?? ""

  if (!isAdminEmail(email)) {
    const grants = (user.publicMetadata?.projects ?? []) as ProjectGrant[]
    const validGrant = grants.find((g) => g.slug === slug && g.expiresAt > Date.now())
    if (!validGrant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  // Fetch raw bytes from VPS
  if (!process.env.VPS_ORIGIN) {
    console.error("[proxy] VPS_ORIGIN is not configured")
    return NextResponse.json({ error: "Content server not configured" }, { status: 503 })
  }
  const origin = process.env.VPS_ORIGIN.trim()
  const secret = (process.env.VPS_SECRET ?? "").trim()
  const url = `${origin}${project.vpsPath}/${filePath}`

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
    return NextResponse.json({ error: "File not found on server" }, { status: 404 })
  }

  if (!vpsResponse.ok) {
    return NextResponse.json({ error: "Content unavailable" }, { status: 502 })
  }

  const contentType = page.fileType === "pdf" ? "application/pdf" : (vpsResponse.headers.get("Content-Type") ?? "application/octet-stream")

  return new Response(vpsResponse.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
