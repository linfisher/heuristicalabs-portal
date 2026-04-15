import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { clerkClient } from "@/lib/clerk"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!process.env.ADMIN_EMAIL) {
    redirect("/portal?error=misconfigured")
  }

  const { userId } = await auth()

  if (!userId) {
    redirect("/portal/sign-in")
  }

  const user = await clerkClient.users.getUser(userId)

  if (user.primaryEmailAddress?.emailAddress !== process.env.ADMIN_EMAIL) {
    redirect("/portal")
  }

  return <>{children}</>
}
