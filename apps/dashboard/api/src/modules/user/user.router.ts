import TYPES from "@/core/di/inversify.types.js";
import { Router } from "express";
import { inject, injectable } from "inversify";
import UserController from "./user.controller.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import { updateUserBodySchema } from "./schema/UpdateUserSchema.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";

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
    this.router.get("/me", authenticateUser, this.controller.getUser);

    this.router.patch(
      "/me",
      authenticateUser,
      validateRequest({ body: updateUserBodySchema }),
      this.controller.updateUser,
    );

    this.router.delete("/me", authenticateUser, this.controller.deleteUser);
  }
}
