import { Resend } from "resend"
import type { ReactElement } from "react"

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: ReactElement
}) {
  if (!to || !to.includes("@") || !to.includes(".")) {
    throw new Error(`Invalid recipient email address: ${to}`)
  }

  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set")
  if (!process.env.FROM_EMAIL) throw new Error("FROM_EMAIL not set")

  // Lazy-initialize so the constructor doesn't throw at build time
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    react,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
