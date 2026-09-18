import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import MerchantController from "./merchant.controller.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import { MerchantIdSchema } from "./schema/MerchantIdSchema.js";

@injectable()
export default class MerchantRouter {
  readonly router: Router;

  constructor(
    @inject(TYPES.MerchantController)
    private readonly merchantController: MerchantController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/",
      authenticateUser,
      this.merchantController.getUserMerchants,
    );

    this.router.post(
      "/",
      authenticateUser,
      this.merchantController.createMerchant,
    );

    this.router.get(
      "/:merchantId",
      authenticateUser,
      validateRequest({ params: MerchantIdSchema }),
      this.merchantController.getMerchantDetails,
    );

    this.router.delete(
      "/:merchantId",
      authenticateUser,
      validateRequest({ params: MerchantIdSchema }),
      this.merchantController.deleteMerchant,
    );
  }
}
