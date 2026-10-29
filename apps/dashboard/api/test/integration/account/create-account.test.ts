import app from "@/app.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import AccountFactory from "../../factory/account.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { createAccountRequestBody } from "../../helper/account.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("POST /api/account", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("creates an account for the authenticated user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const body = createAccountRequestBody();

    const response = await request(app)
      .post("/api/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Account created successfully",
      data: {
        userId: user.id,
        profile: { fullName: body.profile.fullName },
        preferences: {
          language: { code: "en", name: "English" },
          currency: { code: "USD", name: "US Dollar" },
          theme: "SYSTEM",
        },
      },
    });

    const stored = await AccountFactory.find(user.id);
    expect(stored.profile?.fullName).toBe(body.profile.fullName);
    expect(stored.preferences?.theme).toBe("SYSTEM");
  });

  it.each(["profile", "preferences"] as const)(
    "rejects account creation when a %s already exists",
    async (existingPart) => {
      const { user, accessToken } = await createAuthenticatedUser();
      if (existingPart === "profile") {
        await AccountFactory.createProfile(user.id);
      } else {
        await AccountFactory.createPreferences(user.id);
      }

      const response = await request(app)
        .post("/api/account")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(createAccountRequestBody());

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("ACCOUNT_ALREADY_EXISTS");
    },
  );

  it("rejects account creation for a deleted user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await UserFactory.update(user.id, { deletedAt: new Date() });

    const response = await request(app)
      .post("/api/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(createAccountRequestBody());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it.each([
    {},
    { profile: {}, preferences: {} },
    {
      profile: {
        fullName: "A",
        phoneNumber: null,
        profilePictureUrl: null,
      },
      preferences: createAccountRequestBody().preferences,
    },
    {
      profile: createAccountRequestBody().profile,
      preferences: {
        preferredLanguageCode: "en",
        preferredCurrencyCode: "INVALID",
        theme: "UNKNOWN",
      },
    },
  ])("rejects an invalid or incomplete account body: %o", async (body) => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/api/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects unauthenticated account creation", async () => {
    const response = await request(app)
      .post("/api/account")
      .send(createAccountRequestBody());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
