// Shared types used across the portal

export interface ProjectGrant {
  slug: string
  expiresAt: number // Unix ms
}

export interface AccessToken {
  type: "accept" | "deny"
  userId: string
  projectSlug: string
  accessDurationMs: number
  iat: number // Unix seconds (jose convention)
  exp: number // Unix seconds (jose convention)
  jti: string // unique token ID stored in Redis for single-use enforcement
}

export interface Project {
  slug: string
  name: string
  description: string
  vpsPath: string
  pages: ProjectPage[]
}

export type EmbedSource = "youtube" | "drive" | "dropbox" | "vimeo" | "generic"

export interface ProjectPage {
  path: string
  title: string
  fileType: "html" | "json" | "pdf" | "viewer" | "md" | "link" | "embed"
  createdAt?: number              // Unix ms — for sort; older entries may be missing this
  viewerSrc?: string              // local public path for "viewer" type, e.g. "/viewers/foo.html"
  thumbnailSrc?: string           // static preview image for the project page card
  externalUrl?: string            // for "link" and "embed" types
  embedSource?: EmbedSource       // source tag for color-coded card chip
  embedUrl?: string               // for "embed" type — ready-to-iframe URL
}
