import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import AccountController from "./account.controller.js";
import { UpdateAccountSchema } from "./schema/UpdateAccountSchema.js";

@injectable()
export default class AccountRouter {
	readonly router: Router;

	constructor(
		@inject(TYPES.AccountController)
		private readonly accountController: AccountController,
	) {
		this.router = Router();
		this.initRoutes();
	}

	private initRoutes() {
		this.router.get(
			"/",
			authenticateUser,
			this.accountController.getAccount,
		);

		this.router.patch(
			"/",
			authenticateUser,
			validateRequest(UpdateAccountSchema),
			this.accountController.updateAccount,
		);

		this.router.delete(
			"/",
			authenticateUser,
			this.accountController.deleteAccount,
		);
	}
}
