import { NextResponse } from "next/server"
import { redirect } from "next/navigation"

// Admin mutations answer the dashboard's fetch() calls with JSON, so the page
// updates in place, and keep the old redirect + flash message for plain form
// posts. Call these outside any try block (redirect() works by throwing).

// Reads string fields from either a JSON body (the dashboard's buttons) or a
// form body (plain form posts). Returns null when the body cannot be parsed.
export async function readFields(request: Request): Promise<Record<string, string> | null> {
  try {
    if ((request.headers.get("content-type") ?? "").includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>
      const fields: Record<string, string> = {}
      for (const [key, value] of Object.entries(body ?? {})) {
        if (typeof value === "string" || typeof value === "number") fields[key] = String(value)
      }
      return fields
    }
    const form = await request.formData()
    const fields: Record<string, string> = {}
    form.forEach((value, key) => {
      if (typeof value === "string") fields[key] = value
    })
    return fields
  } catch {
    return null
  }
}

export function wantsJson(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("application/json")
}

export function respondDone(request: Request, redirectTo: string): Response {
  if (wantsJson(request)) return NextResponse.json({ ok: true })
  redirect(redirectTo)
}

export function respondFail(request: Request, code: string, status = 500): Response {
  if (wantsJson(request)) return NextResponse.json({ error: code }, { status })
  redirect(`/portal/admin?error=${code}`)
}
