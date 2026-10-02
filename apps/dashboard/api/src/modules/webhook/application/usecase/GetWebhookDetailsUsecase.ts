import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import WebhookRepository from "../../repository/webhook.repository.js";
import { GetWebhookDetailsInputDto } from "../dto/GetWebhookDetailsDto.js";
import { WebhookNotFoundError } from "../../error/webhook.errors.js";
import { WebhookOutputDto } from "../dto/WebhookOutputDto.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class GetWebhookDetailsUsecase {
  constructor(
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepository: WebhookRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(input: GetWebhookDetailsInputDto): Promise<WebhookOutputDto> {
    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      input.merchantId,
      input.userId,
    );
    
    const webhook = await this.webhookRepository.find({
      id: input.webhookId,
      merchantId: input.merchantId,
    });
    if (!webhook) throw new WebhookNotFoundError();

    return {
      id: webhook.id,
      merchantId: webhook.merchantId,
      secretKey: webhook.secretKey,
      url: webhook.url,
    };
  }
}
