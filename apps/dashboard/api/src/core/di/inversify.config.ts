import { Container } from "inversify";
import TYPES from "./inversify.types.js";
import ClientInfoUtil from "../util/client.util.js";
import UserRepository from "@/modules/user/repository/user.repository.js";
import UserMapper from "@/modules/user/user.mapper.js";
import SessionRepository from "@/modules/auth/repository/session.repository.js";
import AuthMapper from "@/modules/auth/auth.mapper.js";
import AuthService from "@/modules/auth/auth.service.js";
import AuthController from "@/modules/auth/auth.controller.js";
import AuthRouter from "@/modules/auth/auth.router.js";
import UserService from "@/modules/user/user.service.js";
import UserController from "@/modules/user/user.controller.js";
import UserRouter from "@/modules/user/user.router.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import MerchantMapper from "@/modules/merchant/merchant.mapper.js";
import MerchantService from "@/modules/merchant/merchant.service.js";
import MerchantController from "@/modules/merchant/merchant.controller.js";
import MerchantRouter from "@/modules/merchant/merchant.router.js";
import ApiKeyRepository from "@/modules/api-key/repository/api-key.repository.js";
import ApiKeyMapper from "@/modules/api-key/api-key.mapper.js";
import ApiKeyService from "@/modules/api-key/api-key.service.js";
import ApiKeyController from "@/modules/api-key/api-key.controller.js";
import ApiKeyRouter from "@/modules/api-key/api-key.router.js";

const container = new Container();

// Util bindings
container
  .bind<ClientInfoUtil>(TYPES.ClientInfoUtil)
  .to(ClientInfoUtil)
  .inSingletonScope();

// User bindings
container
  .bind<UserRepository>(TYPES.UserRepository)
  .to(UserRepository)
  .inSingletonScope();
container.bind<UserMapper>(TYPES.UserMapper).to(UserMapper).inSingletonScope();
container
  .bind<UserService>(TYPES.UserService)
  .to(UserService)
  .inSingletonScope();
container
  .bind<UserController>(TYPES.UserController)
  .to(UserController)
  .inSingletonScope();
container.bind<UserRouter>(TYPES.UserRouter).to(UserRouter).inSingletonScope();

// Merchant bindings
container
  .bind<MerchantRepository>(TYPES.MerchantRepository)
  .to(MerchantRepository)
  .inSingletonScope();
container
  .bind<MerchantMapper>(TYPES.MerchantMapper)
  .to(MerchantMapper)
  .inSingletonScope();
container
  .bind<MerchantService>(TYPES.MerchantService)
  .to(MerchantService)
  .inSingletonScope();
container
  .bind<MerchantController>(TYPES.MerchantController)
  .to(MerchantController)
  .inSingletonScope();
container
  .bind<MerchantRouter>(TYPES.MerchantRouter)
  .to(MerchantRouter)
  .inSingletonScope();

// ApiKey bindings
container
  .bind<ApiKeyMapper>(TYPES.ApiKeyMapper)
  .to(ApiKeyMapper)
  .inSingletonScope();
container
  .bind<ApiKeyRepository>(TYPES.ApiKeyRepository)
  .to(ApiKeyRepository)
  .inSingletonScope();
container
  .bind<ApiKeyService>(TYPES.ApiKeyService)
  .to(ApiKeyService)
  .inSingletonScope();
container
  .bind<ApiKeyController>(TYPES.ApiKeyController)
  .to(ApiKeyController)
  .inSingletonScope();
container
  .bind<ApiKeyRouter>(TYPES.ApiKeyRouter)
  .to(ApiKeyRouter)
  .inSingletonScope();

// Auth bindings
container
  .bind<SessionRepository>(TYPES.SessionRepository)
  .to(SessionRepository)
  .inSingletonScope();
container.bind<AuthMapper>(TYPES.AuthMapper).to(AuthMapper).inSingletonScope();
container
  .bind<AuthService>(TYPES.AuthService)
  .to(AuthService)
  .inSingletonScope();
container
  .bind<AuthController>(TYPES.AuthController)
  .to(AuthController)
  .inSingletonScope();
container.bind<AuthRouter>(TYPES.AuthRouter).to(AuthRouter).inSingletonScope();

export default container;
