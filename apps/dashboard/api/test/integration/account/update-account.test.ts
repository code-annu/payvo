import app from "@/app.js";
import { UserTheme } from "@payvo/database/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import AccountFactory from "../../factory/account.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("PATCH /api/account", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("updates profile and preferences for the authenticated user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await AccountFactory.create(user.id);

    const response = await request(app)
      .patch("/api/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        profile: {
          fullName: "Updated Customer",
          phoneNumber: "+12025550123",
        },
        preferences: {
          theme: UserTheme.DARK,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Account updated successfully",
      data: {
        userId: user.id,
        profile: {
          fullName: "Updated Customer",
          phoneNumber: "+12025550123",
        },
        preferences: {
          theme: UserTheme.DARK,
        },
      },
    });

    const stored = await AccountFactory.find(user.id);
    expect(stored.profile?.fullName).toBe("Updated Customer");
    expect(stored.profile?.phoneNumber).toBe("+12025550123");
    expect(stored.preferences?.theme).toBe(UserTheme.DARK);
  });

  it("updates only the provided profile section", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await AccountFactory.create(user.id);

    const response = await request(app)
      .patch("/api/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ profile: { fullName: "Updated Customer" } });

    expect(response.status).toBe(200);
    expect(response.body.data.profile.fullName).toBe("Updated Customer");
    expect(response.body.data.preferences.theme).toBe(UserTheme.SYSTEM);

    const stored = await AccountFactory.find(user.id);
    expect(stored.profile?.fullName).toBe("Updated Customer");
    expect(stored.preferences?.theme).toBe(UserTheme.SYSTEM);
  });

  it("updates only the provided preferences section", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await AccountFactory.create(user.id);

    const response = await request(app)
      .patch("/api/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ preferences: { theme: UserTheme.LIGHT } });

    expect(response.status).toBe(200);
    expect(response.body.data.profile.fullName).toBe("Payvo Customer");
    expect(response.body.data.preferences.theme).toBe(UserTheme.LIGHT);

    const stored = await AccountFactory.find(user.id);
    expect(stored.profile?.fullName).toBe("Payvo Customer");
    expect(stored.preferences?.theme).toBe(UserTheme.LIGHT);
  });

  it("rejects updates when the account does not exist", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ profile: { fullName: "Updated Customer" } });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
  });

  it("rejects updates when the account is incomplete", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await AccountFactory.createProfile(user.id);

    const response = await request(app)
      .patch("/api/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ preferences: { theme: UserTheme.DARK } });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
  });

  it("rejects updates for a deleted user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await UserFactory.update(user.id, { deletedAt: new Date() });

    const response = await request(app)
      .patch("/api/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ profile: { fullName: "Updated Customer" } });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it.each([
    {},
    { profile: {} },
    { preferences: {} },
    { profile: {}, preferences: {} },
    { profile: { fullName: "A" } },
    { profile: { profilePictureUrl: "not-a-url" } },
    { preferences: { theme: "UNKNOWN" } },
  ])("rejects an empty or invalid update body: %o", async (body) => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects unauthenticated account updates", async () => {
    const response = await request(app)
      .patch("/api/account")
      .send({ profile: { fullName: "Updated Customer" } });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
