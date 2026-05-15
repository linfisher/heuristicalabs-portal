import type React from "react"
import { clerkClient } from "@/lib/clerk"
import { readGrants } from "@/lib/auth"
import { getProject } from "@/lib/projects"
import { getActiveProjects, getArchivedProjects } from "@/lib/projects-registry"
import { AdminProjectsPanel } from "@/components/AdminProjectsPanel"
import { GrantAccessForm } from "@/components/GrantAccessForm"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"

const DURATIONS = [
  { label: "24 hours", chip: "24h", ms: 86400000 },
  { label: "3 days",   chip: "3d",  ms: 259200000 },
  { label: "7 days",   chip: "7d",  ms: 604800000 },
  { label: "30 days",  chip: "30d", ms: 2592000000 },
  { label: "90 days",  chip: "90d", ms: 7776000000 },
]

const DEFAULT_GRANT_MS = 2592000000 // 30 days

// Bucket the grant's remaining time into the smallest DURATION that still
// covers it. Used to visually highlight which chip represents the user's
// current state ("you set this to 90d, so the 90d chip is active").
function currentBucketMs(remainingMs: number): number {
  for (const d of DURATIONS) {
    if (d.ms >= remainingMs) return d.ms
  }
  return DEFAULT_GRANT_MS
}

