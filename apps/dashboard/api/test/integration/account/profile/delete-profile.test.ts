import app from "@/app.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import ProfileFactory from "../../../factory/profile.factory.js";
import RefreshTokenFactory from "../../../factory/refresh-token.factory.js";
import SessionFactory from "../../../factory/session.factory.js";
import UserFactory from "../../../factory/user.factory.js";
import { createAuthenticatedUser } from "../../../helper/auth.helper.js";
import { setupDb } from "../../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("DELETE /api/account/profile", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("deletes the profile, revokes sessions, and soft-deletes the user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await ProfileFactory.create(user.id);

    const response = await request(app)
      .delete("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    const [storedUser, profile, sessions] = await Promise.all([
      UserFactory.find(user.id),
      ProfileFactory.find(user.id),
      SessionFactory.findByUserId(user.id),
    ]);
    expect(storedUser?.deletedAt).toBeInstanceOf(Date);
    expect(profile).toBeNull();
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every((session) => session.revokedAt instanceof Date)).toBe(
      true,
    );

    const refreshTokens = await Promise.all(
      sessions.map((session) =>
        RefreshTokenFactory.findBySessionId(session.id),
      ),
    );
    expect(refreshTokens.flat().length).toBeGreaterThan(0);
    expect(
      refreshTokens.flat().every((token) => token.revokedAt instanceof Date),
    ).toBe(true);
  });

  it("rejects profile deletion for a deleted user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await ProfileFactory.create(user.id);
    await UserFactory.update(user.id, { deletedAt: new Date() });

    const response = await request(app)
      .delete("/api/account/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("allows only one of two concurrent profile deletions to succeed", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    await ProfileFactory.create(user.id);

    const deleteProfile = () =>
      request(app)
        .delete("/api/account/profile")
        .set("Authorization", `Bearer ${accessToken}`);
    const responses = await Promise.all([deleteProfile(), deleteProfile()]);

    expect(responses.filter((response) => response.status === 204)).toHaveLength(
      1,
    );
    expect(responses.some((response) => response.status !== 204)).toBe(true);

    const [storedUser, profile] = await Promise.all([
      UserFactory.find(user.id),
      ProfileFactory.find(user.id),
    ]);
    expect(storedUser?.deletedAt).toBeInstanceOf(Date);
    expect(profile).toBeNull();
  });

  it("rejects unauthenticated profile deletion", async () => {
    const response = await request(app).delete("/api/account/profile");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
