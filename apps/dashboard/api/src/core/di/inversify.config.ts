import { Container } from "inversify";
import TYPES from "./inversify.types.js";
import ClientInfoUtil from "../util/client.util.js";
import { JWTService } from "@payvo/shared/jwt";
import { PasswordHashService } from "@payvo/shared/password-hash";
import UserRepository from "@/modules/user/repository/user.repository.js";
import UserMapper from "@/modules/user/user.mapper.js";
import SessionRepository from "@/modules/auth/repository/session.repository.js";
import AuthMapper from "@/modules/auth/auth.mapper.js";
import AuthService from "@/modules/auth/auth.service.js";
import AuthController from "@/modules/auth/auth.controller.js";
import AuthRouter from "@/modules/auth/auth.router.js";

const container = new Container();

// Util bindings
container
  .bind<ClientInfoUtil>(TYPES.ClientInfoUtil)
  .to(ClientInfoUtil)
  .inSingletonScope();

// Shared bindings
container.bind<JWTService>(TYPES.JWTService).to(JWTService).inSingletonScope();

container
  .bind<PasswordHashService>(TYPES.PasswordHashService)
  .to(PasswordHashService)
  .inSingletonScope();

// User bindings
container
  .bind<UserRepository>(TYPES.UserRepository)
  .to(UserRepository)
  .inSingletonScope();
container.bind<UserMapper>(TYPES.UserMapper).to(UserMapper).inSingletonScope();

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
