import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import AuthController from "./auth.controller.js";
import * as authSchema from "./schema/auth.schema.js";
import { validateRequest } from "@payvo/http/validation";
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
      validateRequest(authSchema.SignupSchema),
      this.authController.postSignup,
    );

    this.router.post(
      "/login",
      validateRequest(authSchema.LoginSchema),
      this.authController.postLogin,
    );

    this.router.post(
      "/rotate-token",
      validateRequest(authSchema.RefreshTokenSchema),
      this.authController.postRotateToken,
    );

    this.router.post(
      "/logout",
      authenticateUser,
      this.authController.postLogout,
    );
  }
}
