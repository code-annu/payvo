import crypto from "node:crypto";

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("base64url");
}
