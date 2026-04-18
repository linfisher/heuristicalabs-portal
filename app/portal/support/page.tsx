import { getAllActiveProjects } from "@/lib/projects"
import SupportForm from "@/components/SupportForm"

export const dynamic = "force-dynamic"

export default function SupportPage() {
  const projects = getAllActiveProjects().map((p) => ({ slug: p.slug, name: p.name }))
  return <SupportForm projects={projects} />
}
