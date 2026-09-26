import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { AuthRequest } from "@/core/middleware/authenticate-api-key.middleware.js";
import CreatePaymentOrderUsecase from "./application/usecase/CreatePaymentOrderUsecase.js";
import CheckoutPaymentOrderUsecase from "./application/usecase/CheckoutPaymentOrderUsecase.js";

@injectable()
export default class PaymentOrderController {
  constructor(
    @inject(TYPES.CreatePaymentOrderUsecase)
    private readonly createPaymentOrderUsecase: CreatePaymentOrderUsecase,
    @inject(TYPES.CheckoutPaymentOrderUsecase)
    private readonly checkoutPaymentOrderUsecase: CheckoutPaymentOrderUsecase,
  ) {}

  createPaymentOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const paymentOrder = await this.createPaymentOrderUsecase.execute({
      ...req.body,
      merchantId: req.auth!.merchantId,
    });

    res
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse(paymentOrder));
  });

  checkoutPaymentOrder = catchAsync(async (req: Request, res: Response) => {
    const { csi } = req.params as { csi: string };
    const checkout = await this.checkoutPaymentOrderUsecase.execute(csi);

    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(checkout));
  });
}
