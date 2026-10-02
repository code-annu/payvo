import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import WebhookRepository from "../../repository/webhook.repository.js";
import { UpdateWebhookInputDto } from "../dto/UpdateWebhookDto.js";
import { WebhookNotFoundError } from "../../error/webhook.errors.js";
import { WebhookOutputDto } from "../dto/WebhookOutputDto.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class UpdateWebhookUsecase {
  constructor(
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepository: WebhookRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(input: UpdateWebhookInputDto): Promise<WebhookOutputDto> {
    const { webhookId, userId, merchantId, ...updates } = input;
    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      merchantId,
      userId,
    );

    const updatedWebhook = await this.webhookRepository.update({
      id: webhookId,
      merchantId: merchantId,
      updates,
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