// If every checked-pre-grant shares one bucket, pre-select that bucket in
// the Grant Now dropdown. Otherwise fall back to the new-grant default.
function commonBucketMs(liveGrants: ProjectGrant[], now: number): number {
  if (liveGrants.length === 0) return DEFAULT_GRANT_MS
  const buckets = Array.from(new Set(liveGrants.map((g) => currentBucketMs(g.expiresAt - now))))
  return buckets.length === 1 && buckets[0] !== undefined ? buckets[0] : DEFAULT_GRANT_MS
}

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
  searchParams: {
    granted?: string
    extended?: string
    notified?: string
    archived?: string
    restored?: string
    error?: string
  }
}) {
  const [{ data: users }, activeProjects, archivedProjects] = await Promise.all([
    clerkClient.users.getUserList({ limit: 200 }),
    getActiveProjects(),
    getArchivedProjects(),
  ])

  // Split archived users out of every flow. Archived users keep their
  // grants + history forever — they just don't appear in the active list,
  // stats, or grant flows.
  const activeUsers = users.filter((u) => !(u.privateMetadata as { archivedAt?: number } | undefined)?.archivedAt)
  const archivedUsers = users.filter((u) => !!(u.privateMetadata as { archivedAt?: number } | undefined)?.archivedAt)

  // Compute stats (active users only)
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  let activeCount = 0
  let expiringSoonCount = 0
  let noAccessCount = 0

  for (const user of activeUsers) {
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
            Heuristica Labs Portal — {activeUsers.length} active user{activeUsers.length !== 1 ? "s" : ""}
            {archivedUsers.length > 0 && ` · ${archivedUsers.length} archived`}
          </p>
        </div>

        {/* Flash messages */}
        {searchParams.granted === "1" && (
          <FlashMessage color="#22c55e" bg="#0f2d0f" border="#22c55e">
            Access granted.
          </FlashMessage>
        )}
        {searchParams.extended === "1" && (
          <FlashMessage color="#22c55e" bg="#0f2d0f" border="#22c55e">
            Access extended.
          </FlashMessage>
        )}
        {searchParams.notified === "1" && (
          <FlashMessage color="#22c55e" bg="#0f2d0f" border="#22c55e">
            User notified by email.
          </FlashMessage>
        )}
        {searchParams.archived === "1" && (
          <FlashMessage color="#22c55e" bg="#0f2d0f" border="#22c55e">
            User archived. Restore from the Archived Users section below.
          </FlashMessage>
        )}
        {searchParams.restored === "1" && (
          <FlashMessage color="#22c55e" bg="#0f2d0f" border="#22c55e">
            User restored.
          </FlashMessage>
        )}
        {searchParams.error && (
          <FlashMessage color="#ef4444" bg="#2d0f0f" border="#ef4444">
            Action failed ({searchParams.error}). Try again.
          </FlashMessage>
        )}

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "40px" }}>
          <StatCard label="Total Users" value={activeUsers.length} color="#888888" />
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
          <strong style={{ color: "#888888" }}>How this works</strong> — pick projects and a duration under <em>Grant Access</em>, or use the <em>Set to:</em> chips next to each existing grant to change duration. Changes are silent. When you&apos;re done making changes, click <em>Notify User</em> to send one email summarizing their current access.
        </div>

        {/* Projects management */}
        <AdminProjectsPanel active={activeProjects} archived={archivedProjects} />

        {/* Inject a tiny style block so native <details> plays nicely in our dark theme */}
        <style>{`
          .user-row { border: 1px solid #1f1f1f; border-radius: 8px; background: #0d0d0d; }
          .user-row + .user-row { margin-top: 6px; }
          .user-row > summary { list-style: none; cursor: pointer; padding: 14px 18px; display: flex; align-items: center; gap: 12px; }
          .user-row > summary::-webkit-details-marker { display: none; }
          .user-row > summary .chev { display: inline-block; color: #666; font-size: 0.75rem; transition: transform 0.15s ease; width: 12px; text-align: center; }
          .user-row[open] > summary .chev { transform: rotate(90deg); }
          .user-row > summary:hover .chev { color: #aaa; }
        `}</style>

        {/* Users list — each user is a collapsible row.
            Sort: users with live grants first, then alphabetically by first name.
            Users with no live grants (revoked / none) sink to the bottom. */}
        <div>
          {[...activeUsers].sort((a, b) => {
            const aLive = readGrants(a).some((g) => g.expiresAt > now)
            const bLive = readGrants(b).some((g) => g.expiresAt > now)
            if (aLive !== bLive) return aLive ? -1 : 1
            const aKey = (a.firstName || a.primaryEmailAddress?.emailAddress || "").toLowerCase()
            const bKey = (b.firstName || b.primaryEmailAddress?.emailAddress || "").toLowerCase()
            return aKey.localeCompare(bKey)
          }).map((user) => {
            const email = user.primaryEmailAddress?.emailAddress ?? "(no email)"
            const name =
              [user.firstName, user.lastName].filter(Boolean).join(" ") || email
            const grants = readGrants(user)
            const liveGrants = grants.filter((g) => g.expiresAt > now)
            const hasAnyLiveGrant = liveGrants.length > 0

            return (
              <details key={user.id} className="user-row" open={hasAnyLiveGrant}>
                <summary>
                  <span className="chev">▸</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9rem" }}>{name}</div>
                    <div style={{ color: "#555555", marginTop: "2px", fontSize: "0.72rem" }}>{email}</div>
                  </div>
                  <div style={{ color: hasAnyLiveGrant ? "#22c55e" : "#555555", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                    {hasAnyLiveGrant
                      ? `${liveGrants.length} active grant${liveGrants.length !== 1 ? "s" : ""}`
                      : "no access"}
                  </div>
                </summary>

                <div style={{ display: "flex", gap: "20px", padding: "4px 18px 18px", flexWrap: "wrap" }}>

                  {/* Current Access */}
                  <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                    <div style={colHeader}>Current Access</div>
                    {liveGrants.length === 0 ? (
                      <span style={{ color: "#444444", fontSize: "0.8rem", fontStyle: "italic" }}>
                        No access yet
                      </span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {liveGrants.map((grant) => {
                          const status = grantStatus(grant, now)
                          const colors = STATUS_COLORS[status]
                          const projectName = getProject(grant.slug)?.name ?? grant.slug
                          const days = daysRemaining(grant.expiresAt, now)
                          const expiry = formatExpiry(grant.expiresAt)
                          const activeBucket = currentBucketMs(grant.expiresAt - now)

                          return (
                            <div
                              key={grant.slug}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                paddingBottom: "8px",
                                borderBottom: "1px solid #1a1a1a",
                              }}
                            >
                              {/* Row 1: project badge + current state + Revoke */}
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
                                <span style={{ color: colors.text, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                                  {status === "expired"
                                    ? `Expired ${expiry}`
                                    : `${days}d · ${expiry}`}
                                </span>
                                <form
                                  action="/portal/admin/revoke"
                                  method="POST"
                                  style={{ marginLeft: "auto" }}
                                >
                                  <input type="hidden" name="userId" value={user.id} />
                                  <input type="hidden" name="projectSlug" value={grant.slug} />
                                  <button type="submit" style={btnRevokeLink} title="Revoke access">
                                    Revoke
                                  </button>
                                </form>
                              </div>

                              {/* Row 2: one-click duration chips */}
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                                <span style={{ color: "#666666", fontSize: "0.7rem", marginRight: "2px" }}>
                                  Set to:
                                </span>
                                {DURATIONS.map((d) => (
                                  <form
                                    key={d.ms}
                                    action="/portal/admin/extend"
                                    method="POST"
                                    style={{ display: "inline" }}
                                  >
                                    <input type="hidden" name="userId" value={user.id} />
                                    <input type="hidden" name="projectSlug" value={grant.slug} />
                                    <input type="hidden" name="durationMs" value={d.ms} />
                                    <button
                                      type="submit"
                                      style={d.ms === activeBucket ? btnDurationChipActive : btnDurationChip}
                                      title={`Set ${projectName} access to ${d.label}`}
                                    >
                                      {d.chip}
                                    </button>
                                  </form>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Grant Access — boxes are pre-checked for projects the user
                      currently has a LIVE grant on, so the admin can see existing
                      access at a glance. The Grant Now button is dimmed until the
                      admin actually changes something (toggles a box or changes the
                      duration), then lights up to signal the change is ready to apply. */}
                  <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                    <div style={colHeader}>Grant Access</div>
                    <GrantAccessForm
                      userId={user.id}
                      projects={activeProjects.map((p) => ({ slug: p.slug, name: p.name }))}
                      initialCheckedSlugs={liveGrants.map((g) => g.slug)}
                      initialDurationMs={commonBucketMs(liveGrants, now)}
                      durations={DURATIONS}
                    />
                    {hasAnyLiveGrant && (
                      <form
                        action="/portal/admin/notify"
                        method="POST"
                        style={{ marginTop: "8px" }}
                      >
                        <input type="hidden" name="userId" value={user.id} />
                        <button type="submit" style={btnNotify} title="Send a summary email of this user's current access">
                          Notify User
                        </button>
                      </form>
                    )}
                    <form
                      action="/portal/admin/users/archive"
                      method="POST"
                      style={{ marginTop: "8px" }}
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit" style={btnArchiveUser} title="Archive this user (hide from active list, keep history). Never deleted.">
                        Archive User
                      </button>
                    </form>
                  </div>

                </div>
              </details>
            )
          })}
        </div>

        {/* Archived Users — collapsed by default. Records preserved forever
            (Clerk metadata never deleted). Click Restore to bring back into
            the active list. */}
        {archivedUsers.length > 0 && (
          <details style={{ marginTop: "40px", border: "1px solid #1f1f1f", borderRadius: "8px", background: "#0d0d0d" }}>
            <summary style={{ cursor: "pointer", padding: "14px 18px", color: "#888", fontSize: "0.85rem", fontWeight: 600, listStyle: "none" }}>
              <span style={{ marginRight: "6px" }}>▸</span>
              Archived Users ({archivedUsers.length})
            </summary>
            <div style={{ padding: "0 18px 18px" }}>
              {[...archivedUsers]
                .sort((a, b) => {
                  const aArch = ((a.privateMetadata ?? {}) as { archivedAt?: number }).archivedAt ?? 0
                  const bArch = ((b.privateMetadata ?? {}) as { archivedAt?: number }).archivedAt ?? 0
                  return bArch - aArch
                })
                .map((user) => {
                  const email = user.primaryEmailAddress?.emailAddress ?? "(no email)"
                  const name =
                    [user.firstName, user.lastName].filter(Boolean).join(" ") || email
                  const archivedAt = ((user.privateMetadata ?? {}) as { archivedAt?: number }).archivedAt
                  return (
                    <div
                      key={user.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 0",
                        borderBottom: "1px solid #1a1a1a",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "#aaaaaa", fontWeight: 500, fontSize: "0.85rem" }}>{name}</div>
                        <div style={{ color: "#555555", marginTop: "2px", fontSize: "0.72rem" }}>{email}</div>
                      </div>
                      {archivedAt && (
                        <div style={{ color: "#555555", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                          archived {formatExpiry(archivedAt)}
                        </div>
                      )}
                      <form action="/portal/admin/users/restore" method="POST">
                        <input type="hidden" name="userId" value={user.id} />
                        <button type="submit" style={btnRestoreUser} title="Restore this user to the active list">
                          Restore
                        </button>
                      </form>
                    </div>
                  )
                })}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

const colHeader: React.CSSProperties = {
  color: "#666666",
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "8px",
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

const btnDurationChip: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "3px",
  color: "#aaaaaa",
  cursor: "pointer",
  fontSize: "0.7rem",
  fontWeight: 600,
  padding: "2px 7px",
  whiteSpace: "nowrap",
}

const btnDurationChipActive: React.CSSProperties = {
  ...btnDurationChip,
  backgroundColor: "#22c55e",
  border: "1px solid #22c55e",
  color: "#0a0a0a",
}

const btnNotify: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  color: "#aaaaaa",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: 600,
  padding: "6px 12px",
  width: "100%",
}

const btnArchiveUser: React.CSSProperties = {
  ...btnNotify,
  color: "#666666",
  fontSize: "0.7rem",
  padding: "4px 10px",
}

const btnRestoreUser: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #2a4a2a",
  borderRadius: "4px",
  color: "#22c55e",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: 600,
  padding: "4px 12px",
  whiteSpace: "nowrap",
}

const btnRevokeLink: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "none",
  color: "#888888",
  cursor: "pointer",
  fontSize: "0.7rem",
  padding: "2px 4px",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  whiteSpace: "nowrap",
}

