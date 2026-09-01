import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";

describe("POST /api/auth/signup", () => {
  beforeEach(async () => {
    await cleanup();
  });

  const validBody = {
    email: "signup-test@example.com",
    password: "StrongP@ss1",
    fullname: "John Doe",
    companyName: "Acme Inc",
  };

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 201 and create a new user", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send(validBody)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.user.fullname).toBe(validBody.fullname);
    expect(res.body.data.user.companyName).toBe(validBody.companyName);
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.user.createdAt).toBeDefined();
  });

  it("should return an accessToken in the response body", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send(validBody)
      .expect(201);

    expect(res.body.data.accessToken).toBeDefined();
    expect(typeof res.body.data.accessToken).toBe("string");
  });

  it("should set the refreshToken cookie", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send(validBody)
      .expect(201);

    const cookies: string[] = (res.headers["set-cookie"] as any) ?? [];
    const refreshCookie = cookies.find((c: string) =>
      c.startsWith("refreshToken="),
    );

    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("HttpOnly");
  });

  

  it("should handle signup without companyName", async () => {
    const { companyName, ...bodyWithoutCompany } = validBody;

    const res = await request(app)
      .post("/api/auth/signup")
      .send(bodyWithoutCompany)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.companyName).toBeNull();
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 409 when email already exists", async () => {
    // First signup
    await request(app).post("/api/auth/signup").send(validBody).expect(201);

    // Duplicate signup
    const res = await request(app)
      .post("/api/auth/signup")
      .send(validBody)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("should return 400 when email is missing", async () => {
    const { email, ...body } = validBody;

    const res = await request(app)
      .post("/api/auth/signup")
      .send(body)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when email is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validBody, email: "not-an-email" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validBody, password: "Ab1!" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when password is missing uppercase", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validBody, password: "strongp@ss1" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when password is missing lowercase", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validBody, password: "STRONGP@SS1" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when password is missing number", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validBody, password: "StrongP@ss!" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when password is missing special character", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validBody, password: "StrongPass1" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when fullname is missing", async () => {
    const { fullname, ...body } = validBody;

    const res = await request(app)
      .post("/api/auth/signup")
      .send(body)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when fullname is too short", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validBody, fullname: "Jo" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when body is empty", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
