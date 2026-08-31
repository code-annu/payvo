import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await cleanup();
  });

  const signupBody = {
    email: "login-test@example.com",
    password: "StrongP@ss1",
    fullname: "John Doe",
    companyName: "Acme Inc",
  };

  const loginBody = {
    email: signupBody.email,
    password: signupBody.password,
  };

  /** Helper: create a user before testing login */
  async function seedUser() {
    await request(app).post("/api/auth/signup").send(signupBody).expect(201);
  }

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 200 and login successfully", async () => {
    await seedUser();

    const res = await request(app)
      .post("/api/auth/login")
      .send(loginBody)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.user.fullname).toBe(signupBody.fullname);
    expect(res.body.data.user.companyName).toBe(signupBody.companyName);
    expect(res.body.data.user.isEmailVerified).toBe(false);
  });

  it("should return an accessToken in the response body", async () => {
    await seedUser();

    const res = await request(app)
      .post("/api/auth/login")
      .send(loginBody)
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
    expect(typeof res.body.data.accessToken).toBe("string");
  });

  it("should set the refreshToken cookie", async () => {
    await seedUser();

    const res = await request(app)
      .post("/api/auth/login")
      .send(loginBody)
      .expect(200);

    const cookies: string[] = (res.headers["set-cookie"] as any) ?? [];
    const refreshCookie = cookies.find((c: string) =>
      c.startsWith("refreshToken="),
    );

    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("HttpOnly");
  });

  it("should include refreshToken data in the response body", async () => {
    await seedUser();

    const res = await request(app)
      .post("/api/auth/login")
      .send(loginBody)
      .expect(200);

    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken.token).toBeDefined();
    expect(res.body.data.refreshToken.expiresAt).toBeDefined();
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 401 when email does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "unknown@example.com", password: "StrongP@ss1" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should return 401 when password is wrong", async () => {
    await seedUser();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ ...loginBody, password: "WrongP@ss1" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should return 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "StrongP@ss1" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "john@example.com" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when body is empty", async () => {
    const res = await request(app).post("/api/auth/login").send({}).expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when email is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "StrongP@ss1" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
