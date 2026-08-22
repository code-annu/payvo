import "reflect-metadata";
import { Container } from "inversify";
import TYPES from "./inversify.types";

// Utils
import JWTUtil from "@/shared/util/jwt.util";
import ClientInfoUtil from "@/shared/util/client-info.util";

// User
import UserController from "@/modules/user/user.controller";
import UserRouter from "@/modules/user/user.router";
import UserService from "@/modules/user/user.service";
import UserRepository from "@/modules/user/repository/user.repository";

// Auth
import AuthController from "@/modules/auth/auth.controller";
import AuthRouter from "@/modules/auth/auth.router";
import AuthService from "@/modules/auth/auth.service";
import SessionRepository from "@/modules/auth/repository/session.repository";
import RefreshTokenRepository from "@/modules/auth/repository/refresh-token.repository";

// Merchant
import MerchantController from "@/modules/merchant/merchant.controller";
import MerchantRouter from "@/modules/merchant/merchant.router";
import MerchantService from "@/modules/merchant/merchant.service";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository";

// Api Keys
import ApiKeyController from "@/modules/api-keys/api-key.controller";
import ApiKeyRouter from "@/modules/api-keys/router/api-key.router";
import BaseApiKeyRouter from "@/modules/api-keys/router/base-api-key.router";
import ApiKeyService from "@/modules/api-keys/api-key.service";
import ApiKeyRepository from "@/modules/api-keys/repository/api-key.repository";
import ApiKeyUtil from "@/shared/util/api-key.util";

const container = new Container();

// Util bindings
container.bind<JWTUtil>(TYPES.JWTUtil).to(JWTUtil).inSingletonScope();
container
  .bind<ClientInfoUtil>(TYPES.ClientInfoUtil)
  .to(ClientInfoUtil)
  .inSingletonScope();

// User bindings
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<UserRouter>(TYPES.UserRouter).to(UserRouter);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);

// Auth bindings
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<AuthRouter>(TYPES.AuthRouter).to(AuthRouter);
container.bind<AuthService>(TYPES.AuthService).to(AuthService);
container
  .bind<SessionRepository>(TYPES.SessionRepository)
  .to(SessionRepository);
container
  .bind<RefreshTokenRepository>(TYPES.RefreshTokenRepository)
  .to(RefreshTokenRepository);

// Merchant bindings
container
  .bind<MerchantController>(TYPES.MerchantController)
  .to(MerchantController);
container.bind<MerchantRouter>(TYPES.MerchantRouter).to(MerchantRouter);
container.bind<MerchantService>(TYPES.MerchantService).to(MerchantService);
container
  .bind<MerchantRepository>(TYPES.MerchantRepository)
  .to(MerchantRepository);

// Api Key bindings
container
  .bind<ApiKeyController>(TYPES.ApiKeyController)
  .to(ApiKeyController);
container.bind<ApiKeyRouter>(TYPES.ApiKeyRouter).to(ApiKeyRouter);
container.bind<BaseApiKeyRouter>(TYPES.BaseApiKeyRouter).to(BaseApiKeyRouter);
container.bind<ApiKeyService>(TYPES.ApiKeyService).to(ApiKeyService);
container
  .bind<ApiKeyRepository>(TYPES.ApiKeyRepository)
  .to(ApiKeyRepository);
container.bind<ApiKeyUtil>(TYPES.ApiKeyUtil).to(ApiKeyUtil);

export default container;

