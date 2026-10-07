import type React from "react"
import { clerkClient } from "@/lib/clerk"
import { grantsFromMetadata, isAdminEmail, readGrants } from "@/lib/auth"
import { getProject } from "@/lib/projects"
import { getActiveProjects, getArchivedProjects } from "@/lib/projects-registry"
import { AdminProjectsPanel } from "@/components/AdminProjectsPanel"
import { GrantAccessForm } from "@/components/GrantAccessForm"
import { AddUserForm } from "@/components/AddUserForm"
import { AdminActionButton } from "@/components/AdminActionButton"
import { GrantDurationChips } from "@/components/GrantDurationChips"
import { UserRowDetails } from "@/components/UserRowDetails"
import { DURATION_NEVER, isNeverExpiring } from "@/lib/durations"
import { getStoredPendingGrants, inviteTargetId } from "@/lib/pending-grants"
import type { ProjectGrant } from "@/lib/types"

export const dynamic = "force-dynamic"

const DURATIONS = [
  { label: "24 hours", chip: "24h", ms: 86400000 },
  { label: "3 days",   chip: "3d",  ms: 259200000 },
  { label: "7 days",   chip: "7d",  ms: 604800000 },
  { label: "30 days",  chip: "30d", ms: 2592000000 },
  { label: "90 days",  chip: "90d", ms: 7776000000 },
  { label: "Infinity", chip: "Infinity", ms: DURATION_NEVER },
]

const DEFAULT_GRANT_MS = 2592000000 // 30 days

// Bucket the grant's remaining time into the smallest DURATION that still
// covers it. Used to visually highlight which chip represents the user's
// current state ("you set this to 90d, so the 90d chip is active").
function currentBucketMs(grant: ProjectGrant, now: number): number {
  if (isNeverExpiring(grant.expiresAt)) return DURATION_NEVER
  const remainingMs = grant.expiresAt - now
  for (const d of DURATIONS) {
    if (d.ms >= remainingMs) return d.ms
  }
  return DEFAULT_GRANT_MS
}

