import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import WebhookFactory from "../../factory/webhook.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("PATCH /api/merchants/:merchantId/webhooks/:webhookId", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("updates a webhook URL and preserves its secret", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "update-webhook-merchant",
			userId: auth.user.id,
		});
		const webhook = await WebhookFactory.create({
			merchantId: merchant.id,
			secretKey: "unchanged-webhook-secret",
			url: "https://example.com/old",
		});
		const url = "https://example.com/new";

		const response = await supertest(app)
			.patch(`/api/merchants/${merchant.id}/webhooks/${webhook.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url });

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			id: webhook.id,
			merchantId: merchant.id,
			secretKey: webhook.secretKey,
			url,
		});
		expect(await WebhookFactory.get(webhook.id)).toMatchObject({
			url,
			secretKey: webhook.secretKey,
		});
	});

	it("requires an access token", async () => {
		const response = await supertest(app).patch(
			"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks/00000000-0000-4000-8000-000000000000",
		);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.patch(
				"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks/00000000-0000-4000-8000-000000000000",
			)
			.set("Authorization", "Bearer invalid-token")
			.send({ url: "https://example.com/new" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.patch(
				"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks/00000000-0000-4000-8000-000000000000",
			)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/new" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a token for a deleted user", async () => {
		const auth = await loginUser();
		await UserFactory.update(auth.user.id, {
			deletedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.patch(
				"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks/00000000-0000-4000-8000-000000000000",
			)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/new" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a merchant that does not exist", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.patch(
				"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks/00000000-0000-4000-8000-000000000000",
			)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/new" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects a merchant not owned by the user", async () => {
		const auth = await loginUser();
		const otherUser = await UserFactory.create({
			email: "other-update-owner@example.com",
			passwordHash: "test-hash",
			fullname: "Other Update Owner",
			companyName: null,
		});
		const merchant = await MerchantFactory.create({
			mid: "other-update-owner-merchant",
			userId: otherUser.id,
		});
		const webhook = await WebhookFactory.create({
			merchantId: merchant.id,
			secretKey: "other-update-owner-secret",
			url: "https://example.com/original",
		});

		const response = await supertest(app)
			.patch(`/api/merchants/${merchant.id}/webhooks/${webhook.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/new" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects an inactive merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "inactive-update-merchant",
			userId: auth.user.id,
		});
		await MerchantFactory.update(merchant.id, { isActive: false });
		const webhook = await WebhookFactory.create({
			merchantId: merchant.id,
			secretKey: "inactive-update-secret",
			url: "https://example.com/original",
		});

		const response = await supertest(app)
			.patch(`/api/merchants/${merchant.id}/webhooks/${webhook.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/new" });

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
	});

	it("returns not found when the webhook does not exist", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "missing-update-webhook-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.patch(
				`/api/merchants/${merchant.id}/webhooks/00000000-0000-4000-8000-000000000000`,
			)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/new" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("WEBHOOK_NOT_FOUND");
	});

	it("does not update a webhook belonging to a different merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "update-wrong-merchant",
			userId: auth.user.id,
		});
		const otherMerchant = await MerchantFactory.create({
			mid: "update-webhook-other-merchant",
			userId: auth.user.id,
		});
		const webhook = await WebhookFactory.create({
			merchantId: otherMerchant.id,
			secretKey: "wrong-merchant-update-secret",
			url: "https://example.com/original",
		});

		const response = await supertest(app)
			.patch(`/api/merchants/${merchant.id}/webhooks/${webhook.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/new" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("WEBHOOK_NOT_FOUND");
		expect((await WebhookFactory.get(webhook.id))?.url).toBe(
			"https://example.com/original",
		);
	});

	it("rejects an invalid URL", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "invalid-url-update-merchant",
			userId: auth.user.id,
		});
		const webhook = await WebhookFactory.create({
			merchantId: merchant.id,
			secretKey: "invalid-url-update-secret",
			url: "https://example.com/original",
		});

		const response = await supertest(app)
			.patch(`/api/merchants/${merchant.id}/webhooks/${webhook.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "not-a-url" });

		expect(response.status).toBe(400);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["url"] }),
			]),
		);
	});

	it("rejects invalid merchant and webhook ids", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.patch("/api/merchants/not-a-uuid/webhooks/not-a-uuid")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/new" });

		expect(response.status).toBe(400);
	});
});
