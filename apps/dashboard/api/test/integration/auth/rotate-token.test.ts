import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { UserFactory } from "../../factory/user.factory.js";
import { SessionFactory } from "../../factory/session.factory.js";
import { RefreshTokenFactory } from "../../factory/refresh-token.factory.js";
import { subDays } from "date-fns";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

describe("POST /api/auth/rotate-token", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Helper to send refresh token cookie
  // ---------------------------------------------------------------------------

  function rotateRequest(rawToken: string) {
    return request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", `refreshToken=${rawToken}`);
  }

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 200 with new accessToken on valid refresh token", async () => {
    const { user } = await UserFactory.createUser();
    const session = await SessionFactory.createSession(user.id);
    const { rawToken } = await RefreshTokenFactory.createRefreshToken(session.id);

    const res = await rotateRequest(rawToken).expect(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        accessToken: expect.any(String),
      },
    });

    expect(res.body.data.accessToken.split(".")).toHaveLength(3);
  });

  it("should set a new refreshToken cookie after rotation", async () => {
    const { user } = await UserFactory.createUser();
    const session = await SessionFactory.createSession(user.id);
    const { rawToken } = await RefreshTokenFactory.createRefreshToken(session.id);

    const res = await rotateRequest(rawToken).expect(200);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const refreshCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
      (c: string) => c.startsWith("refreshToken="),
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);
  });

  it("should revoke the old refresh token in database after rotation", async () => {
    const { user } = await UserFactory.createUser();
    const session = await SessionFactory.createSession(user.id);
    const { rawToken, record } =
      await RefreshTokenFactory.createRefreshToken(session.id);

    await rotateRequest(rawToken).expect(200);

    const oldToken = await RefreshTokenFactory.findRefreshTokenById(record.id);
    expect(oldToken).not.toBeNull();
    expect(oldToken!.revokedAt).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Invalid / unknown token
  // ---------------------------------------------------------------------------

  it("should return 401 INVALID_REFRESH_TOKEN for unknown token", async () => {
    const res = await rotateRequest("totally-unknown-token-value").expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "INVALID_REFRESH_TOKEN",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Revoked token
  // ---------------------------------------------------------------------------

  it("should return 401 REVOKED_REFRESH_TOKEN for already-revoked token", async () => {
    const { user } = await UserFactory.createUser();
    const session = await SessionFactory.createSession(user.id);
    const { rawToken } = await RefreshTokenFactory.createRefreshToken(session.id, {
      revokedAt: new Date().toISOString(),
    });

    const res = await rotateRequest(rawToken).expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "REVOKED_REFRESH_TOKEN",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Expired session
  // ---------------------------------------------------------------------------

  it("should return 401 EXPIRED_SESSION when session has expired", async () => {
    const { user } = await UserFactory.createUser();
    const session = await SessionFactory.createSession(user.id, {
      expiresAt: subDays(new Date(), 1).toISOString(),
    });
    const { rawToken } = await RefreshTokenFactory.createRefreshToken(session.id);

    const res = await rotateRequest(rawToken).expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "EXPIRED_SESSION",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Revoked session
  // ---------------------------------------------------------------------------

  it("should return 401 REVOKED_SESSION when session is revoked", async () => {
    const { user } = await UserFactory.createUser();
    const session = await SessionFactory.createSession(user.id, {
      revokedAt: new Date().toISOString(),
    });
    const { rawToken } = await RefreshTokenFactory.createRefreshToken(session.id);

    const res = await rotateRequest(rawToken).expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "REVOKED_SESSION",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Missing cookie
  // ---------------------------------------------------------------------------

  it("should return 400 when refresh token cookie is missing", async () => {
    const res = await request(app).post("/api/auth/rotate-token").expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});
