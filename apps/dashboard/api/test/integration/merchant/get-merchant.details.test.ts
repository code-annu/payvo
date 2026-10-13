import app from "@/app.js";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MerchantFactory from "../../factory/merchant.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("GET /api/merchants/:merchantId", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("returns merchant details for the authenticated owner", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);

    const response = await request(app)
      .get(`/api/merchants/${merchant.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Merchant fetched successfully",
      data: {
        id: merchant.id,
        userId: user.id,
        mid: merchant.mid,
        status: merchant.status,
        closedAt: null,
      },
    });
  });

  it.each(["nonexistent", "other-user"] as const)(
    "returns not found for a %s merchant",
    async (merchantOwner) => {
      const [{ accessToken }, { user: otherUser }] = await Promise.all([
        createAuthenticatedUser(),
        createAuthenticatedUser(),
      ]);
      const merchantId =
        merchantOwner === "nonexistent"
          ? randomUUID()
          : (await MerchantFactory.create(otherUser.id)).id;

      const response = await request(app)
        .get(`/api/merchants/${merchantId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
    },
  );

  it("rejects an invalid merchant id", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .get("/api/merchants/not-a-uuid")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects unauthenticated merchant detail retrieval", async () => {
    const response = await request(app).get(`/api/merchants/${randomUUID()}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
