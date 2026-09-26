import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import PaymentAttemptController from "./payment-attempt.controller.js";
import { AttemptPaymentSchema } from "./schema/AttemptPaymentSchema.js";

@injectable()
export default class PaymentAttemptRouter {
  readonly router: Router;
  readonly paymentOrderAttemptRouter: Router;

  constructor(
    @inject(TYPES.PaymentAttemptController)
    private readonly paymentAttemptController: PaymentAttemptController,
  ) {
    this.router = Router();
    this.paymentOrderAttemptRouter = Router({ mergeParams: true });
    this.initRoutes();
    this.initPaymentOrderAttemptRouter();
  }

  private initRoutes() {}

  private initPaymentOrderAttemptRouter() {
    this.paymentOrderAttemptRouter.post(
      "/attempt",
      validateRequest(AttemptPaymentSchema),
      this.paymentAttemptController.attemptPayment,
    );
  }
}
