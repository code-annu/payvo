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

	const usecase = new ProcessedPaymentAttemptUsecase(
		paymentAttemptRepo as never,
		paymentOrderRepo as never,
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
		it("marks the attempt as succeed and the order as completed", async () => {
			paymentAttemptRepo.markSucceed.mockResolvedValue({
				id: "attempt-1",
				paymentOrderId: "order-1",
				status: "SUCCEED",
			});
			paymentOrderRepo.markCompleted.mockResolvedValue({
				id: "order-1",
				completedAt: new Date(),
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
		});
	});

	// ────────────────────────────────────────────
	// handleNotProcessed (processed = false)
	// ────────────────────────────────────────────

	describe("when processed is false", () => {
		it("marks the attempt as failed and verifies the order exists", async () => {
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
