import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentOrderCreateInput } from "@payvo/database/types";
import app from "../../../src/app.js";
import setupDb from "../../helper/setupDb.js";
import UserFactory from "../../factory/user.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import PaymentOrderFactory from "../../factory/payment-order.factory.js";

describe("POST /api/payment-orders/:paymentOrderId/attempt", () => {
	const request = supertest(app);

	beforeEach(async () => {
		await setupDb();
		vi.restoreAllMocks();
	});

	async function createOrderWithMerchant(
		overrides: Partial<PaymentOrderCreateInput> = {},
	) {
		const user = await UserFactory.createUser();
		const merchant = await MerchantFactory.createMerchant(user.id);
		const paymentOrder = await PaymentOrderFactory.createPaymentOrder(
			merchant.id,
			overrides,
		);
		return { user, merchant, paymentOrder };
	}

	it("creates a payment attempt for a valid order", async () => {
		const { paymentOrder } = await createOrderWithMerchant();

		const response = await request
			.post(`/api/payment-orders/${paymentOrder.id}/attempt`)
			.send({ paymentMethodCode: "card" });

		expect(response.status, JSON.stringify(response.body)).toBe(201);
		expect(response.body).toEqual({
			success: true,
			data: {
				paymentAttemptId: expect.any(String),
				paymentMethod: {
					id: expect.any(String),
					code: "card",
					name: "Card",
				},
				status: "PROCESSING",
			},
		});
	});

	it("rejects an attempt for a non-existent payment order", async () => {
		const fakeOrderId = crypto.randomUUID();

		const response = await request
			.post(`/api/payment-orders/${fakeOrderId}/attempt`)
			.send({ paymentMethodCode: "card" });

		expect(response.status).toBe(404);
		expect(response.body).toMatchObject({
			success: false,
			error: { code: "PAYMENT_ORDER_NOT_FOUND" },
		});
	});

	it("rejects an attempt with an invalid paymentOrderId", async () => {
		const response = await request
			.post("/api/payment-orders/not-a-uuid/attempt")
			.send({ paymentMethodCode: "card" });

		expect(response.status).toBe(400);
		expect(response.body).toMatchObject({
			success: false,
			error: { message: "Missing or invalid path parameters" },
		});
	});

	it("rejects an attempt with a non-existent payment method", async () => {
		const { paymentOrder } = await createOrderWithMerchant();

		const response = await request
			.post(`/api/payment-orders/${paymentOrder.id}/attempt`)
			.send({ paymentMethodCode: "crypto" });

		expect(response.status).toBe(404);
		expect(response.body).toMatchObject({
			success: false,
			error: { code: "PAYMENT_METHOD_NOT_FOUND" },
		});
	});

	it("rejects an attempt without paymentMethodCode in body", async () => {
		const { paymentOrder } = await createOrderWithMerchant();

		const response = await request
			.post(`/api/payment-orders/${paymentOrder.id}/attempt`)
			.send({});

		expect(response.status).toBe(400);
		expect(response.body).toMatchObject({
			success: false,
			error: { message: "Missing or invalid request body" },
		});
	});

	it("rejects an attempt for a completed payment order", async () => {
		const { paymentOrder } = await createOrderWithMerchant({
			completedAt: new Date().toISOString(),
		});

		const response = await request
			.post(`/api/payment-orders/${paymentOrder.id}/attempt`)
			.send({ paymentMethodCode: "card" });

		expect(response.status).toBe(409);
		expect(response.body).toMatchObject({
			success: false,
			error: { code: "PAYMENT_ORDER_COMPLETED" },
		});
	});

	it("rejects an attempt for an expired payment order", async () => {
		const { paymentOrder } = await createOrderWithMerchant({
			expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
		});

		const response = await request
			.post(`/api/payment-orders/${paymentOrder.id}/attempt`)
			.send({ paymentMethodCode: "card" });

		expect(response.status).toBe(400);
		expect(response.body).toMatchObject({
			success: false,
			error: { code: "PAYMENT_ORDER_EXPIRED" },
		});
	});

	it("allows two simultaneous attempts on the same order", async () => {
		const { paymentOrder } = await createOrderWithMerchant();

		const [res1, res2] = await Promise.all([
			request
				.post(`/api/payment-orders/${paymentOrder.id}/attempt`)
				.send({ paymentMethodCode: "card" }),
			request
				.post(`/api/payment-orders/${paymentOrder.id}/attempt`)
				.send({ paymentMethodCode: "bank_transfer" }),
		]);

		// Both should succeed with 201 since the order is not yet completed
		expect(res1.status, JSON.stringify(res1.body)).toBe(201);
		expect(res2.status, JSON.stringify(res2.body)).toBe(201);

		// Each attempt should have a unique ID
		expect(res1.body.data.paymentAttemptId).not.toBe(
			res2.body.data.paymentAttemptId,
		);

		// They should have different attempt numbers (1 and 2)
		expect(res1.body.data.status).toBe("PROCESSING");
		expect(res2.body.data.status).toBe("PROCESSING");
	});
});
