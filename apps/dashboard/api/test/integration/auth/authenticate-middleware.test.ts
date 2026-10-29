/**
 * Authenticate success
 *  access token is missing
 * access token is expired
 * user is deleted
 */
import app from "@/app.js";
import { jwtConfig } from "@payvo/config/auth";
import { signAccessToken } from "@payvo/shared/jwt";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { setupDb } from "../../helper/setupDb.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import SessionFactory from "../../factory/session.factory.js";
import UserFactory from "../../factory/user.factory.js";

describe("authenticate middleware", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("authenticates a request with a valid access token", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);
  });

  it.each([undefined, "Basic credentials", "Bearer "])(
    "rejects a request without a valid bearer token",
    async (authorization) => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", authorization === undefined ? "" : authorization);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
    },
  );

  it.each(["not-a-jwt", "expired"])(
    "rejects an invalid or expired access token (%s)",
    async (tokenType) => {
      const { user } = await createAuthenticatedUser();
      const [session] = await SessionFactory.findByUserId(user.id);
      if (!session) {
        throw new Error("Authenticated user should have a session");
      }

      const token =
        tokenType === "expired"
          ? await signAccessToken(
              { sub: user.id, sid: session.id },
              {
                secret: jwtConfig.accessToken.secret,
                expiresAt: new Date(Date.now() - 60_000),
              },
            )
          : tokenType;
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
    },
  );

  it("rejects a token belonging to a deleted user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await UserFactory.update(user.id, { deletedAt: new Date() });

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});
