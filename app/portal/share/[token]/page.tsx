// Public file viewer for share-link recipients. No Clerk required — the
// JWT in the URL is the only credential. Renders a stripped-down version
// of the standard project file viewer (no breadcrumb, no admin chrome).

import { readFile } from "fs/promises"
import path from "path"
import { marked } from "marked"
import DOMPurify from "isomorphic-dompurify"
import { getProjectBySlug, resolveContentRoot } from "@/lib/registry"
import { verifyShareToken } from "@/lib/share-tokens"
import PDFProxyIframe from "@/components/PDFProxyIframe"

export const dynamic = "force-dynamic"

interface Props {
  params: { token: string }
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div
      className="bg-[#0A0A0A]"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "32px", color: "#9ca3af", fontFamily: "var(--font-exo2), system-ui, sans-serif", textAlign: "center" }}
    >
      <p style={{ fontSize: "1.05rem", color: "#e5e7eb" }}>This share link no longer works.</p>
      <p style={{ fontSize: "0.85rem" }}>{message}</p>
      <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "12px" }}>Ask the sender for a new link.</p>
    </div>
  )
}

function ShareHeader({ title, expiresAt }: { title: string; expiresAt: number }) {
  const dt = new Date(expiresAt)
  const formatted = dt.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "12px", padding: "10px 20px",
        background: "#0A0A0A", borderBottom: "1px solid #1a1a1a",
        fontFamily: "var(--font-exo2), system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", minWidth: 0 }}>
        <span style={{ color: "#E8147F", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}>Heuristica · Shared</span>
        <span style={{ color: "#e5e7eb", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
      </div>
      <span style={{ color: "#6b7280", fontSize: "0.7rem", flexShrink: 0 }}>Expires {formatted}</span>
    </div>
  )
}

export default async function SharedFilePage({ params }: Props) {
  const { token } = params

  let payload
  try {
    payload = await verifyShareToken(token)
  } catch (err) {
    return <ErrorScreen message={err instanceof Error ? err.message : "Invalid token"} />
  }

  const { slug, pagePath, exp } = payload
  const project = getProjectBySlug(slug)
  if (!project) return <ErrorScreen message="The shared project no longer exists." />

  const page = project.pages.find((p) => p.path === pagePath)
  if (!page) return <ErrorScreen message="The shared file is no longer available." />

  const expiresAt = exp * 1000
  const proxyUrl = `/api/proxy/${slug}/${pagePath}?share=${encodeURIComponent(token)}`

  // Markdown
  if (page.fileType === "md") {
    const diskPath = path.join(resolveContentRoot(), "projects", slug, pagePath)
    let html = ""
    try {
      const raw = await readFile(diskPath, "utf-8")
      const parsed = await marked.parse(raw, { gfm: true, breaks: true })
      html = DOMPurify.sanitize(parsed)
    } catch {
      return <ErrorScreen message="Document unavailable." />
    }
    return (
      <div className="bg-[#0A0A0A]" style={{ minHeight: "100vh", color: "#e5e7eb" }}>
        <ShareHeader title={page.title} expiresAt={expiresAt} />
        <article
          style={{ maxWidth: "820px", margin: "0 auto", padding: "24px 32px 80px", fontFamily: "var(--font-exo2), system-ui, sans-serif", lineHeight: 1.7, fontSize: "1.05rem" }}
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    )
  }

  // Embed (YouTube / Drive / Dropbox / Vimeo)
  if (page.fileType === "embed" && page.embedUrl) {
    return (
      <div className="flex flex-col bg-[#0A0A0A]" style={{ height: "100vh" }}>
        <ShareHeader title={page.title} expiresAt={expiresAt} />
        <iframe src={page.embedUrl} title={page.title} style={{ width: "100%", flex: 1, border: "none", display: "block" }} allow="fullscreen; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    )
  }

  // External link card
  if (page.fileType === "link" && page.externalUrl) {
    return (
      <div className="flex flex-col bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <ShareHeader title={page.title} expiresAt={expiresAt} />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-semibold text-white mb-3">{page.title}</h1>
            <p className="text-sm text-gray-500 mb-6">This link opens in a new tab.</p>
            <a href={page.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#E8147F] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">Open externally</a>
          </div>
        </div>
      </div>
    )
  }

  // Local viewer (Three.js etc.)
  if (page.fileType === "viewer" && page.viewerSrc) {
    let viewerHtml = ""
    try {
      const filePath = path.join(process.cwd(), "public", page.viewerSrc)
      viewerHtml = await readFile(filePath, "utf-8")
    } catch {
      return <ErrorScreen message="Viewer unavailable." />
    }
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <ShareHeader title={page.title} expiresAt={expiresAt} />
        <iframe srcDoc={viewerHtml} title={page.title} sandbox="allow-scripts allow-same-origin" style={{ width: "100%", flex: 1, border: "none", display: "block" }} />
      </div>
    )
  }

  // PDF
  if (page.fileType === "pdf") {
    return (
      <div className="flex flex-col bg-[#0A0A0A]" style={{ height: "100vh" }}>
        <ShareHeader title={page.title} expiresAt={expiresAt} />
        <PDFProxyIframe proxyUrl={proxyUrl} title={page.title} />
      </div>
    )
  }

  // Image
  if (page.fileType === "image") {
    return (
      <div className="bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <ShareHeader title={page.title} expiresAt={expiresAt} />
        <div style={{ padding: "24px 32px 60px", display: "flex", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proxyUrl} alt={page.title} style={{ maxWidth: "100%", maxHeight: "calc(100vh - 120px)", borderRadius: "6px" }} />
        </div>
      </div>
    )
  }

  // Video
  if (page.fileType === "video") {
    return (
      <div className="bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <ShareHeader title={page.title} expiresAt={expiresAt} />
        <div style={{ padding: "24px 32px 60px", display: "flex", justifyContent: "center" }}>
          <video src={proxyUrl} controls style={{ maxWidth: "100%", maxHeight: "calc(100vh - 120px)", borderRadius: "6px", background: "#000" }} />
        </div>
      </div>
    )
  }

  // Audio
  if (page.fileType === "audio") {
    return (
      <div className="bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <ShareHeader title={page.title} expiresAt={expiresAt} />
        <div style={{ padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <h1 className="text-xl font-semibold text-white">{page.title}</h1>
          <audio src={proxyUrl} controls style={{ width: "min(100%, 640px)" }} />
        </div>
      </div>
    )
  }

  // Generic file — offer download
  if (page.fileType === "file") {
    const fileName = page.originalName ?? pagePath
    return (
      <div className="flex flex-col bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <ShareHeader title={page.title} expiresAt={expiresAt} />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-semibold text-white mb-3">{page.title}</h1>
            <p className="text-sm text-gray-500 mb-6">No in-portal preview for this file type.</p>
            <a href={proxyUrl} download={fileName} className="inline-block bg-[#E8147F] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">Download {fileName}</a>
          </div>
        </div>
      </div>
    )
  }

  return <ErrorScreen message={`Unsupported file type: ${page.fileType}`} />
}
