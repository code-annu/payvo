import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentOrderNotFoundError } from "../error/payment-order.errors.js";
import CheckoutPaymentOrderUsecase from "../application/usecase/CheckoutPaymentOrderUsecase.js";

describe("CheckoutPaymentOrderUsecase", () => {
	const paymentOrderRepository = {
		findByCsi: vi.fn(),
	};
	const paymentMethodRepository = {
		findAll: vi.fn(),
	};
	const usecase = new CheckoutPaymentOrderUsecase(
		paymentOrderRepository as never,
		paymentMethodRepository as never,
	);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns the payment order and available payment methods", async () => {
		const expiresAt = new Date("2026-10-01T00:00:00.000Z");
		const paymentOrder = {
			id: "order-1",
			merchantId: "merchant-1",
			merchantCustomerId: "customer-1",
			merchantOrderId: "merchant-order-1",
			idempotencyKey: "request-1",
			csi: "csi-1",
			amount: "100.00",
			currency: "USD",
			status: "CREATED" as const,
			completedAt: null,
			expiresAt,
			createdAt: new Date("2026-09-25T00:00:00.000Z"),
			updatedAt: new Date("2026-09-25T00:00:00.000Z"),
		};
		const paymentMethods = [
			{
				id: "method-1",
				code: "card",
				name: "Card",
				iconUrl: "https://example.com/card.svg",
				createdAt: new Date("2026-09-25T00:00:00.000Z"),
				updatedAt: new Date("2026-09-25T00:00:00.000Z"),
			},
		];
		paymentOrderRepository.findByCsi.mockResolvedValue(paymentOrder);
		paymentMethodRepository.findAll.mockResolvedValue(paymentMethods);

		await expect(usecase.execute("csi-1")).resolves.toEqual({
			paymentOrder: {
				id: "order-1",
				csi: "csi-1",
				amount: "100.00",
				currency: "USD",
				status: "CREATED",
				expiresAt,
			},
			paymentMethods: [
				{
					id: "method-1",
					code: "card",
					name: "Card",
					iconUrl: "https://example.com/card.svg",
				},
			],
		});

		expect(paymentOrderRepository.findByCsi).toHaveBeenCalledWith("csi-1");
		expect(paymentMethodRepository.findAll).toHaveBeenCalledOnce();
	});

	it("throws when the payment order does not exist", async () => {
		paymentOrderRepository.findByCsi.mockResolvedValue(null);

		await expect(usecase.execute("missing-csi")).rejects.toBeInstanceOf(
			PaymentOrderNotFoundError,
		);
		expect(paymentMethodRepository.findAll).not.toHaveBeenCalled();
	});

	it("propagates repository failures", async () => {
		const error = new Error("database unavailable");
		paymentOrderRepository.findByCsi.mockRejectedValue(error);

		await expect(usecase.execute("csi-1")).rejects.toBe(error);
	});
});
