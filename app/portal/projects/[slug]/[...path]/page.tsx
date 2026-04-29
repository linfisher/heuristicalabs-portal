import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@/lib/clerk";
import { isAdminEmail } from "@/lib/auth";
import { getProject, getProjectPage } from "@/lib/projects";
import { getProjectBySlug, resolveContentRoot } from "@/lib/registry";
import { fetchPage } from "@/lib/vps";
import PDFProxyIframe from "@/components/PDFProxyIframe";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string; path: string[] };
}

function Breadcrumb({
  projectName,
  projectSlug,
  pageTitle,
}: {
  projectName: string;
  projectSlug: string;
  pageTitle: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 px-6 py-4 flex items-center gap-1">
      <Link href="/portal" className="hover:text-gray-300 transition-colors">
        Portal
      </Link>
      <span className="mx-1">/</span>
      <Link
        href={`/portal/projects/${projectSlug}`}
        className="hover:text-gray-300 transition-colors"
      >
        {projectName}
      </Link>
      <span className="mx-1">/</span>
      <span className="text-gray-300">{pageTitle}</span>
    </nav>
  );
}

export default async function ProjectContentPage({ params }: Props) {
  const { slug, path: pathSegments } = params;

  // Admins see archived projects too; regular users only see active.
  const { userId } = await auth();
  let adminUser = false;
  if (userId) {
    const user = await clerkClient.users.getUser(userId);
    adminUser = isAdminEmail(user.primaryEmailAddress?.emailAddress);
  }

  const stored = adminUser ? getProjectBySlug(slug) : undefined;
  const project = stored
    ? { slug: stored.slug, name: stored.name, description: stored.description ?? "", vpsPath: stored.vpsPath, pages: stored.pages }
    : getProject(slug);

  if (!project) {
    notFound();
  }

  const filePath = pathSegments.join("/");
  const page = adminUser
    ? project.pages.find((p) => p.path === filePath)
    : getProjectPage(slug, filePath);

  if (!page) {
    notFound();
  }

  const pageTitle = page.title;

  // Markdown — read from disk, parse, sanitize, render
  if (page.fileType === "md") {
    const diskPath = path.join(resolveContentRoot(), "projects", slug, filePath);
    let html = "";
    try {
      const raw = await readFile(diskPath, "utf-8");
      const parsed = await marked.parse(raw, { gfm: true, breaks: true });
      html = DOMPurify.sanitize(parsed);
    } catch {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <p className="text-gray-400">Document unavailable.</p>
        </div>
      )
    }
    return (
      <div className="bg-[#0A0A0A]" style={{ minHeight: "100vh", color: "#e5e7eb" }}>
        <Breadcrumb projectName={project.name} projectSlug={slug} pageTitle={pageTitle} />
        <article
          style={{
            maxWidth: "820px",
            margin: "0 auto",
            padding: "24px 32px 80px",
            fontFamily: "var(--font-exo2), system-ui, sans-serif",
            lineHeight: 1.7,
            fontSize: "1.05rem",
          }}
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  // Embed (YouTube, Drive, Dropbox, Vimeo) — render the embed URL in an iframe
  if (page.fileType === "embed" && page.embedUrl) {
    return (
      <div className="flex flex-col bg-[#0A0A0A]" style={{ height: "100vh" }}>
        <Breadcrumb projectName={project.name} projectSlug={slug} pageTitle={pageTitle} />
        <iframe
          src={page.embedUrl}
          title={pageTitle}
          style={{ width: "100%", flex: 1, border: "none", display: "block" }}
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Plain external link — we don't embed, just show a card to open externally
  if (page.fileType === "link" && page.externalUrl) {
    return (
      <div className="flex flex-col bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <Breadcrumb projectName={project.name} projectSlug={slug} pageTitle={pageTitle} />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-semibold text-white mb-3">{pageTitle}</h1>
            <p className="text-sm text-gray-500 mb-6">
              This link opens in a new tab.
            </p>
            <a
              href={page.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#E8147F] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Open externally
            </a>
            <p className="text-xs text-gray-600 mt-6 break-all">{page.externalUrl}</p>
          </div>
        </div>
      </div>
    );
  }

  // Local viewer — read HTML server-side and inject as srcDoc to avoid X-Frame-Options blocking
  if (page.fileType === "viewer" && page.viewerSrc) {
    let viewerHtml = ""
    try {
      const filePath = path.join(process.cwd(), "public", page.viewerSrc)
      viewerHtml = await readFile(filePath, "utf-8")
    } catch {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <p className="text-gray-400">Viewer unavailable.</p>
        </div>
      )
    }
    return (
      <div style={{ position: "fixed", top: "64px", left: 0, right: 0, bottom: 0 }}>
        <iframe
          srcDoc={viewerHtml}
          title={pageTitle}
          sandbox="allow-scripts allow-same-origin allow-modals allow-downloads"
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      </div>
    )
  }

  // PDF — proxy route handles auth + byte streaming; no server-side fetch needed
  if (page.fileType === "pdf") {
    const proxyUrl = `/api/proxy/${slug}/${filePath}`;
    return (
      <div className="flex flex-col bg-[#0A0A0A]" style={{ height: "100vh" }}>
        <Breadcrumb
          projectName={project.name}
          projectSlug={slug}
          pageTitle={pageTitle}
        />
        <PDFProxyIframe proxyUrl={proxyUrl} title={pageTitle} />
      </div>
    );
  }

  // Image
  if (page.fileType === "image") {
    const proxyUrl = `/api/proxy/${slug}/${filePath}`
    return (
      <div className="bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <Breadcrumb projectName={project.name} projectSlug={slug} pageTitle={pageTitle} />
        <div style={{ padding: "24px 32px 60px", display: "flex", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proxyUrl} alt={pageTitle} style={{ maxWidth: "100%", maxHeight: "calc(100vh - 120px)", borderRadius: "6px" }} />
        </div>
      </div>
    )
  }

  // Video
  if (page.fileType === "video") {
    const proxyUrl = `/api/proxy/${slug}/${filePath}`
    return (
      <div className="bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <Breadcrumb projectName={project.name} projectSlug={slug} pageTitle={pageTitle} />
        <div style={{ padding: "24px 32px 60px", display: "flex", justifyContent: "center" }}>
          <video src={proxyUrl} controls style={{ maxWidth: "100%", maxHeight: "calc(100vh - 120px)", borderRadius: "6px", background: "#000" }} />
        </div>
      </div>
    )
  }

  // Audio
  if (page.fileType === "audio") {
    const proxyUrl = `/api/proxy/${slug}/${filePath}`
    return (
      <div className="bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <Breadcrumb projectName={project.name} projectSlug={slug} pageTitle={pageTitle} />
        <div style={{ padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <h1 className="text-xl font-semibold text-white">{pageTitle}</h1>
          <audio src={proxyUrl} controls style={{ width: "min(100%, 640px)" }} />
        </div>
      </div>
    )
  }

  // Generic file — offer download
  if (page.fileType === "file") {
    const proxyUrl = `/api/proxy/${slug}/${filePath}`
    const fileName = page.originalName ?? filePath
    return (
      <div className="flex flex-col bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <Breadcrumb projectName={project.name} projectSlug={slug} pageTitle={pageTitle} />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-semibold text-white mb-3">{pageTitle}</h1>
            <p className="text-sm text-gray-500 mb-6">No in-portal preview for this file type. Download to open it in its native app.</p>
            <a
              href={proxyUrl}
              download={fileName}
              className="inline-block bg-[#E8147F] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Download {fileName}
            </a>
          </div>
        </div>
      </div>
    )
  }

  const result = await fetchPage(project.vpsPath, filePath);

  if ("error" in result) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center flex-col gap-4 px-6 text-center">
        <p className="text-gray-400">{result.error}</p>
        <Link
          href={`/portal/projects/${slug}`}
          className="text-[#E8147F] hover:underline text-sm"
        >
          Back to {project.name}
        </Link>
      </div>
    );
  }

  const { content } = result;

  if (page.fileType === "html") {
    return (
      <div className="flex flex-col bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <Breadcrumb
          projectName={project.name}
          projectSlug={slug}
          pageTitle={pageTitle}
        />
        <iframe
          srcDoc={content}
          sandbox="allow-scripts"
          title="Project content"
          referrerPolicy="no-referrer"
          style={{
            width: "100%",
            height: "calc(100vh - 108px)",
            border: "none",
            flex: 1,
          }}
        />
      </div>
    );
  }

  if (page.fileType === "json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = content;
    }

    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <Breadcrumb
          projectName={project.name}
          projectSlug={slug}
          pageTitle={pageTitle}
        />
        <div className="px-6 pb-10">
          <pre className="bg-[#111] text-gray-300 font-mono text-sm overflow-auto p-6 rounded-lg">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // Fallback: render raw content in a pre block
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Breadcrumb
        projectName={project.name}
        projectSlug={slug}
        pageTitle={pageTitle}
      />
      <div className="px-6 pb-10">
        <pre className="bg-[#111] text-gray-300 font-mono text-sm overflow-auto p-6 rounded-lg">
          {content}
        </pre>
      </div>
    </div>
  );
}
