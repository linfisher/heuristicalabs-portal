import type { PageFileType } from "./types"

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"]
const VIDEO_EXT = ["mp4", "mov", "webm", "mkv", "ogv", "m4v"]
const AUDIO_EXT = ["mp3", "wav", "ogg", "aac", "flac", "m4a", "opus"]
const MD_EXT = ["md", "markdown"]
const PDF_EXT = ["pdf"]

export function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".")
  if (idx < 0) return ""
  return name.slice(idx + 1).toLowerCase()
}

export function fileTypeFromName(name: string): PageFileType {
  const ext = extensionOf(name)
  if (PDF_EXT.includes(ext)) return "pdf"
  if (MD_EXT.includes(ext)) return "md"
  if (IMAGE_EXT.includes(ext)) return "image"
  if (VIDEO_EXT.includes(ext)) return "video"
  if (AUDIO_EXT.includes(ext)) return "audio"
  return "file"
}

export function mimeTypeFromName(name: string): string {
  const ext = extensionOf(name)
  const map: Record<string, string> = {
    pdf: "application/pdf",
    md: "text/markdown; charset=utf-8",
    markdown: "text/markdown; charset=utf-8",
    jpg: "image/jpeg", jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mkv: "video/x-matroska",
    ogv: "video/ogg",
    m4v: "video/x-m4v",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    aac: "audio/aac",
    flac: "audio/flac",
    m4a: "audio/mp4",
    opus: "audio/opus",
    // Web-asset types — required so a "bundle" page's ES modules, styles and
    // fonts are served with executable content types rather than octet-stream
    // (which nosniff would refuse to run).
    html: "text/html; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    mjs: "text/javascript; charset=utf-8",
    css: "text/css; charset=utf-8",
    json: "application/json; charset=utf-8",
    map: "application/json; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    xml: "application/xml; charset=utf-8",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    glb: "model/gltf-binary",
    gltf: "model/gltf+json",
    wasm: "application/wasm",
    ico: "image/x-icon",
  }
  return map[ext] ?? "application/octet-stream"
}

export function stripExtension(name: string): string {
  const idx = name.lastIndexOf(".")
  return idx < 0 ? name : name.slice(0, idx)
}
