import { SignJWT, jwtVerify } from "jose"
import { Redis } from "@upstash/redis"
import { randomUUID, createSecretKey } from "crypto"
import type { AccessToken } from "./types"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

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
  await redis.set(`token:${jti}`, "1", { ex: ttlSeconds })

  return token
}

export async function verifyToken(token: string): Promise<AccessToken> {
  let payload: AccessToken

  try {
    const { payload: raw } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    })
    payload = raw as unknown as AccessToken
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid token: ${message}`)
  }

  const exists = await redis.exists(`token:${payload.jti}`)
  if (!exists) {
    throw new Error("Token has already been used or has expired")
  }

  return payload
}

export async function deleteToken(jti: string): Promise<void> {
  await redis.del(`token:${jti}`)
}

export async function deleteGrantGroup(
  userId: string,
  projectSlug: string
): Promise<void> {
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
  await redis.set(groupKey, jtis, { ex: ttlSeconds })
}
