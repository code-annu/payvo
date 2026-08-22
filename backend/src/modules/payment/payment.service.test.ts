import PaymentService from "./payment.service";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "./merchant/merchant.errors";
import { Payment } from "./entity/payment.entity";
import { Merchant } from "./merchant/entity/merchant.entity";
import { CreatePaymentDto } from "./dto/CreatePaymentDto";

// ── Helpers ──────────────────────────────────────────────────────────
const now = new Date("2026-08-21T12:00:00Z");

const mockMerchant: Merchant = {
  id: "merchant-1",
  userId: "user-1",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

const mockPaymentInput: CreatePaymentDto = {
  customerId: "customer-1",
  orderId: "order-1",
  idempotencyKey: "idem-key-1",
  amount: 5000,
  currency: "USD",
  description: "Test payment",
};

const mockPayment: Payment = {
  id: "payment-1",
  merchantId: "merchant-1",
  customerId: "customer-1",
  orderId: "order-1",
  idempotencyKey: "idem-key-1",
  status: "CREATED",
  amount: 5000,
  currency: "USD",
  description: "Test payment",
  paymentMethod: null,
  providerTransactionId: null,
  failureCode: null,
  failureMessage: null,
  paidAt: null,
  expiresAt: null,
  createdAt: now,
  updatedAt: now,
};

// ── Stub repositories ────────────────────────────────────────────────
function createMocks() {
  return {
    paymentRepo: {
      create: vi.fn(),
      findById: vi.fn(),
    },
    merchantRepo: {
      create: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
      findByUserId: vi.fn(),
    },
  };
}

function createService(mocks: ReturnType<typeof createMocks>) {
  return new PaymentService(
    mocks.paymentRepo as any,
    mocks.merchantRepo as any,
  );
}

// =====================================================================
// createPayment
// =====================================================================
describe("PaymentService.createPayment", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: PaymentService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  // ── Happy path ───────────────────────────────────────────────────

  it("should create a payment and return it when merchant exists and is active", async () => {
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);
    mocks.paymentRepo.create.mockResolvedValue(mockPayment);

    const result = await service.createPayment("merchant-1", mockPaymentInput);

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
    expect(mocks.paymentRepo.create).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      customerId: "customer-1",
      orderId: "order-1",
      idempotencyKey: "idem-key-1",
      amount: 5000,
      currency: "USD",
      description: "Test payment",
    });
    expect(result).toEqual({ payment: mockPayment });
  });

  it("should pass null for description when it is undefined", async () => {
    const { description, ...rest } = mockPaymentInput;
    const inputWithoutDesc: CreatePaymentDto = rest;
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);
    mocks.paymentRepo.create.mockResolvedValue({
      ...mockPayment,
      description: null,
    });

    await service.createPayment("merchant-1", inputWithoutDesc);

    expect(mocks.paymentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: null }),
    );
  });

  // ── Merchant not found ───────────────────────────────────────────

  it("should throw MerchantNotFoundError if merchant does not exist", async () => {
    mocks.merchantRepo.findById.mockResolvedValue(null);

    await expect(
      service.createPayment("non-existent", mockPaymentInput),
    ).rejects.toThrow(MerchantNotFoundError);

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("non-existent");
    expect(mocks.paymentRepo.create).not.toHaveBeenCalled();
  });

  // ── Inactive merchant ────────────────────────────────────────────

  it("should throw MerchantInactiveError if merchant is inactive", async () => {
    mocks.merchantRepo.findById.mockResolvedValue({
      ...mockMerchant,
      isActive: false,
    });

    await expect(
      service.createPayment("merchant-1", mockPaymentInput),
    ).rejects.toThrow(MerchantInactiveError);

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
    expect(mocks.paymentRepo.create).not.toHaveBeenCalled();
  });
});
