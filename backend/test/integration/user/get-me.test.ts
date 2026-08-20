import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import { prisma } from "@/core/prisma/prisma.client";

const ME_URL = "/api/user/me";

describe("GET /api/user/me", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 200 with user profile when given a valid access token", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .get(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe(authUser.user.id);
    expect(res.body.data.user.email).toBe(authUser.user.email);
    expect(res.body.data.user.isEmailVerified).toBe(authUser.user.isEmailVerified);
    expect(res.body.data.user.fullname).toBeDefined();
  });

  it("should not leak sensitive fields like password or passwordHash", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .get(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).get(ME_URL);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .get(ME_URL)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });

  it("should return 401 if Authorization header format is wrong", async () => {
    const res = await request(app)
      .get(ME_URL)
      .set("Authorization", "Token some-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ── User state ─────────────────────────────────────────────────────

  it("should return 404 if user is soft-deleted", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    // Soft delete user in database directly
    await prisma.user.update({
      where: { id: authUser.user.id },
      data: { deletedAt: new Date() },
    });

    const res = await request(app)
      .get(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });
});
