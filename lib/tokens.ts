import { SignJWT, jwtVerify } from "jose"
import { Redis } from "@upstash/redis"
import { randomUUID, createSecretKey } from "crypto"
import type { AccessToken } from "./types"
import { TOKEN_LINK_TTL_MS } from "./durations"

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

export async function signToken(
  payload: Omit<AccessToken, "jti" | "iat" | "exp">,
  expiresInMs: number
): Promise<string> {
  const jti = randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const exp = now + Math.floor(expiresInMs / 1000)

  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(jti)
    .sign(getSecretKey())

  const ttlSeconds = Math.ceil(expiresInMs / 1000)
  await getRedis().set(`token:${jti}`, "1", { ex: ttlSeconds })

  return token
}

export async function verifyToken(token: string): Promise<AccessToken> {
  let raw: Record<string, unknown>

  try {
    const result = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    })
    raw = result.payload as Record<string, unknown>
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid token: ${message}`)
  }

  if (
    typeof raw.type !== "string" ||
    (raw.type !== "accept" && raw.type !== "deny") ||
    typeof raw.userId !== "string" ||
    typeof raw.projectSlug !== "string" ||
    typeof raw.accessDurationMs !== "number" ||
    typeof raw.jti !== "string"
  ) {
    throw new Error("Malformed token payload")
  }

  const payload = raw as unknown as AccessToken

  const deleted = await getRedis().del(`token:${payload.jti}`)
  if (deleted === 0) {
    throw new Error("Token has already been used or has expired")
  }

  return payload
}

export async function deleteGrantGroup(
  userId: string,
  projectSlug: string
): Promise<void> {
  const redis = getRedis()
  const groupKey = `grant-group:${userId}:${projectSlug}`
  const jtis = await redis.get<string[]>(groupKey)

  if (jtis && jtis.length > 0) {
    const tokenKeys = jtis.map((jti) => `token:${jti}`)
    await redis.del(...tokenKeys)
  }

  await redis.del(groupKey)
}

export async function storeGrantGroup(
  userId: string,
  projectSlug: string,
  jtis: string[],
  ttlSeconds: number
): Promise<void> {
  const groupKey = `grant-group:${userId}:${projectSlug}`
  await getRedis().set(groupKey, jtis, { ex: ttlSeconds })
}

export { TOKEN_LINK_TTL_MS }
