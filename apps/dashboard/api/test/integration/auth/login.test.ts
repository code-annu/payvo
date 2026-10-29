import app from "@/app.js";
import { hashPassword } from "@payvo/shared/crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { setupDb } from "../../helper/setupDb.js";
import UserFactory from "../../factory/user.factory.js";
import SessionFactory from "../../factory/session.factory.js";
import RefreshTokenFactory from "../../factory/refresh-token.factory.js";

const password = "StrongPass1!";

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("authenticates an active user and issues access and refresh tokens", async () => {
    const user = await UserFactory.create({
      email: "login@example.com",
      passwordHash: await hashPassword(password),
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Login successfully",
    });
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );

    const sessions = await SessionFactory.findByUserId(user.id);
    expect(sessions).toHaveLength(1);

    const [session] = sessions;
    if (!session) {
      throw new Error("Login should create a session");
    }
    const refreshTokens = await RefreshTokenFactory.findBySessionId(session.id);
    expect(refreshTokens).toHaveLength(1);
    expect(refreshTokens[0]?.revokedAt).toBeNull();
  });

  it.each([
    [{ email: "not-an-email", password }],
    [{ email: "login@example.com", password: 123 }],
    [{ email: "login@example.com" }],
    [{ password }],
    [{}],
  ])("rejects an invalid login body: %o", async (body) => {
    const response = await request(app).post("/api/auth/login").send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it.each([
    ["unknown@example.com", password],
    ["login@example.com", "WrongPass1!"],
  ])("rejects invalid credentials", async (email, submittedPassword) => {
    await UserFactory.create({
      email: "login@example.com",
      passwordHash: await hashPassword(password),
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password: submittedPassword });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects login for a soft-deleted user", async () => {
    const user = await UserFactory.create({
      email: "deleted@example.com",
      passwordHash: await hashPassword(password),
    });
    await UserFactory.update(user.id, { deletedAt: new Date() });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(await SessionFactory.findByUserId(user.id)).toHaveLength(0);
  });
});
