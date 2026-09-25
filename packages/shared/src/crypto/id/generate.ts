import crypto from "node:crypto";

export function generateAlphaNumericId(length: number = 10): string {
  let id: string;
  do {
    id = crypto.randomBytes(length).toString("base64url");
  } while (!isAlphanumeric(id));
  return id;
}

export function generateId(length: number = 10): string {
  return crypto.randomBytes(length).toString("base64url");
}

function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}
