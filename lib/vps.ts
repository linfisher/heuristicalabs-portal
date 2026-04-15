type FetchPageResult =
  | { content: string; error?: never }
  | { content?: never; error: string }

export async function fetchPage(
  vpsPath: string,
  filePath: string
): Promise<FetchPageResult> {
  if (!filePath || filePath.includes("..") || filePath.startsWith("/") || filePath.startsWith(".")) {
    return { error: "Invalid page path" }
  }

  const url = `${process.env.VPS_ORIGIN}${vpsPath}/${filePath}`

  try {
    const response = await fetch(url, {
      headers: {
        "X-Portal-Secret": (process.env.VPS_SECRET ?? "").trim(),
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
