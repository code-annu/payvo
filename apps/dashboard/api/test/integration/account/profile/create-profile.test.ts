import app from "@/app.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import ProfileFactory from "../../../factory/profile.factory.js";
import UserFactory from "../../../factory/user.factory.js";
import { createAuthenticatedUser } from "../../../helper/auth.helper.js";
import { createProfileRequestBody } from "../../../helper/profile.helper.js";
import { setupDb } from "../../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("POST /api/account/profile", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("creates a profile for the authenticated user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const body = createProfileRequestBody();

    const response = await request(app)
      .post("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Account created successfully",
      data: {
        userId: user.id,
        fullName: body.fullName,
        language: { code: body.preferredLanguageCode, name: "English" },
        currency: { code: body.preferredCurrencyCode, name: "US Dollar" },
        theme: body.theme,
      },
    });

    const stored = await ProfileFactory.find(user.id);
    expect(stored?.fullName).toBe(body.fullName);
    expect(stored?.preferredLanguageCode).toBe("en");
    expect(stored?.preferredCurrencyCode).toBe("USD");
    expect(stored?.theme).toBe("SYSTEM");
  });

  it("rejects profile creation when one already exists", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await ProfileFactory.create(user.id);

    const response = await request(app)
      .post("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(createProfileRequestBody());

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("ACCOUNT_ALREADY_EXISTS");
  });

  it("rejects profile creation for a deleted user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await UserFactory.update(user.id, { deletedAt: new Date() });

    const response = await request(app)
      .post("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(createProfileRequestBody());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it.each([
    {},
    { fullName: "A" },
    { ...createProfileRequestBody(), preferredCurrencyCode: "INVALID" },
    { ...createProfileRequestBody(), preferredLanguageCode: "" },
    { ...createProfileRequestBody(), theme: "UNKNOWN" },
    { ...createProfileRequestBody(), profilePictureUrl: "not-a-url" },
  ])("rejects an invalid or incomplete profile body: %o", async (body) => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects unauthenticated profile creation", async () => {
    const response = await request(app)
      .post("/api/account/profile")
      .send(createProfileRequestBody());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
