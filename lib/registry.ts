import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path"
import type { ProjectPage } from "./types"

export type ProjectStatus = "active" | "archived"

export interface StoredProject {
  slug: string
  name: string
  description?: string
  vpsPath: string
  status: ProjectStatus
  createdAt: number
  updatedAt: number
  archivedAt?: number | null
  pages: ProjectPage[]
}

interface Registry {
  version: 1
  projects: StoredProject[]
}

const SEED_PROJECTS: StoredProject[] = [
  {
    slug: "hivibe-temple",
    name: "HiVibe Temple",
    description: "The HiVibe Kit franchise model and VibroMag Floor Tile system — schematics, BOM, and the full Kit business model.",
    vpsPath: "/projects/hivibe-temple",
    status: "active",
    createdAt: 0,
    updatedAt: 0,
    archivedAt: null,
    pages: [
      { path: "kit-the-model",          title: "HiVibe Kit — The Model",                           fileType: "pdf" },
      { path: "floor-tile-bom",         title: "Floor Tile — Bill of Materials",                   fileType: "pdf" },
      { path: "floor-tile-schematic-1", title: "Floor Tile Schematic — Tile Anatomy",              fileType: "pdf" },
      { path: "floor-tile-schematic-2", title: "Floor Tile Schematic — 4-Tile Connected Grid",     fileType: "pdf" },
      { path: "floor-tile-schematic-3", title: "Floor Tile Schematic — Pin Legend & Edge Seam",    fileType: "pdf" },
      { path: "floor-tile-schematic-4", title: "Floor Tile Schematic — Closed Cross-Section",      fileType: "pdf" },
      { path: "floor-tile-schematic-5", title: "Floor Tile Schematic — Exploded Cross-Section",    fileType: "pdf" },
      { path: "floor-tile-schematic-6", title: "Floor Tile Schematic — Zone Architecture",         fileType: "pdf" },
      { path: "floor-tile-schematic-7", title: "Floor Tile Schematic — Impedance & Amps",          fileType: "pdf" },
      { path: "floor-tile-schematic-8", title: "Floor Tile Schematic — Connector & Signal Chain",  fileType: "pdf" },
    ],
  },
  {
    slug: "hivibe-magtiles",
    name: "HiVibe MagTiles",
    description: "HiVibe Floor Tile v19 interactive 3D viewer — full assembly with clamshell, Four-Star Plenum, wiring, and hardware details.",
    vpsPath: "/projects/hivibe-magtiles",
    status: "active",
    createdAt: 0,
    updatedAt: 0,
    archivedAt: null,
    pages: [
      {
        path: "floor-tile-viewer",
        title: "Floor Tile v19 — Interactive 3D Viewer",
        fileType: "viewer",
        viewerSrc: "/viewers/floor_tile_viewer.html",
        thumbnailSrc: "/thumbnails/floor-tile-viewer.png",
      },
    ],
  },
  {
    slug: "bridgebox",
    name: "BridgeBox",
    description: "System schematics, parts specifications, and pricing for all three BridgeBox offer tiers — Value ($10K), Standard ($12.5K), and Premium ($17.5K).",
    vpsPath: "/projects/bridgebox",
    status: "active",
    createdAt: 0,
    updatedAt: 0,
    archivedAt: null,
    pages: [
      { path: "comparison",        title: "Offer Comparison Chart",                         fileType: "pdf" },
      { path: "schematic-offer-a", title: "Schematic — Offer A (Premium, $17,500)",         fileType: "pdf" },
      { path: "schematic-offer-b", title: "Schematic — Offer B (Standard, $12,500)",        fileType: "pdf" },
      { path: "schematic-offer-c", title: "Schematic — Offer C (Value, $10,000)",           fileType: "pdf" },
      { path: "parts-offer-a",     title: "Parts — Offer A (Premium, $17,500)",             fileType: "pdf" },
      { path: "parts-offer-b",     title: "Parts — Offer B (Standard, $12,500)",            fileType: "pdf" },
      { path: "parts-offer-c",     title: "Parts — Offer C (Value, $10,000)",               fileType: "pdf" },
    ],
  },
]

