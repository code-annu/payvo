import request from "supertest";
import resetDb from "../../helper/cleanup";
import { UserFactory } from "../../factory/user.factory";
import { SessionFactory } from "../../factory/session.factory";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app";

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 200 with accessToken for valid credentials", async () => {
    const { user, plainPassword } = await UserFactory.createUser({
      email: "jane@example.com",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: plainPassword })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        accessToken: expect.any(String),
      },
    });

    expect(res.body.data.accessToken.split(".")).toHaveLength(3);
  });

  it("should set refreshToken cookie on successful login", async () => {
    const { user, plainPassword } = await UserFactory.createUser({
      email: "jane@example.com",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: plainPassword })
      .expect(200);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const refreshCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
      (c: string) => c.startsWith("refreshToken="),
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);
    expect(refreshCookie).toMatch(/Path=\/api\/auth\/rotate-token/);
  });

  it("should create a new session row in database", async () => {
    const { user, plainPassword } = await UserFactory.createUser({
      email: "jane@example.com",
    });

    await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: plainPassword })
      .expect(200);

    const session = await SessionFactory.findSessionByUserId(user.id);
    expect(session).not.toBeNull();
    expect(session!.revokedAt).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Invalid credentials
  // ---------------------------------------------------------------------------

  it("should return 401 INVALID_CREDENTIALS for wrong password", async () => {
    const { user } = await UserFactory.createUser({ email: "jane@example.com" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "WrongPassword1!" })
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "INVALID_CREDENTIALS",
      }),
    });
  });

  it("should return 401 INVALID_CREDENTIALS for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "Test@1234" })
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "INVALID_CREDENTIALS",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Inactive user
  // ---------------------------------------------------------------------------

  it("should return 401 INACTIVE_USER for soft-deleted user", async () => {
    const { user, plainPassword } = await UserFactory.createUser({
      email: "deleted@example.com",
      deletedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: plainPassword })
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "INACTIVE_USER",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Validation errors
  // ---------------------------------------------------------------------------

  it("should return 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "Test@1234" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "jane@example.com" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});
