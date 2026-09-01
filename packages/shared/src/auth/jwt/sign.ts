import { SignJWT } from "jose";
import { AccessTokenPayload } from "./types.js";

export async function signAccessToken(
  payload: AccessTokenPayload,
  options: { secret: string; expiresInMinute: number },
): Promise<string> {
  const encodedSecret = new TextEncoder().encode(options.secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${options.expiresInMinute}m`)
    .sign(encodedSecret);
}
