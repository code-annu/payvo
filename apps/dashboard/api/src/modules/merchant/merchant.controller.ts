import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import MerchantService from "./merchant.service.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { Response } from "express";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import { StatusCode, buildSuccessResponse } from "@payvo/shared/http";

@injectable()
export default class MerchantController {
  constructor(
    @inject(TYPES.MerchantService) private readonly service: MerchantService,
  ) {}

  getUserMerchants = catchAsync(async (req: AuthRequest, res: Response) => {
    const auth = req.auth!;
    const userMerchants = await this.service.getUserMerchants(auth.sub);
    res.status(StatusCode.Success.OK).json(buildSuccessResponse(userMerchants));
  });

  createMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const auth = req.auth!;
    const merchant = await this.service.createMerchant(auth.sub);
    res
      .status(StatusCode.Success.CREATED)
      .json(buildSuccessResponse({ merchant }));
  });

  getMerchantDetails = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const merchant = await this.service.getMerchantDetails(id);
    res.status(StatusCode.Success.OK).json(buildSuccessResponse({ merchant }));
  });

  activateMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const merchant = await this.service.activateMerchant(id);
    res.status(StatusCode.Success.OK).json(buildSuccessResponse({ merchant }));
  });

  inactivateMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const merchant = await this.service.inactivateMerchant(id);
    res.status(StatusCode.Success.OK).json(buildSuccessResponse({ merchant }));
  });

  deleteMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const merchant = await this.service.deleteMerchant(id);
    res.status(StatusCode.Success.OK).json(buildSuccessResponse({ merchant }));
  });
}
