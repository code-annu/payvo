import "reflect-metadata";
import { Container } from "inversify";
import TYPES from "./inversify.types";

// Utils
import ClientInfoUtil from "@/core/utils/client.util";

// Repositories
import UserRepository from "@/modules/user/repository/user.repository";
import SessionRepository from "@/modules/auth/repository/session.repository";
import RefreshTokenRepository from "@/modules/auth/repository/refresh-token.repository";

// Auth
import AuthService from "@/modules/auth/auth.service";
import AuthController from "@/modules/auth/auth.controller";
import AuthRouter from "@/modules/auth/auth.router";

const container = new Container();

// Utils
container.bind(TYPES.ClientInfoUtil).to(ClientInfoUtil);

// Repositories
container.bind(TYPES.UserRepository).to(UserRepository);
container.bind(TYPES.SessionRepository).to(SessionRepository);
container.bind(TYPES.RefreshTokenRepository).to(RefreshTokenRepository);

// Auth
container.bind(TYPES.AuthService).to(AuthService);
container.bind(TYPES.AuthController).to(AuthController);
container.bind(TYPES.AuthRouter).to(AuthRouter);

export default container;
