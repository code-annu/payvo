import { catchAsync } from "@payvo/http/handler";
import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import type { Response } from "express";
import { inject, injectable } from "inversify";
import type { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import MerchantService from "../application/service/merchant.service.js";
import { MerchantTypes } from "../merchant.types.js";
import MerchantMapper from "../mapper/merchant.mapper.js";

@injectable()
export default class MerchantController {
  constructor(
    @inject(MerchantTypes.MerchantService)
    private readonly merchantService: MerchantService,
    @inject(MerchantTypes.MerchantMapper)
    private readonly mapper: MerchantMapper,
  ) {}

  postMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const merchant = await this.merchantService.createMerchant(req.auth!.sub);
    const responseData = this.mapper.mapToMerchantDetailsResponse(merchant);

    res
      .status(StatusCode.Success.CREATED)
      .json(
        buildSuccessResponse(responseData, "Merchant created successfully"),
      );
  });

  getMerchants = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId, merchants } = await this.merchantService.getAllMerchants(
      req.auth!.sub,
    );
    const responseData = this.mapper.mapToUserMerchantsResponse(
      userId,
      merchants,
    );

    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse(responseData, "Merchants fetched successfully"),
      );
  });

  getMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = req.params;
    const merchant = await this.merchantService.getMerchantDetails(
      merchantId as string,
      req.auth!.sub,
    );
    const responseData = this.mapper.mapToMerchantDetailsResponse(merchant);

    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse(responseData, "Merchant fetched successfully"),
      );
  });

  closeMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const { merchantId } = req.params;
    const merchant = await this.merchantService.closeMerchant(
      merchantId as string,
      req.auth!.sub,
    );
    const responseData = this.mapper.mapToMerchantDetailsResponse(merchant);

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(responseData, "Merchant closed successfully"));
  });
}
