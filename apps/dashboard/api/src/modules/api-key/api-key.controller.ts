import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { injectable, inject } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import GenerateApiKeyUsecase from "./application/usecase/GenerateApiKeyUsecase.js";
import GetActiveApiKeyUsecase from "./application/usecase/GetActiveApiKeyUsecase.js";
import RotateApiKeyUsecase from "./application/usecase/RotateApiKeyUsecase.js";
import RevokeApiKeyUsecase from "./application/usecase/RevokeApiKeyUsecase.js";

@injectable()
export default class ApiKeyController {
  constructor(
    @inject(TYPES.GenerateApiKeyUsecase)
    private readonly generateApiKeyUsecase: GenerateApiKeyUsecase,
    @inject(TYPES.GetActiveApiKeyUsecase)
    private readonly getActiveApiKeyUsecase: GetActiveApiKeyUsecase,
    @inject(TYPES.RotateApiKeyUsecase)
    private readonly rotateApiKeyUsecase: RotateApiKeyUsecase,
    @inject(TYPES.RevokeApiKeyUsecase)
    private readonly revokeApiKeyUsecase: RevokeApiKeyUsecase,
  ) {}

  postGenerateApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.generateApiKeyUsecase.execute({
      merchantId: req.params.merchantId as string,
      environment: req.body.environment,
      userId: req.auth!.sub,
    });

    res
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse(result));
  });

  getActiveApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.getActiveApiKeyUsecase.execute({
      merchantId: req.params.merchantId as string,
      environment: req.query.environment as "TEST" | "LIVE",
      userId: req.auth!.sub,
    });

    res
      .status(HttpStatusCode.Success.OK)
      .json(buildSuccessResponse(result));
  });

  postRotateApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.rotateApiKeyUsecase.execute({
      merchantId: req.params.merchantId as string,
      oldKeyRevokeStrategy: req.body.oldKeyRevokeStrategy,
      environment: req.body.environment,
      userId: req.auth!.sub,
    });

    res
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse(result));
  });

  postRevokeApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.revokeApiKeyUsecase.execute({
      apiKeyId: req.params.apiKeyId as string,
      userId: req.auth!.sub,
    });

    res
      .status(HttpStatusCode.Success.OK)
      .json(buildSuccessResponse(result));
  });
}
