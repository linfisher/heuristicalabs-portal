import { UserButton } from "@clerk/nextjs"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <nav
        style={{
          background: "#111111",
          borderBottom: "1px solid #222",
        }}
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6"
      >
        <a
          href="https://heuristicalabs.com"
          style={{ color: "#E8147F", fontFamily: "var(--font-exo2)" }}
          className="text-sm font-700 tracking-widest uppercase"
        >
          HEURISTICA LABS
        </a>
        <UserButton afterSignOutUrl="/portal/sign-in" />
      </nav>
      <main className="pt-16">{children}</main>
    </>
  )
}
