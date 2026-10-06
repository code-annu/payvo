import { beforeEach, describe, expect, it, vi } from "vitest";
import GetMerchantTransactionsUsecase from "../application/usecase/GetMerchantTransactionsUsecase.js";
import GetTransactionDetailsUsecase from "../application/usecase/GetTransactionDetailsUsecase.js";
import { TransactionNotFoundError } from "../error/transaction.errors.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";
import TransactionMapper from "../transaction.mapper.js";

describe("Transaction Usecases", () => {
  const transactionRepository = {
    findByMerchantId: vi.fn(),
    findDetails: vi.fn(),
  };
  const merchantAuthorizationService = {
    requireOwnedActiveMerchant: vi.fn(),
  };

  const getMerchantTransactionsUsecase = new GetMerchantTransactionsUsecase(
    transactionRepository as never,
    merchantAuthorizationService as never,
  );

  const getTransactionDetailsUsecase = new GetTransactionDetailsUsecase(
    transactionRepository as never,
    merchantAuthorizationService as never,
  );

  const input = {
    userId: "user-1",
    merchantId: "merchant-1",
  };

  const transactions = [
    {
      id: "tx-1",
      merchantId: "merchant-1",
      paymentOrderId: "order-1",
      paymentAttemptId: "attempt-1",
      paymentType: "PAYIN" as const,
      grossAmount: "100.00",
      feeAmount: "2.00",
      netAmount: "98.00",
      currency: "USD",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    {
      id: "tx-2",
      merchantId: "merchant-1",
      paymentOrderId: "order-2",
      paymentAttemptId: "attempt-2",
      paymentType: "REFUND" as const,
      grossAmount: "50.00",
      feeAmount: "1.00",
      netAmount: "49.00",
      currency: "USD",
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    merchantAuthorizationService.requireOwnedActiveMerchant.mockResolvedValue(
      undefined,
    );
  });

  describe("GetMerchantTransactionsUsecase", () => {
    it("returns merchant transactions list", async () => {
      transactionRepository.findByMerchantId.mockResolvedValue(transactions);

      const result = await getMerchantTransactionsUsecase.execute(input);

      expect(
        merchantAuthorizationService.requireOwnedActiveMerchant,
      ).toHaveBeenCalledWith("merchant-1", "user-1");
      expect(transactionRepository.findByMerchantId).toHaveBeenCalledWith(
        "merchant-1",
      );
      expect(result).toEqual({
        merchantId: "merchant-1",
        transactions,
      });
    });

    it("returns an empty list when the merchant has no transactions", async () => {
      transactionRepository.findByMerchantId.mockResolvedValue([]);

      const result = await getMerchantTransactionsUsecase.execute(input);

      expect(result).toEqual({
        merchantId: "merchant-1",
        transactions: [],
      });
    });

    it("throws MerchantNotFoundError when merchant is not owned by the user", async () => {
      merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
        new MerchantNotFoundError(),
      );

      await expect(
        getMerchantTransactionsUsecase.execute(input),
      ).rejects.toBeInstanceOf(MerchantNotFoundError);
      expect(transactionRepository.findByMerchantId).not.toHaveBeenCalled();
    });

    it("throws MerchantInactiveError when merchant is inactive", async () => {
      merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
        new MerchantInactiveError(),
      );

      await expect(
        getMerchantTransactionsUsecase.execute(input),
      ).rejects.toBeInstanceOf(MerchantInactiveError);
      expect(transactionRepository.findByMerchantId).not.toHaveBeenCalled();
    });
  });

  describe("GetTransactionDetailsUsecase", () => {
    const detailsInput = {
      userId: "user-1",
      merchantId: "merchant-1",
      transactionId: "tx-1",
    };

    const transactionDetails = {
      ...transactions[0],
      paymentOrder: {
        id: "order-1",
        merchantOrderId: "m-order-1",
        merchantCustomerId: "cust-1",
        idempotencyKey: "idem-1",
        orderNumber: "10000000000000",
        amount: "100.00",
        currency: "USD",
        status: "COMPLETED",
        completedAt: new Date("2026-01-01T00:00:00.000Z"),
        expiresAt: new Date("2026-01-01T00:30:00.000Z"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      paymentAttempt: {
        id: "attempt-1",
        paymentMethodId: "pm-1",
        attemptNumber: 1,
        status: "SUCCEED",
        failureCode: null,
        reason: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    };

    it("returns transaction details with payment order and successful payment attempt", async () => {
      transactionRepository.findDetails.mockResolvedValue(transactionDetails);

      const result = await getTransactionDetailsUsecase.execute(detailsInput);

      expect(
        merchantAuthorizationService.requireOwnedActiveMerchant,
      ).toHaveBeenCalledWith("merchant-1", "user-1");
      expect(transactionRepository.findDetails).toHaveBeenCalledWith({
        id: "tx-1",
        merchantId: "merchant-1",
      });
      expect(result).toEqual(transactionDetails);
    });

    it("throws TransactionNotFoundError when transaction does not exist", async () => {
      transactionRepository.findDetails.mockResolvedValue(null);

      await expect(
        getTransactionDetailsUsecase.execute(detailsInput),
      ).rejects.toBeInstanceOf(TransactionNotFoundError);
    });

    it("throws MerchantNotFoundError when merchant is not owned", async () => {
      merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
        new MerchantNotFoundError(),
      );

      await expect(
        getTransactionDetailsUsecase.execute(detailsInput),
      ).rejects.toBeInstanceOf(MerchantNotFoundError);
      expect(transactionRepository.findDetails).not.toHaveBeenCalled();
    });

    it("throws MerchantInactiveError when merchant is inactive", async () => {
      merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
        new MerchantInactiveError(),
      );

      await expect(
        getTransactionDetailsUsecase.execute(detailsInput),
      ).rejects.toBeInstanceOf(MerchantInactiveError);
      expect(transactionRepository.findDetails).not.toHaveBeenCalled();
    });
  });

  describe("TransactionMapper", () => {
    const mapper = new TransactionMapper();

    it("maps transaction with successful attempt correctly", () => {
      const prismaRecord = {
        id: "tx-1",
        merchantId: "merchant-1",
        paymentOrderId: "order-1",
        paymentAttemptId: "attempt-1",
        paymentType: "PAYIN" as const,
        grossAmount: 100 as never,
        feeAmount: 2 as never,
        netAmount: 98 as never,
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        paymentOrder: {
          id: "order-1",
          merchantOrderId: "m-order-1",
          merchantCustomerId: "cust-1",
          idempotencyKey: "idem-1",
          orderNumber: 10000000000000n,
          amount: 100 as never,
          currency: "USD",
          status: "COMPLETED",
          completedAt: "2026-01-01T00:00:00.000Z",
          expiresAt: "2026-01-01T00:30:00.000Z",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        paymentAttempt: {
          id: "attempt-1",
          paymentMethodId: "pm-1",
          attemptNumber: 1,
          status: "SUCCEED" as const,
          failureCode: null,
          reason: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          paymentMethod: {
            id: "pm-1",
            code: "UPI",
            name: "Unified Payments Interface",
            iconUrl: "https://example.com/upi.svg",
          },
        },
      };

      const mapped = mapper.toTransactionDetailsEntity(prismaRecord as never);

      expect(mapped.id).toBe("tx-1");
      expect(mapped.paymentOrder?.orderNumber).toBe("10000000000000");
      expect(mapped.paymentAttempt?.status).toBe("SUCCEED");
      expect(mapped.paymentMethod).toEqual({
        id: "pm-1",
        code: "UPI",
        name: "Unified Payments Interface",
        iconUrl: "https://example.com/upi.svg",
      });
      expect(mapped.paymentAttempt?.paymentMethod?.code).toBe("UPI");
    });

    it("omits payment attempt when status is not SUCCEED", () => {
      const prismaRecord = {
        id: "tx-1",
        merchantId: "merchant-1",
        paymentOrderId: "order-1",
        paymentAttemptId: "attempt-1",
        paymentType: "PAYIN" as const,
        grossAmount: 100 as never,
        feeAmount: 2 as never,
        netAmount: 98 as never,
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        paymentOrder: null,
        paymentAttempt: {
          id: "attempt-1",
          paymentMethodId: "pm-1",
          attemptNumber: 1,
          status: "FAILED" as const,
          failureCode: "ERR",
          reason: "Failed",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      };

      const mapped = mapper.toTransactionDetailsEntity(prismaRecord as never);

      expect(mapped.paymentAttempt).toBeNull();
    });
  });
});
