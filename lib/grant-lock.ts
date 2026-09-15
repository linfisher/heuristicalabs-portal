// Every grant change reads a user's whole grant list from Clerk, edits it and
// writes the whole list back. Changes for the same user are chained here so two
// quick clicks (a tick in Grant Access and a Set to chip, say) cannot overwrite
// each other. Kept on globalThis because Next may bundle this module more than
// once; the portal runs as a single process, so an in-process chain is enough.

const g = globalThis as typeof globalThis & { __portalGrantLocks?: Map<string, Promise<void>> }
const locks: Map<string, Promise<void>> = (g.__portalGrantLocks ??= new Map())

export function withUserGrantLock<T>(userId: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(userId) ?? Promise.resolve()
  const run = previous.then(task, task)
  const tail = run.then(
    () => undefined,
    () => undefined,
  )
  locks.set(userId, tail)
  void tail.then(() => {
    if (locks.get(userId) === tail) locks.delete(userId)
  })
  return run
}
