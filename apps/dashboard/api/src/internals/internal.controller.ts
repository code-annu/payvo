import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import InternalService from "./internal.service.js";

@injectable()
export default class InternalController {
  constructor(
    @inject(TYPES.InternalService)
    private readonly internalService: InternalService,
  ) {}

  validateApiKey = catchAsync(async (req: Request, res: Response) => {
    const { keyId, keySecret } = req.body;

    const apiKey = await this.internalService.validateApiKey({
      keyId,
      keySecret,
    });

    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(apiKey));
  });
}
