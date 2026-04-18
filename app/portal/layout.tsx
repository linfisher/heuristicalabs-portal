import Link from "next/link"
import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"
import { clerkClient } from "@/lib/clerk"
import { isAdminEmail } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Portal",
  robots: "noindex, nofollow",
}

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
        <div className="flex items-center gap-5">
          <Link
            href="/"
            style={{ color: "#E8147F", fontFamily: "var(--font-exo2)" }}
            className="text-sm font-bold tracking-widest uppercase"
          >
            HEURISTICA LABS
          </Link>
          <Link
            href="/portal"
            style={{
              color: "#888888",
              fontSize: "0.72rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "var(--font-exo2)",
              textDecoration: "none",
            }}
            className="hover:text-white transition-colors"
          >
            Portal
          </Link>
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/portal/support"
            style={{
              color: "#888888",
              fontSize: "0.72rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "var(--font-exo2)",
              textDecoration: "none",
            }}
            className="hover:text-white transition-colors"
          >
            Support
          </Link>
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
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: "32px", height: "32px" },
              },
            }}
          />
        </div>
      </nav>
      <main className="pt-16">{children}</main>
    </>
  )
}
