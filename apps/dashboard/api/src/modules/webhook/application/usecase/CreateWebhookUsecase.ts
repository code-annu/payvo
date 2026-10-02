import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import WebhookRepository from "../../repository/webhook.repository.js";
import { CreateWebhookInputDto } from "../dto/CreateWebhookDto.js";
import { generateRandomSecret } from "@payvo/shared/crypto";
import { WebhookOutputDto } from "../dto/WebhookOutputDto.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class CreateWebhookUsecase {
  constructor(
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepository: WebhookRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(input: CreateWebhookInputDto): Promise<WebhookOutputDto> {
    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      input.merchantId,
      input.userId,
    );
    const secretKey = generateRandomSecret();

    const webhook = await this.webhookRepository.create({
      merchantId: input.merchantId,
      secretKey,
      url: input.url,
    });

    return {
      id: webhook.id,
      merchantId: webhook.merchantId,
      secretKey: webhook.secretKey,
      url: webhook.url,
    };
  }
}
