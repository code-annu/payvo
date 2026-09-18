import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import UserFactory from "../../factory/user.factory.js";
import { cleanupUser } from "../../helper/cleanup.js";
import { loginUser } from "../../helper/auth.helper.js";

const accountPath = "/api/account";

afterEach(async () => {
  await cleanupUser();
});

describe("GET /api/account", () => {
  it("returns the authenticated account", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .get(accountPath)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: authUser.user.id,
        email: authUser.user.email,
        fullname: authUser.user.fullname,
        companyName: authUser.user.companyName,
      },
    });
    expect(response.body.data.passwordHash).toBeUndefined();
  });

  it("rejects requests without an access token", async () => {
    const response = await request(app).get(accountPath);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MISSING_ACCESS_TOKEN" },
    });
  });
});

describe("PATCH /api/account", () => {
  it("updates the authenticated account", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const updates = {
      fullname: "Updated Integration User",
      companyName: "Updated Integration Company",
    };

    const response = await request(app)
      .patch(accountPath)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send(updates);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: authUser.user.id,
        fullname: updates.fullname,
        companyName: updates.companyName,
      },
    });
    expect(response.body.data.passwordHash).toBeUndefined();
  });

  it("rejects an invalid request body", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .patch(accountPath)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ fullname: "x" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INVALID_REQUEST" },
    });
  });

  it("rejects requests without an access token", async () => {
    const response = await request(app)
      .patch(accountPath)
      .send({ fullname: "Updated User" });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MISSING_ACCESS_TOKEN" },
    });
  });
});

describe("DELETE /api/account", () => {
  it("soft-deletes the authenticated account", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .delete(accountPath)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    const getResponse = await request(app)
      .get(accountPath)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(getResponse.status).toBe(404);
    expect(getResponse.body).toMatchObject({
      success: false,
      error: { code: "ACCOUNT_NOT_FOUND" },
    });
  });

  it("rejects requests without an access token", async () => {
    const response = await request(app).delete(accountPath);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MISSING_ACCESS_TOKEN" },
    });
  });
});
