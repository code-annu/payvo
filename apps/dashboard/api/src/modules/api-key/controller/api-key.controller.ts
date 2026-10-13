import { catchAsync } from "@payvo/http/handler";
import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import type { Response } from "express";
import { inject, injectable } from "inversify";
import type { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import ApiKeyService from "../application/service/api-key.service.js";
import { ApiKeyTypes } from "../api-key.types.js";
import { GetActiveApiKeySchema } from "../schema/api-key.schema.js";

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
}
