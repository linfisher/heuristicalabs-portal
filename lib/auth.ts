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
