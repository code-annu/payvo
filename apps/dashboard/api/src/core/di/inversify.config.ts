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

const container = new Container();

// Utils
container.bind(TYPES.ClientInfoUtil).to(ClientInfoUtil);

// Repositories
container.bind(TYPES.UserRepository).to(UserRepository);
container.bind(TYPES.SessionRepository).to(SessionRepository);
container.bind(TYPES.RefreshTokenRepository).to(RefreshTokenRepository);

// User
container.bind(TYPES.UserService).to(UserService);
container.bind(TYPES.UserController).to(UserController);
container.bind(TYPES.UserRouter).to(UserRouter);

// Auth
container.bind(TYPES.AuthService).to(AuthService);
container.bind(TYPES.AuthController).to(AuthController);
container.bind(TYPES.AuthRouter).to(AuthRouter);

export default container;
