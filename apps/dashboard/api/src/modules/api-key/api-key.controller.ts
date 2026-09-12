import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import ApiKeyService from "./api-key.service.js";

@injectable()
export default class ApiKeyController {
  constructor(
    @inject(TYPES.ApiKeyService)
    private readonly apiKeyService: ApiKeyService,
  ) {}

  generateApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchantId = req.params.id as string;
    const { environment } = req.body;

    const result = await this.apiKeyService.generateMerchantApiKey({
      userId,
      merchantId,
      environment,
    });

    res
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse(result));
  });

  getActiveApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchantId = req.params.id as string;
    const environment = req.query.environment as "TEST" | "LIVE";

    const result = await this.apiKeyService.getActiveApiKey({
      userId,
      merchantId,
      environment,
    });

    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(result));
  });

  rotateApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const apiKeyId = req.params.id as string;
    const { oldKeyRevokeStrategy } = req.body;

    const result = await this.apiKeyService.rotateApiKey({
      userId,
      apiKeyId,
      oldKeyRevokeStrategy,
    });

    res
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse(result));
  });
}
