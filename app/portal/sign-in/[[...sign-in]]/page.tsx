import { SignIn } from "@clerk/nextjs"

interface Props {
  searchParams: { redirect_url?: string }
}

export default function SignInPage({ searchParams }: Props) {
  const redirectUrl = searchParams.redirect_url ?? "/portal"
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
      <SignIn forceRedirectUrl={redirectUrl} />
    </div>
  )
}
