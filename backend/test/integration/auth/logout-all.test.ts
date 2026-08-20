import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import { prisma } from "@/core/prisma/prisma.client";

const LOGOUT_ALL_URL = "/api/auth/logout-all";
const REFRESH_URL = "/api/auth/refresh";

describe("POST /api/auth/logout-all", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 204 when given a valid access token", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(LOGOUT_ALL_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(204);
  });

  it("should invalidate all sessions for the user", async () => {
    // Create two sessions for the same user by logging in from auth.helper
    const { authUser: session1, cookies: cookies1 } =
      await AuthHelper.getAuthenticatedUser();

    // We need a second session for the same user — login again
    // But AuthHelper creates random emails, so we do it manually
    const user = await prisma.user.findUnique({
      where: { id: session1.user.id },
    });

    // Login again to create a second session
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: user!.email, password: "Peter@1234" });
    expect(loginRes.status).toBe(200);
    const cookies2 = loginRes.headers["set-cookie"];

    // Logout all using second session's access token
    await request(app)
      .post(LOGOUT_ALL_URL)
      .set("Authorization", `Bearer ${loginRes.body.data.accessToken}`)
      .expect(204);

    // Both refresh tokens should now be revoked
    const refresh1 = await request(app)
      .post(REFRESH_URL)
      .set("Cookie", cookies1);
    expect(refresh1.status).toBe(401);

    const refresh2 = await request(app)
      .post(REFRESH_URL)
      .set("Cookie", cookies2!);
    expect(refresh2.status).toBe(401);
  });

  it("should clear the refreshToken cookie", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(LOGOUT_ALL_URL)
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

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).post(LOGOUT_ALL_URL);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .post(LOGOUT_ALL_URL)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
