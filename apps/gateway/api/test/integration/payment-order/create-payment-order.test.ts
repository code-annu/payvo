import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../../src/app.js";
import { axiosClient } from "../../../src/core/axios/axios.client.js";
import setupDb from "../../helper/setupDb.js";
import UserFactory from "../../factory/user.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import PaymentOrderFactory from "../../factory/payment-order.factory.js";

describe("POST /api/payment-orders", () => {
  const request = supertest(app);

  beforeEach(async () => {
    await setupDb();
    vi.restoreAllMocks();
  });

  async function createCredentials() {
    const user = await UserFactory.createUser();
    const merchant = await MerchantFactory.createMerchant(user.id);
    const credentials = await ApiKeyFactory.createApiKey(merchant.id);

    vi.spyOn(axiosClient, "post").mockResolvedValue({
      data: {
        data: {
          valid: true,
          merchantId: merchant.id,
          environment: "TEST",
        },
      },
    } as never);

    return credentials;
  }

  function validPayload() {
    return {
      merchantCustomerId: crypto.randomUUID(),
      merchantOrderId: crypto.randomUUID(),
      idempotencyKey: `request_${crypto.randomUUID()}`,
      amount: 1250,
      currency: "USD",
    };
  }

  it("creates a payment order and returns its checkout URL", async () => {
    const { keyId, keySecret } = await createCredentials();
    const payload = validPayload();

    const response = await request
      .post("/api/payment-orders")
      .set("x-api-key-id", keyId)
      .set("x-api-key-secret", keySecret)
      .send(payload);

    expect(response.status, JSON.stringify(response.body)).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: { checkoutUrl: expect.stringMatching(/\/[^/]+$/) },
    });
    expect(axiosClient.post).toHaveBeenCalledWith("/validate-api-key", {
      keyId,
      keySecret,
    });
  });

  it("returns the existing checkout URL for an idempotent request", async () => {
    const { apiKey, keyId, keySecret } = await createCredentials();
    const payload = validPayload();
    const existingOrder = await PaymentOrderFactory.createPaymentOrder(
      apiKey.merchantId,
      { idempotencyKey: payload.idempotencyKey },
    );

    const response = await request
      .post("/api/payment-orders")
      .set("x-api-key-id", keyId)
      .set("x-api-key-secret", keySecret)
      .send(payload);

    expect(response.status, JSON.stringify(response.body)).toBe(201);
    expect(response.body.data.checkoutUrl).toMatch(
      new RegExp(`${existingOrder.csi}$`),
    );
  });

  it("rejects requests without API-key credentials", async () => {
    const response = await request
      .post("/api/payment-orders")
      .send(validPayload());

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("MISSING_API_KEY_CREDENTIALS");
  });

  it("rejects an invalid payment order body", async () => {
    const { keyId, keySecret } = await createCredentials();

    const response = await request
      .post("/api/payment-orders")
      .set("x-api-key-id", keyId)
      .set("x-api-key-secret", keySecret)
      .send({ ...validPayload(), amount: 0, merchantOrderId: "invalid" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { message: "Missing or invalid request body" },
    });
  });
});
