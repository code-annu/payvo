import { beforeEach, describe, expect, it, vi } from "vitest";
import ProcessedPaymentAttemptUsecase from "../application/usecase/ProcessedPaymentAttemptUsecase.js";
import {
	PaymentAttemptInvalidStateError,
	PaymentAttemptNotFoundError,
} from "../error/payment-attempt.errors.js";
import { PaymentOrderNotFoundError } from "@/modules/payment-order/error/payment-order.errors.js";

const mocks = vi.hoisted(() => ({
	dbTransaction: vi.fn(),
}));

vi.mock("@payvo/database/client", () => ({
	dbTransaction: mocks.dbTransaction,
}));

describe("ProcessedPaymentAttemptUsecase", () => {
	const transactionClient = {};
	const paymentAttemptRepo = {
		markSucceed: vi.fn(),
		markFailed: vi.fn(),
		findById: vi.fn(),
	};
	const paymentOrderRepo = {
		markCompleted: vi.fn(),
		findById: vi.fn(),
	};
	const transactionRepo = {
		create: vi.fn(),
	};

	const usecase = new ProcessedPaymentAttemptUsecase(
		paymentAttemptRepo as never,
		paymentOrderRepo as never,
		transactionRepo as never,
	);

	beforeEach(() => {
		vi.clearAllMocks();
		mocks.dbTransaction.mockImplementation((callback) =>
			callback(transactionClient),
		);
	});

	// ────────────────────────────────────────────
	// handleProcessed (processed = true)
	// ────────────────────────────────────────────

	describe("when processed is true", () => {
		it("marks the attempt as succeed, order as completed, and creates a transaction", async () => {
			paymentAttemptRepo.markSucceed.mockResolvedValue({
				id: "attempt-1",
				paymentOrderId: "order-1",
				status: "SUCCEED",
			});
			paymentOrderRepo.markCompleted.mockResolvedValue({
				id: "order-1",
				merchantId: "merchant-1",
				amount: "100.00",
				currency: "USD",
				completedAt: new Date(),
			});
			transactionRepo.create.mockResolvedValue({
				id: "tx-1",
				merchantId: "merchant-1",
				paymentOrderId: "order-1",
				paymentAttemptId: "attempt-1",
				paymentType: "PAYIN",
				grossAmount: "100.00",
				feeAmount: "0",
				netAmount: "100.00",
				currency: "USD",
			});

			await usecase.execute({
				paymentAttemptId: "attempt-1",
				processed: true,
			});

			expect(mocks.dbTransaction).toHaveBeenCalledOnce();
			expect(paymentAttemptRepo.markSucceed).toHaveBeenCalledWith(
				transactionClient,
				{ id: "attempt-1" },
			);
			expect(paymentOrderRepo.markCompleted).toHaveBeenCalledWith(
				transactionClient,
				{
					id: "order-1",
					completedAt: expect.any(Date),
				},
			);
			expect(transactionRepo.create).toHaveBeenCalledWith(
				transactionClient,
				{
					merchantId: "merchant-1",
					paymentOrderId: "order-1",
					paymentAttemptId: "attempt-1",
					paymentType: "PAYIN",
					grossAmount: "100.00",
					feeAmount: "0",
					netAmount: "100.00",
					currency: "USD",
				},
			);
		});

		it("throws PaymentAttemptNotFoundError when attempt does not exist", async () => {
			paymentAttemptRepo.markSucceed.mockResolvedValue(null);
			paymentAttemptRepo.findById.mockResolvedValue(null);

			await expect(
				usecase.execute({
					paymentAttemptId: "missing-attempt",
					processed: true,
				}),
			).rejects.toBeInstanceOf(PaymentAttemptNotFoundError);

			expect(paymentAttemptRepo.findById).toHaveBeenCalledWith(
				transactionClient,
				"missing-attempt",
			);
			expect(transactionRepo.create).not.toHaveBeenCalled();
		});

		it("throws PaymentAttemptInvalidStateError when attempt is not PROCESSING", async () => {
			paymentAttemptRepo.markSucceed.mockResolvedValue(null);
			paymentAttemptRepo.findById.mockResolvedValue({
				id: "attempt-1",
				status: "FAILED",
			});

			await expect(
				usecase.execute({
					paymentAttemptId: "attempt-1",
					processed: true,
				}),
			).rejects.toBeInstanceOf(PaymentAttemptInvalidStateError);

			expect(transactionRepo.create).not.toHaveBeenCalled();
		});

		it("throws PaymentOrderNotFoundError when order cannot be marked completed", async () => {
			paymentAttemptRepo.markSucceed.mockResolvedValue({
				id: "attempt-1",
				paymentOrderId: "order-1",
				status: "SUCCEED",
			});
			paymentOrderRepo.markCompleted.mockResolvedValue(null);

			await expect(
				usecase.execute({
					paymentAttemptId: "attempt-1",
					processed: true,
				}),
			).rejects.toBeInstanceOf(PaymentOrderNotFoundError);

			expect(transactionRepo.create).not.toHaveBeenCalled();
		});
	});

	// ────────────────────────────────────────────
	// handleNotProcessed (processed = false)
	// ────────────────────────────────────────────

	describe("when processed is false", () => {
		it("marks the attempt as failed and verifies the order exists without creating a transaction", async () => {
			paymentAttemptRepo.markFailed.mockResolvedValue({
				id: "attempt-1",
				paymentOrderId: "order-1",
				status: "FAILED",
			});
			paymentOrderRepo.findById.mockResolvedValue({
				id: "order-1",
			});

			await usecase.execute({
				paymentAttemptId: "attempt-1",
				processed: false,
			});

			expect(mocks.dbTransaction).toHaveBeenCalledOnce();
			expect(paymentAttemptRepo.markFailed).toHaveBeenCalledWith(
				transactionClient,
				{ id: "attempt-1", reason: "Payment failed" },
			);
			expect(paymentOrderRepo.findById).toHaveBeenCalledWith(
				transactionClient,
				"order-1",
			);
			expect(transactionRepo.create).not.toHaveBeenCalled();
		});

		it("throws PaymentAttemptNotFoundError when attempt does not exist", async () => {
			paymentAttemptRepo.markFailed.mockResolvedValue(null);
			paymentAttemptRepo.findById.mockResolvedValue(null);

			await expect(
				usecase.execute({
					paymentAttemptId: "missing-attempt",
					processed: false,
				}),
			).rejects.toBeInstanceOf(PaymentAttemptNotFoundError);

			expect(paymentAttemptRepo.findById).toHaveBeenCalledWith(
				transactionClient,
				"missing-attempt",
			);
			expect(transactionRepo.create).not.toHaveBeenCalled();
		});

		it("throws PaymentAttemptInvalidStateError when attempt is not PROCESSING", async () => {
			paymentAttemptRepo.markFailed.mockResolvedValue(null);
			paymentAttemptRepo.findById.mockResolvedValue({
				id: "attempt-1",
				status: "SUCCEED",
			});

			await expect(
				usecase.execute({
					paymentAttemptId: "attempt-1",
					processed: false,
				}),
			).rejects.toBeInstanceOf(PaymentAttemptInvalidStateError);

			expect(transactionRepo.create).not.toHaveBeenCalled();
		});

		it("throws PaymentOrderNotFoundError when order does not exist", async () => {
			paymentAttemptRepo.markFailed.mockResolvedValue({
				id: "attempt-1",
				paymentOrderId: "order-1",
				status: "FAILED",
			});
			paymentOrderRepo.findById.mockResolvedValue(null);

			await expect(
				usecase.execute({
					paymentAttemptId: "attempt-1",
					processed: false,
				}),
			).rejects.toBeInstanceOf(PaymentOrderNotFoundError);

			expect(transactionRepo.create).not.toHaveBeenCalled();
		});
	});

	// ────────────────────────────────────────────
	// General
	// ────────────────────────────────────────────

	it("propagates transaction failures", async () => {
		const error = new Error("database unavailable");
		mocks.dbTransaction.mockRejectedValue(error);

		await expect(
			usecase.execute({
				paymentAttemptId: "attempt-1",
				processed: true,
			}),
		).rejects.toBe(error);
	});
});
