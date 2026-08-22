import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types";
import PaymentService from "./payment.service";
import buildSuccessResponse from "@/core/api/success.response";
import catchAsync from "@/core/error/async.catch";
import StatusCode from "@/core/api/StatusCode";
import { ApiKeyRequest } from "@/shared/middleware/authenticate-api-key.middleware";

@injectable()
export default class PaymentController {
  constructor(
    @inject(TYPES.PaymentService)
    private readonly paymentService: PaymentService,
  ) {}

  createPayment = catchAsync(async (req: ApiKeyRequest, res: Response) => {
    const merchantId = req.merchantId!;
    const { payment } = await this.paymentService.createPayment(
      merchantId,
      req.body,
    );

    res.status(StatusCode.Success.CREATED).json(
      buildSuccessResponse({
        payment: {
          id: payment.id,
          merchantId: payment.merchantId,
          customerId: payment.customerId,
          orderId: payment.orderId,
          idempotencyKey: payment.idempotencyKey,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          description: payment.description,
          createdAt: payment.createdAt,
        },
      }),
    );
  });
}
