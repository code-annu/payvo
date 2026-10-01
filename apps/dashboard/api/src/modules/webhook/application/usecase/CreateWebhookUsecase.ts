import crypto from "node:crypto";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import WebhookRepository from "../../repository/webhook.repository.js";
import {
  CreatedWebhookOutputDto,
  CreateWebhookInputDto,
} from "../dto/CreateWebhookDto.js";
import { findActiveMerchantOrThrow } from "../merchant-access.js";
import { generateRandomSecret } from "@payvo/shared/crypto";

@injectable()
export default class CreateWebhookUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async execute(
    input: CreateWebhookInputDto,
  ): Promise<CreatedWebhookOutputDto> {
    await findActiveMerchantOrThrow(this.merchantRepository, input);
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
