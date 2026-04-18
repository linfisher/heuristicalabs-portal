import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"
import { getProject } from "@/lib/projects"
import { getProjectBySlug } from "@/lib/registry"
import { PDFThumbnail } from "@/components/PDFThumbnail"
import ProjectAdminActions from "@/components/ProjectAdminActions"

export const dynamic = "force-dynamic"

interface Props {
  params: { slug: string }
  searchParams: { forbidden?: string; welcome?: string }
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const { slug } = params

  if (searchParams.forbidden === "1") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-3xl font-bold text-white mb-4">Access Required</h1>
          <p className="text-gray-400 mb-8">
            You don&apos;t have access to this project. Request access below.
          </p>
          <Link
            href={`/portal/request-access?project=${slug}`}
            className="inline-block bg-[#E8147F] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Request Access
          </Link>
        </div>
      </div>
    )
  }

  // Admins see both active and archived projects; regular users only see active.
  const { userId } = await auth()
  let adminUser = false
  if (userId) {
    const user = await clerkClient.users.getUser(userId)
    adminUser = isAdminEmail(user.primaryEmailAddress?.emailAddress)
  }

  const stored = adminUser ? getProjectBySlug(slug) : undefined
  const project = stored ? { slug: stored.slug, name: stored.name, description: stored.description ?? "", vpsPath: stored.vpsPath, pages: stored.pages } : getProject(slug)
  if (!project) notFound()
  const projectStatus: "active" | "archived" = stored?.status ?? "active"

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh" }} className="px-6 py-10">
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {searchParams.welcome === "1" && (
          <div
            style={{ background: "#0f2d0f", border: "1px solid #22c55e", color: "#22c55e" }}
            className="mb-6 px-5 py-3 rounded-lg text-sm"
          >
            Access granted. Welcome to {project.name}.
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="text-sm mb-8" style={{ color: "#444" }}>
          <Link href="/portal" style={{ color: "#444" }} className="hover:text-gray-400 transition-colors">
            Portal
          </Link>
          <span className="mx-2">/</span>
          <span style={{ color: "#888" }}>{project.name}</span>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
          <h1
            style={{ color: "#E8147F", fontFamily: "var(--font-exo2)", margin: 0 }}
            className="text-3xl font-bold"
          >
            {project.name}
          </h1>
          {projectStatus === "archived" && (
            <span style={{
              background: "#2d2200",
              border: "1px solid #F5C418",
              color: "#F5C418",
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>Archived</span>
          )}
        </div>
        <p style={{ color: "#555" }} className="text-sm mb-6">
          {project.pages.length} document{project.pages.length !== 1 ? "s" : ""}
        </p>

        {adminUser && (
          <ProjectAdminActions slug={project.slug} name={project.name} status={projectStatus} />
        )}

        {project.pages.length === 0 ? (
          <p style={{ color: "#444" }}>No documents available.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "24px",
            }}
          >
            {project.pages.map((page) => {
              const proxyUrl = `/api/proxy/${slug}/${page.path}`
              return (
                <Link
                  key={page.path}
                  href={`/portal/projects/${slug}/${page.path}`}
                  style={{ textDecoration: "none" }}
                  className="group"
                >
                  <div
                    style={{
                      background: "#111",
                      border: "1px solid #1f1f1f",
                      borderRadius: "8px",
                      overflow: "hidden",
                      transition: "border-color 0.2s, transform 0.15s",
                      cursor: "pointer",
                    }}
                    className="group-hover:!border-[#E8147F44] group-hover:-translate-y-0.5"
                  >
                    {page.fileType === "pdf" ? (
                      <PDFThumbnail proxyUrl={proxyUrl} title={page.title} />
                    ) : page.fileType === "viewer" && page.thumbnailSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={page.thumbnailSrc}
                        alt={page.title}
                        style={{ width: "100%", aspectRatio: "8.5 / 11", objectFit: "cover", display: "block" }}
                      />
                    ) : page.fileType === "viewer" ? (
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "8.5 / 11",
                          background: "#141414",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                        }}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c99b3a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5" />
                          <path d="M2 12l10 5 10-5" />
                        </svg>
                        <span style={{ color: "#555", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Interactive 3D</span>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "8.5 / 11",
                          background: "#141414",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                    )}

                    <div style={{ padding: "10px 14px 13px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <p
                        style={{
                          color: "#cccccc",
                          fontSize: "0.8rem",
                          lineHeight: "1.35",
                          fontWeight: 500,
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        {page.title}
                      </p>
                      <span
                        style={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #2a2a2a",
                          borderRadius: "3px",
                          color: "#555555",
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          padding: "2px 5px",
                          flexShrink: 0,
                          marginTop: "1px",
                          textTransform: "uppercase",
                        }}
                      >
                        {page.fileType ?? "pdf"}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
