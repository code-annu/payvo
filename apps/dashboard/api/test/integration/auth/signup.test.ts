import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { client } from "@payvo/database/client";
import { setupDb } from "../../helper/setupDb.js";
import UserFactory from "../../factory/user.factory.js";
import app from "../../../src/app.js";

describe("POST /api/auth/signup", () => {
  const validSignup = {
    email: "signup@example.com",
    password: "StrongPass1!",
    fullname: "Signup User",
    companyName: "Payvo",
  };

  beforeEach(async () => {
    await setupDb();
  });

  afterEach(async () => {
    await setupDb();
  });

  it("creates the user, session, and refresh token", async () => {
    const response = await supertest(app)
      .post("/api/auth/signup")
      .send(validSignup);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );

    const user = await UserFactory.getByEmail(validSignup.email);
    expect(user).not.toBeNull();
    expect(user?.fullname).toBe(validSignup.fullname);
    expect(user?.companyName).toBe(validSignup.companyName);
    expect(user?.passwordHash).not.toBe(validSignup.password);

    const sessions = await client.orm.public.Session.where({
      userId: user!.id,
    }).all();
    expect(sessions).toHaveLength(1);

    const refreshTokens = await client.orm.public.RefreshToken.where({
      sessionId: sessions[0]!.id,
    }).all();
    expect(refreshTokens).toHaveLength(1);
    expect(refreshTokens[0]!.tokenHash).not.toBe(
      response.headers["set-cookie"]![0]!.split("refreshToken=")[1]?.split(
        ";",
      )[0],
    );
  });

  it("rejects signup with an existing email", async () => {
    await UserFactory.create({
      email: validSignup.email,
      passwordHash: "existing-hash",
      fullname: validSignup.fullname,
      companyName: validSignup.companyName,
    });

    const response = await supertest(app)
      .post("/api/auth/signup")
      .send(validSignup);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe(
      "This email is already associated with an account",
    );
    expect(await client.orm.public.User.where({}).all()).toHaveLength(1);
    expect(await client.orm.public.Session.where({}).all()).toHaveLength(0);
    expect(await client.orm.public.RefreshToken.where({}).all()).toHaveLength(
      0,
    );
  });

  it("rejects an invalid email", async () => {
    const response = await supertest(app)
      .post("/api/auth/signup")
      .send({ ...validSignup, email: "not-an-email" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: ["email"] })]),
    );
  });

  it("rejects a weak password", async () => {
    const response = await supertest(app)
      .post("/api/auth/signup")
      .send({ ...validSignup, password: "weak" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: ["password"] }),
      ]),
    );
  });

  it("rejects missing required fields", async () => {
    const response = await supertest(app).post("/api/auth/signup").send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: ["email"] }),
        expect.objectContaining({ field: ["password"] }),
        expect.objectContaining({ field: ["fullname"] }),
      ]),
    );
  });
});
