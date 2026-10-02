import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import WebhookRepository from "../../repository/webhook.repository.js";
import {
  GetMerchantWebhooksInputDto,
  GetMerchantWebhooksOutputDto,
} from "../dto/GetMerchantWebhooksDto.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class GetMerchantWebhooksUsecase {
  constructor(
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepository: WebhookRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(
    input: GetMerchantWebhooksInputDto,
  ): Promise<GetMerchantWebhooksOutputDto> {
    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      input.merchantId,
      input.userId,
    );

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
