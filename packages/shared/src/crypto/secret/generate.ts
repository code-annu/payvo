import crypto from "node:crypto";


export function generateRandomSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString("base64url");
}


