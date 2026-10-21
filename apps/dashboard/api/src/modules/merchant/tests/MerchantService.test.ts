import { beforeEach, describe, expect, it, vi } from "vitest";
import { dbTransaction, type TransactionClient } from "@payvo/database/client";
import { MerchantStatus, type Merchant } from "@payvo/database/types";
import MerchantService from "../application/service/merchant.service.js";
import type { ApiKeyContract } from "@/modules/api-key/contract/api-key.contract.js";
import * as merchantErrors from "../error/merchant.errors.js";
import MerchantRepository from "../repository/merchant.repository.js";

vi.mock("@payvo/database/client", () => ({
  dbTransaction: vi.fn(),
  prisma: {},
}));

const userId = "02b6e011-cb0f-4472-8d85-9b6332028a30";
const merchantId = "13d84e90-646d-42b8-8ba2-441338db58f6";
const transactionClient = {} as TransactionClient;
const merchant: Merchant = {
  id: merchantId,
  userId,
  mid: "merchant123",
  status: MerchantStatus.ACTIVE,
  closedAt: null,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};

function createServiceTestContext() {
  const repository = new MerchantRepository();
  const create = vi.spyOn(repository, "create").mockResolvedValue(merchant);
  const findAllByUserId = vi
    .spyOn(repository, "findAllByUserId")
    .mockResolvedValue([]);
  const findMerchantOwnedByUser = vi
    .spyOn(repository, "findMerchantOwnedByUser")
    .mockResolvedValue(merchant);
  const closeMerchant = vi
    .spyOn(repository, "closeMerchant")
    .mockResolvedValue(merchant);
  const revokeMerchantApiKeys = vi.fn().mockResolvedValue(undefined);
  const apiKeyContract = { revokeMerchantApiKeys } as unknown as ApiKeyContract;

  return {
    service: new MerchantService(repository, apiKeyContract),
    create,
    findAllByUserId,
    findMerchantOwnedByUser,
    closeMerchant,
    revokeMerchantApiKeys,
  };
}

describe("MerchantService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbTransaction).mockImplementation((callback) =>
      callback(transactionClient),
    );
  });

  it("creates an active merchant with a generated MID", async () => {
    const context = createServiceTestContext();

    await expect(context.service.createMerchant(userId)).resolves.toEqual(
      merchant,
    );

    expect(context.create).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        userId,
        status: MerchantStatus.ACTIVE,
        mid: expect.stringMatching(/^[a-zA-Z0-9]+$/),
      }),
    );
  });

  it("returns all merchants belonging to the user", async () => {
    const context = createServiceTestContext();
    context.findAllByUserId.mockResolvedValue([merchant]);

    await expect(context.service.getAllMerchants(userId)).resolves.toEqual({
      userId,
      merchants: [merchant],
    });
  });

  it("requires ownership to return merchant details", async () => {
    const context = createServiceTestContext();
    context.findMerchantOwnedByUser.mockResolvedValue(null);

    await expect(
      context.service.getMerchantDetails(merchantId, userId),
    ).rejects.toBeInstanceOf(merchantErrors.MerchantNotFoundError);
    expect(context.findMerchantOwnedByUser).toHaveBeenCalledWith(
      userId,
      merchantId,
    );
  });

  it("closes a merchant and records when it was closed", async () => {
    const context = createServiceTestContext();
    const closedMerchant = {
      ...merchant,
      status: MerchantStatus.CLOSED,
      closedAt: new Date(),
    };
    context.closeMerchant.mockResolvedValue(closedMerchant);

    await expect(
      context.service.closeMerchant(merchantId, userId),
    ).resolves.toEqual(closedMerchant);

    expect(context.findMerchantOwnedByUser).toHaveBeenCalledWith(
      userId,
      merchantId,
      transactionClient,
    );
    expect(context.closeMerchant).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({ merchantId, closedAt: expect.any(Date) }),
    );
    expect(context.revokeMerchantApiKeys).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({ merchantId, revokedAt: expect.any(Date) }),
    );
  });

  it("rejects closing a merchant that is not active", async () => {
    const context = createServiceTestContext();
    context.findMerchantOwnedByUser.mockResolvedValue({
      ...merchant,
      status: MerchantStatus.CLOSED,
      closedAt: new Date(),
    });

    await expect(
      context.service.closeMerchant(merchantId, userId),
    ).rejects.toMatchObject({
      code: merchantErrors.MerchantErrorCode.MERCHANT_NOT_ACTIVE,
      statusCode: 409,
    });
    expect(context.closeMerchant).not.toHaveBeenCalled();
  });

  it("rejects closing a merchant that the user does not own", async () => {
    const context = createServiceTestContext();
    context.findMerchantOwnedByUser.mockResolvedValue(null);

    await expect(
      context.service.closeMerchant(merchantId, userId),
    ).rejects.toBeInstanceOf(merchantErrors.MerchantNotFoundError);
    expect(context.closeMerchant).not.toHaveBeenCalled();
  });
});
