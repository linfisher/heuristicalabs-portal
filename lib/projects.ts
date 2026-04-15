import type { Project } from "./types"

export const PROJECTS: Project[] = [
  {
    slug: "bridgebox",
    name: "BridgeBox",
    description: "System schematics, parts specifications, and pricing for all three offer tiers.",
    vpsPath: "/projects/bridgebox",
    pages: [
      { path: "schematic-offer-a", title: "Schematic — Offer A (Premium)", fileType: "html" },
      { path: "schematic-offer-b", title: "Schematic — Offer B (Standard)", fileType: "html" },
      { path: "schematic-offer-c", title: "Schematic — Offer C (Value)", fileType: "html" },
      { path: "parts-offer-a",     title: "Parts — Offer A",              fileType: "html" },
      { path: "parts-offer-b",     title: "Parts — Offer B",              fileType: "html" },
      { path: "parts-offer-c",     title: "Parts — Offer C",              fileType: "html" },
      { path: "comparison",        title: "Comparison Chart",              fileType: "html" },
    ],
  },
]

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug)
}

export function getProjectPage(slug: string, path: string) {
  const project = getProject(slug)
  return project?.pages.find((p) => p.path === path)
}
