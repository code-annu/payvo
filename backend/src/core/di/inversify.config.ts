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

// Projects
import ProjectController from "@/modules/projects/project.controller";
import ProjectRouter from "@/modules/projects/project.router";
import ProjectService from "@/modules/projects/project.service";
import ProjectRepository from "@/modules/projects/repository/project.repository";

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

// Project bindings
container
  .bind<ProjectController>(TYPES.ProjectController)
  .to(ProjectController);
container.bind<ProjectRouter>(TYPES.ProjectRouter).to(ProjectRouter);
container.bind<ProjectService>(TYPES.ProjectService).to(ProjectService);
container
  .bind<ProjectRepository>(TYPES.ProjectRepository)
  .to(ProjectRepository);

export default container;
