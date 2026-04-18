import type { Project } from "./types"

export const PROJECTS: Project[] = [
  {
    slug: "hivibe-temple",
    name: "HiVibe Temple",
    description: "The HiVibe Kit franchise model and VibroMag Floor Tile system — schematics, BOM, and the full Kit business model.",
    vpsPath: "/projects/hivibe-temple",
    pages: [
      { path: "kit-the-model",          title: "HiVibe Kit — The Model",                        fileType: "pdf" },
      { path: "floor-tile-bom",         title: "Floor Tile — Bill of Materials",                 fileType: "pdf" },
      { path: "floor-tile-schematic-1", title: "Floor Tile Schematic — Tile Anatomy",            fileType: "pdf" },
      { path: "floor-tile-schematic-2", title: "Floor Tile Schematic — 4-Tile Connected Grid",   fileType: "pdf" },
      { path: "floor-tile-schematic-3", title: "Floor Tile Schematic — Pin Legend & Edge Seam",  fileType: "pdf" },
      { path: "floor-tile-schematic-4", title: "Floor Tile Schematic — Closed Cross-Section",    fileType: "pdf" },
      { path: "floor-tile-schematic-5", title: "Floor Tile Schematic — Exploded Cross-Section",  fileType: "pdf" },
      { path: "floor-tile-schematic-6", title: "Floor Tile Schematic — Zone Architecture",       fileType: "pdf" },
      { path: "floor-tile-schematic-7", title: "Floor Tile Schematic — Impedance & Amps",        fileType: "pdf" },
      { path: "floor-tile-schematic-8", title: "Floor Tile Schematic — Connector & Signal Chain", fileType: "pdf" },
    ],
  },
  {
    slug: "hivibe-magtiles",
    name: "HiVibe MagTiles",
    description: "HiVibe Floor Tile v19 interactive 3D viewer — full assembly with clamshell, Four-Star Plenum, wiring, and hardware details.",
    vpsPath: "/projects/hivibe-magtiles",
    pages: [
      {
        path: "floor-tile-viewer",
        title: "Floor Tile v19 — Interactive 3D Viewer",
        fileType: "viewer",
        viewerSrc: "/viewers/floor_tile_viewer.html",
      },
    ],
  },
  {
    slug: "bridgebox",
    name: "BridgeBox",
    description: "System schematics, parts specifications, and pricing for all three BridgeBox offer tiers — Value ($10K), Standard ($12.5K), and Premium ($17.5K).",
    vpsPath: "/projects/bridgebox",
    pages: [
      { path: "comparison",        title: "Offer Comparison Chart",                         fileType: "pdf" },
      { path: "schematic-offer-a", title: "Schematic — Offer A (Premium, $17,500)",         fileType: "pdf" },
      { path: "schematic-offer-b", title: "Schematic — Offer B (Standard, $12,500)",        fileType: "pdf" },
      { path: "schematic-offer-c", title: "Schematic — Offer C (Value, $10,000)",           fileType: "pdf" },
      { path: "parts-offer-a",     title: "Parts — Offer A (Premium, $17,500)",             fileType: "pdf" },
      { path: "parts-offer-b",     title: "Parts — Offer B (Standard, $12,500)",            fileType: "pdf" },
      { path: "parts-offer-c",     title: "Parts — Offer C (Value, $10,000)",               fileType: "pdf" },
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
