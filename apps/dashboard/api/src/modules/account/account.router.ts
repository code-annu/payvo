import { Router } from "express";
import { inject, injectable } from "inversify";
import { validateRequest } from "@payvo/http/validation";
import TYPES from "@/core/di/inversify.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import AccountController from "./account.controller.js";
import {
  CreateAccountSchema,
  UpdateAccountSchema,
} from "./schema/account.schema.js";

@injectable()
export default class AccountRouter {
  readonly router: Router;

  constructor(
    @inject(TYPES.AccountController)
    private readonly accountController: AccountController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/",
      authenticateUser,
      validateRequest(CreateAccountSchema),
      this.accountController.postAccount,
    );

    this.router.get("/", authenticateUser, this.accountController.getAccount);

    this.router.patch(
      "/",
      authenticateUser,
      validateRequest(UpdateAccountSchema),
      this.accountController.patchAccount,
    );

    this.router.delete(
      "/",
      authenticateUser,
      this.accountController.deleteAccount,
    );
  }
}
