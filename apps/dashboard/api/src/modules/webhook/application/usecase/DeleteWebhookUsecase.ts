import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import WebhookRepository from "../../repository/webhook.repository.js";
import { DeleteWebhookInputDto } from "../dto/DeleteWebhookDto.js";
import { WebhookNotFoundError } from "../../error/webhook.errors.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class DeleteWebhookUsecase {
  constructor(
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepository: WebhookRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(input: DeleteWebhookInputDto) {
    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      input.merchantId,
      input.userId,
    );

    const deletedWebhook = await this.webhookRepository.delete({
      id: input.webhookId,
      merchantId: input.merchantId,
    });
    if (!deletedWebhook) throw new WebhookNotFoundError();
  }
}
