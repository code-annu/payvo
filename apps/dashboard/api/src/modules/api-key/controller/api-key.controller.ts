import { catchAsync } from "@payvo/http/handler";
import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import type { Response } from "express";
import { inject, injectable } from "inversify";
import type { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import ApiKeyService from "../application/service/api-key.service.js";
import { ApiKeyTypes } from "../api-key.types.js";
import ApiKeyMapper from "../mapper/api-key.mapper.js";
import {
  ApiKeyResponse,
  MerchantApiKeysResponse,
} from "@payvo/shared/schema/responses";
import {
  GetActiveApiKeySchema,
  RevokeApiKeySchema,
  RotateApiKeySchema,
} from "@payvo/shared/schema/requests";

@injectable()
export default class ApiKeyController {
  constructor(
    @inject(ApiKeyTypes.ApiKeyService)
    private readonly apiKeyService: ApiKeyService,
    @inject(ApiKeyTypes.ApiKeyMapper)
    private readonly mapper: ApiKeyMapper,
  ) {}

  postGenerateApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = req.params;
    const { apiKey, keySecret } = await this.apiKeyService.generateApiKey(
      req.auth!.sub,
      {
        merchantId: merchantId as string,
        environment: req.body.environment,
      },
    );

    const responseData: ApiKeyResponse = this.mapper.mapToApiKeyResponse(
      apiKey,
      keySecret,
    );

    res
      .status(StatusCode.Success.CREATED)
      .json(
        buildSuccessResponse(responseData, "API key generated successfully"),
      );
  });

  getActiveApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = req.params;
    const { environment } = GetActiveApiKeySchema.query.parse(req.query);
    const apiKey = await this.apiKeyService.getActiveApiKey(req.auth!.sub, {
      merchantId: merchantId as string,
      environment,
    });

    const responseData: ApiKeyResponse =
      this.mapper.mapToApiKeyResponse(apiKey);

    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse(
          responseData,
          "Active API key fetched successfully",
        ),
      );
  });

  getMerchantApiKeys = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = req.params;
    const { apiKeys, merchantId: id } =
      await this.apiKeyService.getMerchantApiKeys({
        merchantId: merchantId as string,
        userId: req.auth!.sub,
      });

    const responseData: MerchantApiKeysResponse =
      this.mapper.mapToMerchantApiKeysResponse(id, apiKeys);

    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse(
          responseData,
          "Merchant API keys fetched successfully",
        ),
      );
  });

  rotateApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = RotateApiKeySchema.params.parse(req.params);
    const { environment, oldKeyRevokeStrategy } = RotateApiKeySchema.body.parse(
      req.body,
    );
    const { apiKey, keySecret } = await this.apiKeyService.rotateApiKey({
      merchantId,
      userId: req.auth!.sub,
      environment,
      oldKeyRevokeStrategy,
    });

    const responseData: ApiKeyResponse = this.mapper.mapToApiKeyResponse(
      apiKey,
      keySecret,
    );

    res
      .status(StatusCode.Success.CREATED)
      .json(buildSuccessResponse(responseData, "API key rotated successfully"));
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

    const responseData: ApiKeyResponse =
      this.mapper.mapToApiKeyResponse(apiKey);

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(responseData, "API key revoked successfully"));
  });
}
