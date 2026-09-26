import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentOrderCreateInput } from "@payvo/database/types";
import app from "../../../src/app.js";
import setupDb from "../../helper/setupDb.js";
import UserFactory from "../../factory/user.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import PaymentOrderFactory from "../../factory/payment-order.factory.js";

describe("GET /api/payment-orders/:csi", () => {
	const request = supertest(app);

	beforeEach(async () => {
		await setupDb();
		vi.restoreAllMocks();
	});

	async function createPaymentOrder() {
		const user = await UserFactory.createUser();
		const merchant = await MerchantFactory.createMerchant(user.id);

		return PaymentOrderFactory.createPaymentOrder(merchant.id, {
			amount: "1250",
			currency: "USD" as PaymentOrderCreateInput["currency"],
			status: "CREATED",
		});
	}

	it("returns the payment order and available payment methods", async () => {
		const paymentOrder = await createPaymentOrder();

		const response = await request.get(
			`/api/payment-orders/${paymentOrder.csi}`,
		);

		expect(response.status, JSON.stringify(response.body)).toBe(200);
		expect(response.body).toEqual({
			success: true,
			data: {
				paymentOrder: {
					id: paymentOrder.id,
					csi: paymentOrder.csi,
					amount: "1250",
					currency: "USD",
					status: "CREATED",
					expiresAt: expect.any(String),
				},
				paymentMethods: [
					{
						id: expect.any(String),
						code: "card",
						name: "Card",
						iconUrl: "https://example.com/card.svg",
					},
					{
						id: expect.any(String),
						code: "bank_transfer",
						name: "Bank transfer",
						iconUrl: "https://example.com/bank-transfer.svg",
					},
				],
			},
		});

		expect(response.body.data.paymentOrder).not.toHaveProperty("merchantId");
		expect(response.body.data.paymentMethods[0]).not.toHaveProperty(
			"createdAt",
		);
	});

	it("returns not found for an unknown csi", async () => {
		const response = await request.get(
			"/api/payment-orders/csi_unknown-payment-order",
		);

		expect(response.status).toBe(404);
		expect(response.body).toMatchObject({
			success: false,
			error: { code: "PAYMENT_ORDER_NOT_FOUND" },
		});
	});

	it("rejects an empty csi", async () => {
		const response = await request.get("/api/payment-orders/%20");

		expect(response.status).toBe(400);
		expect(response.body).toMatchObject({
			success: false,
			error: { message: "Missing or invalid path parameters" },
		});
	});
});
