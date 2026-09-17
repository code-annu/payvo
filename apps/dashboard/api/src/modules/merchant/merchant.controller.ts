import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import MerchantService from "./merchant.service.js";

@injectable()
export default class MerchantController {
  constructor(
    @inject(TYPES.MerchantService)
    private readonly merchantService: MerchantService,
  ) {}

  createMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchant = await this.merchantService.createMerchant(userId);
    res
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse(merchant));
  });

  getMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchantId = req.params.id as string;
    const merchant = await this.merchantService.getMerchantDetails({
      userId,
      merchantId,
    });
    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(merchant));
  });

  deleteMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchantId = req.params.id as string;
    await this.merchantService.deleteMerchant({
      userId,
      merchantId,
    });
    res.status(HttpStatusCode.Success.NO_CONTENT).end();
  });

  getUserMerchants = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchants = await this.merchantService.getUserMerchants(userId);
    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(merchants));
  });
}
