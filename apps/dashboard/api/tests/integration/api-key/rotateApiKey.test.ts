import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("PATCH /api/merchants/:id/api-keys/rotate", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 200 and new key when rotating with IMMEDIATELY strategy", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    // Generate initial key
    const genRes = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    const originalKeyId = genRes.body.data.keyId;

    // Rotate
    const res = await request(app)
      .patch(`/api/merchants/${merchantId}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.keyId).toBeDefined();
    expect(res.body.data.keySecret).toBeDefined();
    expect(res.body.data.generatedOn).toBeDefined();
    // New key must be different from the old one
    expect(res.body.data.keyId).not.toBe(originalKeyId);
  });

  it("should return 200 and new key when rotating with 24_HOURS strategy", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    const res = await request(app)
      .patch(`/api/merchants/${merchantId}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST", oldKeyRevokeStrategy: "24_HOURS" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.keyId).toBeDefined();
    expect(res.body.data.keySecret).toBeDefined();
    expect(res.body.data.generatedOn).toBeDefined();
  });

  it("should return a new active api key retrievable via GET after rotation", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    // Rotate with IMMEDIATELY so the old key is gone
    const rotateRes = await request(app)
      .patch(`/api/merchants/${merchantId}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(200);

    const newKeyId = rotateRes.body.data.keyId;

    // GET should now return the new key
    const getRes = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "TEST" })
      .expect(200);

    expect(getRes.body.data.keyId).toBe(newKeyId);
  });

  it("should rotate keys independently per environment", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    // Generate keys for both environments
    await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    const liveGenRes = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "LIVE" })
      .expect(201);

    const liveOriginalKeyId = liveGenRes.body.data.keyId;

    // Rotate only TEST key
    await request(app)
      .patch(`/api/merchants/${merchantId}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(200);

    // LIVE key should remain unchanged
    const liveGetRes = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "LIVE" })
      .expect(200);

    expect(liveGetRes.body.data.keyId).toBe(liveOriginalKeyId);
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 404 when no active api key exists to rotate", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const res = await request(app)
      .patch(`/api/merchants/${merchantId}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("API_KEY_NOT_FOUND");
  });

  it("should return 403 when authenticated user does not own the merchant", async () => {
    const { accessToken: accessToken1 } = await AuthHelper.getAuthUser();
    const { accessToken: accessToken2 } = await AuthHelper.getAuthUser();

    // User 1 creates merchant and generates a key
    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken1}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken1}`)
      .send({ environment: "TEST" })
      .expect(201);

    // User 2 tries to rotate
    const res = await request(app)
      .patch(`/api/merchants/${merchantId}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken2}`)
      .send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_USER_MISMATCH");
  });

  it("should return 404 when merchant does not exist", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/rotate")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" })
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
      .patch(`/api/merchants/${merchantId}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" })
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
      .patch(`/api/merchants/${merchantId}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when oldKeyRevokeStrategy is missing from request body", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const res = await request(app)
      .patch(`/api/merchants/${merchantId}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when oldKeyRevokeStrategy has an invalid value", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const res = await request(app)
      .patch(`/api/merchants/${merchantId}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST", oldKeyRevokeStrategy: "INSTANTLY" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when merchantId is not a valid UUID", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/merchants/invalid-uuid/api-keys/rotate")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 when no auth token is provided", async () => {
    const res = await request(app)
      .patch("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/rotate")
      .send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 when invalid auth token is provided", async () => {
    const res = await request(app)
      .patch("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/rotate")
      .set("Authorization", "Bearer invalid-token")
      .send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
