import app from "@/app.js";
import { MerchantStatus } from "@payvo/database/types";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MerchantFactory from "../../factory/merchant.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("GET /api/merchants", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("returns only merchants belonging to the authenticated user", async () => {
    const [{ user, accessToken }, { user: anotherUser }] = await Promise.all([
      createAuthenticatedUser(),
      createAuthenticatedUser(),
    ]);
    const firstMerchant = await MerchantFactory.create(user.id);
    const secondMerchant = await MerchantFactory.create(user.id, {
      status: MerchantStatus.SUSPENDED,
    });
    await MerchantFactory.create(anotherUser.id);

    const response = await request(app)
      .get("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Merchants fetched successfully",
      data: { userId: user.id },
    });
    expect(response.body.data.merchants).toHaveLength(2);
    expect(response.body.data.merchants).toEqual(
      expect.arrayContaining([
        {
          id: firstMerchant.id,
          mid: firstMerchant.mid,
          status: firstMerchant.status,
        },
        {
          id: secondMerchant.id,
          mid: secondMerchant.mid,
          status: secondMerchant.status,
        },
      ]),
    );
    expect(response.body.data.merchants[0]).not.toHaveProperty("userId");
    expect(response.body.data.merchants[0]).not.toHaveProperty("closedAt");
  });

  it("returns an empty list when the user has no merchants", async () => {
    const { user, accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .get("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ userId: user.id, merchants: [] });
  });

  it("rejects unauthenticated merchant retrieval", async () => {
    const response = await request(app).get("/api/merchants");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
