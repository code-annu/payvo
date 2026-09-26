import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentMethodNotFoundError } from "@/modules/payment-method/error/payment-method.errors.js";
import {
  PaymentOrderInvalidState,
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
    markPaymentPending: vi.fn(),
    findById: vi.fn(),
  };
  const paymentAttemptRepository = {
    getNextAttemptNumber: vi.fn(),
    create: vi.fn(),
  };
  const usecase = new AttemptPaymentUsecase(
    paymentMethodRepository as never,
    paymentOrderRepository as never,
    paymentAttemptRepository as never,
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
    });
    paymentOrderRepository.markPaymentPending.mockResolvedValue({
      id: "order-1",
      status: "PAYMENT_PENDING",
    });
    paymentOrderRepository.findById.mockResolvedValue(null);
    paymentAttemptRepository.getNextAttemptNumber.mockResolvedValue(2);
    paymentAttemptRepository.create.mockResolvedValue({
      paymentOrderId: "order-1",
      paymentMethodId: "method-1",
      attemptNumber: 2,
      status: "PROCESSING",
    });
  });

  it("creates a processing attempt and returns only the output DTO fields", async () => {
    await expect(usecase.execute(input)).resolves.toEqual({
      paymentOrderId: "order-1",
      paymentMethodCode: "CARD",
    });

    expect(mocks.dbTransaction).toHaveBeenCalledOnce();
    expect(paymentMethodRepository.findByCode).toHaveBeenCalledWith(
      transactionClient,
      "CARD",
    );
    expect(paymentOrderRepository.markPaymentPending).toHaveBeenCalledWith(
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
  });

  it("throws when the payment method does not exist", async () => {
    paymentMethodRepository.findByCode.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      PaymentMethodNotFoundError,
    );

    expect(paymentOrderRepository.markPaymentPending).not.toHaveBeenCalled();
    expect(paymentAttemptRepository.create).not.toHaveBeenCalled();
  });

  it("throws when the payment order does not exist", async () => {
    paymentOrderRepository.markPaymentPending.mockResolvedValue(null);
    paymentOrderRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      PaymentOrderNotFoundError,
    );

    expect(paymentOrderRepository.findById).toHaveBeenCalledWith(
      transactionClient,
      "order-1",
    );
    expect(paymentAttemptRepository.create).not.toHaveBeenCalled();
  });

  it("throws the invalid-state error when the order cannot be attempted", async () => {
    paymentOrderRepository.markPaymentPending.mockResolvedValue(null);
    paymentOrderRepository.findById.mockResolvedValue({
      id: "order-1",
      status: "PAYMENT_PENDING",
    });

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      PaymentOrderInvalidState,
    );

    expect(paymentAttemptRepository.create).not.toHaveBeenCalled();
  });

  it("propagates transaction failures", async () => {
    const error = new Error("database unavailable");
    mocks.dbTransaction.mockRejectedValue(error);

    await expect(usecase.execute(input)).rejects.toBe(error);
  });
});
