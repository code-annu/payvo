/**
 * Rotate token successfully
 * Reject for revoked token
 * Reject for expired and revoked session
 * Reject for deleted user
 * 2 Users simultaneously tries to rotate the token with same refresh token
 */
import app from "@/app.js";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { setupDb } from "../../helper/setupDb.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import SessionFactory from "../../factory/session.factory.js";
import RefreshTokenFactory from "../../factory/refresh-token.factory.js";
import UserFactory from "../../factory/user.factory.js";

describe("POST /api/auth/rotate-token", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("rotates the refresh token and issues a new access token", async () => {
    const { user, refreshToken } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", `refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Token rotated successfully",
    });
    expect(response.body.data.accessToken).toEqual(expect.any(String));

    const sessions = await SessionFactory.findByUserId(user.id);
    expect(sessions).toHaveLength(1);
    const session = sessions[0];
    if (!session) {
      throw new Error("Authenticated user should have a session");
    }

    const refreshTokens = await RefreshTokenFactory.findBySessionId(session.id);
    expect(refreshTokens).toHaveLength(2);
    expect(
      refreshTokens.filter((token) => token.revokedAt === null),
    ).toHaveLength(1);
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );
  });

  it("rejects a revoked refresh token", async () => {
    const { refreshToken } = await createAuthenticatedUser();

    await request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", `refreshToken=${refreshToken}`)
      .expect(200);

    const response = await request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", `refreshToken=${refreshToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("REVOKED_REFRESH_TOKEN");
  });

  it.each([
    [
      "expired",
      { expiresAt: new Date(Date.now() - 60_000) },
      "EXPIRED_SESSION",
    ],
    ["revoked", { revokedAt: new Date() }, "REVOKED_SESSION"],
  ])(
    "rejects a refresh token for a %s session",
    async (_label, update, code) => {
      const { user, refreshToken } = await createAuthenticatedUser();
      const [session] = await SessionFactory.findByUserId(user.id);
      if (!session) {
        throw new Error("Authenticated user should have a session");
      }
      await SessionFactory.update(session.id, update);

      const response = await request(app)
        .post("/api/auth/rotate-token")
        .set("Cookie", `refreshToken=${refreshToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe(code);
    },
  );

  it("rejects a refresh token belonging to a deleted user", async () => {
    const { user, refreshToken } = await createAuthenticatedUser();
    await UserFactory.update(user.id, { deletedAt: new Date() });

    const response = await request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", `refreshToken=${refreshToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("allows only one concurrent rotation of the same refresh token", async () => {
    const { refreshToken } = await createAuthenticatedUser();
    const rotate = () =>
      request(app)
        .post("/api/auth/rotate-token")
        .set("Cookie", `refreshToken=${refreshToken}`);

    const responses = await Promise.all([rotate(), rotate()]);

    expect(
      responses.filter((response) => response.status === 200),
    ).toHaveLength(1);
    expect(
      responses.filter((response) => response.status === 401),
    ).toHaveLength(1);
  });
});
