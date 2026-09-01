import crypto from "node:crypto";
import { Environment } from "./types.js";

export function generateApiKey(environment: Environment) {
  const keyId = `pvo_${environment}_${crypto.randomBytes(12).toString("base64url")}`;
  const keySecret = crypto.randomBytes(20).toString("base64url");
  return { keyId, keySecret };
}
