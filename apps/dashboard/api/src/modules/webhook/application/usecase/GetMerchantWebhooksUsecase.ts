import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import WebhookRepository from "../../repository/webhook.repository.js";
import {
  GetMerchantWebhooksInputDto,
  GetMerchantWebhooksOutputDto,
} from "../dto/GetMerchantWebhooksDto.js";
import { findActiveMerchantOrThrow } from "../merchant-access.js";

@injectable()
export default class GetMerchantWebhooksUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async execute(
    input: GetMerchantWebhooksInputDto,
  ): Promise<GetMerchantWebhooksOutputDto> {
    await findActiveMerchantOrThrow(this.merchantRepository, input);
    const webhooks = await this.webhookRepository.findByMerchantId(
      input.merchantId,
    );
    return {
      merchantId: input.merchantId,
      webhooks: webhooks.webhooks.map((webhook) => ({
        id: webhook.id,
        url: webhook.url,
      })),
    };
  }
}
