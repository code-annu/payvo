import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("POST /api/merchants/:merchantId/api-keys/:apiKeyId/revoke", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("revokes an API key owned by the authenticated user", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "revoke-key-merchant",
			userId: auth.user.id,
		});
		const apiKey = await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "revoke_test_key",
			secretHash: "revoke-key-hash",
			environment: "TEST",
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/${apiKey.id}/revoke`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			id: apiKey.id,
			keyId: apiKey.keyId,
			status: "REVOKED",
			environment: "TEST",
		});
		expect(response.body.data.revokedAt).toEqual(expect.any(String));
		expect((await ApiKeyFactory.get(apiKey.id))?.status).toBe("REVOKED");
	});

	it("requires an access token", async () => {
		const response = await supertest(app).post(
			"/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/00000000-0000-4000-8000-000000000000/revoke",
		);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.post(
				"/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/00000000-0000-4000-8000-000000000000/revoke",
			)
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.post(
				"/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/00000000-0000-4000-8000-000000000000/revoke",
			)
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
			.post(
				"/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/00000000-0000-4000-8000-000000000000/revoke",
			)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects revoking a key for a merchant not owned by the user", async () => {
		const auth = await loginUser();
		const otherUser = await UserFactory.create({
			email: "other-revoke-owner@example.com",
			passwordHash: "test-hash",
			fullname: "Other Owner",
			companyName: null,
		});
		const merchant = await MerchantFactory.create({
			mid: "other-revoke-owner-merchant",
			userId: otherUser.id,
		});
		const apiKey = await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "other_owner_revoke_key",
			secretHash: "other-owner-hash",
			environment: "TEST",
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/${apiKey.id}/revoke`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects revoking a key for an inactive merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "inactive-revoke-merchant",
			userId: auth.user.id,
		});
		const apiKey = await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "inactive_revoke_key",
			secretHash: "inactive-key-hash",
			environment: "TEST",
		});
		await MerchantFactory.update(merchant.id, { isActive: false });

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/${apiKey.id}/revoke`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
	});

	it("rejects an API key that does not exist for the merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "missing-revoke-key-merchant",
			userId: auth.user.id,
		});
		const response = await supertest(app)
			.post(
				`/api/merchants/${merchant.id}/api-keys/00000000-0000-4000-8000-000000000000/revoke`,
			)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("API_KEY_NOT_FOUND");
	});

	it("rejects revoking an API key that has already been revoked", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "already-revoked-key-merchant",
			userId: auth.user.id,
		});
		const apiKey = await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "already_revoked_key",
			secretHash: "already-revoked-hash",
			environment: "TEST",
			status: "REVOKED",
			revokedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/${apiKey.id}/revoke`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(409);
		expect(response.body.error.code).toBe("REVOKED_API_KEY");
	});

	it("rejects invalid merchant and API-key ids", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.post("/api/merchants/not-a-uuid/api-keys/not-a-uuid/revoke")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(400);
	});
});
