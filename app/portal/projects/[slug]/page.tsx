import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail, readGrants } from "@/lib/auth"
import { getProject } from "@/lib/projects"
import { getProjectBySlug } from "@/lib/registry"
import { embedSourceColor } from "@/lib/url-embed"
import { PDFThumbnail } from "@/components/PDFThumbnail"
import ProjectAdminActions from "@/components/ProjectAdminActions"
import ProjectFileActions from "@/components/ProjectFileActions"
import FileAdminActions from "@/components/FileAdminActions"
import { AddSectionButton } from "@/components/SectionControls"
import { SectionBlock } from "@/components/SectionBlock"
import { AccessDrawer, type AccessGrantRow } from "@/components/AccessDrawer"
import type { ProjectPage } from "@/lib/types"

export const dynamic = "force-dynamic"

interface Props {
  params: { slug: string }
  searchParams: { forbidden?: string; welcome?: string }
}

function chipFor(page: ProjectPage): { label: string; bg: string; border: string; text: string } {
  if (page.fileType === "pdf") return { label: "PDF", bg: "#2a0b1a", border: "#E8147F", text: "#E8147F" }
  if (page.fileType === "md") return { label: "MD", bg: "#2d2200", border: "#F5C418", text: "#F5C418" }
  if (page.fileType === "image") return { label: "IMAGE", bg: "#0a2a2d", border: "#14b8a6", text: "#14b8a6" }
  if (page.fileType === "video") return { label: "VIDEO", bg: "#1e0a2d", border: "#a855f7", text: "#a855f7" }
  if (page.fileType === "audio") return { label: "AUDIO", bg: "#2d1a00", border: "#fb923c", text: "#fb923c" }
  if (page.fileType === "file") return { label: "FILE", bg: "#1a1a1a", border: "#555", text: "#aaa" }
  if (page.fileType === "viewer") return { label: "3D", bg: "#2a1f00", border: "#c99b3a", text: "#c99b3a" }
  if (page.fileType === "embed" || page.fileType === "link") {
    const c = embedSourceColor(page.embedSource ?? "generic")
    const label = page.embedSource === "youtube" ? "YOUTUBE"
      : page.embedSource === "drive" ? "DRIVE"
      : page.embedSource === "dropbox" ? "DROPBOX"
      : page.embedSource === "vimeo" ? "VIMEO"
      : "LINK"
    return { label, bg: c.bg, border: c.border, text: c.text }
  }
  return { label: String(page.fileType).toUpperCase(), bg: "#1a1a1a", border: "#2a2a2a", text: "#555" }
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const { slug } = params

  const { userId } = await auth()
  let adminUser = false
  if (userId) {
    const user = await clerkClient.users.getUser(userId)
    adminUser = isAdminEmail(user.primaryEmailAddress?.emailAddress)
  }

  if (!adminUser && searchParams.forbidden === "1") {
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

  const storedAdmin = adminUser ? getProjectBySlug(slug) : undefined
  const storedAny = getProjectBySlug(slug)

  // Admin-only: gather users who have a grant for this project
  let accessGrants: AccessGrantRow[] = []
  if (adminUser) {
    try {
      const { data: users } = await clerkClient.users.getUserList({ limit: 200 })
      for (const u of users) {
        const grants = readGrants(u)
        const g = grants.find((x) => x.slug === slug)
        if (!g) continue
        accessGrants.push({
          userId: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.primaryEmailAddress?.emailAddress || "(no name)",
          email: u.primaryEmailAddress?.emailAddress ?? "(no email)",
          expiresAt: g.expiresAt,
        })
      }
      // Sort: active first (by expiresAt asc — soonest to expire on top), then expired
      accessGrants.sort((a, b) => a.expiresAt - b.expiresAt)
    } catch {
      // non-fatal; drawer just shows empty
      accessGrants = []
    }
  }
  const project = storedAdmin
    ? { slug: storedAdmin.slug, name: storedAdmin.name, description: storedAdmin.description ?? "", vpsPath: storedAdmin.vpsPath, pages: storedAdmin.pages, sectionOrder: storedAdmin.sectionOrder ?? [] }
    : getProject(slug)
  if (!project) notFound()
  const projectStatus: "active" | "archived" = storedAdmin?.status ?? "active"
  const sectionOrder: string[] = storedAdmin?.sectionOrder ?? storedAny?.sectionOrder ?? []

  // Sort pages: newest createdAt first, unknowns to the bottom.
  const sortedPages = [...project.pages].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))

  // Group pages by section. Empty section name = "unsectioned".
  const pagesBySection = new Map<string, ProjectPage[]>()
  for (const page of sortedPages) {
    const key = page.section && sectionOrder.includes(page.section) ? page.section : ""
    const list = pagesBySection.get(key) ?? []
    list.push(page)
    pagesBySection.set(key, list)
  }
  const unsectioned = pagesBySection.get("") ?? []
  const visibleSections = adminUser
    ? sectionOrder
    : sectionOrder.filter((s) => (pagesBySection.get(s)?.length ?? 0) > 0)

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
          <div style={{ marginBottom: "24px" }}>
            <ProjectAdminActions slug={project.slug} name={project.name} status={projectStatus} />
          </div>
        )}

        {adminUser && (
          <div style={{ marginBottom: "16px" }}>
            <AccessDrawer slug={project.slug} projectName={project.name} grants={accessGrants} />
          </div>
        )}

        {adminUser && <ProjectFileActions slug={project.slug} />}

        {adminUser && (
          <div style={{ margin: "16px 0 24px" }}>
            <AddSectionButton slug={project.slug} />
          </div>
        )}

        {project.pages.length === 0 && visibleSections.length === 0 ? (
          <p style={{ color: "#444" }}>No documents available.</p>
        ) : (
          <>
            {visibleSections.map((sectionName, idx) => {
              const pages = pagesBySection.get(sectionName) ?? []
              if (!adminUser && pages.length === 0) return null
              return (
                <SectionBlock
                  key={sectionName}
                  slug={project.slug}
                  sectionName={sectionName}
                  pageCount={pages.length}
                  adminUser={adminUser}
                  index={idx}
                  total={visibleSections.length}
                >
                  {pages.length === 0 ? (
                    <p style={{ color: "#555", fontSize: "0.8rem", fontStyle: "italic" }}>
                      Empty section — move files here via the dropdown on any card, or upload new ones.
                    </p>
                  ) : (
                    <CardGrid pages={pages} slug={project.slug} adminUser={adminUser} sections={sectionOrder} />
                  )}
                </SectionBlock>
              )
            })}

            {unsectioned.length > 0 && (
              visibleSections.length > 0 ? (
                <SectionBlock
                  slug={project.slug}
                  sectionName=""
                  pageCount={unsectioned.length}
                  adminUser={adminUser}
                >
                  <CardGrid pages={unsectioned} slug={project.slug} adminUser={adminUser} sections={sectionOrder} />
                </SectionBlock>
              ) : (
                <div data-section-name="" style={{ marginBottom: "32px" }}>
                  <CardGrid pages={unsectioned} slug={project.slug} adminUser={adminUser} sections={sectionOrder} />
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CardGrid({ pages, slug, adminUser, sections }: { pages: ProjectPage[]; slug: string; adminUser: boolean; sections: string[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "24px",
      }}
    >
      {pages.map((page) => {
        const chip = chipFor(page)
        const proxyUrl = `/api/proxy/${slug}/${page.path}`
        return (
          <div
            key={page.path}
            style={{
              position: "relative",
              background: "#111",
              border: "1px solid #1f1f1f",
              borderRadius: "8px",
              overflow: "hidden",
              transition: "border-color 0.2s, transform 0.15s",
            }}
            className="group hover:!border-[#E8147F44] hover:-translate-y-0.5"
          >
            <Link
              href={`/portal/projects/${slug}/${page.path}`}
              style={{ textDecoration: "none", display: "block", cursor: "pointer" }}
            >
              {page.fileType === "pdf" ? (
                <PDFThumbnail proxyUrl={proxyUrl} title={page.title} />
              ) : page.fileType === "md" ? (
                <ThumbPlaceholder icon="md" />
              ) : page.fileType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proxyUrl}
                  alt={page.title}
                  style={{ width: "100%", aspectRatio: "8.5 / 11", objectFit: "cover", display: "block", background: "#141414" }}
                />
              ) : page.fileType === "video" ? (
                <ThumbPlaceholder icon="video" />
              ) : page.fileType === "audio" ? (
                <ThumbPlaceholder icon="audio" />
              ) : page.fileType === "file" ? (
                <ThumbPlaceholder icon="generic" />
              ) : page.fileType === "embed" || page.fileType === "link" ? (
                <ThumbPlaceholder icon="link" />
              ) : page.fileType === "viewer" && page.thumbnailSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={page.thumbnailSrc}
                  alt={page.title}
                  style={{ width: "100%", aspectRatio: "8.5 / 11", objectFit: "cover", display: "block" }}
                />
              ) : page.fileType === "viewer" ? (
                <ThumbPlaceholder icon="viewer" />
              ) : (
                <ThumbPlaceholder icon="generic" />
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
                    backgroundColor: chip.bg,
                    border: `1px solid ${chip.border}`,
                    borderRadius: "3px",
                    color: chip.text,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    padding: "2px 6px",
                    flexShrink: 0,
                    marginTop: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  {chip.label}
                </span>
              </div>
            </Link>

            {adminUser && (
              <div style={{ padding: "0 14px 12px", display: "flex", justifyContent: "flex-end" }}>
                <FileAdminActions
                  slug={slug}
                  pagePath={page.path}
                  title={page.title}
                  sections={sections}
                  currentSection={page.section}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


function ThumbPlaceholder({ icon }: { icon: "md" | "link" | "viewer" | "generic" | "video" | "audio" }) {
  const content = icon === "md" ? (
    <>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5C418" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M8 12h6M8 16h6" />
      </svg>
      <span style={{ color: "#555", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Markdown</span>
    </>
  ) : icon === "link" ? (
    <>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <span style={{ color: "#555", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Link</span>
    </>
  ) : icon === "video" ? (
    <>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
      <span style={{ color: "#555", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Video</span>
    </>
  ) : icon === "audio" ? (
    <>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      <span style={{ color: "#555", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Audio</span>
    </>
  ) : icon === "viewer" ? (
    <>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c99b3a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
      <span style={{ color: "#555", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Interactive 3D</span>
    </>
  ) : (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )

  return (
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
      {content}
    </div>
  )
}
