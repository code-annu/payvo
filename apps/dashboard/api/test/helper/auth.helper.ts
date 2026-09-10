import request from "supertest";
import app from "../../src/app";
import type { RefreshToken, Session, User } from "@payvo/database/types";
import { RefreshTokenFactory } from "../factory/refresh-token.factory";
import { SessionFactory } from "../factory/session.factory";
import { UserFactory, type UserOverrides } from "../factory/user.factory";

export interface AuthUserOverrides extends UserOverrides {}

export interface AuthenticatedUser {
  accessToken: string;
  user: User;
  plainPassword: string;
  session: Session;
  refreshToken: string | undefined;
  refreshTokenRecord: RefreshToken | null;
}

export async function getAuthenticatedUser(
  overrides: AuthUserOverrides = {},
): Promise<AuthenticatedUser> {
  // 1. First create the user with credentials
  const { user, plainPassword } = await UserFactory.createUser(overrides);

  // 2. Call login endpoint with those credentials
  const res = await request(app)
    .post("/api/auth/login")
    .send({
      email: user.email,
      password: plainPassword,
    })
    .expect(200);

  const accessToken: string = res.body.data.accessToken;

  // 3. Extract raw refresh token from set-cookie header if present
  const cookies = res.headers["set-cookie"];
  let rawRefreshToken: string | undefined;
  if (cookies) {
    const cookieList = Array.isArray(cookies) ? cookies : [cookies];
    const refreshCookie = cookieList.find((c: string) =>
      c.startsWith("refreshToken="),
    );
    if (refreshCookie) {
      rawRefreshToken = refreshCookie
        .split(";")[0]
        .replace("refreshToken=", "");
    }
  }

  // 4. Retrieve session and refresh token DB records
  const session = await SessionFactory.findSessionByUserId(user.id);
  if (!session) {
    throw new Error("Failed to find session for authenticated user");
  }

  const refreshTokenRecord =
    await RefreshTokenFactory.findRefreshTokenBySessionId(session.id);

  return {
    accessToken,
    user,
    plainPassword,
    session,
    refreshToken: rawRefreshToken,
    refreshTokenRecord,
  };
}
