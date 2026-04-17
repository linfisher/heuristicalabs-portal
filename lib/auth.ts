import type { User } from "@clerk/nextjs/server"
import type { ProjectGrant } from "@/lib/types"

/**
 * Admin check — matches on the local part of the email only.
 * linfisher@gmail.com and linfisher@icloud.com both pass when ADMIN_EMAIL=linfisher@gmail.com.
 * Fails closed if ADMIN_EMAIL is unset.
 */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return false
  const adminLocal = adminEmail.toLowerCase().split("@")[0]
  const userLocal = email.toLowerCase().split("@")[0]
  return userLocal === adminLocal
}

export function readGrants(user: User): ProjectGrant[] {
  const raw = user.publicMetadata?.projects
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (g): g is ProjectGrant =>
      g !== null &&
      typeof g === "object" &&
      typeof (g as ProjectGrant).slug === "string" &&
      typeof (g as ProjectGrant).expiresAt === "number"
  )
}
