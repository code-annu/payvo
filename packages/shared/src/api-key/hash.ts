import crypto from "node:crypto";

export function hashKeySecret(keySecret: string): string {
  return crypto.createHash("sha256").update(keySecret).digest("hex");
}
