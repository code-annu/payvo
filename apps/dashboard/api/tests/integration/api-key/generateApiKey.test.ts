import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("POST /api/merchants/:id/api-keys", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 201 and the generated api key for TEST environment", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    // Create a merchant (created as active by default)
    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const res = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.keyId).toBeDefined();
    expect(res.body.data.keySecret).toBeDefined();
    expect(res.body.data.generatedOn).toBeDefined();
  });

  it("should return 201 and the generated api key for LIVE environment", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const res = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "LIVE" })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.keyId).toBeDefined();
    expect(res.body.data.keySecret).toBeDefined();
    expect(res.body.data.generatedOn).toBeDefined();
  });

  it("should allow independent keys for TEST and LIVE environments", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const testRes = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    const liveRes = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "LIVE" })
      .expect(201);

    expect(testRes.body.data.keyId).not.toBe(liveRes.body.data.keyId);
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 409 when an active api key already exists for the environment", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    // First key generation
    await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    // Second key generation for same environment
    const res = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("API_KEY_ALREADY_EXISTS");
  });

  it("should return 403 when authenticated user does not own the merchant", async () => {
    const { accessToken: accessToken1 } = await AuthHelper.getAuthUser();
    const { accessToken: accessToken2 } = await AuthHelper.getAuthUser();

    // User 1 creates a merchant
    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken1}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    // User 2 tries to generate api key for user 1's merchant
    const res = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ environment: "TEST" })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_USER_MISMATCH");
  });

  it("should return 404 when merchant does not exist", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 409 when merchant is inactive", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    // Inactivate the merchant
    await request(app)
      .patch(`/api/merchants/${merchantId}/inactivate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const res = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_INACTIVE");
  });

  it("should return 400 when environment is missing from request body", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const res = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when environment is an invalid value", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const res = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "INVALID" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when merchantId is not a valid UUID", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .post("/api/merchants/invalid-uuid/api-keys")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 when no auth token is provided", async () => {
    const res = await request(app)
      .post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys")
      .send({ environment: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 when invalid auth token is provided", async () => {
    const res = await request(app)
      .post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys")
      .set("Authorization", "Bearer invalid-token")
      .send({ environment: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
