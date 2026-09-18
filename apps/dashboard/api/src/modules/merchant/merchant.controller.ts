import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import CreateMerchantUsecase from "./application/usecase/CreateMerchantUsecase.js";
import GetMerchantDetailsUsecase from "./application/usecase/GetMerchantDetailsUsecase.js";
import GetUserMerchantsUsecase from "./application/usecase/GetUserMerchantsUsecase.js";
import DeleteMerchantUsecase from "./application/usecase/DeleteMerchantUsecase.js";

@injectable()
export default class MerchantController {
  constructor(
    @inject(TYPES.CreateMerchantUsecase)
    private readonly createMerchantUsecase: CreateMerchantUsecase,
    @inject(TYPES.GetMerchantDetailsUsecase)
    private readonly getMerchantDetailsUsecase: GetMerchantDetailsUsecase,
    @inject(TYPES.GetUserMerchantsUsecase)
    private readonly getUserMerchantsUsecase: GetUserMerchantsUsecase,
    @inject(TYPES.DeleteMerchantUsecase)
    private readonly deleteMerchantUsecase: DeleteMerchantUsecase,
  ) {}

  createMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const merchant = await this.createMerchantUsecase.execute(req.auth!.sub);

    res
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse(merchant));
  });

  getMerchantDetails = catchAsync(async (req: AuthRequest, res: Response) => {
    const merchant = await this.getMerchantDetailsUsecase.execute({
      merchantId: req.params.merchantId as string,
      userId: req.auth!.sub,
    });

    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(merchant));
  });

  getUserMerchants = catchAsync(async (req: AuthRequest, res: Response) => {
    const merchants = await this.getUserMerchantsUsecase.execute(req.auth!.sub);

    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(merchants));
  });

  deleteMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    await this.deleteMerchantUsecase.execute({
      merchantId: req.params.merchantId as string,
      userId: req.auth!.sub,
    });

    res.status(HttpStatusCode.Success.NO_CONTENT).end();
  });
}
