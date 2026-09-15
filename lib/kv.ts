import fs from "node:fs"
import path from "node:path"
import { resolveContentRoot } from "./registry"

// Small persistent key-value store on the VPS disk. Replaces Upstash Redis,
// whose database was deleted for inactivity in 2026. Implements only the calls
// the portal uses: get / set (ex, nx) / del / incr / expire.
//
// Safe because the portal runs as a single PM2 fork process: state lives in
// memory (so check-and-delete is atomic within one tick) and every mutation is
// written to disk atomically (temp file + rename), so it survives restarts.

type Entry = { v: unknown; exp?: number } // exp = Unix ms

let store: Map<string, Entry> | null = null
let writeChain: Promise<void> = Promise.resolve()

function filePath(): string {
  return process.env.KV_PATH ?? path.join(resolveContentRoot(), "kv.json")
}

function load(): Map<string, Entry> {
  if (store) return store
  store = new Map()
  try {
    const raw = JSON.parse(fs.readFileSync(filePath(), "utf-8")) as Record<string, Entry>
    const now = Date.now()
    for (const [key, entry] of Object.entries(raw)) {
      if (!entry.exp || entry.exp > now) store.set(key, entry)
    }
  } catch {
    // Missing or unreadable file: start empty.
  }
  return store
}

function live(key: string): Entry | undefined {
  const s = load()
  const entry = s.get(key)
  if (entry?.exp && entry.exp <= Date.now()) {
    s.delete(key)
    return undefined
  }
  return entry
}

function persist(): Promise<void> {
  const s = load()
  const now = Date.now()
  for (const [key, entry] of s) {
    if (entry.exp && entry.exp <= now) s.delete(key)
  }
  const snapshot = JSON.stringify(Object.fromEntries(s))
  writeChain = writeChain
    .catch(() => {})
    .then(async () => {
      const p = filePath()
      await fs.promises.mkdir(path.dirname(p), { recursive: true })
      const tmp = `${p}.tmp`
      await fs.promises.writeFile(tmp, snapshot)
      await fs.promises.rename(tmp, p)
    })
  return writeChain
}

export const kv = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = live(key)
    return entry ? (entry.v as T) : null
  },

  async set(key: string, value: unknown, opts: { ex?: number; nx?: boolean } = {}): Promise<"OK" | null> {
    if (opts.nx && live(key)) return null
    load().set(key, opts.ex ? { v: value, exp: Date.now() + opts.ex * 1000 } : { v: value })
    await persist()
    return "OK"
  },

  async del(...keys: string[]): Promise<number> {
    let removed = 0
    for (const key of keys) {
      if (live(key) && load().delete(key)) removed++
    }
    if (removed > 0) await persist()
    return removed
  },

  async incr(key: string): Promise<number> {
    const entry = live(key)
    const next = (typeof entry?.v === "number" ? entry.v : 0) + 1
    load().set(key, entry?.exp ? { v: next, exp: entry.exp } : { v: next })
    await persist()
    return next
  },

  async expire(key: string, seconds: number): Promise<number> {
    const entry = live(key)
    if (!entry) return 0
    entry.exp = Date.now() + seconds * 1000
    await persist()
    return 1
  },
}
