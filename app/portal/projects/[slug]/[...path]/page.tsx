import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getProjectPage } from "@/lib/projects";
import { fetchPage } from "@/lib/vps";

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

  const project = getProject(slug);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400">Project not found.</p>
      </div>
    );
  }

  const filePath = pathSegments.join("/");
  const page = getProjectPage(slug, filePath);

  if (!page) {
    notFound();
  }

  const pageTitle = page.title;

  // PDF — proxy route handles auth + byte streaming; no server-side fetch needed
  if (page.fileType === "pdf") {
    const proxyUrl = `/api/proxy/${slug}/${filePath}`;
    return (
      <div className="flex flex-col bg-[#0A0A0A]" style={{ minHeight: "100vh" }}>
        <Breadcrumb
          projectName={project.name}
          projectSlug={slug}
          pageTitle={pageTitle}
        />
        <iframe
          src={proxyUrl}
          title={pageTitle}
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
