import type React from "react"
import { clerkClient } from "@/lib/clerk"
import { PROJECTS, getProject } from "@/lib/projects"
import type { ProjectGrant } from "@/lib/types"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { sent?: string }
}) {
  const { data: users } = await clerkClient.users.getUserList({ limit: 100 })

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", padding: "48px 32px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ color: "#ffffff", fontSize: "2rem", fontWeight: 700, marginBottom: "8px" }}>
          Admin Dashboard
        </h1>
        <p style={{ color: "#888888", marginBottom: "40px", fontSize: "0.875rem" }}>
          Heuristica Labs Portal — User Management
        </p>

        {searchParams.sent === "1" && (
          <div
            style={{
              backgroundColor: "#0f2d0f",
              border: "1px solid #22c55e",
              borderRadius: "6px",
              padding: "12px 16px",
              marginBottom: "32px",
              color: "#22c55e",
              fontSize: "0.875rem",
            }}
          >
            Grant email sent successfully.
          </div>
        )}

        <div
          style={{
            backgroundColor: "#111111",
            border: "1px solid #222222",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "40px",
            color: "#aaaaaa",
            fontSize: "0.875rem",
          }}
        >
          <strong style={{ color: "#ffffff" }}>Pending requests:</strong> Access requests are
          handled via email — approve or deny directly from the request email.
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.875rem",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #333333" }}>
              <th style={th}>User</th>
              <th style={th}>Active Grants</th>
              <th style={th}>Grant Access</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const email = user.emailAddresses[0]?.emailAddress ?? "(no email)"
              const name =
                [user.firstName, user.lastName].filter(Boolean).join(" ") || email
              const grants =
                (user.publicMetadata?.projects as ProjectGrant[] | undefined) ?? []

              return (
                <tr key={user.id} style={{ borderBottom: "1px solid #1f1f1f" }}>
                  <td style={td}>
                    <div style={{ color: "#ffffff", fontWeight: 600 }}>{name}</div>
                    <div style={{ color: "#888888", marginTop: "2px" }}>{email}</div>
                  </td>

                  <td style={td}>
                    {grants.length === 0 ? (
                      <span style={{ color: "#555555" }}>None</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {grants.map((grant) => {
                          const projectName =
                            getProject(grant.slug)?.name ?? grant.slug
                          const expiry = new Date(grant.expiresAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )
                          return (
                            <div
                              key={grant.slug}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span
                                style={{
                                  backgroundColor: "#1a1a2e",
                                  border: "1px solid #E8147F",
                                  color: "#E8147F",
                                  borderRadius: "4px",
                                  padding: "2px 8px",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {projectName} — expires {expiry}
                              </span>
                              <form action="/portal/admin/revoke" method="POST">
                                <input type="hidden" name="userId" value={user.id} />
                                <input
                                  type="hidden"
                                  name="projectSlug"
                                  value={grant.slug}
                                />
                                <button
                                  type="submit"
                                  style={{
                                    background: "none",
                                    border: "1px solid #444444",
                                    borderRadius: "4px",
                                    color: "#888888",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                    padding: "2px 8px",
                                  }}
                                >
                                  Revoke
                                </button>
                              </form>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </td>

                  <td style={td}>
                    <form
                      action="/portal/admin/grant"
                      method="POST"
                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="projectSlug"
                        style={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333333",
                          borderRadius: "4px",
                          color: "#ffffff",
                          fontSize: "0.8rem",
                          padding: "6px 10px",
                        }}
                      >
                        {PROJECTS.map((p) => (
                          <option key={p.slug} value={p.slug}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: "#E8147F",
                          border: "none",
                          borderRadius: "4px",
                          color: "#ffffff",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          padding: "6px 14px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Send Grant Email
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

const th: React.CSSProperties = {
  textAlign: "left",
  color: "#888888",
  fontWeight: 600,
  padding: "10px 16px",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
}

const td: React.CSSProperties = {
  padding: "16px 16px",
  verticalAlign: "top",
  color: "#cccccc",
}
