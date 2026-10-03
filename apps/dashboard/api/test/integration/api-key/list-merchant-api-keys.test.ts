import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("GET /api/merchants/:merchantId/api-keys", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("returns the API keys for an owned merchant without key material", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "list-api-keys-merchant",
			userId: auth.user.id,
		});
		const activeKey = await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "list_active_test_key",
			secretHash: "active-secret-hash",
			environment: "TEST",
			lastUsedAt: "2026-01-01T00:00:00.000Z",
		});
		const graceKey = await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "list_grace_live_key",
			secretHash: "grace-secret-hash",
			environment: "LIVE",
		});
		const graceEndsAt = "2026-02-01T00:00:00.000Z";
		await ApiKeyFactory.update(graceKey.id, {
			status: "GRACE_PERIOD",
			graceEndsAt,
		});
		const revokedKey = await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "list_revoked_test_key",
			secretHash: "revoked-secret-hash",
			environment: "TEST",
		});
		const revokedAt = "2026-03-01T00:00:00.000Z";
		await ApiKeyFactory.update(revokedKey.id, {
			status: "REVOKED",
			revokedAt,
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/api-keys`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			merchantId: merchant.id,
			apiKeys: expect.arrayContaining([
				{
					id: activeKey.id,
					status: "ACTIVE",
					environment: "TEST",
					graceEndsAt: null,
					revokedAt: null,
					lastUsedAt: expect.any(String),
				},
				{
					id: graceKey.id,
					status: "GRACE_PERIOD",
					environment: "LIVE",
					graceEndsAt,
					revokedAt: null,
					lastUsedAt: null,
				},
				{
					id: revokedKey.id,
					status: "REVOKED",
					environment: "TEST",
					graceEndsAt: null,
					revokedAt,
					lastUsedAt: null,
				},
			]),
		});
		expect(response.body.data.apiKeys).toHaveLength(3);
		for (const apiKey of response.body.data.apiKeys) {
			expect(apiKey).not.toHaveProperty("keyId");
			expect(apiKey).not.toHaveProperty("secretHash");
		}
	});

	it("returns an empty API-key list when the merchant has no keys", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "empty-api-keys-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/api-keys`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toEqual({
			merchantId: merchant.id,
			apiKeys: [],
		});
	});

	it("requires an access token", async () => {
		const response = await supertest(app).get(
			"/api/merchants/00000000-0000-4000-8000-000000000000/api-keys",
		);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys")
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a token for a deleted user", async () => {
		const auth = await loginUser();
		await UserFactory.update(auth.user.id, {
			deletedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a merchant that does not exist", async () => {
		const auth = await loginUser();

		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects a merchant not owned by the user", async () => {
		const auth = await loginUser();
		const otherUser = await UserFactory.create({
			email: "other-list-api-keys-owner@example.com",
			passwordHash: "test-hash",
			fullname: "Other API-Key List Owner",
			companyName: null,
		});
		const merchant = await MerchantFactory.create({
			mid: "other-list-api-keys-merchant",
			userId: otherUser.id,
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/api-keys`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects an inactive merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "inactive-list-api-keys-merchant",
			userId: auth.user.id,
		});
		await MerchantFactory.update(merchant.id, { isActive: false });

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/api-keys`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
	});

	it("rejects an invalid merchant id", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.get("/api/merchants/not-a-uuid/api-keys")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(400);
	});
});
