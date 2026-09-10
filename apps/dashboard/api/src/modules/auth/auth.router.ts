import TYPES from "@/core/di/inversify.types";
import { validateRequest } from "@/core/middleware/validate-request.middleware";
import { Router } from "express";
import { inject, injectable } from "inversify";
import AuthController from "./auth.controller";
import { RefreshTokenSchema } from "./schema/RefreshTokenSchema";
import { SignupSchema } from "./schema/SignupSchema";
import { LoginSchema } from "./schema/LoginSchema";
import authenticateUser from "@/core/middleware/authenticate.middleware";

@injectable()
export default class AuthRouter {
  readonly router: Router;
  constructor(
    @inject(TYPES.AuthController) private readonly controller: AuthController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/signup",
      validateRequest(SignupSchema),
      this.controller.postSignup,
    );

    this.router.post(
      "/login",
      validateRequest(LoginSchema),
      this.controller.postLogin,
    );

    this.router.post(
      "/rotate-token",
      validateRequest(RefreshTokenSchema),
      this.controller.postRotateToken,
    );

    this.router.post("/logout", authenticateUser, this.controller.postLogout);
  }
}
