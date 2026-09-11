import TYPES from "@/core/di/inversify.types.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import { Router } from "express";
import { inject, injectable } from "inversify";
import UserController from "./user.controller.js";
import { UpdateUserSchema } from "./schema/UpdateUserSchema.js";

@injectable()
export default class UserRouter {
  readonly router: Router;
  constructor(
    @inject(TYPES.UserController) private readonly controller: UserController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get("/me", authenticateUser, this.controller.getMe);

    this.router.patch(
      "/me",
      authenticateUser,
      validateRequest(UpdateUserSchema),
      this.controller.patchMe,
    );

    this.router.delete("/me", authenticateUser, this.controller.deleteMe);
  }
}