function resolveRegistryPath(): string {
  if (process.env.REGISTRY_PATH) return process.env.REGISTRY_PATH
  const prodDir = "/var/www/portal-content"
  try {
    fs.accessSync(prodDir, fs.constants.W_OK)
    return path.join(prodDir, "registry.json")
  } catch {
    return path.join(process.cwd(), ".registry.json")
  }
}

let cache: Registry | null = null
let writeQueue: Promise<unknown> = Promise.resolve()

function loadSync(): Registry {
  if (cache) return cache
  const p = resolveRegistryPath()
  try {
    const raw = fs.readFileSync(p, "utf-8")
    const parsed = JSON.parse(raw) as Registry
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.projects)) {
      throw new Error("Registry file is malformed")
    }
    cache = parsed
    return cache
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === "ENOENT") {
      const seeded: Registry = { version: 1, projects: structuredClone(SEED_PROJECTS) }
      try {
        fs.mkdirSync(path.dirname(p), { recursive: true })
        fs.writeFileSync(p, JSON.stringify(seeded, null, 2), "utf-8")
      } catch {
        // sandbox may block write; keep in-memory
      }
      cache = seeded
      return cache
    }
    throw err
  }
}

async function writeAtomic(data: Registry): Promise<void> {
  const p = resolveRegistryPath()
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}`
  await fsp.mkdir(path.dirname(p), { recursive: true })
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8")
  await fsp.rename(tmp, p)
}

type Mutator = (r: Registry) => void | Promise<void>

async function mutate(fn: Mutator): Promise<Registry> {
  const next = writeQueue.then(async () => {
    const current = loadSync()
    const draft: Registry = structuredClone(current)
    await fn(draft)
    await writeAtomic(draft)
    cache = draft
    return draft
  })
  writeQueue = next.catch(() => {})
  return next
}

export function getAllProjects(): StoredProject[] {
  return loadSync().projects
}

export function getProjectBySlug(slug: string): StoredProject | undefined {
  return loadSync().projects.find((p) => p.slug === slug)
}

export function getActiveProjects(): StoredProject[] {
  return loadSync().projects.filter((p) => p.status === "active")
}

export function getArchivedProjects(): StoredProject[] {
  return loadSync().projects.filter((p) => p.status === "archived")
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function createProject(name: string): Promise<StoredProject> {
  const trimmed = name.trim()
  const slug = slugify(trimmed)
  if (!slug) throw new Error("Invalid project name")

  let created: StoredProject | undefined
  await mutate((r) => {
    if (r.projects.some((p) => p.slug === slug)) {
      throw new Error("A project with that slug already exists")
    }
    const now = Date.now()
    created = {
      slug,
      name: trimmed,
      vpsPath: `/projects/${slug}`,
      status: "active",
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      pages: [],
    }
    r.projects.push(created)
  })
  if (!created) throw new Error("Create failed")
  return created
}

export async function renameProject(slug: string, newName: string): Promise<void> {
  const name = newName.trim()
  if (!name) throw new Error("Name cannot be empty")
  await mutate((r) => {
    const p = r.projects.find((x) => x.slug === slug)
    if (!p) throw new Error("Project not found")
    p.name = name
    p.updatedAt = Date.now()
  })
}

export async function archiveProject(slug: string): Promise<void> {
  await mutate((r) => {
    const p = r.projects.find((x) => x.slug === slug)
    if (!p) return
    p.status = "archived"
    p.archivedAt = Date.now()
    p.updatedAt = Date.now()
  })
}

export async function restoreProject(slug: string): Promise<void> {
  await mutate((r) => {
    const p = r.projects.find((x) => x.slug === slug)
    if (!p) return
    p.status = "active"
    p.archivedAt = null
    p.updatedAt = Date.now()
  })
}

export async function deleteProject(slug: string): Promise<void> {
  await mutate((r) => {
    r.projects = r.projects.filter((p) => p.slug !== slug)
  })
  // Best-effort: remove on-disk content folder. User confirmed delete means delete.
  const contentRoot = process.env.CONTENT_ROOT ?? "/var/www/portal-content"
  const projectDir = path.join(contentRoot, "projects", slug)
  try {
    await fsp.rm(projectDir, { recursive: true, force: true })
  } catch {
    // directory may not exist locally in dev; silently ignore
  }
}
