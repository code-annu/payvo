import app from "@/app.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import AccountFactory from "../../factory/account.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("GET /api/account", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("returns account details for the authenticated user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await AccountFactory.create(user.id);

    const response = await request(app)
      .get("/api/account")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Account fetched successfully",
      data: {
        userId: user.id,
        profile: { fullName: "Payvo Customer" },
        preferences: {
          language: { code: "en", name: "English" },
          currency: { code: "USD", name: "US Dollar" },
          theme: "SYSTEM",
          timezone: "UTC",
        },
      },
    });
  });

  it("returns not found when the user has no account", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .get("/api/account")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
  });

  it("returns not found when the account is incomplete", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await AccountFactory.createProfile(user.id);

    const response = await request(app)
      .get("/api/account")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
  });

  it("rejects account retrieval for a deleted user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await UserFactory.update(user.id, { deletedAt: new Date() });

    const response = await request(app)
      .get("/api/account")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects unauthenticated account retrieval", async () => {
    const response = await request(app).get("/api/account");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
