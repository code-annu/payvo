import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import AuthController from "./auth.controller.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import { SignupSchema } from "./schema/SignupSchema.js";
import { LoginSchema } from "./schema/LoginSchema.js";
import { RefreshTokenSchema } from "./schema/RefreshTokenSchema.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";

@injectable()
export default class AuthRouter {
  readonly router: Router;
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
      this.authController.postSignup,
    );

    this.router.post(
      "/login",
      validateRequest(LoginSchema),
      this.authController.postLogin,
    );

    this.router.post(
      "/rotate-token",
      validateRequest(RefreshTokenSchema),
      this.authController.postRotateToken,
    );

    this.router.post(
      "/logout",
      authenticateUser,
      this.authController.postLogout,
    );
  }
}
