import { Router } from "express";
import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types";
import AuthController from "./auth.controller";
import { validateRequest } from "@/shared/middleware/validate-request.middleware";
import { SignupSchema } from "./schema/SignupSchema";
import { LoginSchema } from "./schema/LoginSchema";
import { RefreshTokenSchema } from "./schema/RefreshTokenSchema";
import authenticateUser from "@/shared/middleware/authenticate.middleware";

@injectable()
export default class AuthRouter {
  public readonly router: Router;

  constructor(
    @inject(TYPES.AuthController)
    private readonly authController: AuthController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/signup",
      validateRequest(SignupSchema),
      this.authController.signup,
    );

    this.router.post(
      "/login",
      validateRequest(LoginSchema),
      this.authController.login,
    );

    this.router.post(
      "/refresh",
      validateRequest(RefreshTokenSchema),
      this.authController.refreshToken,
    );

    this.router.post(
      "/logout",
      authenticateUser,
      this.authController.logout,
    );

    this.router.post(
      "/logout-all",
      authenticateUser,
      this.authController.logoutAll,
    );
  }
}
