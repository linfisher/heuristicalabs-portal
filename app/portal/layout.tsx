import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  let adminUser = false

  if (userId) {
    const user = await clerkClient.users.getUser(userId)
    adminUser = isAdminEmail(user.primaryEmailAddress?.emailAddress)
  }

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

        <div className="flex items-center gap-5">
          {adminUser && (
            <Link
              href="/portal/admin"
              style={{
                color: "#444444",
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "var(--font-exo2)",
                textDecoration: "none",
              }}
            >
              Admin
            </Link>
          )}
          <UserButton />
        </div>
      </nav>
      <main className="pt-16">{children}</main>
    </>
  )
}
