import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import resetDb from "../../helper/cleanup.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { SessionFactory } from "../../factory/session.factory.js";
import { RefreshTokenFactory } from "../../factory/refresh-token.factory.js";
import { jwtConfig } from "@payvo/config/auth";
import crypto from "node:crypto";
import app from "../../../src/app.js";

// ---------------------------------------------------------------------------
// Helper to create an expired JWT without importing jose directly
// ---------------------------------------------------------------------------

function signExpiredJwt(payload: { sub: string; sid: string }): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");

  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: now - 3600,
      exp: now - 1800,
    }),
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", jwtConfig.accessToken.secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

describe("POST /api/auth/logout", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 204 and revoke session for authenticated user", async () => {
    const { accessToken, session } = await getAuthenticatedUser();

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    const revokedSession = await SessionFactory.findSessionById(session.id);
    expect(revokedSession).not.toBeNull();
    expect(revokedSession!.revokedAt).not.toBeNull();
  });

  it("should revoke all refresh tokens for the session", async () => {
    const { accessToken, session, refreshTokenRecord } =
      await getAuthenticatedUser();

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    const token = await RefreshTokenFactory.findRefreshTokenById(
      refreshTokenRecord!.id,
    );
    expect(token).not.toBeNull();
    expect(token!.revokedAt).not.toBeNull();
  });

  it("should clear the refreshToken cookie", async () => {
    const { accessToken } = await getAuthenticatedUser();

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const refreshCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
      (c: string) => c.startsWith("refreshToken="),
    );
    expect(refreshCookie).toBeDefined();
    // A cleared cookie has an empty value or expires in the past
    expect(refreshCookie).toMatch(
      /refreshToken=;|refreshToken=\s*;|Expires=Thu, 01 Jan 1970/i,
    );
  });

  // ---------------------------------------------------------------------------
  // Missing Authorization header
  // ---------------------------------------------------------------------------

  it("should return 401 MISSING_ACCESS_TOKEN when no Authorization header", async () => {
    const res = await request(app).post("/api/auth/logout").expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "MISSING_ACCESS_TOKEN",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Malformed token
  // ---------------------------------------------------------------------------

  it("should return 401 INVALID_ACCESS_TOKEN for malformed Bearer token", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", "Bearer not.a.valid.jwt.token")
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "INVALID_ACCESS_TOKEN",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Expired JWT
  // ---------------------------------------------------------------------------

  it("should return 401 INVALID_ACCESS_TOKEN for expired JWT", async () => {
    const { user, session } = await getAuthenticatedUser();

    const expiredToken = signExpiredJwt({
      sub: user.id,
      sid: session.id,
    });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "INVALID_ACCESS_TOKEN",
      }),
    });
  });
});
