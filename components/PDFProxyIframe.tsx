"use client"

import { useEffect, useState } from "react"

interface Props {
  proxyUrl: string
  title: string
}

export default function PDFProxyIframe({ proxyUrl, title }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null

    fetch(proxyUrl, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load document")
        return res.blob()
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error")
      })

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [proxyUrl])

  if (error) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#9ca3af" }}>{error}</p>
      </div>
    )
  }

  if (!blobUrl) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#9ca3af" }}>Loading...</p>
      </div>
    )
  }

  return (
    <iframe
      src={blobUrl}
      title={title}
      style={{ width: "100%", border: "none", flex: 1, minHeight: "calc(100vh - 52px)" }}
    />
  )
}
