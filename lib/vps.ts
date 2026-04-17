import { VPS_SECRET_HEADER } from "@/lib/constants"

type FetchPageResult =
  | { content: string; error?: never }
  | { content?: never; error: string }

// DEAD CODE: all pages in the registry use fileType: "pdf" which bypasses this function.
// If you add html/json pages, add Clerk auth + grant check here before calling this.
export async function fetchPage(
  vpsPath: string,
  filePath: string
): Promise<FetchPageResult> {
  if (!filePath || filePath.includes("..") || filePath.startsWith("/") || filePath.startsWith(".")) {
    return { error: "Invalid page path" }
  }

  const secret = (process.env.VPS_SECRET ?? "").trim()
  if (!secret) console.error("[vps] VPS_SECRET is not configured — content server will reject requests")

  const url = `${process.env.VPS_ORIGIN}${vpsPath}/${filePath}`

  try {
    const response = await fetch(url, {
      headers: {
        [VPS_SECRET_HEADER]: secret,
      },
      signal: AbortSignal.timeout(8000),
    })

    if (response.status === 404) {
      return { error: "Page not found" }
    }

    if (!response.ok) {
      return { error: "Content unavailable" }
    }

    const content = await response.text()
    return { content }
  } catch (err) {
    console.error("[vps] fetchPage failed", { url, error: err instanceof Error ? err.message : String(err) })
    return { error: "Could not reach content server" }
  }
}
