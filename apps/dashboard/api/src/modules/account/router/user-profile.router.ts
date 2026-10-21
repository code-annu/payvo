import { Router } from "express";
import { inject, injectable } from "inversify";
import { validateRequest } from "@payvo/http/validation";
import { AccountTypes } from "../account.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import ProfileController from "../controller/user-profile.controller.js";
import {
  CreateUserProfileSchema,
  UpdateUserProfileSchema,
} from "@payvo/shared/schema/requests";

@injectable()
export default class ProfileRouter {
  readonly router: Router;

  constructor(
    @inject(AccountTypes.ProfileController)
    private readonly accountController: ProfileController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/",
      authenticateUser,
      validateRequest(CreateUserProfileSchema),
      this.accountController.postAccount,
    );

    this.router.get("/", authenticateUser, this.accountController.getAccount);

    this.router.patch(
      "/",
      authenticateUser,
      validateRequest(UpdateUserProfileSchema),
      this.accountController.patchAccount,
    );

    this.router.delete(
      "/",
      authenticateUser,
      this.accountController.deleteAccount,
    );
  }
}
