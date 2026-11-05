import { Router } from "express";
import { inject, injectable } from "inversify";
import { validateRequest } from "@payvo/http/validation";
import { AccountTypes } from "../account.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import AccountController from "../controller/account.controller.js";
import {
  CreateAccountSchema,
  UpdateAccountSchema,
} from "../schema/account.schema.js";

@injectable()
export default class AccountRouter {
  readonly router: Router;

  constructor(
    @inject(AccountTypes.AccountController)
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
