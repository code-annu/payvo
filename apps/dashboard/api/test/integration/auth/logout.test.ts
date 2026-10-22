import app from "@/app.js";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { setupDb } from "../../helper/setupDb.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import SessionFactory from "../../factory/session.factory.js";
import RefreshTokenFactory from "../../factory/refresh-token.factory.js";

describe("POST /api/auth/logout", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("revokes the authenticated session and its refresh tokens", async () => {
    const { user, accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );

    const [session] = await SessionFactory.findByUserId(user.id);
    if (!session) {
      throw new Error("Authenticated user should have a session");
    }
    expect(session.revokedAt).not.toBeNull();

    const refreshTokens = await RefreshTokenFactory.findBySessionId(session.id);
    expect(refreshTokens).toHaveLength(1);
    expect(refreshTokens[0]?.revokedAt).not.toBeNull();
  });
});
