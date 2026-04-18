import type { Project, ProjectPage } from "./types"
import { getActiveProjects as getActiveStored, getProjectBySlug } from "./registry"

function toProject(stored: { slug: string; name: string; description?: string; vpsPath: string; pages: ProjectPage[] }): Project {
  return {
    slug: stored.slug,
    name: stored.name,
    description: stored.description ?? "",
    vpsPath: stored.vpsPath,
    pages: stored.pages,
  }
}

// Active projects visible to users and admin listings.
export function getAllActiveProjects(): Project[] {
  return getActiveStored().map(toProject)
}

// Returns an active project, or undefined if missing or archived.
export function getProject(slug: string): Project | undefined {
  const p = getProjectBySlug(slug)
  if (!p || p.status !== "active") return undefined
  return toProject(p)
}

export function getProjectPage(slug: string, pagePath: string): ProjectPage | undefined {
  const p = getProject(slug)
  return p?.pages.find((pg) => pg.path === pagePath)
}
