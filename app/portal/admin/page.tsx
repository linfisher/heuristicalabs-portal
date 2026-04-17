import type React from "react"
import { clerkClient } from "@/lib/clerk"
import { readGrants } from "@/lib/auth"
import { getProject } from "@/lib/projects"
import { getActiveProjects, getArchivedProjects } from "@/lib/projects-registry"
import { AdminProjectsPanel } from "@/components/AdminProjectsPanel"
import type { ProjectGrant } from "@/lib/types"

const DURATIONS = [
  { label: "24 hours", ms: 86400000 },
  { label: "3 days",   ms: 259200000 },
  { label: "7 days",   ms: 604800000 },
  { label: "30 days",  ms: 2592000000 },
  { label: "90 days",  ms: 7776000000 },
]

function grantStatus(grant: ProjectGrant, now: number): "active" | "expiring" | "expired" {
  if (grant.expiresAt <= now) return "expired"
  if (grant.expiresAt <= now + 7 * 24 * 60 * 60 * 1000) return "expiring"
  return "active"
}

function daysRemaining(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
}

function formatExpiry(expiresAt: number): string {
  return new Date(expiresAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

const STATUS_COLORS = {
  active:   { bg: "#0f2d0f", border: "#22c55e", text: "#22c55e" },
  expiring: { bg: "#2d2200", border: "#F5C418", text: "#F5C418" },
  expired:  { bg: "#2d0f0f", border: "#ef4444", text: "#ef4444" },
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { sent?: string; granted?: string; extended?: string; error?: string }
}) {
  const [{ data: users, totalCount }, activeProjects, archivedProjects] = await Promise.all([
    clerkClient.users.getUserList({ limit: 200 }),
    getActiveProjects(),
    getArchivedProjects(),
  ])

  // Compute stats
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  let activeCount = 0
  let expiringSoonCount = 0
  let noAccessCount = 0

  for (const user of users) {
    const grants = readGrants(user)
    const liveGrants = grants.filter((g) => g.expiresAt > now)
    if (liveGrants.length === 0) {
      noAccessCount++
    } else {
      activeCount++
      if (liveGrants.some((g) => g.expiresAt <= now + sevenDaysMs)) {
        expiringSoonCount++
      }
    }
  }

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", padding: "48px 32px", fontFamily: "var(--font-exo2)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ color: "#ffffff", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: "#555555", marginTop: "6px", fontSize: "0.8125rem" }}>
            Heuristica Labs Portal — {totalCount} registered user{totalCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Flash messages */}
        {searchParams.sent === "1" && (
          <FlashMessage color="#22c55e" bg="#0f2d0f" border="#22c55e">
            Grant email sent. Admin will receive duration chips to finalize access.
          </FlashMessage>
        )}
        {searchParams.granted === "1" && (
          <FlashMessage color="#22c55e" bg="#0f2d0f" border="#22c55e">
            Access granted directly. User can log in now.
          </FlashMessage>
        )}
        {searchParams.extended === "1" && (
          <FlashMessage color="#F5C418" bg="#2d2200" border="#F5C418">
            Access extended successfully.
          </FlashMessage>
        )}
        {searchParams.error === "grant_failed" && (
          <FlashMessage color="#ef4444" bg="#2d0f0f" border="#ef4444">
            Failed to grant access. Try again.
          </FlashMessage>
        )}
        {searchParams.error === "extend_failed" && (
          <FlashMessage color="#ef4444" bg="#2d0f0f" border="#ef4444">
            Failed to extend access. Try again.
          </FlashMessage>
        )}
        {searchParams.error === "revoke_failed" && (
          <FlashMessage color="#ef4444" bg="#2d0f0f" border="#ef4444">
            Failed to revoke access. Try again.
          </FlashMessage>
        )}
        {searchParams.error === "email_failed" && (
          <FlashMessage color="#ef4444" bg="#2d0f0f" border="#ef4444">
            Failed to send grant email. Try again or use Direct Grant.
          </FlashMessage>
        )}

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "40px" }}>
          <StatCard label="Total Users" value={totalCount} color="#888888" />
          <StatCard label="Active Access" value={activeCount} color="#22c55e" />
          <StatCard label="Expiring Soon" value={expiringSoonCount} color="#F5C418" />
          <StatCard label="No Access" value={noAccessCount} color="#555555" />
        </div>

        {/* Info note */}
        <div
          style={{
            backgroundColor: "#111111",
            border: "1px solid #222222",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "32px",
            color: "#666666",
            fontSize: "0.8rem",
          }}
        >
          <strong style={{ color: "#888888" }}>Pending requests</strong> — received via email. Use Direct Grant below to skip the email flow and grant access instantly.
        </div>

        {/* Projects management */}
        <AdminProjectsPanel active={activeProjects} archived={archivedProjects} />

        {/* Users table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
              <th style={th}>User</th>
              <th style={th}>Current Access</th>
              <th style={th}>Direct Grant</th>
              <th style={th}>Email Grant</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const email = user.primaryEmailAddress?.emailAddress ?? "(no email)"
              const name =
                [user.firstName, user.lastName].filter(Boolean).join(" ") || email
              const grants = readGrants(user)
              const hasAnyLiveGrant = grants.some((g) => g.expiresAt > now)

              return (
                <tr key={user.id} style={{ borderBottom: "1px solid #1a1a1a" }}>

                  {/* User info */}
                  <td style={{ ...td, minWidth: "180px" }}>
                    <div style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.875rem" }}>{name}</div>
                    <div style={{ color: "#555555", marginTop: "3px", fontSize: "0.75rem" }}>{email}</div>
                    {!hasAnyLiveGrant && grants.length === 0 && (
                      <div style={{ color: "#444444", marginTop: "6px", fontSize: "0.7rem" }}>No grants</div>
                    )}
                  </td>

                  {/* Current Access */}
                  <td style={{ ...td, minWidth: "280px" }}>
                    {grants.length === 0 ? (
                      <span style={{ color: "#444444", fontSize: "0.8rem" }}>None</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {grants.map((grant) => {
                          const status = grantStatus(grant, now)
                          const colors = STATUS_COLORS[status]
                          const projectName = getProject(grant.slug)?.name ?? grant.slug
                          const days = daysRemaining(grant.expiresAt, now)
                          const expiry = formatExpiry(grant.expiresAt)

                          return (
                            <div key={grant.slug}>
                              {/* Status badge + days */}
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                <span
                                  style={{
                                    backgroundColor: colors.bg,
                                    border: `1px solid ${colors.border}`,
                                    color: colors.text,
                                    borderRadius: "4px",
                                    padding: "2px 8px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {projectName}
                                </span>
                                <span style={{ color: colors.text, fontSize: "0.75rem" }}>
                                  {status === "expired"
                                    ? `Expired ${expiry}`
                                    : `${days}d left — ${expiry}`}
                                </span>
                              </div>

                              {/* Extend + Revoke controls */}
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <form action="/portal/admin/extend" method="POST" style={{ display: "flex", gap: "6px" }}>
                                  <input type="hidden" name="userId" value={user.id} />
                                  <input type="hidden" name="projectSlug" value={grant.slug} />
                                  <select name="durationMs" style={selectStyle}>
                                    {DURATIONS.map((d) => (
                                      <option key={d.ms} value={d.ms}>{d.label}</option>
                                    ))}
                                  </select>
                                  <button type="submit" style={btnSecondary}>
                                    {status === "expired" ? "Restore" : "Extend"}
                                  </button>
                                </form>
                                <form action="/portal/admin/revoke" method="POST">
                                  <input type="hidden" name="userId" value={user.id} />
                                  <input type="hidden" name="projectSlug" value={grant.slug} />
                                  <button type="submit" style={btnDanger}>Revoke</button>
                                </form>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </td>

                  {/* Direct Grant */}
                  <td style={{ ...td, minWidth: "220px" }}>
                    <form
                      action="/portal/admin/direct-grant"
                      method="POST"
                      style={{ display: "flex", flexDirection: "column", gap: "6px" }}
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <select name="projectSlug" style={selectStyle}>
                        {activeProjects.map((p) => (
                          <option key={p.slug} value={p.slug}>{p.name}</option>
                        ))}
                      </select>
                      <select name="durationMs" style={selectStyle}>
                        {DURATIONS.map((d) => (
                          <option key={d.ms} value={d.ms}>{d.label}</option>
                        ))}
                      </select>
                      <button type="submit" style={btnPrimary}>
                        Grant Now
                      </button>
                    </form>
                  </td>

                  {/* Email Grant */}
                  <td style={{ ...td, minWidth: "160px" }}>
                    <form
                      action="/portal/admin/grant"
                      method="POST"
                      style={{ display: "flex", flexDirection: "column", gap: "6px" }}
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <select name="projectSlug" style={selectStyle}>
                        {activeProjects.map((p) => (
                          <option key={p.slug} value={p.slug}>{p.name}</option>
                        ))}
                      </select>
                      <button type="submit" style={btnGhost}>
                        Send Email
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FlashMessage({
  children,
  color,
  bg,
  border,
}: {
  children: React.ReactNode
  color: string
  bg: string
  border: string
}) {
  return (
    <div
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: "6px",
        padding: "12px 16px",
        marginBottom: "24px",
        color,
        fontSize: "0.875rem",
      }}
    >
      {children}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        backgroundColor: "#111111",
        border: "1px solid #1f1f1f",
        borderRadius: "8px",
        padding: "20px 24px",
      }}
    >
      <div style={{ color, fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}>{value}</div>
      <div style={{ color: "#666666", fontSize: "0.75rem", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: "left",
  color: "#555555",
  fontWeight: 600,
  padding: "10px 16px",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
}

const td: React.CSSProperties = {
  padding: "20px 16px",
  verticalAlign: "top",
}

const selectStyle: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  color: "#cccccc",
  fontSize: "0.8rem",
  padding: "5px 8px",
  width: "100%",
}

const btnPrimary: React.CSSProperties = {
  backgroundColor: "#E8147F",
  border: "none",
  borderRadius: "4px",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
  padding: "7px 14px",
  width: "100%",
}

const btnSecondary: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #333333",
  borderRadius: "4px",
  color: "#aaaaaa",
  cursor: "pointer",
  fontSize: "0.75rem",
  padding: "4px 10px",
  whiteSpace: "nowrap",
}

const btnGhost: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #333333",
  borderRadius: "4px",
  color: "#888888",
  cursor: "pointer",
  fontSize: "0.8rem",
  padding: "7px 14px",
  width: "100%",
}

const btnDanger: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #3d1515",
  borderRadius: "4px",
  color: "#ef4444",
  cursor: "pointer",
  fontSize: "0.75rem",
  padding: "4px 10px",
  whiteSpace: "nowrap",
}
