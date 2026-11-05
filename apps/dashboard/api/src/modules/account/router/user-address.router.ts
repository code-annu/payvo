import { Router } from "express";
import { inject, injectable } from "inversify";
import { validateRequest } from "@payvo/http/validation";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import UserAddressController from "../controller/user-address.controller.js";
import {
  AddUserAddressSchema,
  UserAddressParamsSchema,
  UpdateUserAddressSchema,
} from "../schema/address.schema.js";
import { AccountTypes } from "../account.types.js";

@injectable()
export default class UserAddressRouter {
  readonly router: Router;

  constructor(
    @inject(AccountTypes.UserAddressController)
    private readonly userAddressController: UserAddressController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/",
      authenticateUser,
      validateRequest(AddUserAddressSchema),
      this.userAddressController.postAddress,
    );

    this.router.get(
      "/",
      authenticateUser,
      this.userAddressController.getAddresses,
    );

    this.router.patch(
      "/:addressId",
      authenticateUser,
      validateRequest(UpdateUserAddressSchema),
      this.userAddressController.patchAddress,
    );

    this.router.delete(
      "/:addressId",
      authenticateUser,
      validateRequest({ params: UserAddressParamsSchema }),
      this.userAddressController.deleteAddress,
    );
  }
}
