import { Container } from "inversify";
import { UserTypes } from "./user.types.js";
import UserRepository from "./repository/user.repository.js";
import UserService from "./application/user.service.js";

export { UserTypes } from "./user.types.js";

export function registerUserModule(container: Container): void {
  container.bind(UserTypes.UserRepository).to(UserRepository);
  container.bind(UserTypes.UserService).to(UserService);
}
