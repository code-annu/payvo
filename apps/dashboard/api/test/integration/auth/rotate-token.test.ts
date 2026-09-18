import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import UserFactory from "../../factory/user.factory.js";
import { cleanupUser } from "../../helper/cleanup.js";
import { authPath, loginUser } from "../../helper/auth.helper.js";

afterEach(async () => {
  await cleanupUser();
});

describe("POST /api/auth/rotate-token", () => {
  it("rotates a valid refresh token", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .post(`${authPath}/rotate-token`)
      .set("Cookie", authUser.refreshCookie);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { accessToken: expect.any(String) },
    });
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );
  });

  it("rejects a missing refresh token cookie", async () => {
    const response = await request(app).post(`${authPath}/rotate-token`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INVALID_REQUEST" },
    });
  });

  it("rejects an unknown refresh token", async () => {
    const response = await request(app)
      .post(`${authPath}/rotate-token`)
      .set("Cookie", "refreshToken=unknown-refresh-token");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INVALID_REFRESH_TOKEN" },
    });
  });

  it("rejects reuse of a rotated refresh token", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const firstResponse = await request(app)
      .post(`${authPath}/rotate-token`)
      .set("Cookie", authUser.refreshCookie);
    const secondResponse = await request(app)
      .post(`${authPath}/rotate-token`)
      .set("Cookie", authUser.refreshCookie);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(401);
    expect(secondResponse.body).toMatchObject({
      success: false,
      error: { code: "REVOKED_REFRESH_TOKEN" },
    });
  });
});
