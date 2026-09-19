import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateCheckoutSessionUsecase from "../application/usecase/CreateCheckoutSessionUsecase.js";
import { PaymentOrderExpiredError } from "@/modules/payment-order/errors/payment-order.errors.js";
import { InvalidCheckoutSessionExpiryError } from "../error/checkout-session.errors.js";

const mocks = vi.hoisted(() => ({
  generateId: vi.fn(),
  dbTransaction: vi.fn(),
  paymentConfig: {
    order: { expiryMinutes: 30 },
    checkoutSession: {
      expiryMinutes: 10,
      baseUrl: "https://checkout.payvo.test",
    },
  },
}));

vi.mock("@payvo/shared/crypto", () => ({
  generateId: mocks.generateId,
}));

vi.mock("@payvo/config/payment", () => ({
  paymentConfig: mocks.paymentConfig,
}));

vi.mock("@payvo/database/client", () => ({
  dbTransaction: mocks.dbTransaction,
}));

describe("CreateCheckoutSessionUsecase", () => {
  const transactionClient = { orm: {} };
  const paymentOrderRepository = {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
  };
  const checkoutSessionRepository = { create: vi.fn() };
  const usecase = new CreateCheckoutSessionUsecase(
    paymentOrderRepository as never,
    checkoutSessionRepository as never,
  );

  const input = {
    merchantId: "merchant-1",
    merchantCustomerId: "0ecbb6d9-f40d-44bc-99f5-6d7c62bc41de",
    merchantOrderId: "8226bc50-3e43-465e-a948-5e2d4c4b2ec4",
    idempotencyKey: "checkout-idempotency-key",
    amount: 499,
    currency: "INR",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-19T10:00:00.000Z"));
    vi.clearAllMocks();

    mocks.paymentConfig.order.expiryMinutes = 30;
    mocks.paymentConfig.checkoutSession.expiryMinutes = 10;
    mocks.paymentConfig.checkoutSession.baseUrl = "https://checkout.payvo.test";
    mocks.generateId.mockReturnValue("checkout-session-token");
    mocks.dbTransaction.mockImplementation(async (callback) =>
      callback(transactionClient),
    );
    paymentOrderRepository.findByIdempotencyKey.mockResolvedValue(null);
    paymentOrderRepository.create.mockResolvedValue({
      id: "payment-order-1",
      expiresAt: new Date("2026-09-19T10:30:00.000Z"),
    });
    checkoutSessionRepository.create.mockResolvedValue({
      id: "checkout-session-1",
      csi: "checkout-session-token",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a payment order and checkout session in one transaction", async () => {
    await expect(usecase.execute(input)).resolves.toEqual({
      checkoutUrl: "https://checkout.payvo.test?csi=checkout-session-token",
    });

    expect(paymentOrderRepository.findByIdempotencyKey).toHaveBeenCalledWith(
      input.merchantId,
      input.idempotencyKey,
    );
    expect(paymentOrderRepository.create).toHaveBeenCalledWith(
      transactionClient,
      {
        merchantId: input.merchantId,
        merchantCustomerId: input.merchantCustomerId,
        merchantOrderId: input.merchantOrderId,
        idempotencyKey: input.idempotencyKey,
        amount: "499",
        currency: "INR",
        expiresAt: "2026-09-19T10:30:00.000Z",
      },
    );
    expect(checkoutSessionRepository.create).toHaveBeenCalledWith(
      transactionClient,
      {
        csi: "checkout-session-token",
        paymentOrderId: "payment-order-1",
        expiresAt: "2026-09-19T10:10:00.000Z",
      },
    );
  });

  it("reuses an unexpired idempotent order and caps session expiry at the order expiry", async () => {
    paymentOrderRepository.findByIdempotencyKey.mockResolvedValue({
      id: "payment-order-1",
      expiresAt: new Date("2026-09-19T10:04:00.000Z"),
    });

    await usecase.execute(input);

    expect(paymentOrderRepository.create).not.toHaveBeenCalled();
    expect(checkoutSessionRepository.create).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        paymentOrderId: "payment-order-1",
        expiresAt: "2026-09-19T10:04:00.000Z",
      }),
    );
  });

  it("rejects an expired idempotent order without starting a transaction", async () => {
    paymentOrderRepository.findByIdempotencyKey.mockResolvedValue({
      id: "payment-order-1",
      expiresAt: new Date("2026-09-19T09:59:59.999Z"),
    });

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      PaymentOrderExpiredError,
    );

    expect(mocks.dbTransaction).not.toHaveBeenCalled();
    expect(paymentOrderRepository.create).not.toHaveBeenCalled();
    expect(checkoutSessionRepository.create).not.toHaveBeenCalled();
  });

  it("rejects an expiry configuration that would create an immediately expired session", async () => {
    mocks.paymentConfig.checkoutSession.expiryMinutes = 0;

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      InvalidCheckoutSessionExpiryError,
    );

    expect(mocks.dbTransaction).not.toHaveBeenCalled();
    expect(paymentOrderRepository.create).not.toHaveBeenCalled();
    expect(checkoutSessionRepository.create).not.toHaveBeenCalled();
  });
});
