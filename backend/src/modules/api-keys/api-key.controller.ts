import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types";
import ApiKeyService from "./api-key.service";
import buildSuccessResponse from "@/core/api/success.response";
import catchAsync from "@/core/error/async.catch";
import StatusCode from "@/core/api/StatusCode";
import { AuthRequest } from "@/shared/middleware/authenticate.middleware";
import { ApiKey } from "./entity/api-key.entity";

function stripSensitiveFields(apiKey: ApiKey) {
  const { keyHash, keyValue, ...details } = apiKey;
  return details;
}

@injectable()
export default class ApiKeyController {
  constructor(
    @inject(TYPES.ApiKeyService)
    private readonly apiKeyService: ApiKeyService,
  ) {}

  createApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchantId = req.params.id as string;
    const { apiKey } = await this.apiKeyService.createApiKey(
      userId,
      merchantId,
      req.body,
    );

    // Return the full key including plaintext value on creation (stripping keyHash)
    const { keyHash, ...apiKeyResponse } = apiKey;
    res.status(StatusCode.Success.CREATED).json(
      buildSuccessResponse({
        apiKey: apiKeyResponse,
      }),
    );
  });

  getApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const apiKeyId = req.params.id as string;
    const result = await this.apiKeyService.getApiKey(userId, apiKeyId);

    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse({ apiKey: stripSensitiveFields(result.apiKey) }),
      );
  });

  getMerchantApiKeys = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchantId = req.params.id as string;
    const result = await this.apiKeyService.getMerchantApiKeys(
      userId,
      merchantId,
    );

    res.status(StatusCode.Success.OK).json(
      buildSuccessResponse({
        merchantId: result.merchantId,
        apiKeys: result.apiKeys.map(stripSensitiveFields),
      }),
    );
  });

  revokeApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const apiKeyId = req.params.id as string;
    const result = await this.apiKeyService.revokeApiKey(userId, apiKeyId);

    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse({ apiKey: stripSensitiveFields(result.apiKey) }),
      );
  });

  deleteApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const apiKeyId = req.params.id as string;
    await this.apiKeyService.deleteApiKey(userId, apiKeyId);

    res.status(StatusCode.Success.NO_CONTENT).end();
  });
}
