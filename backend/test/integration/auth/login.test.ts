import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import UserFactory from "../../factory/user.factory";
import { prisma } from "@/core/prisma/prisma.client";

const LOGIN_URL = "/api/auth/login";
const TEST_EMAIL = "login@example.com";
const TEST_PASSWORD = "Password1!";

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await resetDb();
    await UserFactory.createUser(TEST_EMAIL, TEST_PASSWORD);
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 200 with user data and access token on valid credentials", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("should set a refreshToken cookie", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const refreshCookie = Array.isArray(cookies)
      ? cookies.find((c: string) => c.startsWith("refreshToken="))
      : cookies;
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("HttpOnly");
  });

  it("should not leak password hash in the response", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  // ── Invalid credentials ────────────────────────────────────────────

  it("should return 401 if email does not exist", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: "nonexistent@example.com", password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should return 401 if password is wrong", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: TEST_EMAIL, password: "WrongPassword1!" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should return 401 if user is soft-deleted", async () => {
    // Soft-delete the user
    await prisma.user.updateMany({
      where: { email: TEST_EMAIL },
      data: { deletedAt: new Date() },
    });

    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  // ── Validation errors ──────────────────────────────────────────────

  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if body is empty", async () => {
    const res = await request(app).post(LOGIN_URL).send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if email is invalid", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: "not-an-email", password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
