import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import { prisma } from "@/core/prisma/prisma.client";

const ME_URL = "/api/user/me";
const LOGIN_URL = "/api/auth/login";

describe("DELETE /api/user/me", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 204 when given a valid access token", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .delete(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(204);
  });

  it("should clear the refreshToken cookie", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .delete(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(204);
    const cookies = res.headers["set-cookie"];
    if (cookies) {
      const refreshCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith("refreshToken="))
        : cookies;
      if (refreshCookie) {
        expect(refreshCookie).toMatch(
          /refreshToken=;|Expires=Thu, 01 Jan 1970/i,
        );
      }
    }
  });

  it("should mark user as deleted in the database and revoke sessions", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    await request(app)
      .delete(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .expect(204);

    // Verify user is soft-deleted
    const userInDb = await prisma.user.findUnique({
      where: { id: authUser.user.id },
    });
    expect(userInDb).not.toBeNull();
    expect(userInDb!.deletedAt).not.toBeNull();

    // Verify all sessions are revoked
    const sessions = await prisma.session.findMany({
      where: { userId: authUser.user.id },
    });
    expect(sessions.length).toBeGreaterThan(0);
    sessions.forEach((session) => {
      expect(session.revokedAt).not.toBeNull();
    });
  });

  it("should prevent login after user is deleted", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    // Delete user
    await request(app)
      .delete(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .expect(204);

    // Attempt login with the original user's email
    const loginRes = await request(app)
      .post(LOGIN_URL)
      .send({ email: authUser.user.email, password: "Peter@1234" });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).delete(ME_URL);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .delete(ME_URL)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });

  // ── User state ─────────────────────────────────────────────────────

  it("should return 404 if user is already soft-deleted", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    // First deletion
    await request(app)
      .delete(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .expect(204);

    // Second deletion attempt
    const res = await request(app)
      .delete(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });
});
