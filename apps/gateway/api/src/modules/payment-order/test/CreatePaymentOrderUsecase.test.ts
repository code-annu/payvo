import { beforeEach, describe, expect, it, vi } from "vitest";
import CreatePaymentOrderUsecase from "../application/usecase/CreatePaymentOrderUsecase.js";

const mocks = vi.hoisted(() => ({
	generateId: vi.fn(),
}));

vi.mock("@payvo/shared/crypto", () => ({
	generateId: mocks.generateId,
}));

vi.mock("@payvo/config/payment", () => ({
	paymentConfig: {
		order: {
			expiryMinutes: 30,
			checkoutBaseUrl: "https://checkout.payvo.test/",
		},
	},
}));

describe("CreatePaymentOrderUsecase", () => {
	const paymentOrderRepository = {
		findByIdempotencyKey: vi.fn(),
		create: vi.fn(),
	};
	const usecase = new CreatePaymentOrderUsecase(
		paymentOrderRepository as never,
	);

	const input = {
		merchantId: "merchant-1",
		merchantCustomerId: "customer-1",
		merchantOrderId: "order-1",
		idempotencyKey: "request-1",
		amount: 1250,
		currency: "USD",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mocks.generateId.mockReturnValue("csi-1");
		paymentOrderRepository.findByIdempotencyKey.mockResolvedValue(null);
		paymentOrderRepository.create.mockResolvedValue({ csi: "csi-1" });
	});

	it("returns the existing checkout URL for an idempotent request", async () => {
		paymentOrderRepository.findByIdempotencyKey.mockResolvedValue({
			csi: "existing-csi",
		});

		await expect(usecase.execute(input)).resolves.toEqual({
			checkoutUrl: "https://checkout.payvo.test/existing-csi",
		});

		expect(paymentOrderRepository.create).not.toHaveBeenCalled();
		expect(mocks.generateId).not.toHaveBeenCalled();
	});

	it("creates a payment order and returns its checkout URL", async () => {
		await expect(usecase.execute(input)).resolves.toEqual({
			checkoutUrl: "https://checkout.payvo.test/csi-1",
		});

		expect(paymentOrderRepository.findByIdempotencyKey).toHaveBeenCalledWith(
			"request-1",
		);
		expect(mocks.generateId).toHaveBeenCalledOnce();
		expect(paymentOrderRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				merchantId: "merchant-1",
				merchantCustomerId: "customer-1",
				merchantOrderId: "order-1",
				idempotencyKey: "request-1",
				csi: "csi-1",
				amount: "1250",
				currency: "USD",
				status: "CREATED",
				expiresAt: expect.any(String),
			}),
		);
	});

	it("propagates repository failures", async () => {
		const error = new Error("database unavailable");
		paymentOrderRepository.findByIdempotencyKey.mockRejectedValue(error);

		await expect(usecase.execute(input)).rejects.toBe(error);
	});
});
