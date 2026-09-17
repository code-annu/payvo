import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { ApiKeyFactory } from "../../factory/api-key.factory.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

const endpoint = (merchantId: string) =>
  `/api/merchants/${merchantId}/api-keys/rotate`;

describe("POST /api/merchants/:id/api-keys/rotate", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("should create a new key with IMMEDIATELY strategy", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "rotate1@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    const { apiKey: oldKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY", environment: "TEST" })
      .expect(201);

    expect(res.body.data.status).toBe("ACTIVE");
    expect(res.body.data.id).not.toBe(oldKey.id);
  });

  it("should revoke the old key immediately", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "revokecheck@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    const { apiKey: oldKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY", environment: "TEST" })
      .expect(201);

    const dbOldKey = await ApiKeyFactory.findApiKeyById(oldKey.id);
    expect(dbOldKey!.status).toBe("REVOKED");
    expect(dbOldKey!.revokedAt).not.toBeNull();
  });

  it("should set the old key to GRACE_PERIOD with 24_HOURS", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "grace@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    const { apiKey: oldKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "24_HOURS", environment: "TEST" })
      .expect(201);

    const dbOldKey = await ApiKeyFactory.findApiKeyById(oldKey.id);
    expect(dbOldKey!.status).toBe("GRACE_PERIOD");
    expect(dbOldKey!.graceEndsAt).not.toBeNull();
  });

  it("should return an active key with 24_HOURS strategy", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "rotate24@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    const { apiKey: oldKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "24_HOURS", environment: "TEST" })
      .expect(201);

    expect(res.body.data.status).toBe("ACTIVE");
    expect(res.body.data.id).not.toBe(oldKey.id);
  });

  it("should return 401 without authorization", async () => {
    const { user } = await getAuthenticatedUser({ email: "noauth@example.com" });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY", environment: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 404 when the merchant does not exist", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "keynotfound@example.com",
    });

    const res = await request(app)
      .post(endpoint("00000000-0000-0000-0000-000000000000"))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY", environment: "TEST" })
      .expect(404);

    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 404 for another user's merchant", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "attacker@example.com",
    });
    const { user: owner } = await getAuthenticatedUser({
      email: "owner@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: owner.id });
    await ApiKeyFactory.createApiKey({ merchantId: merchant.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY", environment: "TEST" })
      .expect(404);

    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 404 when the merchant has no active key to rotate", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "rotaterevoked@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
      status: "REVOKED",
    });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY", environment: "TEST" })
      .expect(404);

    expect(res.body.error.code).toBe("API_KEY_NOT_FOUND");
  });

  it("should return 400 when strategy is missing", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "nostrategy@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(400);

    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 for an invalid strategy", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "badstrategy@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "NEVER", environment: "TEST" })
      .expect(400);

    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});