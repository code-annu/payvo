import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import MerchantFactory from "../../factory/merchant.factory";
import { prisma } from "@/core/prisma/prisma.client";

describe("POST /api/merchants/:id/api-keys", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 201 with api key data including plaintext key value", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ keyType: "SECRET", environment: "TEST" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.apiKey).toBeDefined();
    expect(res.body.data.apiKey.id).toBeDefined();
    expect(res.body.data.apiKey.merchantId).toBe(merchant.id);
    expect(res.body.data.apiKey.keyType).toBe("SECRET");
    expect(res.body.data.apiKey.environment).toBe("TEST");
    expect(res.body.data.apiKey.keyPrefix).toBeDefined();
    expect(res.body.data.apiKey.isActive).toBe(true);
    expect(res.body.data.apiKey.createdAt).toBeDefined();
    // Plaintext key must be returned on creation
    expect(res.body.data.apiKey.keyValue).toBeDefined();
    expect(typeof res.body.data.apiKey.keyValue).toBe("string");
    expect(res.body.data.apiKey.keyValue.length).toBeGreaterThan(0);

    // Verify persisted in DB
    const dbApiKey = await prisma.apiKey.findUnique({
      where: { id: res.body.data.apiKey.id },
    });
    expect(dbApiKey).not.toBeNull();
    expect(dbApiKey?.merchantId).toBe(merchant.id);
    expect(dbApiKey?.keyType).toBe("SECRET");
    expect(dbApiKey?.environment).toBe("TEST");
  });

  it("should create a PUBLISHABLE LIVE key", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ keyType: "PUBLISHABLE", environment: "LIVE" });

    expect(res.status).toBe(201);
    expect(res.body.data.apiKey.keyType).toBe("PUBLISHABLE");
    expect(res.body.data.apiKey.environment).toBe("LIVE");
  });

  // ── Validation errors ──────────────────────────────────────────────

  it("should return 400 if keyType is missing", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ environment: "TEST" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if environment is missing", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ keyType: "SECRET" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if keyType is invalid", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ keyType: "INVALID", environment: "TEST" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if body is empty", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Not found / Isolation ──────────────────────────────────────────

  it("should return 404 with MERCHANT_NOT_FOUND if merchant does not exist", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const nonExistentId = "a0000000-0000-4000-a000-000000000000";

    const res = await request(app)
      .post(`/api/merchants/${nonExistentId}/api-keys`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ keyType: "SECRET", environment: "TEST" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 403 with MERCHANT_ACCESS_DENIED if merchant belongs to another user", async () => {
    const { authUser: user1 } = await AuthHelper.getAuthenticatedUser();
    const { authUser: user2 } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(user2.user.id);

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${user1.accessToken}`)
      .send({ keyType: "SECRET", environment: "TEST" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_ACCESS_DENIED");
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app)
      .post("/api/merchants/a0000000-0000-4000-a000-000000000000/api-keys")
      .send({ keyType: "SECRET", environment: "TEST" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .post("/api/merchants/a0000000-0000-4000-a000-000000000000/api-keys")
      .set("Authorization", "Bearer invalid-token")
      .send({ keyType: "SECRET", environment: "TEST" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
