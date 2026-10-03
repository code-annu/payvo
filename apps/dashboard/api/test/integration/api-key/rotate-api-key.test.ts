import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("POST /api/merchants/:merchantId/api-keys/rotate", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("rotates an active API key", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "rotate-key-merchant",
			userId: auth.user.id,
		});
		const oldApiKey = await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "old_rotate_test_key",
			secretHash: "old-rotate-hash",
			environment: "TEST",
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/rotate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({
				environment: "TEST",
				oldKeyRevokeStrategy: "IMMEDIATELY",
			});

		expect(response.status).toBe(201);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			id: expect.any(String),
			keyId: expect.any(String),
			keySecret: expect.any(String),
			status: "ACTIVE",
			environment: "TEST",
			generatedAt: expect.any(String),
		});
		expect((await ApiKeyFactory.get(oldApiKey.id))?.status).toBe("REVOKED");

		const newApiKey = await ApiKeyFactory.get(response.body.data.id);
		expect(newApiKey?.merchantId).toBe(merchant.id);
		expect(newApiKey?.secretHash).not.toBe(response.body.data.keySecret);
	});

	it("keeps the previous API key active for 24 hours when requested", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "rotate-key-grace-merchant",
			userId: auth.user.id,
		});
		const oldApiKey = await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "old_rotate_grace_test_key",
			secretHash: "old-rotate-grace-hash",
			environment: "TEST",
		});

		const beforeRotation = Date.now();
		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/rotate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({
				environment: "TEST",
				oldKeyRevokeStrategy: "24_HOURS",
			});
		const afterRotation = Date.now();

		expect(response.status).toBe(201);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			id: expect.any(String),
			keyId: expect.any(String),
			keySecret: expect.any(String),
			status: "ACTIVE",
			environment: "TEST",
			generatedAt: expect.any(String),
		});

		const updatedOldKey = await ApiKeyFactory.get(oldApiKey.id);
		expect(updatedOldKey?.status).toBe("GRACE_PERIOD");
		expect(updatedOldKey?.graceEndsAt).not.toBeNull();
		const graceEndsAt = new Date(updatedOldKey!.graceEndsAt!).getTime();
		expect(graceEndsAt).toBeGreaterThanOrEqual(
			beforeRotation + 24 * 60 * 60 * 1000,
		);
		expect(graceEndsAt).toBeLessThanOrEqual(
			afterRotation + 24 * 60 * 60 * 1000,
		);

		const newApiKey = await ApiKeyFactory.get(response.body.data.id);
		expect(newApiKey?.merchantId).toBe(merchant.id);
		expect(newApiKey?.secretHash).not.toBe(response.body.data.keySecret);
	});

	it("requires an access token", async () => {
		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/rotate")
			.send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/rotate")
			.set("Authorization", "Bearer invalid-token")
			.send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/rotate")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a token for a deleted user", async () => {
		const auth = await loginUser();
		await UserFactory.update(auth.user.id, {
			deletedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/rotate")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a merchant that does not exist", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/rotate")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects a merchant not owned by the user", async () => {
		const auth = await loginUser();
		const otherUser = await UserFactory.create({
			email: "other-rotate-owner@example.com",
			passwordHash: "test-hash",
			fullname: "Other Owner",
			companyName: null,
		});
		const merchant = await MerchantFactory.create({
			mid: "other-rotate-owner-merchant",
			userId: otherUser.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/rotate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects an inactive merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "inactive-rotate-merchant",
			userId: auth.user.id,
		});
		await MerchantFactory.update(merchant.id, { isActive: false });

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/rotate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" });

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
	});

	it("rejects rotation when no active key exists", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "no-active-rotate-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/rotate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST", oldKeyRevokeStrategy: "IMMEDIATELY" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("API_KEY_NOT_FOUND");
	});

	it("rejects an invalid environment", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "invalid-env-rotate-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/rotate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "STAGING", oldKeyRevokeStrategy: "IMMEDIATELY" });

		expect(response.status).toBe(400);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["environment"] }),
			]),
		);
	});

	it("rejects an invalid revoke strategy", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "invalid-strategy-rotate-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/rotate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST", oldKeyRevokeStrategy: "NEVER" });

		expect(response.status).toBe(400);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["oldKeyRevokeStrategy"] }),
			]),
		);
	});

	it("rejects a missing request body", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "missing-body-rotate-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/rotate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({});

		expect(response.status).toBe(400);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["environment"] }),
				expect.objectContaining({ field: ["oldKeyRevokeStrategy"] }),
			]),
		);
	});
});