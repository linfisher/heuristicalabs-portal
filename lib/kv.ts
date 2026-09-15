import fs from "node:fs"
import path from "node:path"
import { resolveContentRoot } from "./registry"

// Small persistent key-value store on the VPS disk. Replaces Upstash Redis,
// whose database was deleted for inactivity in 2026. Implements only the calls
// the portal uses: get / set (ex, nx) / del / incr / expire.
//
// Safe because the portal runs as a single PM2 fork process. State lives on
// globalThis, not in module scope: Next can bundle this module more than once
// (route handlers vs server pages), and every copy must share one store.
// Mutations run one at a time against a copy, the copy is written to disk
// (temp file + rename), and only then becomes the live store — so single-use
// checks stay atomic and a failed write leaves memory unchanged.

type Entry = { v: unknown; exp?: number } // exp = Unix ms
type KvState = { store: Map<string, Entry> | null; chain: Promise<unknown> }

const g = globalThis as typeof globalThis & { __portalKv?: KvState }
const state: KvState = (g.__portalKv ??= { store: null, chain: Promise.resolve() })

function filePath(): string {
  return process.env.KV_PATH ?? path.join(resolveContentRoot(), "kv.json")
}

function load(): Map<string, Entry> {
  if (state.store) return state.store
  const store = new Map<string, Entry>()
  try {
    const raw = JSON.parse(fs.readFileSync(filePath(), "utf-8")) as Record<string, Entry>
    const now = Date.now()
    for (const [key, entry] of Object.entries(raw)) {
      if (!entry.exp || entry.exp > now) store.set(key, entry)
    }
  } catch {
    // Missing or unreadable file: start empty.
  }
  state.store = store
  return store
}

function read(key: string): Entry | undefined {
  const entry = load().get(key)
  return entry && (!entry.exp || entry.exp > Date.now()) ? entry : undefined
}

function mutate<T>(apply: (next: Map<string, Entry>) => { result: T; changed: boolean }): Promise<T> {
  const run = async (): Promise<T> => {
    const now = Date.now()
    const next = new Map<string, Entry>()
    for (const [key, entry] of load()) {
      if (!entry.exp || entry.exp > now) next.set(key, entry)
    }
    const { result, changed } = apply(next)
    if (changed) {
      const p = filePath()
      await fs.promises.mkdir(path.dirname(p), { recursive: true })
      const tmp = `${p}.tmp`
      await fs.promises.writeFile(tmp, JSON.stringify(Object.fromEntries(next)))
      await fs.promises.rename(tmp, p)
      state.store = next
    }
    return result
  }
  const pending = state.chain.then(run, run)
  state.chain = pending.catch(() => {})
  return pending
}

export const kv = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = read(key)
    // A copy, so callers that edit the value cannot change the store without set().
    return entry ? (structuredClone(entry.v) as T) : null
  },

  set(key: string, value: unknown, opts: { ex?: number; nx?: boolean } = {}): Promise<"OK" | null> {
    return mutate<"OK" | null>((next) => {
      if (opts.nx && next.has(key)) return { result: null, changed: false }
      const v = structuredClone(value)
      next.set(key, opts.ex ? { v, exp: Date.now() + opts.ex * 1000 } : { v })
      return { result: "OK", changed: true }
    })
  },

  del(...keys: string[]): Promise<number> {
    return mutate<number>((next) => {
      let removed = 0
      for (const key of keys) {
        if (next.delete(key)) removed++
      }
      return { result: removed, changed: removed > 0 }
    })
  },

  incr(key: string): Promise<number> {
    return mutate<number>((next) => {
      const entry = next.get(key)
      const value = (typeof entry?.v === "number" ? entry.v : 0) + 1
      next.set(key, entry?.exp ? { v: value, exp: entry.exp } : { v: value })
      return { result: value, changed: true }
    })
  },

  expire(key: string, seconds: number): Promise<number> {
    return mutate<number>((next) => {
      const entry = next.get(key)
      if (!entry) return { result: 0, changed: false }
      next.set(key, { v: entry.v, exp: Date.now() + seconds * 1000 })
      return { result: 1, changed: true }
    })
  },
}
