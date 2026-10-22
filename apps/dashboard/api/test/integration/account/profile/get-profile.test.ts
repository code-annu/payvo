import app from "@/app.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import ProfileFactory from "../../../factory/profile.factory.js";
import UserFactory from "../../../factory/user.factory.js";
import { createAuthenticatedUser } from "../../../helper/auth.helper.js";
import { setupDb } from "../../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("GET /api/account/profile", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("returns profile details for the authenticated user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await ProfileFactory.create(user.id);

    const response = await request(app)
      .get("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Account fetched successfully",
      data: {
        userId: user.id,
        fullName: "Payvo Customer",
        language: { code: "en", name: "English" },
        currency: { code: "USD", name: "US Dollar" },
        theme: "SYSTEM",
        timezone: "UTC",
      },
    });
  });

  it("returns not found when the user has no profile", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .get("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
  });

  it("rejects profile retrieval for a deleted user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await UserFactory.update(user.id, { deletedAt: new Date() });

    const response = await request(app)
      .get("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects unauthenticated profile retrieval", async () => {
    const response = await request(app).get("/api/account/profile");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
