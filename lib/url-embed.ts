import type { EmbedSource } from "./types"

export interface EmbedInfo {
  source: EmbedSource
  embedUrl: string | null // null means "open externally only"
  label: string           // human-readable source label, e.g. "YouTube"
}

/**
 * Parse a URL and return embed information. For known providers, produces an
 * iframe-ready embed URL. For unknown URLs, returns source=generic and null.
 */
export function detectEmbed(raw: string): EmbedInfo {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { source: "generic", embedUrl: null, label: "Link" }
  }

  const host = url.hostname.toLowerCase()

  // YouTube
  if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v")
    if (id) return { source: "youtube", embedUrl: `https://www.youtube.com/embed/${id}`, label: "YouTube" }
  }
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0]
    if (id) return { source: "youtube", embedUrl: `https://www.youtube.com/embed/${id}`, label: "YouTube" }
  }

  // Google Drive
  if (host === "drive.google.com") {
    // /file/d/<id>/view or /file/d/<id>/preview
    const m = url.pathname.match(/\/file\/d\/([^/]+)/)
    if (m) return { source: "drive", embedUrl: `https://drive.google.com/file/d/${m[1]}/preview`, label: "Google Drive" }
    // /open?id=<id>
    const id = url.searchParams.get("id")
    if (id) return { source: "drive", embedUrl: `https://drive.google.com/file/d/${id}/preview`, label: "Google Drive" }
  }

  // Dropbox
  if (host === "dropbox.com" || host === "www.dropbox.com") {
    // Replace ?dl=0 with ?raw=1 (or add raw=1 if missing)
    const params = url.searchParams
    params.delete("dl")
    params.set("raw", "1")
    url.search = params.toString()
    return { source: "dropbox", embedUrl: url.toString(), label: "Dropbox" }
  }

  // Vimeo
  if (host === "vimeo.com" || host === "www.vimeo.com") {
    const m = url.pathname.match(/^\/(\d+)/)
    if (m) return { source: "vimeo", embedUrl: `https://player.vimeo.com/video/${m[1]}`, label: "Vimeo" }
  }

  // Fallback — external link only, no embed
  return { source: "generic", embedUrl: null, label: "Link" }
}

export function embedSourceColor(source: EmbedSource): { bg: string; border: string; text: string } {
  switch (source) {
    case "youtube":
      return { bg: "#3d0f0f", border: "#ef4444", text: "#ef4444" }
    case "drive":
      return { bg: "#0a2a2d", border: "#14b8a6", text: "#14b8a6" }
    case "dropbox":
      return { bg: "#0d1f3d", border: "#3b82f6", text: "#3b82f6" }
    case "vimeo":
      return { bg: "#0a2130", border: "#22d3ee", text: "#22d3ee" }
    default:
      return { bg: "#1a1a1a", border: "#555", text: "#888" }
  }
}
