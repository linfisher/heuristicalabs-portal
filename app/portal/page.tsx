import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { clerkClient } from "@/lib/clerk"
import { getAllActiveProjects, getProject } from "@/lib/projects"
import { getAllProjects } from "@/lib/registry"
import { isAdminEmail } from "@/lib/auth"
import AddProjectButton from "@/components/AddProjectButton"
import ProjectAdminActions from "@/components/ProjectAdminActions"
import type { ProjectGrant } from "@/lib/types"

const MS_72H = 72 * 60 * 60 * 1000

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default async function PortalPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const user = await clerkClient.users.getUser(userId)
  const admin = isAdminEmail(user.primaryEmailAddress?.emailAddress)

  if (admin) {
    const allProjects = getAllProjects()
    const active = allProjects.filter((p) => p.status === "active")
    const archived = allProjects.filter((p) => p.status === "archived")

    return (
      <div
        style={{ background: "#0A0A0A", minHeight: "calc(100vh - 4rem)", fontFamily: "var(--font-exo2)" }}
        className="px-6 py-12"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h1 style={{ color: "#FAF7F0" }} className="text-3xl font-semibold tracking-wide">
              All Projects
            </h1>
            <div className="flex items-center gap-3">
              <Link
                href="/portal/admin"
                style={{ color: "#888", border: "1px solid #333" }}
                className="text-xs uppercase tracking-widest px-3 py-2 rounded hover:text-white hover:border-[#555] transition-colors"
              >
                Admin Dashboard
              </Link>
              <AddProjectButton />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {active.map((project) => (
              <div
                key={project.slug}
                style={{ background: "#111", border: "1px solid #222" }}
                className="rounded-lg p-6 flex flex-col gap-4"
              >
                <div>
                  <h2 style={{ color: "#E8147F" }} className="text-xl font-semibold tracking-wide mb-2">
                    {project.name}
                  </h2>
                  <p style={{ color: "#888" }} className="text-sm leading-relaxed">
                    {project.description || <span style={{ color: "#444" }}>No description</span>}
                  </p>
                </div>
                <p style={{ color: "#444" }} className="text-xs">
                  {project.pages.length} document{project.pages.length !== 1 ? "s" : ""}
                </p>

                <ProjectAdminActions slug={project.slug} name={project.name} status="active" />

                <Link
                  href={`/portal/projects/${project.slug}`}
                  style={{ background: "#E8147F", color: "#FAF7F0" }}
                  className="inline-block text-center text-sm font-semibold tracking-wide px-4 py-2 rounded hover:opacity-90 transition-opacity"
                >
                  Open Project
                </Link>
              </div>
            ))}
          </div>

          {archived.length > 0 && (
            <details style={{ marginTop: "32px" }}>
              <summary style={{ color: "#555", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", padding: "8px 0" }}>
                {archived.length} archived project{archived.length !== 1 ? "s" : ""}
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                {archived.map((project) => (
                  <div
                    key={project.slug}
                    style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", opacity: 0.8 }}
                    className="rounded-lg p-6 flex flex-col gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 style={{ color: "#666" }} className="text-xl font-semibold tracking-wide">
                          {project.name}
                        </h2>
                        <span style={{
                          background: "#2d2200",
                          border: "1px solid #F5C418",
                          color: "#F5C418",
                          fontSize: "0.6rem",
                          letterSpacing: "0.1em",
                          padding: "2px 8px",
                        }} className="rounded-full uppercase font-semibold">
                          Archived
                        </span>
                      </div>
                      <p style={{ color: "#555" }} className="text-sm leading-relaxed">
                        {project.description || <span style={{ color: "#333" }}>No description</span>}
                      </p>
                    </div>
                    <p style={{ color: "#333" }} className="text-xs">
                      {project.pages.length} document{project.pages.length !== 1 ? "s" : ""}
                    </p>

                    <ProjectAdminActions slug={project.slug} name={project.name} status="archived" />
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    )
  }

  // Regular users — show only granted projects
  const allGrants = (user.publicMetadata?.projects ?? []) as ProjectGrant[]
  const now = Date.now()
  const validGrants = allGrants.filter((g) => g.expiresAt > now)

  const grantedProjects = validGrants
    .map((grant) => {
      const project = getProject(grant.slug)
      if (!project) return null
      return { grant, project }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <div
      style={{ background: "#0A0A0A", minHeight: "calc(100vh - 4rem)", fontFamily: "var(--font-exo2)" }}
      className="px-6 py-12"
    >
      <div className="max-w-4xl mx-auto">
        <h1
          style={{ color: "#FAF7F0" }}
          className="text-3xl font-semibold tracking-wide mb-10"
        >
          Your Projects
        </h1>

        {grantedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p style={{ color: "#888" }} className="text-lg mb-4">
              No active project access.
            </p>
            <Link
              href="/portal/request-access"
              style={{ color: "#E8147F" }}
              className="text-sm font-medium underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Request access
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {grantedProjects.map(({ grant, project }) => {
              const expiringSoon = grant.expiresAt - now < MS_72H
              return (
                <div
                  key={project.slug}
                  style={{ background: "#111", border: "1px solid #222" }}
                  className="rounded-lg p-6 flex flex-col gap-4"
                >
                  <div>
                    <h2
                      style={{ color: "#E8147F" }}
                      className="text-xl font-semibold tracking-wide mb-2"
                    >
                      {project.name}
                    </h2>
                    <p style={{ color: "#888" }} className="text-sm leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-auto">
                    <span style={{ color: "#555" }} className="text-xs">
                      Access until {formatDate(grant.expiresAt)}
                    </span>
                    {expiringSoon && (
                      <span
                        style={{
                          background: "#F5C41822",
                          color: "#F5C418",
                          border: "1px solid #F5C41844",
                        }}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                      >
                        Expires soon
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/portal/projects/${project.slug}`}
                    style={{ background: "#E8147F", color: "#FAF7F0" }}
                    className="inline-block text-center text-sm font-semibold tracking-wide px-4 py-2 rounded hover:opacity-90 transition-opacity"
                  >
                    Open Project
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
