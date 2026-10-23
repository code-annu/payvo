import app from "@/app.js";
import {
  ApiKeyEnvironment,
  ApiKeyStatus,
  MerchantStatus,
} from "@payvo/database/types";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("PATCH /api/merchants/:merchantId/close", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("closes an active merchant owned by the authenticated user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);

    const response = await request(app)
      .patch(`/api/merchants/${merchant.id}/close`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Merchant closed successfully",
      data: {
        id: merchant.id,
        userId: user.id,
        status: MerchantStatus.CLOSED,
        closedAt: expect.any(String),
      },
    });

    const storedMerchant = await MerchantFactory.find(merchant.id);
    expect(storedMerchant?.status).toBe(MerchantStatus.CLOSED);
    expect(storedMerchant?.closedAt).toBeInstanceOf(Date);
  });

  it("revokes all API keys when closing the merchant", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);

    const testKeyResponse = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: ApiKeyEnvironment.TEST });
    const liveKeyResponse = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: ApiKeyEnvironment.LIVE });

    expect(testKeyResponse.status).toBe(201);
    expect(liveKeyResponse.status).toBe(201);

    const response = await request(app)
      .patch(`/api/merchants/${merchant.id}/close`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    const storedKeys = await ApiKeyFactory.findByMerchantId(merchant.id);
    expect(storedKeys).toHaveLength(2);
    expect(storedKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: testKeyResponse.body.data.id,
          status: ApiKeyStatus.REVOKED,
          revokedAt: expect.any(Date),
        }),
        expect.objectContaining({
          id: liveKeyResponse.body.data.id,
          status: ApiKeyStatus.REVOKED,
          revokedAt: expect.any(Date),
        }),
      ]),
    );
  });

  it.each(["nonexistent", "other-user"] as const)(
    "returns not found when closing a %s merchant",
    async (merchantOwner) => {
      const [{ accessToken }, { user: otherUser }] = await Promise.all([
        createAuthenticatedUser(),
        createAuthenticatedUser(),
      ]);
      const merchant = await MerchantFactory.create(otherUser.id);
      const merchantId =
        merchantOwner === "nonexistent" ? randomUUID() : merchant.id;

      const response = await request(app)
        .patch(`/api/merchants/${merchantId}/close`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
    },
  );

  it("rejects closing a merchant that is already closed", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const closedAt = new Date();
    const merchant = await MerchantFactory.create(user.id, {
      status: MerchantStatus.CLOSED,
      closedAt,
    });

    const response = await request(app)
      .patch(`/api/merchants/${merchant.id}/close`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("MERCHANT_NOT_ACTIVE");

    const storedMerchant = await MerchantFactory.find(merchant.id);
    expect(storedMerchant?.closedAt?.getTime()).toBe(closedAt.getTime());
  });

  it("rejects an invalid merchant id", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/merchants/not-a-uuid/close")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects unauthenticated merchant closure", async () => {
    const response = await request(app).patch(
      `/api/merchants/${randomUUID()}/close`,
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
