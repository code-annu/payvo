import app from "@/app.js";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { setupDb } from "../../helper/setupDb.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import UserFactory from "../../factory/user.factory.js";

describe("GET /api/auth/me", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("returns the authenticated user's account details", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const emailVerifiedAt = new Date("2025-01-02T03:04:05.000Z");
    const passwordChangedAt = new Date("2025-01-03T04:05:06.000Z");
    await UserFactory.update(user.id, { emailVerifiedAt, passwordChangedAt });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "User details retrieved successfully",
      data: {
        email: user.email,
        emailVerifiedAt: emailVerifiedAt.toISOString(),
        passwordChangedAt: passwordChangedAt.toISOString(),
        createdOn: user.createdAt.toISOString(),
      },
    });
    expect(response.body.data).not.toHaveProperty("passwordHash");
  });

  it("requires an access token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
