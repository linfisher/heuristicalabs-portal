import { NextResponse } from "next/server"
import { redirect } from "next/navigation"

// Admin mutations answer the dashboard's fetch() calls with JSON, so the page
// updates in place, and keep the old redirect + flash message for plain form
// posts. Call these outside any try block (redirect() works by throwing).

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
