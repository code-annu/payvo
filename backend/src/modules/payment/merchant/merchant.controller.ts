import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types";
import MerchantService from "./merchant.service";
import buildSuccessResponse from "@/core/api/success.response";
import catchAsync from "@/core/error/async.catch";
import StatusCode from "@/core/api/StatusCode";
import { AuthRequest } from "@/shared/middleware/authenticate.middleware";

@injectable()
export default class MerchantController {
  constructor(
    @inject(TYPES.MerchantService)
    private readonly merchantService: MerchantService,
  ) {}

  createMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const { merchant } = await this.merchantService.createMerchant(userId);

    res.status(StatusCode.Success.CREATED).json(
      buildSuccessResponse({
        merchant: {
          id: merchant.id,
          userId: merchant.userId,
          isActive: merchant.isActive,
          createdAt: merchant.createdAt,
        },
      }),
    );
  });

  getMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchantId = req.params.id as string;
    const { merchant } = await this.merchantService.getMerchant(
      userId,
      merchantId,
    );

    res.status(StatusCode.Success.OK).json(
      buildSuccessResponse({
        merchant: {
          id: merchant.id,
          userId: merchant.userId,
          isActive: merchant.isActive,
          createdAt: merchant.createdAt,
        },
      }),
    );
  });

  deleteMerchant = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const merchantId = req.params.id as string;
    await this.merchantService.deleteMerchant(userId, merchantId);

    res.status(StatusCode.Success.NO_CONTENT).end();
  });

  getUserMerchants = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const { merchants } = await this.merchantService.getUserMerchants(userId);

    res.status(StatusCode.Success.OK).json(
      buildSuccessResponse({
        merchants: merchants.map((m) => ({
          id: m.id,
          userId: m.userId,
          isActive: m.isActive,
          createdAt: m.createdAt,
        })),
      }),
    );
  });
}
