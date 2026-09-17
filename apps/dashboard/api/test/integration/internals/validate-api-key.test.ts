import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { UserFactory } from "../../factory/user.factory.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { ApiKeyFactory } from "../../factory/api-key.factory.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import { appConfig } from "@payvo/config/app";

const INTERNAL_SECRET = appConfig.internalSecret;
const ENDPOINT = "/internal/validate-api-key";

describe("POST /internal/validate-api-key", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 200 with api key data for valid credentials", async () => {
    const { user } = await UserFactory.createUser({ email: "owner@test.com" });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    const { apiKey, plainKeySecret } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
    });

    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", INTERNAL_SECRET)
      .send({ keyId: apiKey.keyId, keySecret: plainKeySecret })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: expect.objectContaining({
        id: apiKey.id,
        keyId: apiKey.keyId,
        environment: "TEST",
        status: "ACTIVE",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Internal secret authentication
  // ---------------------------------------------------------------------------

  it("should return 401 MISSING_INTERNAL_SECRET when X-Internal-Secret header is missing", async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({ keyId: "some-key", keySecret: "some-secret" })
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "MISSING_INTERNAL_SECRET",
      }),
    });
  });

  it("should return 401 INVALID_INTERNAL_SECRET when X-Internal-Secret is wrong", async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", "wrong-secret-value")
      .send({ keyId: "some-key", keySecret: "some-secret" })
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "INVALID_INTERNAL_SECRET",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid API key
  // ---------------------------------------------------------------------------

  it("should return 401 INVALID_API_KEY_CREDENTIALS for non-existent keyId", async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", INTERNAL_SECRET)
      .send({ keyId: "nonexistent-key-id", keySecret: "any-secret" })
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "INVALID_API_KEY_CREDENTIALS",
      }),
    });
  });

  it("should return 401 INVALID_API_KEY_CREDENTIALS for wrong keySecret", async () => {
    const { user } = await UserFactory.createUser({ email: "owner@test.com" });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    const { apiKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
    });

    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", INTERNAL_SECRET)
      .send({ keyId: apiKey.keyId, keySecret: "wrong-secret" })
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "INVALID_API_KEY_CREDENTIALS",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Inactive merchant
  // ---------------------------------------------------------------------------

  it("should return 401 INVALID_API_KEY_CREDENTIALS when merchant is not active", async () => {
    const { user } = await UserFactory.createUser({ email: "owner@test.com" });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
      isActive: false,
    });
    const { apiKey, plainKeySecret } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
    });

    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", INTERNAL_SECRET)
      .send({ keyId: apiKey.keyId, keySecret: plainKeySecret })
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "INVALID_API_KEY_CREDENTIALS",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Revoked API key
  // ---------------------------------------------------------------------------

  it("should return 401 REVOKED_API_KEY when api key is revoked", async () => {
    const { user } = await UserFactory.createUser({ email: "owner@test.com" });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    const { apiKey, plainKeySecret } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      status: "REVOKED",
    });

    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", INTERNAL_SECRET)
      .send({ keyId: apiKey.keyId, keySecret: plainKeySecret })
      .expect(401);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "REVOKED_API_KEY",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Validation errors
  // ---------------------------------------------------------------------------

  it("should return 400 when keyId is missing", async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", INTERNAL_SECRET)
      .send({ keySecret: "some-secret" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 when keySecret is missing", async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", INTERNAL_SECRET)
      .send({ keyId: "some-key" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 when body is empty", async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", INTERNAL_SECRET)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 when keyId is an empty string", async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", INTERNAL_SECRET)
      .send({ keyId: "", keySecret: "some-secret" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 when keySecret is an empty string", async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set("X-Internal-Secret", INTERNAL_SECRET)
      .send({ keyId: "some-key", keySecret: "" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});
