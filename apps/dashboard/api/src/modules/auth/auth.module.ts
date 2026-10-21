import { Container } from "inversify";
import { AuthTypes } from "./auth.types.js";
import SessionRepository from "./repository/session.repository.js";
import RefreshTokenRepository from "./repository/refresh-token.repository.js";
import AuthService from "./application/auth.service.js";
import AuthController from "./auth.controller.js";
import AuthRouter from "./auth.router.js";

export { AuthTypes } from "./auth.types.js";

export function registerAuthModule(container: Container): void {
  container.bind(AuthTypes.SessionRepository).to(SessionRepository);
  container.bind(AuthTypes.RefreshTokenRepository).to(RefreshTokenRepository);
  container.bind(AuthTypes.AuthService).to(AuthService);
  container.bind(AuthTypes.AuthController).to(AuthController);
  container.bind(AuthTypes.AuthRouter).to(AuthRouter);
}
