import { Router } from "express";
import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types";
import UserController from "./user.controller";
import { validateRequest } from "@/shared/middleware/validate-request.middleware";
import { UpdateMeSchema } from "./schema/UpdateMeSchema";
import authenticateUser from "@/shared/middleware/authenticate.middleware";

@injectable()
export default class UserRouter {
  public readonly router: Router;

  constructor(
    @inject(TYPES.UserController)
    private readonly userController: UserController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/me",
      authenticateUser,
      this.userController.getMe,
    );

    this.router.patch(
      "/me",
      authenticateUser,
      validateRequest(UpdateMeSchema),
      this.userController.updateMe,
    );

    this.router.delete(
      "/me",
      authenticateUser,
      this.userController.deleteMe,
    );
  }
}
