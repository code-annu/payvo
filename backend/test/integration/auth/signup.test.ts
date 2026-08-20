import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";

const SIGNUP_URL = "/api/auth/signup";

const validPayload = {
  fullname: "John Doe",
  email: "john@example.com",
  password: "Password1!",
};

describe("POST /api/auth/signup", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should register a new user and return 201 with user data and access token", async () => {
    const res = await request(app).post(SIGNUP_URL).send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(validPayload.email);
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("should set a refreshToken cookie", async () => {
    const res = await request(app).post(SIGNUP_URL).send(validPayload);

    expect(res.status).toBe(201);
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const refreshCookie = Array.isArray(cookies)
      ? cookies.find((c: string) => c.startsWith("refreshToken="))
      : cookies;
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("HttpOnly");
  });

  it("should accept an optional companyName", async () => {
    const res = await request(app)
      .post(SIGNUP_URL)
      .send({ ...validPayload, companyName: "Acme Inc" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("should not leak password hash in the response", async () => {
    const res = await request(app).post(SIGNUP_URL).send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  // ── Duplicate email ────────────────────────────────────────────────

  it("should return 409 if email already exists", async () => {
    await request(app).post(SIGNUP_URL).send(validPayload).expect(201);

    const res = await request(app).post(SIGNUP_URL).send(validPayload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  // ── Validation errors ──────────────────────────────────────────────

  it("should return 400 if email is missing", async () => {
    const { email, ...noEmail } = validPayload;
    const res = await request(app).post(SIGNUP_URL).send(noEmail);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if email is invalid", async () => {
    const res = await request(app)
      .post(SIGNUP_URL)
      .send({ ...validPayload, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if password is missing", async () => {
    const { password, ...noPassword } = validPayload;
    const res = await request(app).post(SIGNUP_URL).send(noPassword);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if password is too short", async () => {
    const res = await request(app)
      .post(SIGNUP_URL)
      .send({ ...validPayload, password: "Ab1!" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if password has no uppercase letter", async () => {
    const res = await request(app)
      .post(SIGNUP_URL)
      .send({ ...validPayload, password: "password1!" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if password has no special character", async () => {
    const res = await request(app)
      .post(SIGNUP_URL)
      .send({ ...validPayload, password: "Password1" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if fullname is missing", async () => {
    const { fullname, ...noName } = validPayload;
    const res = await request(app).post(SIGNUP_URL).send(noName);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if fullname is too short", async () => {
    const res = await request(app)
      .post(SIGNUP_URL)
      .send({ ...validPayload, fullname: "AB" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if body is empty", async () => {
    const res = await request(app).post(SIGNUP_URL).send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
