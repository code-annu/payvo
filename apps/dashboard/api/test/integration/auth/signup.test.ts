import app from "@/app.js";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { setupDb } from "../../helper/setupDb.js";
import UserFactory from "../../factory/user.factory.js";
import SessionFactory from "../../factory/session.factory.js";
import RefreshTokenFactory from "../../factory/refresh-token.factory.js";

describe("POST /api/auth/signup", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("creates a user, session, and refresh token and returns an access token", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ email: "signup@example.com", password: "StrongPass1!" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Signup successfully",
    });
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    const refreshCookie = response.headers["set-cookie"];
    expect(refreshCookie).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );
    const rawRefreshToken =
      String(refreshCookie).match(/refreshToken=([^;]+)/)?.[1];
    if (!rawRefreshToken) {
      throw new Error("Signup should set a refresh-token cookie");
    }

    const user = await UserFactory.findByEmail("signup@example.com");
    expect(user).not.toBeNull();
    if (!user) {
      throw new Error("Signup should create a user");
    }

    const sessions = await SessionFactory.findByUserId(user.id);
    expect(sessions).toHaveLength(1);
    const [session] = sessions;
    if (!session) {
      throw new Error("Signup should create a session");
    }
    expect(session.userAgent).toBeDefined();

    const refreshTokens = await RefreshTokenFactory.findBySessionId(session.id);
    expect(refreshTokens).toHaveLength(1);
    const [refreshToken] = refreshTokens;
    if (!refreshToken) {
      throw new Error("Signup should create a refresh token");
    }
    expect(refreshToken.tokenHash).not.toBe(rawRefreshToken);
  });

  it("rejects an email that already belongs to an account", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ email: "duplicate@example.com", password: "StrongPass1!" })
      .expect(201);

    const response = await request(app)
      .post("/api/auth/signup")
      .send({ email: "duplicate@example.com", password: "StrongPass1!" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it.each([
    [{ email: "not-an-email", password: "StrongPass1!" }],
    [{ email: "signup@example.com", password: "weak" }],
    [{ email: "signup@example.com" }],
    [{ password: "StrongPass1!" }],
    [{}],
  ])("rejects an invalid signup body: %o", async (body) => {
    const response = await request(app).post("/api/auth/signup").send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
