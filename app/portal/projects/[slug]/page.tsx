import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";

interface Props {
  params: { slug: string };
  searchParams: { forbidden?: string; welcome?: string };
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const { slug } = params;

  if (searchParams.forbidden === "1") {
    const project = getProject(slug);
    const projectName = project?.name ?? slug;

    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-3xl font-bold text-white mb-4">Access Required</h1>
          <p className="text-gray-400 mb-8">
            You don&apos;t have access to {projectName}.
          </p>
          <Link
            href={`/portal/request-access?project=${slug}`}
            className="inline-block bg-[#E8147F] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#c9106e] transition-colors"
          >
            Request Access
          </Link>
        </div>
      </div>
    );
  }

  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-10">
      <div className="max-w-4xl mx-auto">
        {searchParams.welcome === "1" && (
          <div className="mb-6 bg-green-900/40 border border-green-700 text-green-300 px-5 py-3 rounded-lg text-sm">
            Access granted. Welcome to {project.name}.
          </div>
        )}

        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/portal" className="hover:text-gray-300 transition-colors">
            Portal
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{project.name}</span>
        </nav>

        <h1 className="text-3xl font-bold text-[#E8147F] mb-8">{project.name}</h1>

        {project.pages.length === 0 ? (
          <p className="text-gray-500">No pages available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.pages.map((page) => (
              <Link
                key={page.path}
                href={`/portal/projects/${slug}/${page.path}`}
                className="block bg-[#111] rounded-lg p-5 hover:bg-[#1a1a1a] transition-colors"
              >
                <span className="text-white font-medium">{page.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
