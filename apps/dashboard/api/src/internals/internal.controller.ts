import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import ValidateApiKeyUsecase from "./application/usecase/ValidateApiKeyUsecase.js";

@injectable()
export default class InternalController {
  constructor(
    @inject(TYPES.ValidateApiKeyUsecase)
    private readonly validateApiKeyUsecase: ValidateApiKeyUsecase,
  ) {}

  validateApiKey = catchAsync(async (req: Request, res: Response) => {
    const apiKey = await this.validateApiKeyUsecase.execute(req.body);

    res.status(HttpStatusCode.Success.OK).json(
      buildSuccessResponse({
        valid: true,
        merchantId: apiKey.merchantId,
        environment: apiKey.environment,
      }),
    );
  });
}
