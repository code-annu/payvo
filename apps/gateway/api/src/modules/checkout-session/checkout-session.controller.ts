import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { Response } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { AuthRequest } from "@/core/middleware/authenticate-api-key.middleware.js";
import CreateCheckoutSessionUsecase from "./application/usecase/CreateCheckoutSessionUsecase.js";

@injectable()
export default class CheckoutSessionController {
  constructor(
    @inject(TYPES.CreateCheckoutSessionUsecase)
    private readonly createCheckoutSessionUsecase: CreateCheckoutSessionUsecase,
  ) {}

  postCreateCheckoutSession = catchAsync(
    async (req: AuthRequest, res: Response) => {
      const result = await this.createCheckoutSessionUsecase.execute({
        ...req.body,
        merchantId: req.auth!.merchantId,
      });

      res.status(HttpStatusCode.Success.CREATED).json(
        buildSuccessResponse({
          checkoutUrl: result.checkoutUrl,
        }),
      );
    },
  );
}
