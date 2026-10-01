import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateWebhookUsecase from "../application/usecase/CreateWebhookUsecase.js";
import GetMerchantWebhooksUsecase from "../application/usecase/GetMerchantWebhooksUsecase.js";
import GetWebhookDetailsUsecase from "../application/usecase/GetWebhookDetailsUsecase.js";
import UpdateWebhookUsecase from "../application/usecase/UpdateWebhookUsecase.js";
import DeleteWebhookUsecase from "../application/usecase/DeleteWebhookUsecase.js";
import { WebhookNotFoundError } from "../error/webhook.errors.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

describe("Webhook use cases", () => {
  const merchantRepository = { findOwnedByUser: vi.fn() };
  const webhookRepository = {
    create: vi.fn(),
    findByMerchantId: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const createWebhook = new CreateWebhookUsecase(
    merchantRepository as never,
    webhookRepository as never,
  );
  const getMerchantWebhooks = new GetMerchantWebhooksUsecase(
    merchantRepository as never,
    webhookRepository as never,
  );
  const getWebhookDetails = new GetWebhookDetailsUsecase(
    merchantRepository as never,
    webhookRepository as never,
  );
  const updateWebhook = new UpdateWebhookUsecase(
    merchantRepository as never,
    webhookRepository as never,
  );
  const deleteWebhook = new DeleteWebhookUsecase(
    merchantRepository as never,
    webhookRepository as never,
  );

  const input = {
    merchantId: "merchant-1",
    userId: "user-1",
    url: "https://example.com/webhooks",
  };
  const merchant = {
    id: input.merchantId,
    mid: "mid-1",
    userId: input.userId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const webhook = {
    id: "webhook-1",
    merchantId: input.merchantId,
    secretKey: "generated-secret",
    url: input.url,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    merchantRepository.findOwnedByUser.mockResolvedValue(merchant);
    webhookRepository.create.mockImplementation(async (data) => ({
      ...webhook,
      ...data,
    }));
    webhookRepository.findByMerchantId.mockResolvedValue({
      merchantId: input.merchantId,
      webhooks: [],
    });
    webhookRepository.findById.mockResolvedValue(webhook);
    webhookRepository.update.mockResolvedValue({
      ...webhook,
      url: "https://example.com/updated",
    });
    webhookRepository.delete.mockResolvedValue(webhook);
  });

  it("creates with a generated secret and returns it only at creation", async () => {
    const result = await createWebhook.execute(input);

    const [createData] = webhookRepository.create.mock.calls[0]!;
    expect(createData).toMatchObject({ merchantId: input.merchantId, url: input.url });
    expect(createData.secretKey).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(result.secretKey).toBe(createData.secretKey);
  });

  it("does not list webhooks when the merchant is inactive", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue({
      ...merchant,
      isActive: false,
    });

    await expect(getMerchantWebhooks.execute(input)).rejects.toBeInstanceOf(
      MerchantInactiveError,
    );
    expect(webhookRepository.findByMerchantId).not.toHaveBeenCalled();
  });

  it("hides the secret when reading webhook details", async () => {
    const result = await getWebhookDetails.execute({
      webhookId: webhook.id,
      userId: input.userId,
    });

    expect(result).not.toHaveProperty("secretKey");
  });

  it("rejects webhook detail access when the merchant is not owned", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue(null);

    await expect(
      getWebhookDetails.execute({ webhookId: webhook.id, userId: input.userId }),
    ).rejects.toBeInstanceOf(MerchantNotFoundError);
  });

  it("does not update a webhook when its merchant is inactive", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue({
      ...merchant,
      isActive: false,
    });

    await expect(
      updateWebhook.execute({
        webhookId: webhook.id,
        userId: input.userId,
        url: "https://example.com/updated",
      }),
    ).rejects.toBeInstanceOf(MerchantInactiveError);
    expect(webhookRepository.update).not.toHaveBeenCalled();
  });

  it("does not delete a webhook when its merchant is inactive", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue({
      ...merchant,
      isActive: false,
    });

    await expect(
      deleteWebhook.execute({ webhookId: webhook.id, userId: input.userId }),
    ).rejects.toBeInstanceOf(MerchantInactiveError);
    expect(webhookRepository.delete).not.toHaveBeenCalled();
  });

  it("throws WebhookNotFoundError for an unknown webhook id", async () => {
    webhookRepository.findById.mockResolvedValue(null);

    await expect(
      getWebhookDetails.execute({ webhookId: "missing", userId: input.userId }),
    ).rejects.toBeInstanceOf(WebhookNotFoundError);
    expect(merchantRepository.findOwnedByUser).not.toHaveBeenCalled();
  });
});