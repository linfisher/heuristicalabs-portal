import { Resend } from "resend"
import type { ReactElement } from "react"

const resend = new Resend(process.env.RESEND_API_KEY!)

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

  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to,
    subject,
    react,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
