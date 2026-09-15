import type { User } from "@clerk/nextjs/server"
import { clerkClient } from "@/lib/clerk"
import { grantsFromMetadata } from "@/lib/auth"
import { kv } from "@/lib/kv"
import { withUserGrantLock } from "@/lib/grant-lock"
import type { ProjectGrant } from "@/lib/types"

// Access for people who were invited but have not signed in yet. A Clerk
// invitation cannot be edited, so the admin's current choice for an invited
// email lives in the store under invite-grants:<email>. On the person's first
// portal visit those grants replace whatever the invitation copied onto the
// new account. The admin dashboard addresses an invited person as
// "invite:<email>" wherever it would pass a Clerk user id.

export const INVITE_TARGET_PREFIX = "invite:"

export function inviteTargetId(email: string): string {
  return `${INVITE_TARGET_PREFIX}${email.toLowerCase()}`
}

function pendingKey(email: string): string {
  return `invite-grants:${email.toLowerCase()}`
}

export async function setPendingGrants(email: string, grants: ProjectGrant[]): Promise<void> {
  await kv.set(pendingKey(email), grants)
}

export async function getStoredPendingGrants(email: string): Promise<ProjectGrant[] | null> {
  const stored = await kv.get<unknown>(pendingKey(email))
  return stored === null ? null : grantsFromMetadata({ projects: stored })
}

// Stored choice first; invites created before the store existed fall back to
// the grants on their pending Clerk invitation. Null = no pending invite.
export async function currentPendingGrants(email: string): Promise<ProjectGrant[] | null> {
  const stored = await getStoredPendingGrants(email)
  if (stored) return stored
  const { data } = await clerkClient.invitations.getInvitationList({ status: "pending", limit: 100 })
  const invite = data.find((i) => i.emailAddress.toLowerCase() === email.toLowerCase())
  return invite ? grantsFromMetadata(invite.publicMetadata) : null
}

// Called on the portal home page. Returns the applied grants, or null when
// this user has nothing pending.
export async function claimPendingGrants(user: User): Promise<ProjectGrant[] | null> {
  const email = user.primaryEmailAddress?.emailAddress
  if (!email) return null
  const pending = await getStoredPendingGrants(email)
  if (!pending) return null
  return withUserGrantLock(user.id, async () => {
    await clerkClient.users.updateUserMetadata(user.id, { publicMetadata: { projects: pending } })
    await kv.del(pendingKey(email))
    console.info("[invite] pending grants applied on first visit", { userId: user.id, email, count: pending.length })
    return pending
  })
}
