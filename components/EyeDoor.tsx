"use client"

import { useEffect, useRef, useState } from "react"

// The eye at the top of the portal home. For everyone it is artwork. When an
// href is passed (admin only, decided server-side so clients' pages never
// carry the address) it is also a hidden door: hold X to arm it (it becomes a
// link; the art itself never changes), or tap it 4 times quickly on a phone.
const TAPS_TO_OPEN = 4
const TAP_WINDOW_MS = 1500

// components/ is outside Tailwind's content globs, so style inline.
const layer = { position: "absolute", inset: 0, width: "100%", height: "100%", userSelect: "none" } as const

export default function EyeDoor({ href }: { href?: string }) {
  const [armed, setArmed] = useState(false)
  const taps = useRef<number[]>([])

  useEffect(() => {
    if (!href) return
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "x" && !typing(e.target)) setArmed(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "x") setArmed(false)
    }
    const off = () => setArmed(false)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", off)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", off)
    }
  }, [href])

  const onTap = () => {
    if (!href || armed) return
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < TAP_WINDOW_MS), now]
    if (taps.current.length >= TAPS_TO_OPEN) {
      taps.current = []
      window.open(href, "_blank", "noopener,noreferrer")
    }
  }

  const art = (
    <span style={{ position: "relative", display: "block", width: "clamp(150px, 24vw, 200px)", aspectRatio: "2500 / 2120" }} onClick={onTap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/eye-door.png" alt="" draggable={false} style={layer} />
    </span>
  )

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
      {armed && href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Command Center" style={{ display: "block", cursor: "pointer" }}>
          {art}
        </a>
      ) : (
        art
      )}
    </div>
  )
}
