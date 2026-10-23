import app from "@/app.js";
import {
  ApiKeyEnvironment,
  ApiKeyStatus,
  MerchantStatus,
} from "@payvo/database/types";
import { hashKeySecret } from "@payvo/shared/api-key";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("POST /api/merchants/:merchantId/api-keys", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("generates an active API key for an owned merchant", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);

    const response = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: ApiKeyEnvironment.TEST });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "API key generated successfully",
      data: {
        merchantId: merchant.id,
        environment: ApiKeyEnvironment.TEST,
        status: ApiKeyStatus.ACTIVE,
        keyId: expect.stringMatching(/^pvo_test_[A-Za-z0-9_-]+$/),
        keySecret: expect.any(String),
        graceEndsAt: null,
        revokedAt: null,
        lastUsedAt: null,
        generatedAt: expect.any(String),
      },
    });

    const [storedKey] = await ApiKeyFactory.findByMerchantId(merchant.id);
    expect(storedKey).toMatchObject({
      id: response.body.data.id,
      merchantId: merchant.id,
      keyId: response.body.data.keyId,
      environment: ApiKeyEnvironment.TEST,
      status: ApiKeyStatus.ACTIVE,
    });
    expect(storedKey?.secretHash).toBe(
      hashKeySecret(response.body.data.keySecret),
    );
    expect(storedKey?.secretHash).not.toBe(response.body.data.keySecret);
  });

  it.each(["nonexistent", "other-user"] as const)(
    "returns not found when generating a key for a %s merchant",
    async (merchantOwner) => {
      const [{ accessToken }, { user: anotherUser }] = await Promise.all([
        createAuthenticatedUser(),
        createAuthenticatedUser(),
      ]);
      const merchant = await MerchantFactory.create(anotherUser.id);
      const merchantId =
        merchantOwner === "nonexistent" ? randomUUID() : merchant.id;

      const response = await request(app)
        .post(`/api/merchants/${merchantId}/api-keys`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ environment: ApiKeyEnvironment.TEST });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
    },
  );

  it.each([MerchantStatus.SUSPENDED, MerchantStatus.CLOSED])(
    "rejects key generation for a %s merchant",
    async (status) => {
      const { user, accessToken } = await createAuthenticatedUser();
      const merchant = await MerchantFactory.create(user.id, { status });

      const response = await request(app)
        .post(`/api/merchants/${merchant.id}/api-keys`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ environment: ApiKeyEnvironment.TEST });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("MERCHANT_NOT_ACTIVE");
    },
  );

  it("rejects generating a second active key for the same environment", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);
    const existingKey = await ApiKeyFactory.create(merchant.id);

    const response = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: ApiKeyEnvironment.TEST });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("API_KEY_ALREADY_EXISTS");
    expect(await ApiKeyFactory.findByMerchantId(merchant.id)).toEqual([
      expect.objectContaining({ id: existingKey.id }),
    ]);
  });

  it("allows one active key per environment", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);

    const testResponse = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: ApiKeyEnvironment.TEST });
    const liveResponse = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: ApiKeyEnvironment.LIVE });

    expect(testResponse.status).toBe(201);
    expect(liveResponse.status).toBe(201);
    expect(await ApiKeyFactory.findByMerchantId(merchant.id)).toHaveLength(2);
  });

  it("enforces the one-active-key constraint at the database level", async () => {
    const { user } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);
    const existingKey = await ApiKeyFactory.create(merchant.id);

    await expect(
      ApiKeyFactory.create(merchant.id, {
        keyId: `pvo_test_${randomUUID()}`,
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    expect(await ApiKeyFactory.findByMerchantId(merchant.id)).toEqual([
      expect.objectContaining({ id: existingKey.id }),
    ]);
  });

  it("rejects an invalid merchant id or environment", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);

    const invalidMerchantIdResponse = await request(app)
      .post("/api/merchants/not-a-uuid/api-keys")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: ApiKeyEnvironment.TEST });
    const invalidEnvironmentResponse = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "invalid" });

    expect(invalidMerchantIdResponse.status).toBe(400);
    expect(invalidEnvironmentResponse.status).toBe(400);
  });

  it("rejects unauthenticated key generation", async () => {
    const response = await request(app)
      .post(`/api/merchants/${randomUUID()}/api-keys`)
      .send({ environment: ApiKeyEnvironment.TEST });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});