import "reflect-metadata";
import { Container } from "inversify";
import TYPES from "./inversify.types.js";

// Utils
import ClientInfoUtil from "@/core/utils/client.util.js";

// Repositories
import UserRepository from "@/modules/user/repository/user.repository.js";
import SessionRepository from "@/modules/auth/repository/session.repository.js";
import RefreshTokenRepository from "@/modules/auth/repository/refresh-token.repository.js";

// User
import UserService from "@/modules/user/user.service.js";
import UserController from "@/modules/user/user.controller.js";
import UserRouter from "@/modules/user/user.router.js";

// Auth
import AuthService from "@/modules/auth/auth.service.js";
import AuthController from "@/modules/auth/auth.controller.js";
import AuthRouter from "@/modules/auth/auth.router.js";

// Merchant
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import MerchantService from "@/modules/merchant/merchant.service.js";
import MerchantController from "@/modules/merchant/merchant.controller.js";
import MerchantRouter from "@/modules/merchant/merchant.router.js";

// ApiKey
import ApiKeyRepository from "@/modules/api-key/repository/api-key.repository.js";
import ApiKeyService from "@/modules/api-key/api-key.service.js";
import ApiKeyController from "@/modules/api-key/api-key.controller.js";
import ApiKeyRouter from "@/modules/api-key/api-key.router.js";

const container = new Container();

// Utils
container.bind(TYPES.ClientInfoUtil).to(ClientInfoUtil);

// Repositories
container.bind(TYPES.UserRepository).to(UserRepository);
container.bind(TYPES.SessionRepository).to(SessionRepository);
container.bind(TYPES.RefreshTokenRepository).to(RefreshTokenRepository);
container.bind(TYPES.MerchantRepository).to(MerchantRepository);
container.bind(TYPES.ApiKeyRepository).to(ApiKeyRepository);

// User
container.bind(TYPES.UserService).to(UserService);
container.bind(TYPES.UserController).to(UserController);
container.bind(TYPES.UserRouter).to(UserRouter);

// Auth
container.bind(TYPES.AuthService).to(AuthService);
container.bind(TYPES.AuthController).to(AuthController);
container.bind(TYPES.AuthRouter).to(AuthRouter);

// Merchant
container.bind(TYPES.MerchantService).to(MerchantService);
container.bind(TYPES.MerchantController).to(MerchantController);
container.bind(TYPES.MerchantRouter).to(MerchantRouter);

// ApiKey
container.bind(TYPES.ApiKeyService).to(ApiKeyService);
container.bind(TYPES.ApiKeyController).to(ApiKeyController);
container.bind(TYPES.ApiKeyRouter).to(ApiKeyRouter);

export default container;
