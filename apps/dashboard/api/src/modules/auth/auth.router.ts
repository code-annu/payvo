import TYPES from "@/core/di/inversify.types.js";
import { Router } from "express";
import { inject, injectable } from "inversify";
import AuthController from "./auth.controller.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import { signupBodySchema } from "./schema/SignupSchema.js";
import { loginBodySchema } from "./schema/LoginSchema.js";
import { RefreshTokenSchema } from "./schema/RefreshTokenSchema.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";

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
      validateRequest({ body: signupBodySchema }),
      this.controller.postSignup,
    );

    this.router.post(
      "/login",
      validateRequest({ body: loginBodySchema }),
      this.controller.postLogin,
    );

    this.router.post(
      "/rotate-token",
      validateRequest(RefreshTokenSchema),
      this.controller.postRotateToken,
    );
    this.router.post("/logout", authenticateUser, this.controller.postLogout);
    this.router.post(
      "/logout-all",
      authenticateUser,
      this.controller.postLogoutAll,
    );
  }
}
