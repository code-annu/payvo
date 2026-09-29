import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentMethodNotFoundError } from "@/modules/payment-method/error/payment-method.errors.js";
import {
	PaymentOrderCompletedError,
	PaymentOrderExpiredError,
	PaymentOrderNotFoundError,
} from "@/modules/payment-order/error/payment-order.errors.js";
import AttemptPaymentUsecase from "../application/usecase/AttemptPaymentUsecase.js";

const mocks = vi.hoisted(() => ({
	dbTransaction: vi.fn(),
}));

vi.mock("@payvo/database/client", () => ({
	dbTransaction: mocks.dbTransaction,
}));

describe("AttemptPaymentUsecase", () => {
	const transactionClient = {};
	const paymentMethodRepository = {
		findByCode: vi.fn(),
	};
	const paymentOrderRepository = {
		findById: vi.fn(),
	};
	const paymentAttemptRepository = {
		getNextAttemptNumber: vi.fn(),
		create: vi.fn(),
	};
	const paymentProvider = {
		processPayment: vi.fn(),
	};
	const usecase = new AttemptPaymentUsecase(
		paymentMethodRepository as never,
		paymentOrderRepository as never,
		paymentAttemptRepository as never,
		paymentProvider as never,
	);

	const input = {
		paymentOrderId: "order-1",
		paymentMethodCode: "CARD",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mocks.dbTransaction.mockImplementation((callback) =>
			callback(transactionClient),
		);
		paymentMethodRepository.findByCode.mockResolvedValue({
			id: "method-1",
			code: "CARD",
			name: "Card",
		});
		paymentOrderRepository.findById.mockResolvedValue({
			id: "order-1",
			completedAt: null,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in the future
		});
		paymentAttemptRepository.getNextAttemptNumber.mockResolvedValue(2);
		paymentAttemptRepository.create.mockResolvedValue({
			id: "attempt-1",
			paymentOrderId: "order-1",
			paymentMethodId: "method-1",
			attemptNumber: 2,
			status: "PROCESSING",
		});
		paymentProvider.processPayment.mockResolvedValue(undefined);
	});

	it("creates a processing attempt and returns the output DTO fields", async () => {
		await expect(usecase.execute(input)).resolves.toEqual({
			paymentAttemptId: "attempt-1",
			paymentMethod: {
				id: "method-1",
				code: "CARD",
				name: "Card",
			},
			status: "PROCESSING",
		});

		expect(mocks.dbTransaction).toHaveBeenCalledOnce();
		expect(paymentMethodRepository.findByCode).toHaveBeenCalledWith(
			transactionClient,
			"CARD",
		);
		expect(paymentOrderRepository.findById).toHaveBeenCalledWith(
			transactionClient,
			"order-1",
		);
		expect(paymentAttemptRepository.getNextAttemptNumber).toHaveBeenCalledWith(
			transactionClient,
			"order-1",
		);
		expect(paymentAttemptRepository.create).toHaveBeenCalledWith(
			transactionClient,
			{
				paymentOrderId: "order-1",
				paymentMethodId: "method-1",
				attemptNumber: 2,
				status: "PROCESSING",
			},
		);
		expect(paymentProvider.processPayment).toHaveBeenCalledWith({
			paymentMethodId: "method-1",
			paymentAttemptId: "attempt-1",
		});
	});

	it("throws when the payment method does not exist", async () => {
		paymentMethodRepository.findByCode.mockResolvedValue(null);

		await expect(usecase.execute(input)).rejects.toBeInstanceOf(
			PaymentMethodNotFoundError,
		);

		expect(paymentOrderRepository.findById).not.toHaveBeenCalled();
		expect(paymentAttemptRepository.create).not.toHaveBeenCalled();
	});

	it("throws when the payment order does not exist", async () => {
		paymentOrderRepository.findById.mockResolvedValue(null);

		await expect(usecase.execute(input)).rejects.toBeInstanceOf(
			PaymentOrderNotFoundError,
		);

		expect(paymentAttemptRepository.create).not.toHaveBeenCalled();
	});

	it("throws when the payment order has expired", async () => {
		paymentOrderRepository.findById.mockResolvedValue({
			id: "order-1",
			completedAt: null,
			expiresAt: new Date(Date.now() - 60 * 1000), // 1 minute in the past
		});

		await expect(usecase.execute(input)).rejects.toBeInstanceOf(
			PaymentOrderExpiredError,
		);

		expect(paymentAttemptRepository.create).not.toHaveBeenCalled();
	});

	it("throws when the payment order is already completed", async () => {
		paymentOrderRepository.findById.mockResolvedValue({
			id: "order-1",
			completedAt: new Date("2026-09-28T00:00:00.000Z"),
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		});

		await expect(usecase.execute(input)).rejects.toBeInstanceOf(
			PaymentOrderCompletedError,
		);

		expect(paymentAttemptRepository.create).not.toHaveBeenCalled();
	});

	it("propagates transaction failures", async () => {
		const error = new Error("database unavailable");
		mocks.dbTransaction.mockRejectedValue(error);

		await expect(usecase.execute(input)).rejects.toBe(error);
	});
});