// If every checked-pre-grant shares one bucket, pre-select that bucket in
// the Grant Access length dropdown. Otherwise fall back to the new-grant default.
function commonBucketMs(liveGrants: ProjectGrant[], now: number): number {
  if (liveGrants.length === 0) return DEFAULT_GRANT_MS
  const buckets = Array.from(new Set(liveGrants.map((g) => currentBucketMs(g, now))))
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

type PendingInvite = { id: string; email: string; createdAt: number; grants: ProjectGrant[] }
type ProjectOption = { slug: string; name: string }

export default async function AdminPage({
  searchParams,
}: {
  searchParams: {
    granted?: string
    extended?: string
    notified?: string
    archived?: string
    restored?: string
    invited?: string
    error?: string
  }
}) {
  const [{ data: users }, activeProjects, archivedProjects] = await Promise.all([
    clerkClient.users.getUserList({ limit: 200 }),
    getActiveProjects(),
    getArchivedProjects(),
  ])
  const projectOptions: ProjectOption[] = activeProjects.map((p) => ({ slug: p.slug, name: p.name }))

  // Invited people who have not signed in yet. They have no Clerk user; their
  // access is whatever the admin last set (stored), else what the invite carries.
  let pendingInvites: PendingInvite[] = []
  try {
    const { data } = await clerkClient.invitations.getInvitationList({ status: "pending", limit: 100 })
    pendingInvites = await Promise.all(
      data.map(async (i) => ({
        id: i.id,
        email: i.emailAddress,
        createdAt: i.createdAt,
        grants: (await getStoredPendingGrants(i.emailAddress)) ?? grantsFromMetadata(i.publicMetadata),
      })),
    )
    pendingInvites.sort((a, b) => b.createdAt - a.createdAt)
  } catch (err) {
    console.error("[admin] could not load pending invitations", err)
  }

  // Split archived users out of every flow. Archived users keep their
  // grants + history forever — they just don't appear in the active list,
  // stats, or grant flows.
  // The admin's own account(s) are not listed or counted — there is nothing to manage on them.
  const managedUsers = users.filter((u) => !isAdminEmail(u.primaryEmailAddress?.emailAddress))
  const activeUsers = managedUsers.filter((u) => !(u.privateMetadata as { archivedAt?: number } | undefined)?.archivedAt)
  const archivedUsers = managedUsers.filter((u) => !!(u.privateMetadata as { archivedAt?: number } | undefined)?.archivedAt)

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
            {pendingInvites.length > 0 && ` · ${pendingInvites.length} not signed in yet`}
            {archivedUsers.length > 0 && ` · ${archivedUsers.length} archived`}
          </p>
        </div>

        {/* Flash messages — only reached by plain form posts; the dashboard's
            own buttons save in place and show their result on the button. */}
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
        {searchParams.invited === "1" && (
          <FlashMessage color="#22c55e" bg="#0f2d0f" border="#22c55e">
            Invite sent. A copy went to your inbox. Their access is ready when they accept.
          </FlashMessage>
        )}
        {searchParams.error === "invite_exists" ? (
          <FlashMessage color="#F5C418" bg="#2d2200" border="#F5C418">
            That email already has an account or a pending invite. If they are in the list below, grant access on their row.
          </FlashMessage>
        ) : searchParams.error === "invite_email_failed" ? (
          <FlashMessage color="#ef4444" bg="#2d0f0f" border="#ef4444">
            The invite was created but the email did not send. Try again in a minute.
          </FlashMessage>
        ) : searchParams.error ? (
          <FlashMessage color="#ef4444" bg="#2d0f0f" border="#ef4444">
            Action failed ({searchParams.error}). Try again.
          </FlashMessage>
        ) : null}

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
          <strong style={{ color: "#888888" }}>How this works</strong> — every change saves the moment you make it: tick or untick projects under <em>Grant Access</em>, change the access length, or use the <em>Set to:</em> chips on an existing grant. Changes are silent. When you&apos;re done, click <em>Notify User</em> to send one email summarizing their current access. People invited but not signed in yet can be edited the same way; their access applies when they first sign in.
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

        <h2 style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 700, margin: "40px 0 0" }}>
          Users
          <span style={{ color: "#777777", fontSize: "0.8rem", fontWeight: 500, marginLeft: "10px" }}>
            {activeUsers.length} active
            {pendingInvites.length > 0 && ` · ${pendingInvites.length} invited, not signed in yet`}
          </span>
        </h2>

        <AddUserForm
          projects={projectOptions}
          durations={DURATIONS}
          defaultDurationMs={DEFAULT_GRANT_MS}
        />

        {/* Users list — invited people not signed in yet first, then each user.
            Every row is editable the same way. Sort: users with live grants first,
            then alphabetically by first name. Users with no live grants sink. */}
        <div>
          {pendingInvites.map((invite) => {
            const liveGrants = invite.grants.filter((g) => g.expiresAt > now)
            return (
              <UserRowDetails key={invite.id} defaultOpen>
                <summary>
                  <span className="chev">▸</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9rem" }}>{invite.email}</span>
                      <span style={awaitingTag}>Not signed in yet</span>
                    </div>
                    <div style={{ color: "#777777", marginTop: "2px", fontSize: "0.72rem" }}>
                      Invited {formatExpiry(invite.createdAt)} · access applies when they first sign in
                    </div>
                  </div>
                  <div style={{ color: liveGrants.length > 0 ? "#F5C418" : "#555555", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                    {liveGrants.length > 0
                      ? `${liveGrants.length} project${liveGrants.length !== 1 ? "s" : ""} set`
                      : "no projects set"}
                  </div>
                </summary>
                <AccessColumns
                  targetId={inviteTargetId(invite.email)}
                  liveGrants={liveGrants}
                  now={now}
                  projects={projectOptions}
                  actions={
                    <AdminActionButton
                      endpoint="/portal/admin/invite/resend"
                      json
                      payload={{ invitationId: invite.id }}
                      label="Resend Invite"
                      busyLabel="Sending..."
                      doneLabel="Invite resent"
                      tone="pink"
                      fullWidth
                      title={`Send ${invite.email} a fresh invite email with their current projects (you get a copy)`}
                    />
                  }
                />
              </UserRowDetails>
            )
          })}

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
            const liveGrants = readGrants(user).filter((g) => g.expiresAt > now)
            const hasAnyLiveGrant = liveGrants.length > 0

            return (
              <UserRowDetails key={user.id} defaultOpen={hasAnyLiveGrant}>
                <summary>
                  <span className="chev">▸</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9rem" }}>{name}</span>
                      {!user.lastSignInAt && <span style={awaitingTag}>Not signed in yet</span>}
                    </div>
                    <div style={{ color: "#555555", marginTop: "2px", fontSize: "0.72rem" }}>{email}</div>
                  </div>
                  <div style={{ color: hasAnyLiveGrant ? "#22c55e" : "#555555", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                    {hasAnyLiveGrant
                      ? `${liveGrants.length} active grant${liveGrants.length !== 1 ? "s" : ""}`
                      : "no access"}
                  </div>
                </summary>
                <AccessColumns
                  targetId={user.id}
                  liveGrants={liveGrants}
                  now={now}
                  projects={projectOptions}
                  actions={
                    <>
                      {hasAnyLiveGrant && (
                        <AdminActionButton
                          endpoint="/portal/admin/notify"
                          payload={{ userId: user.id }}
                          label="Notify User"
                          busyLabel="Sending email..."
                          doneLabel="Email sent"
                          tone="neutral"
                          fullWidth
                          title="Send a summary email of this user's current access (you get a copy)"
                        />
                      )}
                      <AdminActionButton
                        endpoint="/portal/admin/users/archive"
                        payload={{ userId: user.id }}
                        label="Archive User"
                        busyLabel="Archiving..."
                        doneLabel="Archived"
                        tone="neutral"
                        fullWidth
                        title="Archive this user (hide from active list, keep history). Never deleted."
                      />
                    </>
                  }
                />
              </UserRowDetails>
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
                      <AdminActionButton
                        endpoint="/portal/admin/users/restore"
                        payload={{ userId: user.id }}
                        label="Restore"
                        busyLabel="Restoring..."
                        doneLabel="Restored"
                        tone="success"
                        title="Restore this user to the active list"
                      />
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

// The two editable columns of a user row: Current Access (per-project state,
// Revoke, Set to chips) and Grant Access (autosaving checkboxes + length),
// followed by the row's action buttons. targetId is a Clerk user id or
// "invite:<email>" for someone invited who has not signed in yet.
function AccessColumns({
  targetId,
  liveGrants,
  now,
  projects,
  actions,
}: {
  targetId: string
  liveGrants: ProjectGrant[]
  now: number
  projects: ProjectOption[]
  actions: React.ReactNode
}) {
  return (
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
              const never = isNeverExpiring(grant.expiresAt)

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
                        : never
                          ? "Never expires"
                          : `${days}d · ${expiry}`}
                    </span>
                    <div style={{ marginLeft: "auto" }}>
                      <AdminActionButton
                        endpoint="/portal/admin/project-access"
                        json
                        payload={{ action: "revoke", userId: targetId, projectSlug: grant.slug }}
                        label="Revoke"
                        busyLabel="Revoking..."
                        doneLabel="Revoked"
                        tone="link"
                        title={`Revoke ${projectName} access`}
                      />
                    </div>
                  </div>

                  {/* Row 2: one-click duration chips */}
                  <GrantDurationChips
                    userId={targetId}
                    projectSlug={grant.slug}
                    projectName={projectName}
                    durations={DURATIONS}
                    activeMs={currentBucketMs(grant, now)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Grant Access — boxes are pre-checked for projects with LIVE access.
          Every tick, untick and length change saves immediately. */}
      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <div style={colHeader}>Grant Access</div>
        <GrantAccessForm
          userId={targetId}
          projects={projects}
          initialCheckedSlugs={liveGrants.map((g) => g.slug)}
          initialDurationMs={commonBucketMs(liveGrants, now)}
          durations={DURATIONS}
        />
        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {actions}
        </div>
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

const awaitingTag: React.CSSProperties = {
  backgroundColor: "#2d2200",
  border: "1px solid #F5C418",
  color: "#F5C418",
  borderRadius: "999px",
  padding: "1px 8px",
  fontSize: "0.62rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
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
