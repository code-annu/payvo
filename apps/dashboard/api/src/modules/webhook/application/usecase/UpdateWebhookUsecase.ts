import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import WebhookRepository from "../../repository/webhook.repository.js";
import { UpdateWebhookInputDto } from "../dto/UpdateWebhookDto.js";
import { findActiveMerchantOrThrow } from "../merchant-access.js";
import { WebhookNotFoundError } from "../../error/webhook.errors.js";
import { WebhookOutputDto } from "../dto/WebhookOutputDto.js";

@injectable()
export default class UpdateWebhookUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async execute(input: UpdateWebhookInputDto): Promise<WebhookOutputDto> {
    const webhook = await this.webhookRepository.findById(input.webhookId);
    if (!webhook) {
      throw new WebhookNotFoundError();
    }

    await findActiveMerchantOrThrow(this.merchantRepository, {
      merchantId: webhook.merchantId,
      userId: input.userId,
    });

    const updatedWebhook = await this.webhookRepository.update({
      id: webhook.id,
      merchantId: webhook.merchantId,
      url: input.url,
    });
    if (!updatedWebhook) {
      throw new WebhookNotFoundError();
    }

    return {
      id: updatedWebhook.id,
      merchantId: updatedWebhook.merchantId,
      secretKey: updatedWebhook.secretKey,
      url: updatedWebhook.url,
    };
  }
}
