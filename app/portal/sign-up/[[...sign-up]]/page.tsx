import { SignUp } from "@clerk/nextjs"

// Landing page for admin invitations: Clerk appends __clerk_ticket to this URL
// and <SignUp /> consumes it, so the invited user's grants arrive with the account.
export default function SignUpPage() {
  return (
    <div
      style={{
        background: "#0A0A0A",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-exo2)",
      }}
    >
      <p
        style={{ color: "#E8147F" }}
        className="text-sm font-semibold tracking-[0.25em] uppercase mb-8"
      >
        HEURISTICA LABS
      </p>
      <SignUp forceRedirectUrl="/portal" signInUrl="/portal/sign-in" />
    </div>
  )
}
