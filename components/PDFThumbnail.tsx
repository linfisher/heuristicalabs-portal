"use client"

import { useEffect, useRef, useState } from "react"

interface Props {
  proxyUrl: string
  title: string
}

// pdfjs-dist has a long-standing webpack ESM interop issue on Next 14; load
// the module + worker from a CDN so webpack stays out of the path. Version
// must match what we load to keep worker/main compatible.
const PDFJS_VERSION = "5.6.205"
const PDFJS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`
const PDFJS_WORKER_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`
const PDFJS_CMAP_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`
const PDFJS_STANDARD_FONTS = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`

// Global loader — all thumbnails share one pdfjs module
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null
function loadPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (pdfjsPromise) return pdfjsPromise
  pdfjsPromise = import(/* webpackIgnore: true */ /* @vite-ignore */ PDFJS_CDN).then((mod) => {
    mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN
    return mod as typeof import("pdfjs-dist")
  })
  return pdfjsPromise
}

export function PDFThumbnail({ proxyUrl, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loadingTaskRef = useRef<{ destroy: () => Promise<void> } | null>(null)
  const pdfRef = useRef<{ destroy: () => Promise<void> } | null>(null)
  const renderTaskRef = useRef<{ cancel: () => void; promise: Promise<void> } | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const pdfjsLib = await loadPdfjs()

        const response = await fetch(proxyUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const buffer = await response.arrayBuffer()
        if (cancelled) return

        const loadingTask = pdfjsLib.getDocument({
          data: buffer,
          cMapUrl: PDFJS_CMAP_URL,
          cMapPacked: true,
          standardFontDataUrl: PDFJS_STANDARD_FONTS,
        })
        loadingTaskRef.current = loadingTask
        const pdf = await loadingTask.promise
        pdfRef.current = pdf
        if (cancelled) return

        const page = await pdf.getPage(1)
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return

        // Render at 2x a standard 612pt wide PDF for crisp thumbnails
        const viewport = page.getViewport({ scale: 1 })
        const targetW = 620
        const scale = targetW / viewport.width
        const scaled = page.getViewport({ scale })

        canvas.width = scaled.width
        canvas.height = scaled.height

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const renderTask = page.render({ canvasContext: ctx, viewport: scaled, canvas })
        renderTaskRef.current = renderTask
        await renderTask.promise
        if (cancelled) return

        setState("ready")
      } catch (err) {
        if (typeof console !== "undefined") console.error("[PDFThumbnail]", proxyUrl, err)
        if (!cancelled) setState("error")
      }
    }

    render()
    return () => {
      cancelled = true
      renderTaskRef.current?.cancel()
      renderTaskRef.current = null
      loadingTaskRef.current?.destroy()
      loadingTaskRef.current = null
      pdfRef.current?.destroy()
      pdfRef.current = null
    }
  }, [proxyUrl])

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "8.5 / 11",
        background: "#141414",
        borderRadius: "4px 4px 0 0",
        overflow: "hidden",
      }}
    >
      {state === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#333", fontSize: "0.7rem", letterSpacing: "0.08em" }}>
            LOADING
          </span>
        </div>
      )}

      {state === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ color: "#2a2a2a", fontSize: "0.65rem", letterSpacing: "0.06em" }}>
            {title}
          </span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Preview of ${title}`}
        style={{
          width: "100%",
          height: "100%",
          display: state === "ready" ? "block" : "none",
          objectFit: "contain",
        }}
      />
    </div>
  )
}
