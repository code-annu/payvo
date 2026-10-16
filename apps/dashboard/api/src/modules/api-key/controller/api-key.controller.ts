import { catchAsync } from "@payvo/http/handler";
import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import type { Response } from "express";
import { inject, injectable } from "inversify";
import type { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import ApiKeyService from "../application/service/api-key.service.js";
import { ApiKeyTypes } from "../api-key.types.js";
import {
  GetActiveApiKeySchema,
  RevokeApiKeySchema,
  RotateApiKeySchema,
} from "../schema/api-key.schema.js";

@injectable()
export default class ApiKeyController {
  constructor(
    @inject(ApiKeyTypes.ApiKeyService)
    private readonly apiKeyService: ApiKeyService,
  ) {}

  postApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = req.params;
    const apiKey = await this.apiKeyService.generateApiKey(req.auth!.sub, {
      merchantId: merchantId as string,
      environment: req.body.environment,
    });

    res
      .status(StatusCode.Success.CREATED)
      .json(buildSuccessResponse(apiKey, "API key generated successfully"));
  });

  getActiveApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = req.params;
    const { environment } = GetActiveApiKeySchema.query.parse(req.query);
    const apiKey = await this.apiKeyService.getActiveApiKey(req.auth!.sub, {
      merchantId: merchantId as string,
      environment,
    });

    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse(apiKey, "Active API key fetched successfully"),
      );
  });

  getMerchantApiKeys = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = req.params;
    const apiKeys = await this.apiKeyService.getMerchantApiKeys({
      merchantId: merchantId as string,
      userId: req.auth!.sub,
    });

    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse(apiKeys, "Merchant API keys fetched successfully"),
      );
  });

  rotateApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = RotateApiKeySchema.params.parse(req.params);
    const { environment, oldKeyRevokeStrategy } =
      RotateApiKeySchema.body.parse(req.body);
    const apiKey = await this.apiKeyService.rotateApiKey({
      merchantId,
      userId: req.auth!.sub,
      environment,
      oldKeyRevokeStrategy,
    });

    res
      .status(StatusCode.Success.CREATED)
      .json(buildSuccessResponse(apiKey, "API key rotated successfully"));
  });

  revokeApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId, apiKeyId } = RevokeApiKeySchema.params.parse(
      req.params,
    );
    const apiKey = await this.apiKeyService.revokeApiKey({
      merchantId,
      apiKeyId,
      userId: req.auth!.sub,
    });

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(apiKey, "API key revoked successfully"));
  });
}
