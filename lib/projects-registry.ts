import { Redis } from "@upstash/redis"
import { PROJECTS } from "./projects"

export type ProjectEntry = {
  slug: string
  name: string
  isCustom: boolean
}

type StoredProject = {
  slug: string
  name: string
  createdAt: number
}

type ProjectRegistry = {
  archived: string[]
  custom: StoredProject[]
}

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

const REGISTRY_KEY = "projects:registry"

async function getRegistry(): Promise<ProjectRegistry> {
  const raw = await getRedis().get<ProjectRegistry>(REGISTRY_KEY)
  return raw ?? { archived: [], custom: [] }
}

async function saveRegistry(data: ProjectRegistry): Promise<void> {
  await getRedis().set(REGISTRY_KEY, data)
}

export async function getActiveProjects(): Promise<ProjectEntry[]> {
  const { archived, custom } = await getRegistry()
  const archivedSet = new Set(archived)

  const staticActive: ProjectEntry[] = PROJECTS
    .filter((p) => !archivedSet.has(p.slug))
    .map((p) => ({ slug: p.slug, name: p.name, isCustom: false }))

  const customActive: ProjectEntry[] = custom
    .filter((p) => !archivedSet.has(p.slug))
    .map((p) => ({ slug: p.slug, name: p.name, isCustom: true }))

  return [...staticActive, ...customActive]
}

export async function getArchivedProjects(): Promise<ProjectEntry[]> {
  const { archived, custom } = await getRegistry()
  const archivedSet = new Set(archived)

  const staticArchived: ProjectEntry[] = PROJECTS
    .filter((p) => archivedSet.has(p.slug))
    .map((p) => ({ slug: p.slug, name: p.name, isCustom: false }))

  const customArchived: ProjectEntry[] = custom
    .filter((p) => archivedSet.has(p.slug))
    .map((p) => ({ slug: p.slug, name: p.name, isCustom: true }))

  return [...staticArchived, ...customArchived]
}

export async function createProject(name: string): Promise<ProjectEntry> {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  if (!slug) throw new Error("Invalid project name")

  const registry = await getRegistry()

  const allSlugs = new Set([
    ...PROJECTS.map((p) => p.slug),
    ...registry.custom.map((p) => p.slug),
  ])
  if (allSlugs.has(slug)) throw new Error("A project with that name already exists")

  registry.custom.push({ slug, name: name.trim(), createdAt: Date.now() })
  await saveRegistry(registry)

  return { slug, name: name.trim(), isCustom: true }
}

export async function archiveProject(slug: string): Promise<void> {
  const registry = await getRegistry()
  if (!registry.archived.includes(slug)) {
    registry.archived.push(slug)
    await saveRegistry(registry)
  }
}

export async function restoreProject(slug: string): Promise<void> {
  const registry = await getRegistry()
  registry.archived = registry.archived.filter((s) => s !== slug)
  await saveRegistry(registry)
}

export async function deleteProject(slug: string): Promise<void> {
  const registry = await getRegistry()
  registry.custom = registry.custom.filter((p) => p.slug !== slug)
  registry.archived = registry.archived.filter((s) => s !== slug)
  await saveRegistry(registry)
}
