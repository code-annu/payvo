import { validateRequest } from "@payvo/http/validation";
import { Router } from "express";
import { inject, injectable } from "inversify";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import MerchantController from "../controller/merchant.controller.js";
import { MerchantTypes } from "../merchant.types.js";
import * as merchantSchemas from "@payvo/shared/schema/requests";

@injectable()
export default class MerchantRouter {
  readonly router: Router;

  constructor(
    @inject(MerchantTypes.MerchantController)
    private readonly merchantController: MerchantController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.post(
      "/",
      authenticateUser,
      this.merchantController.postMerchant,
    );
    this.router.get(
      "/",
      authenticateUser,
      this.merchantController.getMerchants,
    );
    this.router.get(
      "/:merchantId",
      authenticateUser,
      validateRequest(merchantSchemas.GetMerchantDetailsSchema),
      this.merchantController.getMerchant,
    );
    this.router.patch(
      "/:merchantId/close",
      authenticateUser,
      validateRequest(merchantSchemas.CloseMerchantSchema),
      this.merchantController.closeMerchant,
    );
  }
}
