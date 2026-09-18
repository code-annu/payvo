import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import { cleanupUser } from "../../helper/cleanup.js";
import UserFactory from "../../factory/user.factory.js";
import { authPath } from "../../helper/auth.helper.js";

afterEach(async () => {
  await cleanupUser();
});

describe("POST /api/auth/signup", () => {
  it("creates an account and returns an access token", async () => {
    const user = UserFactory.buildUser();
    const response = await request(app).post(`${authPath}/signup`).send(user);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: { accessToken: expect.any(String) },
    });
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );
  });

  it("rejects an invalid request body", async () => {
    const response = await request(app).post(`${authPath}/signup`).send({
      email: "invalid-email",
      password: "weak",
      fullname: "x",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INVALID_REQUEST" },
    });
  });

  it("rejects a duplicate email", async () => {
    const user = UserFactory.buildUser();
    await request(app).post(`${authPath}/signup`).send(user);
    const response = await request(app).post(`${authPath}/signup`).send(user);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "EMAIL_ALREADY_EXISTS" },
    });
  });
});
