"use client"

import { useState } from "react"
import type React from "react"

// A user row on the admin dashboard. Whether it starts open comes from the
// server once; after that the admin controls it, so a save that refreshes the
// page does not collapse the row being edited.
export function UserRowDetails({ defaultOpen, children }: { defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details className="user-row" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      {children}
    </details>
  )
}
