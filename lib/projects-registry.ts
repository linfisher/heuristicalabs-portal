// Thin facade over lib/registry.ts — kept for import-path stability.
// The admin UI talks to these; new code should import from "./registry" directly.

import {
  createProject as createProjectImpl,
  renameProject as renameProjectImpl,
  archiveProject as archiveProjectImpl,
  restoreProject as restoreProjectImpl,
  deleteProject as deleteProjectImpl,
  moveProject as moveProjectImpl,
  getActiveProjects as getActiveStored,
  getArchivedProjects as getArchivedStored,
} from "./registry"

export interface ProjectEntry {
  slug: string
  name: string
}

export async function getActiveProjects(): Promise<ProjectEntry[]> {
  return getActiveStored().map((p) => ({ slug: p.slug, name: p.name }))
}

export async function getArchivedProjects(): Promise<ProjectEntry[]> {
  return getArchivedStored().map((p) => ({ slug: p.slug, name: p.name }))
}

export async function createProject(name: string): Promise<ProjectEntry> {
  const p = await createProjectImpl(name)
  return { slug: p.slug, name: p.name }
}

export async function renameProject(slug: string, newName: string): Promise<void> {
  await renameProjectImpl(slug, newName)
}

export async function archiveProject(slug: string): Promise<void> {
  await archiveProjectImpl(slug)
}

export async function restoreProject(slug: string): Promise<void> {
  await restoreProjectImpl(slug)
}

export async function deleteProject(slug: string): Promise<void> {
  await deleteProjectImpl(slug)
}

export async function moveProject(slug: string, direction: -1 | 1): Promise<void> {
  await moveProjectImpl(slug, direction)
}
