import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import requireActiveUser from "@/core/middleware/require-active-user.middleware.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import TransactionController from "./transaction.controller.js";
import { GetMerchantTransactionsSchema } from "./schema/GetMerchantTransactionsSchema.js";
import { GetTransactionDetailsSchema } from "./schema/GetTransactionDetailsSchema.js";

@injectable()
export default class TransactionRouter {
  readonly router: Router;
  private readonly authProtectionSuite = [authenticateUser, requireActiveUser];

  constructor(
    @inject(TYPES.TransactionController)
    private readonly transactionController: TransactionController,
  ) {
    this.router = Router({ mergeParams: true });
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/",
      this.authProtectionSuite,
      validateRequest(GetMerchantTransactionsSchema),
      this.transactionController.getMerchantTransactions,
    );

    this.router.get(
      "/:transactionId",
      this.authProtectionSuite,
      validateRequest(GetTransactionDetailsSchema),
      this.transactionController.getTransactionDetails,
    );
  }
}
