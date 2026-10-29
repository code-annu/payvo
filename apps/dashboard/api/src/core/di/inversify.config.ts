import { Container } from "inversify";
import TYPES from "./inversify.types.js";
import UserRepository from "@/modules/user/repository/user.repository.js";
import UserService from "@/modules/user/application/user.service.js";
import AuthService from "@/modules/auth/application/auth.service.js";
import AuthController from "@/modules/auth/auth.controller.js";
import AuthRouter from "@/modules/auth/auth.router.js";
import SessionRepository from "@/modules/auth/repository/session.repository.js";
import RefreshTokenRepository from "@/modules/auth/repository/refresh-token.repository.js";
import UserProfileRepository from "@/modules/account/repository/user-profile.repository.js";
import UserPreferencesRepository from "@/modules/account/repository/user-preferences.repository.js";
import AccountMapper from "@/modules/account/account.mapper.js";
import AccountService from "@/modules/account/application/account.service.js";
import AccountController from "@/modules/account/account.controller.js";
import AccountRouter from "@/modules/account/account.router.js";

const container = new Container();

// User bindings
container.bind(TYPES.UserRepository).to(UserRepository);
container.bind(TYPES.UserService).to(UserService);

// Account bindings
container.bind(TYPES.UserProfileRepository).to(UserProfileRepository);
container.bind(TYPES.UserPreferencesRepository).to(UserPreferencesRepository);
container.bind(TYPES.AccountMapper).to(AccountMapper);
container.bind(TYPES.AccountService).to(AccountService);
container.bind(TYPES.AccountController).to(AccountController);
container.bind(TYPES.AccountRouter).to(AccountRouter);

// Auth bindings
container.bind(TYPES.SessionRepository).to(SessionRepository);
container.bind(TYPES.RefreshTokenRepository).to(RefreshTokenRepository);
container.bind(TYPES.AuthService).to(AuthService);
container.bind(TYPES.AuthController).to(AuthController);
container.bind(TYPES.AuthRouter).to(AuthRouter);

export default container;
