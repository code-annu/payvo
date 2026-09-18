import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import UserFactory from "../../factory/user.factory.js";
import { cleanupUser } from "../../helper/cleanup.js";
import { authPath, loginUser } from "../../helper/auth.helper.js";

afterEach(async () => {
  await cleanupUser();
});

describe("POST /api/auth/login", () => {
  it("authenticates a registered user and returns an access token", async () => {
    const user = await UserFactory.createUser();
    const { response } = await loginUser(user);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { accessToken: expect.any(String) },
    });
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );
  });

  it("rejects invalid credentials", async () => {
    const user = await UserFactory.createUser();

    const response = await request(app).post(`${authPath}/login`).send({
      email: user.email,
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INVALID_CREDENTIALS" },
    });
  });

  it("rejects an invalid request body", async () => {
    const response = await request(app).post(`${authPath}/login`).send({
      email: "invalid-email",
      password: "",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INVALID_REQUEST" },
    });
  });
});
