import { createHash, randomBytes } from "crypto"

const TOKEN_PREFIX = "px_"
const PREFIX_LENGTH = TOKEN_PREFIX.length + 7

export type GeneratedToken = {
  plaintext: string
  hash: string
  prefix: string
}

export function generateToken(): GeneratedToken {
  const random = randomBytes(32).toString("base64url")
  const plaintext = `${TOKEN_PREFIX}${random}`
  return {
    plaintext,
    hash: hashToken(plaintext),
    prefix: plaintext.slice(0, PREFIX_LENGTH),
  }
}

export function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex")
}
