import { Container } from "inversify";
import { AccountTypes } from "./account.types.js";
import UserProfileRepository from "./repository/user-profile.repository.js";
import UserPreferencesRepository from "./repository/user-preferences.repository.js";
import UserAddressRepository from "./repository/user-address.repository.js";
import AccountMapper from "./mapper/account.mapper.js";
import UserAddressMapper from "./mapper/user-address.mapper.js";
import AccountService from "./application/service/account.service.js";
import UserAddressService from "./application/service/user-address.service.js";
import AccountController from "./controller/account.controller.js";
import AccountRouter from "./router/account.router.js";
import UserAddressController from "./controller/user-address.controller.js";
import UserAddressRouter from "./router/user-address.router.js";

export { AccountTypes } from "./account.types.js";

export function registerAccountModule(container: Container): void {
  container.bind(AccountTypes.UserProfileRepository).to(UserProfileRepository);
  container
    .bind(AccountTypes.UserPreferencesRepository)
    .to(UserPreferencesRepository);
  container.bind(AccountTypes.UserAddressRepository).to(UserAddressRepository);
  container.bind(AccountTypes.AccountMapper).to(AccountMapper);
  container.bind(AccountTypes.UserAddressMapper).to(UserAddressMapper);
  container.bind(AccountTypes.AccountService).to(AccountService);
  container.bind(AccountTypes.UserAddressService).to(UserAddressService);
  container.bind(AccountTypes.AccountController).to(AccountController);
  container.bind(AccountTypes.AccountRouter).to(AccountRouter);
  container.bind(AccountTypes.UserAddressController).to(UserAddressController);
  container.bind(AccountTypes.UserAddressRouter).to(UserAddressRouter);
}
