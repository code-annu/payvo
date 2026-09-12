import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { UserFactory } from "../../factory/user.factory.js";
import { SessionFactory } from "../../factory/session.factory.js";
import { RefreshTokenFactory } from "../../factory/refresh-token.factory.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

describe("POST /api/auth/signup", () => {
  beforeEach(async () => {
    await resetDb();
  });

  const validPayload = {
    email: "john@example.com",
    password: "Str0ng!Pass",
    fullname: "John Doe",
    companyName: "Acme Inc",
  };

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 201 with accessToken on valid signup", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send(validPayload)
      .expect(201);

    expect(res.body).toEqual({
      success: true,
      data: {
        accessToken: expect.any(String),
      },
    });

    expect(res.body.data.accessToken.split(".")).toHaveLength(3);
  });

  it("should set refreshToken cookie with correct options", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send(validPayload)
      .expect(201);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const refreshCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
      (c: string) => c.startsWith("refreshToken="),
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);
    expect(refreshCookie).toMatch(/Path=\/api\/auth\/rotate-token/);
  });

  it("should create user in database with hashed password", async () => {
    await request(app).post("/api/auth/signup").send(validPayload).expect(201);

    const user = await UserFactory.findUserByEmail(validPayload.email);
    expect(user).not.toBeNull();
    expect(user!.email).toBe(validPayload.email);
    expect(user!.fullname).toBe(validPayload.fullname);
    expect(user!.companyName).toBe(validPayload.companyName);
    // Password must be hashed, not stored as plaintext
    expect(user!.passwordHash).not.toBe(validPayload.password);
    expect(user!.passwordHash.length).toBeGreaterThan(20);
  });

  it("should create session and refresh token rows in database", async () => {
    await request(app).post("/api/auth/signup").send(validPayload).expect(201);

    const user = await UserFactory.findUserByEmail(validPayload.email);
    expect(user).not.toBeNull();

    const session = await SessionFactory.findSessionByUserId(user!.id);
    expect(session).not.toBeNull();

    const refreshToken =
      await RefreshTokenFactory.findRefreshTokenBySessionId(session!.id);
    expect(refreshToken).not.toBeNull();
    expect(refreshToken!.revokedAt).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Duplicate email
  // ---------------------------------------------------------------------------

  it("should return 409 EMAIL_ALREADY_EXISTS for duplicate email", async () => {
    await UserFactory.createUser({ email: "taken@example.com" });

    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validPayload, email: "taken@example.com" })
      .expect(409);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "EMAIL_ALREADY_EXISTS",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Validation errors
  // ---------------------------------------------------------------------------

  it("should return 400 when email field is missing", async () => {
    const { email: _, ...noEmail } = validPayload;

    const res = await request(app)
      .post("/api/auth/signup")
      .send(noEmail)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 for invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validPayload, email: "not-an-email" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 for weak password without uppercase", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validPayload, password: "weak!pass1" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 when fullname is too short", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validPayload, fullname: "AB" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});
