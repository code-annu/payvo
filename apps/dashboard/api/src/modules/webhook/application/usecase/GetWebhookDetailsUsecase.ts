import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import WebhookRepository from "../../repository/webhook.repository.js";
import { GetWebhookDetailsInputDto } from "../dto/GetWebhookDetailsDto.js";
import { findActiveMerchantOrThrow } from "../merchant-access.js";
import { WebhookNotFoundError } from "../../error/webhook.errors.js";
import { WebhookOutputDto } from "../dto/WebhookOutputDto.js";

@injectable()
export default class GetWebhookDetailsUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async execute(input: GetWebhookDetailsInputDto): Promise<WebhookOutputDto> {
    const webhook = await this.webhookRepository.findById(input.webhookId);
    if (!webhook) {
      throw new WebhookNotFoundError();
    }

    await findActiveMerchantOrThrow(this.merchantRepository, {
      merchantId: webhook.merchantId,
      userId: input.userId,
    });

    return {
      id: webhook.id,
      merchantId: webhook.merchantId,
      secretKey: webhook.secretKey,
      url: webhook.url,
    };
  }
}
