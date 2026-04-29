// Share-link tokens — admin-minted, file-scoped, no Clerk account required.
// A signed JWT carries the project slug + file path; Redis tracks the token's
// existence so the admin can revoke or it can naturally expire.
//
// Distinct from the project-grant tokens in lib/tokens.ts:
//   - access tokens are tied to a Clerk userId and issue a project-wide grant
//   - share tokens stand alone, bind to one specific file, and bypass Clerk
//     entirely for the viewer who has the link

import { SignJWT, jwtVerify } from "jose"
import { Redis } from "@upstash/redis"
import { randomUUID, createSecretKey } from "crypto"

export interface ShareToken {
  type: "share"
  slug: string
  pagePath: string
  jti: string
  iat: number
  exp: number
}

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

function getSecretKey() {
  const secret = process.env.TOKEN_SECRET
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("TOKEN_SECRET must be set and at least 32 bytes")
  }
  return createSecretKey(Buffer.from(secret))
}

export async function signShareToken(
  slug: string,
  pagePath: string,
  expiresInMs: number
): Promise<{ token: string; jti: string; expiresAt: number }> {
  const jti = randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const exp = now + Math.floor(expiresInMs / 1000)

  const token = await new SignJWT({ type: "share", slug, pagePath })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(jti)
    .sign(getSecretKey())

  const ttlSeconds = Math.ceil(expiresInMs / 1000)
  await getRedis().set(`share-token:${jti}`, "1", { ex: ttlSeconds })

  return { token, jti, expiresAt: exp * 1000 }
}

// Verify a share token — checks signature, expiry, and Redis presence (so
// admins can revoke). Multi-use within window — does NOT delete on verify.
export async function verifyShareToken(token: string): Promise<ShareToken> {
  let raw: Record<string, unknown>
  try {
    const result = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] })
    raw = result.payload as Record<string, unknown>
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid share token: ${message}`)
  }

  if (
    raw.type !== "share" ||
    typeof raw.slug !== "string" ||
    typeof raw.pagePath !== "string" ||
    typeof raw.jti !== "string"
  ) {
    throw new Error("Malformed share token payload")
  }

  const payload = raw as unknown as ShareToken
  const exists = await getRedis().get(`share-token:${payload.jti}`)
  if (!exists) {
    throw new Error("Share link has been revoked or has expired")
  }

  return payload
}

export async function revokeShareToken(jti: string): Promise<void> {
  await getRedis().del(`share-token:${jti}`)
}
