import { jwtVerify } from "jose";
import { AccessTokenPayload } from "./types.js";

export async function verifyAccessToken(
  token: string,
  secret: string,
): Promise<AccessTokenPayload> {
  const encodedSecret = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify<AccessTokenPayload>(
    token,
    encodedSecret,
    { algorithms: ["HS256"] },
  );
  return payload;
}
