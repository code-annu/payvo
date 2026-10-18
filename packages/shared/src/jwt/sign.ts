import { SignJWT } from "jose";
import { AccessTokenPayload } from "./payload.types.js";

export async function signAccessToken(
  payload: AccessTokenPayload,
  options: { secret: string; expiresAt: Date | number | string },
): Promise<string> {
  const encodedSecret = new TextEncoder().encode(options.secret);

  const expiration =
    options.expiresAt instanceof Date
      ? Math.floor(options.expiresAt.getTime() / 1000)
      : options.expiresAt;

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(encodedSecret);
}
