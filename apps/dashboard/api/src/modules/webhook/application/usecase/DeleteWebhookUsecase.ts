import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import WebhookRepository from "../../repository/webhook.repository.js";
import { DeleteWebhookInputDto } from "../dto/DeleteWebhookDto.js";
import { DeleteWebhookResultDto } from "../dto/DeleteWebhookResultDto.js";
import { findActiveMerchantOrThrow } from "../merchant-access.js";
import { WebhookNotFoundError } from "../../error/webhook.errors.js";

@injectable()
export default class DeleteWebhookUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async execute(input: DeleteWebhookInputDto) {
    const webhook = await this.webhookRepository.findById(input.webhookId);
    if (!webhook) {
      throw new WebhookNotFoundError();
    }

    await findActiveMerchantOrThrow(this.merchantRepository, {
      merchantId: webhook.merchantId,
      userId: input.userId,
    });

    const deletedWebhook = await this.webhookRepository.delete({
      id: webhook.id,
      merchantId: webhook.merchantId,
    });
    if (!deletedWebhook) {
      throw new WebhookNotFoundError();
    }
  }
}
