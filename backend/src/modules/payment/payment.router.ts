import { Router } from "express";
import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types";
import PaymentController from "./payment.controller";
import { validateRequest } from "@/shared/middleware/validate-request.middleware";
import authenticateApiKey from "@/shared/middleware/authenticate-api-key.middleware";
import { CreatePaymentSchema } from "./schema/CreatePaymentSchema";

@injectable()
export default class PaymentRouter {
  public readonly router: Router;

  constructor(
    @inject(TYPES.PaymentController)
    private readonly paymentController: PaymentController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/",
      authenticateApiKey,
      validateRequest(CreatePaymentSchema),
      this.paymentController.createPayment,
    );
  }
}
