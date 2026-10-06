import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import GetMerchantTransactionsUsecase from "./application/usecase/GetMerchantTransactionsUsecase.js";
import GetTransactionDetailsUsecase from "./application/usecase/GetTransactionDetailsUsecase.js";

@injectable()
export default class TransactionController {
  constructor(
    @inject(TYPES.GetMerchantTransactionsUsecase)
    private readonly getMerchantTransactionsUsecase: GetMerchantTransactionsUsecase,
    @inject(TYPES.GetTransactionDetailsUsecase)
    private readonly getTransactionDetailsUsecase: GetTransactionDetailsUsecase,
  ) {}

  getMerchantTransactions = catchAsync(
    async (req: AuthRequest, res: Response) => {
      const result = await this.getMerchantTransactionsUsecase.execute({
        merchantId: req.params.merchantId as string,
        userId: req.auth!.sub,
      });

      res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(result));
    },
  );

  getTransactionDetails = catchAsync(
    async (req: AuthRequest, res: Response) => {
      const result = await this.getTransactionDetailsUsecase.execute({
        transactionId: req.params.transactionId as string,
        merchantId: req.params.merchantId as string,
        userId: req.auth!.sub,
      });

      res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(result));
    },
  );
}
