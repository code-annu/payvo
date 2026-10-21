import { Container } from "inversify";
import { AccountTypes } from "./account.types.js";
import UserProfileRepository from "./repository/user-profile.repository.js";
import UserAddressRepository from "./repository/user-address.repository.js";
import UserProfileMapper from "./mapper/user-profile.mapper.js";
import UserAddressMapper from "./mapper/user-address.mapper.js";
import AccountService from "./application/service/user-profile.service.js";
import DeleteAccountUsecase from "./application/usecase/DeleteAccountUsecase.js";
import UserAddressService from "./application/service/user-address.service.js";
import ProfileController from "./controller/user-profile.controller.js";
import ProfileRouter from "./router/user-profile.router.js";
import UserAddressController from "./controller/user-address.controller.js";
import UserAddressRouter from "./router/user-address.router.js";

export { AccountTypes } from "./account.types.js";

export function registerAccountModule(container: Container): void {
  container.bind(AccountTypes.UserProfileRepository).to(UserProfileRepository);
  container.bind(AccountTypes.UserAddressRepository).to(UserAddressRepository);
  container.bind(AccountTypes.ProfileMapper).to(UserProfileMapper);
  container.bind(AccountTypes.UserAddressMapper).to(UserAddressMapper);
  container.bind(AccountTypes.ProfileService).to(AccountService);
  container.bind(AccountTypes.DeleteAccountUsecase).to(DeleteAccountUsecase);
  container.bind(AccountTypes.UserAddressService).to(UserAddressService);
  container
    .bind(AccountTypes.UserAddressContract)
    .toService(AccountTypes.UserAddressService);
  container.bind(AccountTypes.ProfileController).to(ProfileController);
  container.bind(AccountTypes.ProfileRouter).to(ProfileRouter);
  container.bind(AccountTypes.UserAddressController).to(UserAddressController);
  container.bind(AccountTypes.UserAddressRouter).to(UserAddressRouter);
}
