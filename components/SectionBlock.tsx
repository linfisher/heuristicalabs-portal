"use client"

import { useEffect, useState } from "react"
import { SectionHeaderAdmin } from "./SectionControls"

interface Props {
  slug: string
  sectionName: string            // "" means unsectioned
  pageCount: number
  adminUser: boolean
  index?: number
  total?: number
  defaultCollapsed?: boolean
  children: React.ReactNode
}

export function SectionBlock({ slug, sectionName, pageCount, adminUser, index = 0, total = 0, defaultCollapsed = false, children }: Props) {
  const storageKey = `sectionCollapsed:${slug}:${sectionName}`
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored === "1") setCollapsed(true)
      else if (stored === "0") setCollapsed(false)
    } catch {
      // localStorage may be disabled; ignore
    }
    setHydrated(true)
  }, [storageKey])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(storageKey, next ? "1" : "0")
    } catch {
      // ignore
    }
  }

  const chevron = (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
        transition: "transform 0.15s",
        color: "#555",
        fontSize: "0.7rem",
        marginRight: "8px",
      }}
    >
      ▼
    </span>
  )

  const isUnsectioned = sectionName === ""
  const displayName = isUnsectioned ? "Unsectioned" : sectionName

  return (
    <section data-section-name={sectionName} style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? "Expand" : "Collapse"} section ${displayName}`}
          style={toggleBtnStyle}
        >
          {chevron}
          <span style={publicSectionTitle}>
            {displayName}
            <span style={sectionCountStyle}> · {pageCount}</span>
          </span>
        </button>

        {adminUser && !isUnsectioned && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <SectionHeaderAdmin
              slug={slug}
              name={sectionName}
              index={index}
              total={total}
              pageCount={pageCount}
            />
          </div>
        )}
      </div>

      {/* Always mount children to preserve PDF thumbnail caches, but hide when collapsed */}
      <div
        style={{
          display: collapsed && hydrated ? "none" : "block",
          marginTop: "16px",
        }}
      >
        {children}
      </div>
    </section>
  )
}

const toggleBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "10px 0",
  display: "flex",
  alignItems: "center",
  fontFamily: "var(--font-exo2)",
  color: "inherit",
  textAlign: "left",
}

const publicSectionTitle: React.CSSProperties = {
  color: "#F5C418",
  fontFamily: "var(--font-exo2)",
  fontSize: "1.05rem",
  fontWeight: 700,
  letterSpacing: "0.02em",
}

const sectionCountStyle: React.CSSProperties = {
  color: "#555",
  fontWeight: 400,
  fontSize: "0.85rem",
}
