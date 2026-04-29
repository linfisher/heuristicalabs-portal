"use client"

import { useEffect } from "react"

// Sits next to a sandboxed iframe and listens for a print-request message
// from inside it. When triggered, it focuses the iframe + calls print on
// its contentWindow. Used as a fallback path if the in-iframe window.print()
// gets blocked by the sandbox on certain browsers.
export default function IframePrintBridge() {
  useEffect(() => {
    function handler(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return
      if (e.data.type !== "proforma-print-request") return
      const iframe = document.querySelector<HTMLIFrameElement>("iframe")
      if (!iframe || !iframe.contentWindow) return
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      } catch {
        // Last-resort fallback: print the parent page itself.
        window.print()
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  return null
}
