import app from "@/app.js";
import { UserTheme } from "@payvo/database/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import ProfileFactory from "../../../factory/profile.factory.js";
import UserFactory from "../../../factory/user.factory.js";
import { createAuthenticatedUser } from "../../../helper/auth.helper.js";
import { setupDb } from "../../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("PATCH /api/account/profile", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("updates supplied profile and preference fields together", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await ProfileFactory.create(user.id);

    const response = await request(app)
      .patch("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        fullName: "Updated Customer",
        phoneNumber: "+12025550123",
        theme: UserTheme.DARK,
        timezone: "America/New_York",
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Account updated successfully",
      data: {
        userId: user.id,
        fullName: "Updated Customer",
        phoneNumber: "+12025550123",
        theme: UserTheme.DARK,
        timezone: "America/New_York",
      },
    });

    const stored = await ProfileFactory.find(user.id);
    expect(stored?.fullName).toBe("Updated Customer");
    expect(stored?.phoneNumber).toBe("+12025550123");
    expect(stored?.theme).toBe(UserTheme.DARK);
    expect(stored?.timezone).toBe("America/New_York");
  });

  it("updates only the supplied profile field", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await ProfileFactory.create(user.id);

    const response = await request(app)
      .patch("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullName: "Updated Customer" });

    expect(response.status).toBe(200);
    expect(response.body.data.fullName).toBe("Updated Customer");
    expect(response.body.data.theme).toBe(UserTheme.SYSTEM);

    const stored = await ProfileFactory.find(user.id);
    expect(stored?.fullName).toBe("Updated Customer");
    expect(stored?.theme).toBe(UserTheme.SYSTEM);
  });

  it("updates only a preference field", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await ProfileFactory.create(user.id);

    const response = await request(app)
      .patch("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ theme: UserTheme.LIGHT });

    expect(response.status).toBe(200);
    expect(response.body.data.fullName).toBe("Payvo Customer");
    expect(response.body.data.theme).toBe(UserTheme.LIGHT);

    const stored = await ProfileFactory.find(user.id);
    expect(stored?.fullName).toBe("Payvo Customer");
    expect(stored?.theme).toBe(UserTheme.LIGHT);
  });

  it("rejects updates when the profile does not exist", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullName: "Updated Customer" });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
  });

  it("rejects updates for a deleted user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await UserFactory.update(user.id, { deletedAt: new Date() });

    const response = await request(app)
      .patch("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullName: "Updated Customer" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it.each([
    {},
    { fullName: "A" },
    { profilePictureUrl: "not-a-url" },
    { preferredCurrencyCode: "INVALID" },
    { preferredLanguageCode: "" },
    { theme: "UNKNOWN" },
  ])("rejects an empty or invalid update body: %o", async (body) => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects unauthenticated profile updates", async () => {
    const response = await request(app)
      .patch("/api/account/profile")
      .send({ fullName: "Updated Customer" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
