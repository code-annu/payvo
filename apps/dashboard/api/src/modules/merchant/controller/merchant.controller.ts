import { catchAsync } from "@payvo/http/handler";
import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import type { Response } from "express";
import { inject, injectable } from "inversify";
import type { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import MerchantService from "../application/service/merchant.service.js";
import { MerchantTypes } from "../merchant.types.js";

@injectable()
export default class MerchantController {
  constructor(
    @inject(MerchantTypes.MerchantService)
    private readonly merchantService: MerchantService,
  ) {}

  postMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const merchant = await this.merchantService.createMerchant(req.auth!.sub);

    res
      .status(StatusCode.Success.CREATED)
      .json(buildSuccessResponse(merchant, "Merchant created successfully"));
  });

  getMerchants = catchAsync(async (req: AuthRequest, res: Response) => {
    const merchants = await this.merchantService.getAllMerchants(req.auth!.sub);

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(merchants, "Merchants fetched successfully"));
  });

  getMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = req.params;
    const merchant = await this.merchantService.getMerchantDetails(
      merchantId as string,
      req.auth!.sub,
    );

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(merchant, "Merchant fetched successfully"));
  });

  closeMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = req.params;
    const merchant = await this.merchantService.closeMerchant(
      merchantId as string,
      req.auth!.sub,
    );

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(merchant, "Merchant closed successfully"));
  });
}
