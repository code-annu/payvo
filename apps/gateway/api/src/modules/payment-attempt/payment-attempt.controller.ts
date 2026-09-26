import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import type { Request, Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import AttemptPaymentUsecase from "./application/usecase/AttemptPaymentUsecase.js";

@injectable()
export default class PaymentAttemptController {
  constructor(
    @inject(TYPES.AttemptPaymentUsecase)
    private readonly attemptPaymentUsecase: AttemptPaymentUsecase,
  ) {}

  attemptPayment = catchAsync(async (req: Request, res: Response) => {
    const { paymentOrderId } = req.params as { paymentOrderId: string };
    const result = await this.attemptPaymentUsecase.execute({
      paymentOrderId,
      paymentMethodCode: req.body.paymentMethodCode,
    });

    res
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse(result));
  });
}
