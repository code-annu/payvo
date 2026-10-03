import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import WebhookFactory from "../../factory/webhook.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("GET /api/merchants/:merchantId/webhooks/:webhookId", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("returns details for a webhook belonging to the merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "get-webhook-details-merchant",
			userId: auth.user.id,
		});
		const webhook = await WebhookFactory.create({
			merchantId: merchant.id,
			secretKey: "webhook-details-secret",
			url: "https://example.com/webhook-details",
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/webhooks/${webhook.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toEqual({
			id: webhook.id,
			merchantId: merchant.id,
			secretKey: webhook.secretKey,
			url: webhook.url,
		});
	});

	it("requires an access token", async () => {
		const response = await supertest(app).get(
			"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks/00000000-0000-4000-8000-000000000000",
		);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.get(
				"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks/00000000-0000-4000-8000-000000000000",
			)
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.get(
				"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks/00000000-0000-4000-8000-000000000000",
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
			.get(
				"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks/00000000-0000-4000-8000-000000000000",
			)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a merchant that does not exist", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.get(
				"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks/00000000-0000-4000-8000-000000000000",
			)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects a merchant not owned by the user", async () => {
		const auth = await loginUser();
		const otherUser = await UserFactory.create({
			email: "other-webhook-details-owner@example.com",
			passwordHash: "test-hash",
			fullname: "Other Webhook Details Owner",
			companyName: null,
		});
		const merchant = await MerchantFactory.create({
			mid: "other-webhook-details-merchant",
			userId: otherUser.id,
		});
		const webhook = await WebhookFactory.create({
			merchantId: merchant.id,
			secretKey: "other-owner-webhook-secret",
			url: "https://example.com/other-owner",
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/webhooks/${webhook.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects an inactive merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "inactive-webhook-details-merchant",
			userId: auth.user.id,
		});
		await MerchantFactory.update(merchant.id, { isActive: false });
		const webhook = await WebhookFactory.create({
			merchantId: merchant.id,
			secretKey: "inactive-webhook-details-secret",
			url: "https://example.com/inactive",
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/webhooks/${webhook.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
	});

	it("returns not found when the webhook does not exist", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "missing-webhook-details-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.get(
				`/api/merchants/${merchant.id}/webhooks/00000000-0000-4000-8000-000000000000`,
			)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("WEBHOOK_NOT_FOUND");
	});

	it("does not return a webhook belonging to a different merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "webhook-details-requested-merchant",
			userId: auth.user.id,
		});
		const otherMerchant = await MerchantFactory.create({
			mid: "webhook-details-owning-merchant",
			userId: auth.user.id,
		});
		const webhook = await WebhookFactory.create({
			merchantId: otherMerchant.id,
			secretKey: "different-merchant-webhook-secret",
			url: "https://example.com/different-merchant",
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/webhooks/${webhook.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("WEBHOOK_NOT_FOUND");
	});

	it("rejects invalid merchant and webhook ids", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.get("/api/merchants/not-a-uuid/webhooks/not-a-uuid")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(400);
	});
});
